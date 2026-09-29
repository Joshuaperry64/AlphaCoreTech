import modal
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import stripe
import os

# Set up Modal App and Image with Stripe dependency
image = modal.Image.debian_slim().pip_install("stripe", "fastapi")
app = modal.App("alphacore-stripe")
web_app = FastAPI()

# Allow CORS for your frontend
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Restrict to alpha-core.tech in production
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
    
    if not amount_usd or amount_usd < 10:
        raise HTTPException(status_code=400, detail="Minimum transfer amount is $10.00")
    
    # Convert USD to cents for Stripe API
    amount_cents = int(amount_usd * 100)
    
    try:
        # Create a PaymentIntent with destination routing
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            automatic_payment_methods={"enabled": True},
            # Destination routing requires the recipient's Stripe Connect Account ID
            # transfer_data={"destination": "acct_123456789"}, 
        )
        return {"clientSecret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

@app.function(image=image, secrets=[modal.Secret.from_name("stripe-secret")])
@modal.asgi_app()
def fastapi_app():
    return web_app
