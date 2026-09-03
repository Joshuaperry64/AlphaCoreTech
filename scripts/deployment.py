import modal
import base64
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 1. Import the central app instance
from shared_app import app

# 2. Import all worker scripts so their decorators attach to the app
import scraper
import cloner
import txt2img
import img2img
import txt2vid
import img2vid
import framepack
import music
import web_loader

# 3. Create the Monolithic API Router
web_app = FastAPI(title="AlphaCore AIO Backend")

web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@web_app.get("/")
def home():
    return {"status": "AlphaCore AIO Backend Online", "timestamp": time.time()}

# --- NEW MUSIC GENERATION ENDPOINT ---
class MusicRequest(BaseModel):
    prompt: str
    length_seconds: int = 30

@web_app.post("/api/music/generate")
async def api_generate_music(req: MusicRequest):
    try:
        # Call the remote worker
        audio_bytes = await music.MusicGenerator().run.remote.aio(
            prompt=req.prompt,
            length_in_seconds=req.length_seconds
        )
        # Encode as base64 for the frontend
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        return {"audio_b64": audio_b64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW ASSET MANAGER ENDPOINTS ---
class DownloadRequest(BaseModel):
    source: str
    params: dict

@web_app.post("/api/assets/download")
async def api_download_asset(req: DownloadRequest):
    try:
        result = await web_loader.AssetManager().download_asset.remote.aio(req.source, req.params)
        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@web_app.get("/api/assets/list")
async def api_list_assets(subfolder: str = "checkpoints"):
    try:
        files = await web_loader.AssetManager().list_assets.remote.aio(subfolder)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 4. Expose the FastAPI app to Modal
router_image = modal.Image.debian_slim(python_version="3.12").pip_install("fastapi[standard]", "pydantic", "requests")

@app.function(image=router_image)
@modal.asgi_app()
def fastapi_app():
    return web_app
