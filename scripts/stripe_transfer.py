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

    # Allow CORS for your frontend
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], 
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
        fee_rate = data.get("fee_rate")
        
        if not amount_usd or amount_usd < 10:
            raise HTTPException(status_code=400, detail="Minimum transfer amount is $10.00")
        
        # Convert USD to cents for Stripe API
        amount_cents = int(amount_usd * 100)
        
        # Determine fee tier label for audit metadata
        fee_label = "0%" if profile.lower() == "architect" else ("7%" if profile.lower() == "fisherman" else "10%")

        try:
            # Create a PaymentIntent with destination routing
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency="usd",
                automatic_payment_methods={"enabled": True},
                transfer_data={"destination": "acct_1UKrOjHx3NuZf8IK"}, 
                metadata={
                    "profile": profile,
                    "platform_fee": fee_label
                }
            )
            return {"clientSecret": intent.client_secret}
        except Exception as e:
            raise HTTPException(status_code=403, detail=str(e))

    return web_app