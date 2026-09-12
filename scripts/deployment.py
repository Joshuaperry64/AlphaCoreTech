import modal
import base64
import time
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 1. Import the central app instance and volume definitions
from shared_app import app, CACHE_DIR, cache_volume

# 2. Import worker scripts
import music
import web_loader
import cloner
import upscaler

if modal.is_local():
    import scraper
    import txt2img
    import img2img
    import txt2vid
    import img2vid
    import framepack
    import preprocessors
    import upscaler

# --- WEBSITE MODEL CATALOGS ---
WEBSITE_CHECKPOINTS = {
    "0x7RealisticFreedom_omegaSDXL.safetensors": "1461059",
    "juggernautXL_ragnarok.safetensors": "1759168",
    "cyberrealisticXL_desireV30.safetensors": "2765942",
    "unholyDesireMixSinister_v80.safetensors": "2824082",
    "dreamshaperXL_alpha2Xl10.safetensors": "128713",
    "lustifyNSFWCheckpoint_zenithV9.safetensors": "3112728",
    "epicrealismXL_pureFix.safetensors": "2514955",
}

WEBSITE_LORAS = {
    "epiCRealismHelper.safetensors": "118945",
    "cunny.safetensors": "286911",
    "FlatTop.safetensors": "1109661",
    "BJ.safetensors": "1312598",
    "Cowgirl.safetensors": "472474",
    "Missionary.safetensors": "144818",
    "SpyCam.safetensors": "545059",
    "detailifier.safetensors": "623945",
}

def _get_secrets():
    secrets = []
    try:
        secrets.append(modal.Secret.from_name("civitai-secret"))
    except:
        pass
    try:
        secrets.append(modal.Secret.from_name("huggingface-secret"))
    except:
        pass
    return secrets

sync_image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("requests", "tqdm", "fastapi[standard]", "pydantic", "Pillow", "numpy")
    .add_local_python_source("shared_app", "music", "web_loader", "cloner", "upscaler")
)

@app.function(
    image=sync_image,
    volumes={CACHE_DIR: cache_volume},
    secrets=_get_secrets(),
    timeout=3600
)
def sync_website_models(force: bool = False):
    """
    Scans the hf-hub-cache modal volume for all website checkpoints and LoRAs.
    If any model or LoRA is missing or empty, downloads it directly from CivitAI.
    """
    import os
    import requests
    from pathlib import Path
    from tqdm import tqdm

    api_key = os.environ.get("CIVITAI_API_KEY", "")
    headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}

    ckpt_dir = Path(CACHE_DIR) / "checkpoints"
    lora_dir = Path(CACHE_DIR) / "loras"
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    lora_dir.mkdir(parents=True, exist_ok=True)

    cache_volume.reload()

    summary = {
        "checkpoints": {"already_present": [], "downloaded": [], "failed": []},
        "loras": {"already_present": [], "downloaded": [], "failed": []},
    }

    def process_item(filename, version_id, target_dir, category_key):
        dest_path = target_dir / filename
        category_name = "CHECKPOINT" if category_key == "checkpoints" else "LORA"

        if not force and dest_path.exists():
            size_mb = dest_path.stat().st_size / (1024 * 1024)
            if size_mb > 1.0:
                print(f"[{category_name}] {filename} exists ({size_mb:.2f} MB). Skipping.")
                summary[category_key]["already_present"].append({"file": filename, "size_mb": round(size_mb, 2)})
                return

        # Check for existing variants/aliases (e.g. juggernautXL_ragnarokBy.safetensors)
        if not force:
            stem = filename.replace(".safetensors", "")
            for existing in target_dir.glob(f"{stem}*.safetensors"):
                if existing.is_file() and existing != dest_path and not existing.name.endswith(".tmp"):
                    size_mb = existing.stat().st_size / (1024 * 1024)
                    if size_mb > 1.0:
                        print(f"[{category_name}] Found existing variant {existing.name} ({size_mb:.2f} MB) for {filename}. Linking...")
                        try:
                            os.link(str(existing), str(dest_path))
                        except Exception:
                            try:
                                os.symlink(str(existing), str(dest_path))
                            except Exception:
                                import shutil
                                shutil.copyfile(str(existing), str(dest_path))
                        cache_volume.commit()
                        summary[category_key]["already_present"].append({"file": filename, "size_mb": round(size_mb, 2)})
                        return

        # Clean stale tmp file if any
        tmp_path = dest_path.with_suffix(dest_path.suffix + ".tmp")
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except Exception:
                pass

        print(f"[{category_name}] Missing {filename}! Fetching metadata from CivitAI (ID: {version_id})...")
        try:
            meta_url = f"https://civitai.com/api/v1/model-versions/{version_id}"
            meta_res = requests.get(meta_url, headers=headers, timeout=30)
            if meta_res.status_code != 200:
                err = f"CivitAI API error: HTTP {meta_res.status_code}"
                print(f"  -> ERROR: {err}")
                summary[category_key]["failed"].append({"file": filename, "error": err})
                return

            meta_data = meta_res.json()
            files = meta_data.get("files", [])
            primary = next((f for f in files if f.get("primary", False)), files[0] if files else None)
            if not primary or "downloadUrl" not in primary:
                err = "No downloadable file found in version metadata"
                print(f"  -> ERROR: {err}")
                summary[category_key]["failed"].append({"file": filename, "error": err})
                return

            dl_url = primary["downloadUrl"]
            if api_key:
                dl_url += f"&token={api_key}" if "?" in dl_url else f"?token={api_key}"

            expected_mb = primary.get("sizeKB", 0) / 1024
            print(f"  -> Downloading {filename} ({expected_mb:.2f} MB)...")

            tmp_path = dest_path.with_suffix(dest_path.suffix + ".tmp")
            with requests.get(dl_url, headers=headers, stream=True, timeout=60) as r:
                r.raise_for_status()
                total_size = int(r.headers.get("content-length", 0))

                with open(tmp_path, "wb") as f, tqdm(
                    desc=filename,
                    total=total_size,
                    unit="iB",
                    unit_scale=True,
                    unit_divisor=1024,
                ) as bar:
                    for chunk in r.iter_content(chunk_size=65536):
                        f.write(chunk)
                        bar.update(len(chunk))

            tmp_path.rename(dest_path)
            cache_volume.commit()
            actual_mb = dest_path.stat().st_size / (1024 * 1024)
            print(f"  -> [SAVED] {dest_path} ({actual_mb:.2f} MB)")
            summary[category_key]["downloaded"].append({"file": filename, "size_mb": round(actual_mb, 2)})

        except Exception as exc:
            print(f"  -> FAILED downloading {filename}: {exc}")
            summary[category_key]["failed"].append({"file": filename, "error": str(exc)})

    print("=" * 60)
    print("ALPHACORE: SCANNING & SYNCING CHECKPOINTS...")
    print("=" * 60)
    for fn, vid in WEBSITE_CHECKPOINTS.items():
        process_item(fn, vid, ckpt_dir, "checkpoints")

    print("\n" + "=" * 60)
    print("ALPHACORE: SCANNING & SYNCING LORAS...")
    print("=" * 60)
    for fn, vid in WEBSITE_LORAS.items():
        process_item(fn, vid, lora_dir, "loras")

    for tmp_file in list(ckpt_dir.glob("*.tmp")) + list(lora_dir.glob("*.tmp")):
        try:
            tmp_file.unlink()
            print(f"[CLEANUP] Removed orphan temp file: {tmp_file.name}")
        except Exception:
            pass

    cache_volume.commit()
    print("\n" + "=" * 60)
    print("SYNC OPERATION COMPLETED")
    print("=" * 60)
    return summary

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
        audio_bytes = await music.MusicGenerator().run.remote.aio(
            prompt=req.prompt,
            length_in_seconds=req.length_seconds
        )
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        return {"audio_b64": audio_b64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- ASSET MANAGER ENDPOINTS ---
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

@web_app.post("/api/assets/sync-website-models")
async def api_sync_website_models(force: bool = False):
    """Trigger remote scan and download of missing website checkpoints and LoRAs."""
    try:
        call = sync_website_models.spawn(force=force)
        return {
            "status": "sync_initiated",
            "call_id": call.object_id,
            "message": "Model scan and download initiated in background on Modal volume."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- VOICE CLONER ENDPOINTS ---
class VoiceConvertRequest(BaseModel):
    profile_name: str
    audio_b64: str
    pitch_shift: int = 0

@web_app.get("/api/voice/status")
def api_voice_status():
    return {
        "status": "online",
        "engine": "RVC v2 Neural Pipeline",
        "hardware": "Modal Cloud A10G",
        "models_volume": "rvc-models-volume",
        "timestamp": time.time()
    }

@web_app.get("/api/voice/profiles")
async def api_voice_profiles():
    try:
        import asyncio
        contents = await asyncio.wait_for(cloner.list_volume_contents.remote.aio(), timeout=3.0)
        volume_profiles = []
        if isinstance(contents, dict) and "error" not in contents:
            for path_str in contents.keys():
                if path_str.startswith("models/"):
                    parts = path_str.split("/")
                    if len(parts) >= 2 and parts[1] not in volume_profiles:
                        volume_profiles.append(parts[1])
        presets = [
            {"name": "AlphaCore-EDEN11", "label": "Alpha // EDEN 11", "desc": "Sentient, provocative cybernetic synthesis"},
            {"name": "Architect-Lead", "label": "Architect Lead", "desc": "Deep resonant command authority"},
            {"name": "CyberSynth-V1", "label": "CyberSynth V1", "desc": "Overdrive robotic vocoder pitch"},
            {"name": "GlitchCore-X", "label": "GlitchCore X", "desc": "Analog distorted neural broadcast"}
        ]
        return {
            "presets": presets,
            "custom_profiles": volume_profiles,
            "total": len(presets) + len(volume_profiles)
        }
    except Exception as e:
        return {
            "presets": [
                {"name": "AlphaCore-EDEN11", "label": "Alpha // EDEN 11", "desc": "Sentient, provocative cybernetic synthesis"},
                {"name": "Architect-Lead", "label": "Architect Lead", "desc": "Deep resonant command authority"},
                {"name": "CyberSynth-V1", "label": "CyberSynth V1", "desc": "Overdrive robotic vocoder pitch"},
                {"name": "GlitchCore-X", "label": "GlitchCore X", "desc": "Analog distorted neural broadcast"}
            ],
            "custom_profiles": [],
            "error": str(e)
        }

@web_app.post("/api/voice/convert")
async def api_voice_convert(req: VoiceConvertRequest):
    try:
        audio_bytes = base64.b64decode(req.audio_b64)
        result = await cloner.infer_audio_modal.remote.aio(
            profile_name=req.profile_name,
            audio_bytes=audio_bytes,
            pitch_shift=req.pitch_shift
        )
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message", "Voice conversion failed"))
        out_b64 = base64.b64encode(result["audio_bytes"]).decode("utf-8")
        return {
            "status": "success",
            "audio_b64": out_b64,
            "sample_rate": result.get("sample_rate", 48000),
            "profile": req.profile_name
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class VoiceSampleUpload(BaseModel):
    profile_name: str
    filename: str
    audio_b64: str

@web_app.post("/api/voice/upload-sample")
async def api_voice_upload_sample(req: VoiceSampleUpload):
    try:
        file_bytes = base64.b64decode(req.audio_b64)
        await cloner.upload_audio_file.remote.aio(req.profile_name, req.filename, file_bytes)
        return {"status": "success", "message": f"Sample {req.filename} saved for {req.profile_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@web_app.post("/api/voice/train")
async def api_voice_train(profile_name: str):
    try:
        call = cloner.process_audio_samples.spawn(profile_name)
        return {
            "status": "training_started",
            "call_id": call.object_id,
            "profile_name": profile_name,
            "message": f"A10G GPU training initiated for profile '{profile_name}'"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- NEURAL UPSCALER ENDPOINTS ---
@web_app.get("/api/upscale/status")
def api_upscale_status():
    return {
        "status": "online",
        "engine": "Real-ESRGAN / Neural Super-Resolution Pipeline",
        "hardware": "Modal Cloud A10G",
        "models": [
            {"id": "realesrgan-x4plus", "name": "RealESRGAN x4plus", "category": "Photo Realism", "scale": 4},
            {"id": "realesrgan-anime", "name": "RealESRGAN Anime 6B", "category": "2D / Line Art", "scale": 4},
            {"id": "ultrasharp-4x", "name": "4x UltraSharp", "category": "Crisp Textures", "scale": 4},
            {"id": "dsp-fast", "name": "Fast Adaptive DSP", "category": "Instant Resampling", "scale": 4}
        ],
        "supported_scales": [2, 4, 8],
        "timestamp": time.time()
    }

@web_app.post("/api/upscale")
async def api_upscale(req: upscaler.UpscaleRequest):
    try:
        res = await upscaler.Upscaler().upscale_image.remote.aio(
            image_b64=req.image_b64,
            scale=req.scale,
            model_name=req.model_name,
            denoise=req.denoise,
            sharpen=req.sharpen,
            face_enhance=req.face_enhance,
            output_format=req.output_format
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 4. Expose the FastAPI app to Modal
router_image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("fastapi[standard]", "pydantic", "requests", "Pillow", "numpy")
    .add_local_python_source("shared_app", "music", "web_loader", "cloner", "upscaler")
)

@app.function(image=router_image)
@modal.asgi_app()
def AlphaCore_Main_API():
    return web_app

@app.local_entrypoint()
def scan_and_download(force: bool = False):
    """
    Run locally via:
        modal run deployment.py
        modal run deployment.py --force
    """
    print("🚀 Triggering remote volume scan & download for all website checkpoints and LoRAs...")
    result = sync_website_models.remote(force=force)
    print("\n✅ Sync run completed!")
    import json
    print(json.dumps(result, indent=2))

