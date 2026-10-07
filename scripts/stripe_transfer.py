import os
import time
import json
import stripe
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

LEDGER_PATH = Path("/hf-hub-cache/laundry_ledger.json")
FALLBACK_PATH = Path("/tmp/laundry_ledger.json")

def _get_ledger_file():
    if LEDGER_PATH.parent.exists():
        return LEDGER_PATH
    FALLBACK_PATH.parent.mkdir(parents=True, exist_ok=True)
    return FALLBACK_PATH

def _load_ledger():
    f = _get_ledger_file()
    if f.exists():
        try:
            with open(f, "r") as fp:
                return json.load(fp)
        except Exception:
            pass
    return {"profiles": {}, "guest_escrows": {}}

try:
    from shared_app import cache_volume
except Exception:
    cache_volume = None

def _save_ledger(data):
    f = _get_ledger_file()
    try:
        with open(f, "w") as fp:
            json.dump(data, fp, indent=2)
        if cache_volume and f == LEDGER_PATH:
            try:
                cache_volume.commit()
            except Exception:
                pass
    except Exception as e:
        print(f"[LEDGER] Save failed: {e}")

def _sweep_guest_refunds_internal():
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
    if not stripe.api_key:
        return []
    ledger = _load_ledger()
    now = time.time()
    refunded = []

    for dep_id, escrow in list(ledger.get("guest_escrows", {}).items()):
        if escrow.get("status") == "held" and not escrow.get("claimed", False):
            # Check if 24 hours (86400 seconds) have passed
            if now - escrow.get("created_at", now) >= 86400:
                pi_id = escrow.get("pi_id")
                gross_cents = escrow.get("gross_cents", 0)
                non_refundable_fee_cents = escrow.get("non_refundable_fee_cents", 0)
                refund_cents = max(0, gross_cents - non_refundable_fee_cents)

                if pi_id and refund_cents > 0:
                    try:
                        ref = stripe.Refund.create(
                            payment_intent=pi_id,
                            amount=refund_cents,
                            reason="requested_by_customer"
                        )
                        escrow["status"] = "auto_refunded"
                        escrow["refunded_at"] = now
                        escrow["refund_id"] = ref.id
                        refunded.append({"deposit_id": dep_id, "refund_id": ref.id, "cents": refund_cents})
                        print(f"[AUTO-REFUND] Successfully refunded guest deposit {dep_id}: ${refund_cents/100:.2f}")
                    except Exception as err:
                        print(f"[AUTO-REFUND] Failed for {dep_id}: {err}")
                        escrow["refund_error"] = str(err)
    if refunded:
        _save_ledger(ledger)
    return refunded

def StripeAPI() -> FastAPI:
    web_app = FastAPI(title="AlphaCore Stripe Engine", version="3.0.0")

    origins = [
        "https://alpha-core.tech",
        "https://alphacoretech.netlify.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"https://.*\.alpha-core\.tech|https://.*--alphacoretech\.netlify\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # -------------------------------------------------------------
    # 1. PROFILE LEDGER & INVENTORY PERSISTENCE
    # -------------------------------------------------------------
    @web_app.get("/balance")
    async def get_balance(profile: str = "Guest"):
        # Run opportunistic sweep of abandoned guest escrows
        try:
            _sweep_guest_refunds_internal()
        except Exception as e:
            print(f"[SWEEP] Opportunistic check note: {e}")

        ledger = _load_ledger()
        clean_prof = profile.strip().lower()
        prof_data = ledger.get("profiles", {}).get(clean_prof, {
            "balance": 0.0,
            "tokens": 0,
            "detergent": 5,
            "dryerSheets": 5,
            "wetClothes": 0,
            "cleanClothes": 0
        })
        return {
            "profile": profile,
            "is_guest": clean_prof == "guest",
            "balance": prof_data.get("balance", 0.0),
            "tokens": prof_data.get("tokens", 0),
            "inventory": {
                "detergent": prof_data.get("detergent", 5),
                "dryerSheets": prof_data.get("dryerSheets", 5),
                "wetClothes": prof_data.get("wetClothes", 0),
                "cleanClothes": prof_data.get("cleanClothes", 0),
            }
        }

    @web_app.post("/update-inventory")
    async def update_inventory(request: Request):
        data = await request.json()
        profile = str(data.get("profile", "Guest")).strip().lower()
        if profile == "guest":
            return {"status": "ok", "note": "guest inventory is ephemeral"}

        inv = data.get("inventory", {})
        ledger = _load_ledger()
        if "profiles" not in ledger:
            ledger["profiles"] = {}
        if profile not in ledger["profiles"]:
            ledger["profiles"][profile] = {
                "balance": 0.0, "tokens": 0, "detergent": 5, "dryerSheets": 5, "wetClothes": 0, "cleanClothes": 0
            }

        p = ledger["profiles"][profile]
        for k in ["tokens", "detergent", "dryerSheets", "wetClothes", "cleanClothes", "balance"]:
            if k in inv:
                p[k] = inv[k]

        _save_ledger(ledger)
        return {"status": "success", "profile": profile, "current": p}

    # -------------------------------------------------------------
    # 2. ATM DEPOSIT (INCOMING FUNDS VIA SOURCE CARD / CASH APP)
    # -------------------------------------------------------------
    @web_app.post("/atm-deposit")
    async def atm_deposit(request: Request):
        stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
        data = await request.json()
        amount_usd = float(data.get("amount", 0.0))
        profile = str(data.get("profile", "Guest")).strip()
        is_guest = profile.lower() == "guest" or bool(data.get("is_guest", False))

        if amount_usd < 10.0:
            raise HTTPException(status_code=400, detail="Minimum ATM deposit is $10.00 USD.")

        amount_cents = int(round(amount_usd * 100))
        # Non-refundable card network capture fee: Stripe standard (2.9% + 30 cents)
        non_refundable_fee_cents = int(round(amount_cents * 0.029 + 30))

        # Profile fee rate
        prof_lower = profile.lower()
        if prof_lower == "architect":
            fee_rate = 0.0
        elif prof_lower == "fisherman":
            fee_rate = 0.07
        else:
            fee_rate = 0.10

        deposit_id = f"dep_{int(time.time())}_{os.urandom(4).hex()}"

        try:
            # Create PaymentIntent charged to AlphaCore platform balance
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency="usd",
                payment_method_types=["card", "cashapp"],
                metadata={
                    "deposit_id": deposit_id,
                    "profile": profile,
                    "is_guest": str(is_guest),
                    "action": "atm_deposit",
                    "non_refundable_fee_cents": str(non_refundable_fee_cents)
                }
            )

            tokens_yielded = max(1, int(round(amount_usd * 4)))

            return {
                "clientSecret": intent.client_secret,
                "paymentIntentId": intent.id,
                "depositId": deposit_id,
                "amount": amount_usd,
                "amountCents": amount_cents,
                "tokens": tokens_yielded,
                "nonRefundableFeeCents": non_refundable_fee_cents,
                "isGuest": is_guest
            }
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=getattr(e, "user_message", None) or str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @web_app.post("/confirm-atm-deposit")
    async def confirm_atm_deposit(request: Request):
        stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
        data = await request.json()
        pi_id = data.get("paymentIntentId")
        deposit_id = data.get("depositId")
        profile = str(data.get("profile", "Guest")).strip()
        is_guest = profile.lower() == "guest" or bool(data.get("is_guest", False))

        try:
            intent = stripe.PaymentIntent.retrieve(pi_id)
            if intent.status != "succeeded":
                raise HTTPException(status_code=400, detail=f"Deposit not succeeded. Status: {intent.status}")

            gross_amount = intent.amount / 100.0
            tokens = max(1, int(round(gross_amount * 4)))
            non_ref_fee = int(intent.metadata.get("non_refundable_fee_cents", round(intent.amount * 0.029 + 30)))

            ledger = _load_ledger()

            if is_guest:
                # Store in Guest Escrow with 24-hr safety timer
                if "guest_escrows" not in ledger:
                    ledger["guest_escrows"] = {}
                ledger["guest_escrows"][deposit_id] = {
                    "deposit_id": deposit_id,
                    "pi_id": pi_id,
                    "gross_cents": intent.amount,
                    "amount": gross_amount,
                    "tokens": tokens,
                    "non_refundable_fee_cents": non_ref_fee,
                    "created_at": time.time(),
                    "status": "held",
                    "claimed": False
                }
            else:
                # Credit to persistent Profile balance
                prof_lower = profile.lower()
                if "profiles" not in ledger:
                    ledger["profiles"] = {}
                if prof_lower not in ledger["profiles"]:
                    ledger["profiles"][prof_lower] = {
                        "balance": 0.0, "tokens": 0, "detergent": 5, "dryerSheets": 5, "wetClothes": 0, "cleanClothes": 0
                    }
                ledger["profiles"][prof_lower]["balance"] += gross_amount
                ledger["profiles"][prof_lower]["tokens"] += tokens

            _save_ledger(ledger)

            return {
                "status": "confirmed",
                "depositId": deposit_id,
                "amount": gross_amount,
                "tokens": tokens,
                "isGuest": is_guest,
                "message": "Funds secured in platform holding tank."
            }
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=getattr(e, "user_message", None) or str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # -------------------------------------------------------------
    # 3. COIN CHANGER PAYOUT (INSTANT PUSH-TO-CARD DEBIT ENTRY)
    # -------------------------------------------------------------
    @web_app.post("/changer-payout")
    async def changer_payout(request: Request):
        stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
        data = await request.json()
        payout_amount = float(data.get("amount", 0.0))
        profile = str(data.get("profile", "Guest")).strip()
        is_guest = profile.lower() == "guest"
        deposit_id = data.get("depositId")
        card_token = data.get("cardToken")  # Generated via stripe.createToken('card', ...)

        if not card_token:
            raise HTTPException(status_code=400, detail="Destination debit card token is required.")

        if payout_amount < 10.0:
            raise HTTPException(status_code=400, detail="Minimum payout is $10.00 USD.")

        ledger = _load_ledger()

        # 1. Verify and reserve funds from Ledger
        if is_guest:
            if not deposit_id or deposit_id not in ledger.get("guest_escrows", {}):
                raise HTTPException(status_code=400, detail="Invalid or expired guest deposit session.")
            escrow = ledger["guest_escrows"][deposit_id]
            if escrow.get("claimed", False) or escrow.get("status") != "held":
                raise HTTPException(status_code=400, detail="Deposit funds have already been claimed or refunded.")
        else:
            prof_lower = profile.lower()
            prof_data = ledger.get("profiles", {}).get(prof_lower, {})
            if prof_data.get("balance", 0.0) < payout_amount:
                raise HTTPException(status_code=400, detail="Insufficient persistent account balance.")

        payout_cents = int(round(payout_amount * 100))

        # 2. Execute Headless Push-to-Card Instant Payout
        try:
            # Create headless individual custom recipient connected account in background
            client_ip = request.client.host if request.client else "127.0.0.1"
            account = stripe.Account.create(
                type="custom",
                country="US",
                business_type="individual",
                capabilities={"transfers": {"requested": True}},
                external_account=card_token,  # Attached debit card
                tos_acceptance={"date": int(time.time()), "ip": client_ip}
            )

            # Transfer funds from platform to the custom account
            transfer = stripe.Transfer.create(
                amount=payout_cents,
                currency="usd",
                destination=account.id,
                description=f"AlphaCore Clean Laundry Payout // {profile}"
            )

            # Fire Instant Payout directly to debit card (Visa Direct / Mastercard Send)
            payout = stripe.Payout.create(
                amount=payout_cents,
                currency="usd",
                method="instant",
                stripe_account=account.id
            )

            # 3. Mark funds as claimed in Ledger
            if is_guest:
                ledger["guest_escrows"][deposit_id]["claimed"] = True
                ledger["guest_escrows"][deposit_id]["status"] = "claimed"
                ledger["guest_escrows"][deposit_id]["claimed_at"] = time.time()
                ledger["guest_escrows"][deposit_id]["payout_id"] = payout.id
            else:
                prof_lower = profile.lower()
                ledger["profiles"][prof_lower]["balance"] -= payout_amount

            _save_ledger(ledger)

            return {
                "status": "success",
                "payoutId": payout.id,
                "amount": payout_amount,
                "method": "instant_push_to_card",
                "message": "Funds successfully pushed to destination debit card."
            }
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=getattr(e, "user_message", None) or str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Payout execution failed: {str(e)}")

    # -------------------------------------------------------------
    # 4. GUEST ESCROW 24-HOUR AUTO-REFUND SWEEPER
    # -------------------------------------------------------------
    @web_app.post("/sweep-guest-refunds")
    async def sweep_guest_refunds():
        refunded = _sweep_guest_refunds_internal()
        return {
            "status": "success",
            "refunded_count": len(refunded),
            "refunded_items": refunded
        }

    # -------------------------------------------------------------
    # 5. LEGACY ENDPOINTS FOR DIRECT ACCT ROUTING COMPATIBILITY
    # -------------------------------------------------------------
    @web_app.post("/create-payment-intent")
    async def create_payment_intent(request: Request):
        stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
        data = await request.json()
        amount_usd = data.get("amount")
        profile = str(data.get("profile", "Guest")).strip()
        destination = data.get("destination", "acct_1UKrOjHx3NuZf8IK")

        if not destination.startswith("acct_"):
            raise HTTPException(status_code=400, detail="Invalid destination account ID format.")
        amount_cents = int(round(float(amount_usd) * 100))

        prof_lower = profile.lower()
        fee_rate = 0.0 if prof_lower == "architect" else (0.07 if prof_lower == "fisherman" else 0.10)
        fee_cents = int(round(amount_cents * fee_rate))

        try:
            direct_params = {
                "amount": amount_cents,
                "currency": "usd",
                "payment_method_types": ["card"],
                "metadata": {"profile": profile, "destination": destination}
            }
            if fee_cents > 0:
                direct_params["application_fee_amount"] = fee_cents

            intent = stripe.PaymentIntent.create(**direct_params, stripe_account=destination)
            return {"clientSecret": intent.client_secret, "destination": destination, "chargeType": "direct"}
        except Exception:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency="usd",
                automatic_payment_methods={"enabled": True},
                transfer_data={"destination": destination}
            )
            return {"clientSecret": intent.client_secret, "destination": destination, "chargeType": "destination"}

    @web_app.post("/create-connect-account")
    async def create_connect_account(request: Request):
        stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
        data = await request.json()
        name = str(data.get("name", "AlphaCore Recipient")).strip()
        account = stripe.Account.create(
            type="express",
            country="US",
            business_profile={"name": name, "url": "https://alpha-core.tech"},
            capabilities={"card_payments": {"requested": True}, "transfers": {"requested": True}}
        )
        account_link = stripe.AccountLink.create(
            account=account.id,
            refresh_url="https://alpha-core.tech/#/laundry",
            return_url=f"https://alpha-core.tech/#/laundry?onboarded_acct={account.id}",
            type="account_onboarding"
        )
        return {"accountId": account.id, "onboardingUrl": account_link.url}

    @web_app.get("/get-account-info")
    async def get_account_info(account_id: str):
        stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
        acc = stripe.Account.retrieve(str(account_id).strip())
        return {
            "id": acc.id,
            "name": getattr(acc.business_profile, "name", "Connected Account"),
            "payouts_enabled": getattr(acc, "payouts_enabled", False),
            "charges_enabled": getattr(acc, "charges_enabled", False)
        }

    return web_app

# Fix: Export the application globally so it can be mounted directly by deploy.py
app = StripeAPI()