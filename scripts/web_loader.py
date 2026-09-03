from shared_app import app, CACHE_DIR, cache_volume
import modal

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "requests",
        "huggingface-hub>=0.24.0",
    )
)

def _get_secrets():
    secrets = []
    try: secrets.append(modal.Secret.from_name("civitai-secret"))
    except: pass
    try: secrets.append(modal.Secret.from_name("huggingface-secret"))
    except: pass
    return secrets

@app.cls(image=image, volumes={CACHE_DIR: cache_volume}, secrets=_get_secrets())
class AssetManager:
    @modal.method()
    def download_asset(self, source: str, params: dict):
        import os
        import requests
        from pathlib import Path

        subfolder = params.get("subfolder", "checkpoints")
        dest_dir = Path(CACHE_DIR) / subfolder
        dest_dir.mkdir(parents=True, exist_ok=True)
        
        output_filename = params.get("output_filename", "")

        if source == "civitai":
            version_id = params.get("civitai_version_id")
            if not version_id: return {"error": "Missing civitai_version_id"}
            
            api_key = os.environ.get("CIVITAI_API_KEY", "")
            meta_url = f"https://civitai.com/api/v1/model-versions/{version_id}"
            headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
            
            meta = requests.get(meta_url, headers=headers, timeout=30)
            if meta.status_code != 200: return {"error": f"CivitAI API error: {meta.text}"}
            
            files = meta.json().get("files", [])
            primary = next((f for f in files if f.get("primary", False)), files[0] if files else None)
            if not primary: return {"error": "No downloadable files found"}
            
            download_url = primary["downloadUrl"]
            if api_key: download_url += f"&token={api_key}" if "?" in download_url else f"?token={api_key}"
            
            final_filename = output_filename or primary["name"]
            dest_path = dest_dir / final_filename
            
            # Streaming download
            with requests.get(download_url, headers=headers, stream=True) as r:
                r.raise_for_status()
                with open(dest_path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
            
            cache_volume.commit()
            return {"status": "success", "filename": final_filename, "size": primary.get("sizeKB", 0)}

        elif source == "huggingface":
            import huggingface_hub
            hf_repo = params.get("hf_repo")
            hf_filename = params.get("hf_filename")
            if not hf_repo or not hf_filename: return {"error": "Missing repo or filename"}
            
            hf_token = os.environ.get("HF_TOKEN")
            try:
                downloaded = huggingface_hub.hf_hub_download(
                    repo_id=hf_repo,
                    filename=hf_filename,
                    token=hf_token,
                    local_dir=str(dest_dir),
                    local_dir_use_symlinks=False,
                )
                final_filename = output_filename or Path(downloaded).name
                final_dest = dest_dir / final_filename
                if output_filename and Path(downloaded) != final_dest:
                    Path(downloaded).rename(final_dest)
                
                cache_volume.commit()
                return {"status": "success", "filename": final_filename}
            except Exception as e:
                return {"error": str(e)}

        elif source == "url":
            url = params.get("direct_url")
            if not url: return {"error": "Missing direct_url"}
            
            final_filename = output_filename or url.split("/")[-1].split("?")[0] or "downloaded_file.bin"
            dest_path = dest_dir / final_filename
            
            with requests.get(url, stream=True) as r:
                r.raise_for_status()
                with open(dest_path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
            
            cache_volume.commit()
            return {"status": "success", "filename": final_filename}
            
        return {"error": "Invalid source"}
        
    @modal.method()
    def list_assets(self, subfolder: str = "checkpoints"):
        from pathlib import Path
        cache_volume.reload()
        dir_path = Path(CACHE_DIR) / subfolder
        if not dir_path.exists(): return []
        
        return [
            {
                "name": f.name,
                "size_mb": round(f.stat().st_size / (1024*1024), 2)
            }
            for f in dir_path.iterdir() if f.is_file()
        ]
