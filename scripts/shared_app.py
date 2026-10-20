import modal
from pathlib import Path

app = modal.App("alphacore-aio-backend")
CACHE_DIR = "/hf-hub-cache"
OUTPUTS_DIR = "/outputs"

cache_volume = modal.Volume.from_name("hf-hub-cache", create_if_missing=True)
outputs_volume = modal.Volume.from_name("outputs", create_if_missing=True)

# Unified Modal Secret containing all environment variables (.env)
# Keys: HF_TOKEN, CIVITAI_API_KEY, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY,
# GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, FB_APP_ID, FB_APP_SECRET
UNIFIED_SECRET = modal.Secret.from_name("alphacore-secrets")
UNIFIED_SECRETS = [UNIFIED_SECRET]
