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
            # Build PaymentIntent payload with destination transfer routing
            intent_params = {
                "amount": amount_cents,
                "currency": "usd",
                "automatic_payment_methods": {"enabled": True},
                "transfer_data": {"destination": "acct_1UKrOjHx3NuZf8IK"},
                "metadata": {
                    "profile": profile,
                    "platform_fee": fee_label
                }
            }

            # Retain platform cut (AlphaCore / Perry-IT LLC) when fee > 0
            if fee_cents > 0:
                intent_params["application_fee_amount"] = fee_cents

            intent = stripe.PaymentIntent.create(**intent_params)
            return {"clientSecret": intent.client_secret}
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=getattr(e, "user_message", None) or str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return web_app