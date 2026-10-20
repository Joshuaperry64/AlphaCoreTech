import modal
import base64
import time
import os
import httpx
from typing import Optional, Dict, Any, List
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

# 1. Import the central app instance and volume definitions
from shared_app import app, CACHE_DIR, cache_volume

# 2. Import worker scripts
import music
import web_loader
import voice_cloner
import upscaler
import vid2audio

if modal.is_local():
    import scraper
    import txt2img
    import img2img
    import txt2vid
    import img2vid
    import framepack
    import preprocessors
    import vllm_t4

# --- WEBSITE MODEL CATALOGS ---
WEBSITE_CHECKPOINTS = {
    "0x7RealisticFreedom_omegaSDXL.safetensors": "1461059",
    "juggernautXL_ragnarok.safetensors": "1759168",
    "cyberrealisticXL_desireV30.safetensors": "2765942",
    "unholyDesireMixCrimson_v50.safetensors": "2200584",
    "dreamshaperXL_alpha2Xl10.safetensors": "128713",
    "lustifyNSFWCheckpoint_zenithV9.safetensors": "3112728",
    "epicrealismXL_pureFix.safetensors": "2514955",
    "intorealism_sdxlV4.safetensors": "2650268",
    "cyberrealisticPony_v180Coreshift.safetensors": "2884631",
    "realvisxlV50_v50Bakedvae.safetensors": "798204",
    "realisticComicBook_v10.safetensors": "271085",
    "juicyDreams_v10.safetensors": "3381025",
}

WEBSITE_LORAS = {
    "epiCRealismHelper.safetensors": "1051156",
    "cunny.safetensors": "286911",
    "FlatTop.safetensors": "1109661",
    "BJ.safetensors": "1312598",
    "Cowgirl.safetensors": "472474",
    "Missionary.safetensors": "144818",
    "SpyCam.safetensors": "545059",
    "detailifier.safetensors": "623945",
    "lezcunbkv2.safetensors": "252053",
}

def _get_secrets():
    return [modal.Secret.from_name("alphacore-secrets")]

sync_image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("requests", "tqdm", "fastapi[standard]", "pydantic", "Pillow", "numpy")
    .add_local_python_source("shared_app", "music", "web_loader", "voice_cloner", "upscaler", "vid2audio")
)

@app.cls(
    image=sync_image,
    volumes={CACHE_DIR: cache_volume},
    secrets=_get_secrets(),
    timeout=3600
)
class AssetSync:
    @modal.method()
    def sync_website_models(self, force: bool = False, check_updates: bool = True):
        """
        Scans the hf-hub-cache modal volume for all website checkpoints and LoRAs.
        If check_updates is True, checks CivitAI for newer versions of models and LoRAs
        belonging to the same base architecture (SDXL) and alerts/updates them.
        If any model or LoRA is missing or empty, downloads it directly from CivitAI.
        """
        import os
        import json
        import requests
        from pathlib import Path
        from tqdm import tqdm

        api_key = os.environ.get("CIVITAI_API_KEY", "")
        headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}

        ckpt_dir = Path(CACHE_DIR) / "checkpoints"
        lora_dir = Path(CACHE_DIR) / "loras"
        ckpt_dir.mkdir(parents=True, exist_ok=True)
        lora_dir.mkdir(parents=True, exist_ok=True)

        try:
            cache_volume.reload()
        except Exception as ve:
            print(f"[DEPLOYMENT] Volume reload note (non-fatal): {ve}")

        summary = {
            "checkpoints": {"already_present": [], "downloaded": [], "updated": [], "failed": []},
            "loras": {"already_present": [], "downloaded": [], "updated": [], "failed": []},
        }

        manifest_path = Path(CACHE_DIR) / "models_manifest.json"
        manifest = {}
        if manifest_path.exists():
            try:
                with open(manifest_path, "r", encoding="utf-8") as mf:
                    manifest = json.load(mf)
            except Exception as me:
                print(f"[MANIFEST] Read note: {me}")

        def save_manifest_entry(fname, vid, vname="", size_mb=0.0):
            manifest[fname] = {
                "version_id": str(vid),
                "name": vname,
                "size_mb": round(size_mb, 2) if size_mb else None,
                "updated_at": time.time()
            }
            try:
                with open(manifest_path, "w", encoding="utf-8") as mf:
                    json.dump(manifest, mf, indent=2)
                cache_volume.commit()
            except Exception as me:
                print(f"[MANIFEST] Save note: {me}")

        # Cache of version metadata to prevent duplicate API hits
        version_cache = {}

        def fetch_version_meta(v_id):
            if v_id in version_cache:
                return version_cache[v_id]
            try:
                res = requests.get(f"https://civitai.com/api/v1/model-versions/{v_id}", headers=headers, timeout=25)
                if res.status_code == 200:
                    data = res.json()
                    version_cache[v_id] = data
                    return data
            except Exception as e:
                print(f"  [API] Failed fetching version {v_id}: {e}")
            return None

        def check_for_upstream_update(current_version_id, category_name, filename):
            """Checks CivitAI parent model for newer versions with matching architecture."""
            try:
                # If we have an on-volume recorded version for this file, use it as baseline
                manifest_entry = manifest.get(filename, {})
                if isinstance(manifest_entry, dict):
                    effective_curr_vid = str(manifest_entry.get("version_id", current_version_id))
                else:
                    effective_curr_vid = str(manifest_entry)

                v_data = fetch_version_meta(effective_curr_vid)
                if not v_data:
                    v_data = fetch_version_meta(current_version_id)
                if not v_data:
                    return None
                model_id = v_data.get("modelId")
                curr_base = (v_data.get("baseModel") or "SDXL").strip().lower()
                curr_created = v_data.get("createdAt")

                if not model_id:
                    return None

                m_res = requests.get(f"https://civitai.com/api/v1/models/{model_id}", headers=headers, timeout=25)
                if m_res.status_code != 200:
                    return None

                m_data = m_res.json()
                all_versions = m_data.get("modelVersions", [])
                candidates = []
                for v in all_versions:
                    v_id_str = str(v.get("id"))
                    # If this version matches currently installed/recorded version, skip
                    if v_id_str == str(effective_curr_vid):
                        continue

                    # Must have published status
                    if v.get("status") and v.get("status").lower() not in ("published", "active"):
                        continue

                    # Must have downloadable files
                    v_files = v.get("files", [])
                    if not any(f.get("downloadUrl") for f in v_files):
                        continue

                    v_base = (v.get("baseModel") or "").strip().lower()
                    # Architecture family consistency check:
                    if "sdxl" in curr_base and "sdxl" not in v_base:
                        continue
                    if "pony" in curr_base and "pony" not in v_base:
                        continue
                    if "noob" in curr_base and "noob" not in v_base:
                        continue
                    if "1.5" in curr_base and "1.5" not in v_base:
                        continue

                    v_created = v.get("createdAt")
                    # Compare release timestamp if present
                    if v_created and curr_created and v_created > curr_created:
                        candidates.append(v)

                if candidates:
                    # Sort candidates so the newest version by createdAt is selected
                    candidates.sort(key=lambda x: x.get("createdAt") or "", reverse=True)
                    newest = candidates[0]
                    return {
                        "newer_version_id": str(newest.get("id")),
                        "newer_version_name": newest.get("name"),
                        "newer_created_at": newest.get("createdAt"),
                        "current_version_id": str(effective_curr_vid),
                        "current_version_name": v_data.get("name"),
                        "model_title": m_data.get("name"),
                        "filename": filename,
                        "category": category_name
                    }
            except Exception as check_err:
                print(f"  [UPDATE CHECK] Note for {filename}: {check_err}")
            return None

        def process_item(filename, version_id, target_dir, category_key):
            dest_path = target_dir / filename
            category_name = "CHECKPOINT" if category_key == "checkpoints" else "LORA"
            effective_version_id = version_id
            is_an_update = False
            update_meta = None

            # Check for upstream newer versions if update checking is active
            if check_updates:
                update_info = check_for_upstream_update(version_id, category_name, filename)
                if update_info:
                    print(f"🔔 [UPDATE DETECTED] {category_name} '{filename}' ({update_info['model_title']}):")
                    print(f"    Current: {update_info['current_version_name']} (ID: {update_info['current_version_id']})")
                    print(f"    Newer:   {update_info['newer_version_name']} (ID: {update_info['newer_version_id']} - Released: {update_info['newer_created_at']})")
                    effective_version_id = update_info["newer_version_id"]
                    is_an_update = True
                    update_meta = update_info

            # If not an update, check if current file already exists and is healthy
            if not is_an_update and not force and dest_path.exists():
                size_mb = dest_path.stat().st_size / (1024 * 1024)
                min_valid_mb = 10.0 if category_key == "checkpoints" else 1.0
                if size_mb > min_valid_mb:
                    print(f"[{category_name}] {filename} exists ({size_mb:.2f} MB, version {manifest.get(filename, {}).get('version_id', version_id)}). Skipping.")
                    if filename not in manifest:
                        save_manifest_entry(filename, version_id, size_mb=size_mb)
                    summary[category_key]["already_present"].append({"file": filename, "size_mb": round(size_mb, 2)})
                    return

            # Check for existing variants/aliases only if not updating
            if not is_an_update and not force:
                stem = filename.replace(".safetensors", "")
                for existing in target_dir.glob(f"{stem}*.safetensors"):
                    if existing.is_file() and existing != dest_path and not existing.name.endswith(".tmp"):
                        size_mb = existing.stat().st_size / (1024 * 1024)
                        if size_mb > (10.0 if category_key == "checkpoints" else 1.0):
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
                            save_manifest_entry(filename, version_id, size_mb=size_mb)
                            summary[category_key]["already_present"].append({"file": filename, "size_mb": round(size_mb, 2)})
                            return

            # Clean stale tmp file if any
            tmp_path = dest_path.with_suffix(dest_path.suffix + ".tmp")
            if tmp_path.exists():
                try:
                    tmp_path.unlink()
                except Exception:
                    pass

            action_label = f"UPDATING {filename} to version {effective_version_id}" if is_an_update else f"Missing {filename}! Fetching metadata (ID: {effective_version_id})"
            print(f"[{category_name}] {action_label} from CivitAI...")
            try:
                meta_data = fetch_version_meta(effective_version_id)
                if not meta_data:
                    err = f"CivitAI API could not retrieve metadata for ID {effective_version_id}."
                    print(f"  -> ERROR: {err}")
                    summary[category_key]["failed"].append({"file": filename, "error": err})
                    return

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

                tmp_size_mb = tmp_path.stat().st_size / (1024 * 1024)
                min_mb = 10.0 if category_key == "checkpoints" else 1.0
                if tmp_size_mb < min_mb:
                    tmp_path.unlink(missing_ok=True)
                    err = f"Downloaded file size too small ({tmp_size_mb:.2f} MB), potentially corrupt or HTML error response."
                    print(f"  -> ERROR: {err}")
                    summary[category_key]["failed"].append({"file": filename, "error": err})
                    return

                # Atomic replacement: guarantees dest_path is never wiped if download failed
                tmp_path.replace(dest_path)
                cache_volume.commit()
                actual_mb = dest_path.stat().st_size / (1024 * 1024)
                print(f"  -> [SAVED] {dest_path} ({actual_mb:.2f} MB)")
                
                v_name = update_meta.get("newer_version_name", "") if update_meta else meta_data.get("name", "")
                save_manifest_entry(filename, effective_version_id, v_name, size_mb=actual_mb)

                if is_an_update:
                    summary[category_key]["updated"].append({
                        "file": filename,
                        "size_mb": round(actual_mb, 2),
                        "new_version_id": effective_version_id,
                        "new_version_name": update_meta.get("newer_version_name") if update_meta else None
                    })
                else:
                    summary[category_key]["downloaded"].append({"file": filename, "size_mb": round(actual_mb, 2)})

            except Exception as exc:
                print(f"  -> FAILED downloading {filename}: {exc}")
                summary[category_key]["failed"].append({"file": filename, "error": str(exc)})

        print("=" * 60)
        print("ALPHACORE: SCANNING & SYNCING CHECKPOINTS...")
        print("=" * 60)
        # Purge obsolete checkpoints if present to reclaim volume storage
        for obsolete_fn in ["unholyDesireMixSinister_v80.safetensors", "realisticVisionV60B1_v60B1VAE.safetensors"]:
            obsolete_file = ckpt_dir / obsolete_fn
            if obsolete_file.exists():
                try:
                    obsolete_file.unlink()
                    print(f"[AssetSync] ♻️ Replaced/purged obsolete {obsolete_fn}")
                except Exception as e:
                    print(f"[AssetSync] Note purging obsolete checkpoint {obsolete_fn}: {e}")

        for fn, vid in WEBSITE_CHECKPOINTS.items():
            process_item(fn, vid, ckpt_dir, "checkpoints")

        print("\n" + "=" * 60)
        print("ALPHACORE: SCANNING & SYNCING LORAS...")
        print("=" * 60)
        for fn, vid in WEBSITE_LORAS.items():
            process_item(fn, vid, lora_dir, "loras")

        # Provide friendly alias licking_lesbians.safetensors pointing to lezcunbkv2.safetensors
        lez_file = lora_dir / "lezcunbkv2.safetensors"
        lez_alias = lora_dir / "licking_lesbians.safetensors"
        if lez_file.exists() and not lez_alias.exists():
            try:
                os.link(str(lez_file), str(lez_alias))
            except Exception:
                try:
                    os.symlink(str(lez_file), str(lez_alias))
                except Exception:
                    pass

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

# --- PYDANTIC REQUEST SCHEMAS ---
class MusicRequest(BaseModel):
    prompt: str
    lyrics: Optional[str] = "[Instrumental]"
    length_seconds: Optional[int] = 30
    duration: Optional[float] = None
    format: str = "mp3"
    seed: Optional[int] = 1

class DownloadRequest(BaseModel):
    source: str
    params: dict

class VoiceConvertRequest(BaseModel):
    profile_name: str
    audio_b64: str
    pitch_shift: int = 0

class VoiceSampleUpload(BaseModel):
    profile_name: str
    filename: str
    audio_b64: str

class VoiceTrainRequest(BaseModel):
    profile_name: Optional[str] = None

class Vid2AudioRequest(BaseModel):
    video: Optional[str] = None
    video_b64: Optional[str] = None
    prompt: str = ""
    negative_prompt: str = "low quality, muffled, noise, distorted"
    duration: float = 8.0
    num_steps: int = 25
    cfg_strength: float = 4.5
    variant: str = "large_44k_v2"
    seed: int = -1
    return_video: bool = True

# 3. Create the Monolithic API Router Factory
def create_aio_api(is_eco: bool = False) -> FastAPI:
    tier_name = "Economy" if is_eco else "Architect Priority"
    app_instance = FastAPI(title=f"AlphaCore AIO Backend ({tier_name})")

    app_instance.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app_instance.get("/")
    def home():
        return {
            "status": f"AlphaCore AIO Backend ({tier_name}) Online",
            "tier": "economy" if is_eco else "architect",
            "timestamp": time.time()
        }

    # --- VID2AUDIO ENDPOINTS ---
    @app_instance.get("/api/vid2audio/status")
    def api_vid2audio_status():
        hw = "Modal Cloud T4 (Economy Tier, 60s Scaledown)" if is_eco else "Modal Cloud L40S (Architect Priority)"
        return {
            "status": "online",
            "tier": "economy" if is_eco else "architect",
            "engine": "MMAudio 44.1kHz Neural Foley Pipeline",
            "hardware": hw,
            "timestamp": time.time()
        }

    @app_instance.post("/api/vid2audio/generate")
    async def api_generate_vid2audio(req: Vid2AudioRequest):
        try:
            v2a_cls = vid2audio.Vid2Audio_Eco if is_eco else vid2audio.Vid2Audio
            video_input = req.video or req.video_b64
            if not video_input:
                raise HTTPException(status_code=400, detail="Missing 'video' (base64) parameter")
            
            result = await v2a_cls().generate.remote.aio(
                video_b64=video_input,
                prompt=req.prompt,
                negative_prompt=req.negative_prompt,
                duration=req.duration,
                num_steps=req.num_steps,
                cfg_strength=req.cfg_strength,
                variant=req.variant,
                seed=req.seed,
                return_video=req.return_video
            )
            return result
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app_instance.post("/api/vid2audio/stream")
    async def api_generate_vid2audio_stream(req: Vid2AudioRequest):
        v2a_cls = vid2audio.Vid2Audio_Eco if is_eco else vid2audio.Vid2Audio
        video_input = req.video or req.video_b64
        if not video_input:
            raise HTTPException(status_code=400, detail="Missing 'video' (base64) parameter")

        async def event_generator():
            try:
                for update in v2a_cls().run_stream.remote_gen(
                    video_b64=video_input,
                    prompt=req.prompt,
                    negative_prompt=req.negative_prompt,
                    duration=req.duration,
                    num_steps=req.num_steps,
                    cfg_strength=req.cfg_strength,
                    variant=req.variant,
                    seed=req.seed,
                    return_video=req.return_video
                ):
                    yield f"data: {json.dumps(update)}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )

    # --- MUSIC GENERATION ENDPOINT ---
    @app_instance.post("/api/music/generate")
    async def api_generate_music(req: MusicRequest):
        try:
            gen_cls = music.MusicGenerator_Eco if is_eco else music.MusicGenerator
            target_duration = float(req.duration if req.duration is not None else (req.length_seconds or 30))
            audio_bytes = await gen_cls().run.remote.aio(
                prompt=req.prompt,
                lyrics=req.lyrics or "[Instrumental]",
                duration=target_duration,
                format=req.format or "mp3",
                manual_seeds=req.seed
            )
            audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
            return {
                "status": "success",
                "audio_b64": audio_b64,
                "format": req.format or "mp3",
                "duration": target_duration
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # --- ASSET MANAGER ENDPOINTS ---
    @app_instance.post("/api/assets/download")
    async def api_download_asset(req: DownloadRequest):
        try:
            result = await web_loader.Model_Downloader().download_asset.remote.aio(req.source, req.params)
            if result.get("error"):
                raise HTTPException(status_code=400, detail=result["error"])
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app_instance.get("/api/assets/list")
    async def api_list_assets(subfolder: str = "checkpoints"):
        try:
            files = await web_loader.Model_Downloader().list_assets.remote.aio(subfolder)
            return {"files": files}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app_instance.post("/api/assets/sync-website-models")
    async def api_sync_website_models(force: bool = False):
        try:
            call = AssetSync().sync_website_models.spawn(force=force)
            return {
                "status": "sync_initiated",
                "call_id": call.object_id,
                "message": "Model scan and download initiated in background on Modal volume."
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # --- VOICE CLONER ENDPOINTS ---
    @app_instance.get("/api/voice/status")
    def api_voice_status():
        hw = "Modal Cloud T4 (Economy Tier, 60s Scaledown)" if is_eco else "Modal Cloud A10G (Architect Priority)"
        return {
            "status": "online",
            "tier": "economy" if is_eco else "architect",
            "engine": "RVC v2 Neural Pipeline",
            "hardware": hw,
            "models_volume": "rvc-models-volume",
            "timestamp": time.time()
        }

    @app_instance.get("/api/voice/profiles")
    async def api_voice_profiles():
        try:
            import asyncio
            contents = await asyncio.wait_for(voice_cloner.VoiceCloner_Storage().list_volume_contents.remote.aio(), timeout=15.0)
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

    @app_instance.post("/api/voice/convert")
    async def api_voice_convert(req: VoiceConvertRequest):
        try:
            audio_bytes = base64.b64decode(req.audio_b64)
            fn = voice_cloner.VoiceCloner_Eco().infer_audio_modal_eco if is_eco else voice_cloner.VoiceCloner().infer_audio_modal
            result = await fn.remote.aio(
                profile_name=req.profile_name,
                audio_bytes=audio_bytes,
                pitch_shift=req.pitch_shift
            )
            if result.get("status") == "error":
                raise HTTPException(status_code=400, detail=result.get("message", "Voice conversion failed"))
            out_b64 = base64.b64encode(result["audio_bytes"]).decode("utf-8")
            return {
                "status": "success",
                "tier": "economy" if is_eco else "architect",
                "audio_b64": out_b64,
                "sample_rate": result.get("sample_rate", 48000),
                "profile": req.profile_name
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app_instance.post("/api/voice/upload-sample")
    async def api_voice_upload_sample(req: VoiceSampleUpload):
        try:
            file_bytes = base64.b64decode(req.audio_b64)
            await voice_cloner.VoiceCloner_Storage().upload_audio_file.remote.aio(req.profile_name, req.filename, file_bytes)
            return {"status": "success", "message": f"Sample {req.filename} saved for {req.profile_name}"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app_instance.post("/api/voice/train")
    async def api_voice_train(profile_name: Optional[str] = None, req: Optional[VoiceTrainRequest] = None):
        target_name = profile_name or (req.profile_name if req else None)
        if not target_name:
            raise HTTPException(status_code=400, detail="Missing 'profile_name' parameter")
        try:
            call = voice_cloner.VoiceCloner().process_audio_samples.spawn(target_name)
            return {
                "status": "training_started",
                "call_id": call.object_id,
                "profile_name": target_name,
                "message": f"GPU training initiated for profile '{target_name}'"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # --- UNIVERSAL CALL STATUS ENDPOINT ---
    @app_instance.get("/api/call-status/{call_id}")
    def api_get_call_status(call_id: str):
        try:
            fc = modal.functions.FunctionCall.from_id(call_id)
            try:
                result = fc.get(timeout=0)
                return {
                    "status": "completed",
                    "call_id": call_id,
                    "result": result
                }
            except TimeoutError:
                return {
                    "status": "running",
                    "call_id": call_id
                }
        except Exception as e:
            return {
                "status": "failed",
                "call_id": call_id,
                "error": str(e)
            }

    # --- NEURAL UPSCALER ENDPOINTS ---
    @app_instance.get("/api/upscale/status")
    def api_upscale_status():
        hw = "Modal Cloud T4 (Economy Tier, 60s Scaledown)" if is_eco else "Modal Cloud A10G (Architect Priority)"
        return {
            "status": "online",
            "tier": "economy" if is_eco else "architect",
            "engine": "Real-ESRGAN / Neural Super-Resolution Pipeline",
            "hardware": hw,
            "models": [
                {"id": "realesrgan-x4plus", "name": "RealESRGAN x4plus", "category": "Photo Realism", "scale": 4},
                {"id": "realesrgan-anime", "name": "RealESRGAN Anime 6B", "category": "2D / Line Art", "scale": 4},
                {"id": "ultrasharp-4x", "name": "4x UltraSharp", "category": "Crisp Textures", "scale": 4},
                {"id": "dsp-fast", "name": "Fast Adaptive DSP", "category": "Instant Resampling", "scale": 4}
            ],
            "supported_scales": [2, 4, 8],
            "timestamp": time.time()
        }

    @app_instance.post("/api/upscale")
    async def api_upscale(req: upscaler.UpscaleRequest):
        try:
            upscaler_cls = upscaler.Upscaler_Eco if is_eco else upscaler.Upscaler
            res = await upscaler_cls().upscale_image.remote.aio(
                **req.model_dump()
            )
            return res
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # --- COGNITIVE CORE (vLLM SERVER) STATUS ---
    @app_instance.get("/api/cognitive/status")
    def api_cognitive_status():
        return {
            "status": "online",
            "tier": "universal",
            "engine": "vLLM Abliterated Vision-Language Server",
            "model": "nicklas373/Huihui-gemma-4-12B-it-abliterated-AWQ",
            "hardware": "Modal Cloud T4 (Eager Mode, 16GB VRAM)",
            "endpoint_label": "cognitive-core",
            "timestamp": time.time()
        }

    return app_instance

web_app = create_aio_api(is_eco=False)
web_app_eco = create_aio_api(is_eco=True)

# 4. Expose the FastAPI apps to Modal
router_image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("fastapi[standard]", "pydantic", "requests", "Pillow", "numpy", "httpx", "stripe")
    .add_local_python_source("shared_app", "music", "web_loader", "voice_cloner", "upscaler", "vid2audio", "stripe_transfer")
)

@app.function(image=router_image, volumes={CACHE_DIR: cache_volume}, scaledown_window=120, secrets=_get_secrets())
@modal.asgi_app()
def AlphaCore_Main_API():
    """Universal Main API mapping /architect and /eco to respective routers."""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    
    master_app = FastAPI(title="AlphaCore Universal Main API")
    master_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @master_app.get("/")
    def root():
        return {"status": "AlphaCore Universal Main API Online", "endpoints": ["/architect", "/eco"]}
        
    master_app.mount("/architect", web_app)
    master_app.mount("/eco", web_app_eco)
    
    import stripe_transfer
    # Mount the globally initialized module app directly
    master_app.mount("/stripe", stripe_transfer.app) 
    
    return master_app

@app.local_entrypoint()
def scan_and_download(force: bool = False, check_updates: bool = True):
    """
    Run locally via:
        modal run deploy.py
        modal run deploy.py --force
        modal run deploy.py --no-check-updates
    """
    print("🚀 Triggering remote volume scan & download for all website checkpoints and LoRAs...")
    if check_updates:
        print("🔍 Update checking enabled: Will inspect CivitAI for newer compatible model versions...")
    result = AssetSync().sync_website_models.remote(force=force, check_updates=check_updates)
    print("\n✅ Sync run completed!")
    import json
    print(json.dumps(result, indent=2))
    
    # Highlight updates if executed and automatically update local deploy.py catalog IDs
    updates = result.get("checkpoints", {}).get("updated", []) + result.get("loras", {}).get("updated", [])
    if updates:
        print("\n" + "!" * 60)
        print("🎉 MODEL / LORA ASSETS SUCCESSFULLY REPLACED WITH NEWER VERSIONS:")
        print("!" * 60)
        for u in updates:
            print(f"  • {u['file']} -> Version: {u.get('new_version_name')} (ID: {u.get('new_version_id')}, {u.get('size_mb')} MB)")
        print("!" * 60)

        try:
            import re
            deploy_script_path = Path(__file__).resolve()
            with open(deploy_script_path, "r", encoding="utf-8") as f:
                content = f.read()

            modified = False
            for u in updates:
                f_name = u["file"]
                new_id = str(u["new_version_id"])
                # Match e.g. "dreamshaperXL_alpha2Xl10.safetensors": "128713"
                pattern = rf'("{re.escape(f_name)}":\s*")[^"]*(")'
                if re.search(pattern, content):
                    content = re.sub(pattern, rf'\g<1>{new_id}\g<2>', content)
                    modified = True
                    print(f"💾 [AUTO-CATALOG] Updated '{f_name}' to version ID '{new_id}' in deploy.py")

            if modified:
                with open(deploy_script_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print("✅ Successfully updated local deploy.py catalog IDs to prevent repeated downloads!")
        except Exception as update_err:
            print(f"⚠️ [AUTO-CATALOG] Failed updating local deploy.py catalog IDs: {update_err}")