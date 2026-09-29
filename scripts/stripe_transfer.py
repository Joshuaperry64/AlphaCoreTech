import modal
import os

# Set up Modal App and Image with Stripe dependency
image = modal.Image.debian_slim().pip_install("stripe", "fastapi")
app = modal.App("alphacore-stripe")

@app.function(image=image, secrets=[modal.Secret.from_name("stripe-secret")])
@modal.asgi_app()
def fastapi_app():
    # Defer all heavy imports to the cloud container to bypass Termux build errors
    from fastapi import FastAPI, Request, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    import stripe

    web_app = FastAPI()

    # Allow CORS for authorized domains and local dev environments
    origins = [
        "https://alpha-core.tech",
        "https://www.alpha-core.tech",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"https://.*\.alpha-core\.tech",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @web_app.post("/create-payment-intent")
    async def create_payment_intent(request: Request):
        # Retrieve securely stored Stripe Secret Key from Modal Secrets
        stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
        
        data = await request.json()
        amount_usd = data.get("amount")
        profile = str(data.get("profile", "Guest")).strip()
        
        # Dynamic destination routing (defaults to PerryIT Sutton Bank vault)
        destination = data.get("destination")
        if not destination or not str(destination).strip():
            destination = "acct_1UKrOjHx3NuZf8IK"
        else:
            destination = str(destination).strip()

        if not destination.startswith("acct_"):
            raise HTTPException(status_code=400, detail="Invalid destination account ID format (must start with 'acct_')")
        
        if not amount_usd or amount_usd < 10:
            raise HTTPException(status_code=400, detail="Minimum transfer amount is $10.00")
        
        # Convert USD to cents for Stripe API
        amount_cents = int(round(float(amount_usd) * 100))
        
        # Determine platform fee tier based on profile
        profile_lower = profile.lower()
        if profile_lower == "architect":
            fee_label = "0%"
            fee_rate = 0.0
        elif profile_lower == "fisherman":
            fee_label = "7%"
            fee_rate = 0.07
        else:
            fee_label = "10%"
            fee_rate = 0.10
        
        fee_cents = int(round(amount_cents * fee_rate))

        try:
            # Build PaymentIntent payload with dynamic destination transfer routing
            intent_params = {
                "amount": amount_cents,
                "currency": "usd",
                "automatic_payment_methods": {"enabled": True},
                "transfer_data": {"destination": destination},
                "metadata": {
                    "profile": profile,
                    "platform_fee": fee_label,
                    "destination_account": destination
                }
            }

            # Retain platform cut (Perry-IT LLC / AlphaCore) when fee > 0
            if fee_cents > 0:
                intent_params["application_fee_amount"] = fee_cents

            intent = stripe.PaymentIntent.create(**intent_params)
            return {
                "clientSecret": intent.client_secret,
                "destination": destination,
                "platformFee": fee_label,
                "feeCents": fee_cents
            }
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=getattr(e, "user_message", None) or str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @web_app.post("/create-connect-account")
    async def create_connect_account(request: Request):
        stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
        data = await request.json()
        email = data.get("email")
        name = str(data.get("name", "AlphaCore Recipient")).strip()
        return_url = data.get("return_url", "https://alpha-core.tech/#/laundry")
        refresh_url = data.get("refresh_url", "https://alpha-core.tech/#/laundry")

        try:
            # Create an Express connected account for seamless Stripe-hosted onboarding
            account_params = {
                "type": "express",
                "country": "US",
                "business_profile": {
                    "name": name,
                    "url": "https://alpha-core.tech"
                },
                "capabilities": {
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                }
            }
            if email and "@" in str(email):
                account_params["email"] = str(email).strip()

            account = stripe.Account.create(**account_params)

            # Generate onboarding link
            account_link = stripe.AccountLink.create(
                account=account.id,
                refresh_url=refresh_url,
                return_url=f"{return_url}?onboarded_acct={account.id}",
                type="account_onboarding"
            )

            return {
                "accountId": account.id,
                "onboardingUrl": account_link.url
            }
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=getattr(e, "user_message", None) or str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @web_app.get("/get-account-info")
    async def get_account_info(account_id: str):
        stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
        clean_id = str(account_id).strip()
        if not clean_id.startswith("acct_"):
            raise HTTPException(status_code=400, detail="Invalid account ID format (must start with 'acct_')")
        try:
            acc = stripe.Account.retrieve(clean_id)
            bank_name = "External Bank / Card"
            last4 = "••••"
            if hasattr(acc, "external_accounts") and acc.external_accounts and acc.external_accounts.data:
                ea = acc.external_accounts.data[0]
                bank_name = getattr(ea, "bank_name", getattr(ea, "brand", "Card / Bank"))
                last4 = getattr(ea, "last4", "••••")
            return {
                "id": acc.id,
                "name": getattr(acc.business_profile, "name", None) or getattr(acc, "email", "Connected Account"),
                "email": getattr(acc, "email", None),
                "payouts_enabled": getattr(acc, "payouts_enabled", False),
                "charges_enabled": getattr(acc, "charges_enabled", False),
                "bank_name": bank_name,
                "last4": last4
            }
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=getattr(e, "user_message", None) or str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return web_app