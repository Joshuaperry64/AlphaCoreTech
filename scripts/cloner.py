"""
voice_cloner.py - RVC v2 Voice Cloning Backend
Modal GPU pipeline for training, refining, and managing voice profiles.
"""

import os
import sys
import json
import subprocess
import shutil
import modal
from pathlib import Path

# ─────────────────────────────────────────────
# Modal Infrastructure
# ─────────────────────────────────────────────

volume = modal.Volume.from_name("rvc-models-volume", create_if_missing=True)

image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("git", "ffmpeg", "wget", "build-essential")
    .run_commands("git clone https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI.git /rvc")
    .run_commands("cd /rvc && git checkout 9f2f0559e6932c10c48642d404e7d2e771d9db43")
    .workdir("/rvc")
    .run_commands("python -m pip install 'pip<24.1'")
    .pip_install("torch==2.1.2", "torchaudio==2.1.2", "torchvision==0.16.2", index_url="https://download.pytorch.org/whl/cu121")
    .run_commands("cd /rvc && pip install -r requirements.txt")
    .pip_install("gitpython")
    .run_commands(
        "wget -q https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/hubert_base.pt -P /rvc/assets/hubert/",
        "wget -q https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/rmvpe.pt -P /rvc/assets/rmvpe/",
        "wget -q https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained_v2/f0G48k.pth -P /rvc/assets/pretrained_v2/",
        "wget -q https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained_v2/f0D48k.pth -P /rvc/assets/pretrained_v2/"
    )
)

from shared_app import app

# ─────────────────────────────────────────────
# Local Profile Management
# ─────────────────────────────────────────────

PROFILES_DIR = Path("profiles")
PROFILES_DIR.mkdir(exist_ok=True)


def list_profiles() -> list[str]:
    return sorted([d.name for d in PROFILES_DIR.iterdir() if d.is_dir()])


def get_profile_data(profile_name: str) -> dict:
    data_file = PROFILES_DIR / profile_name / "metadata.json"
    if data_file.exists():
        with open(data_file, "r") as f:
            return json.load(f)
    return {"name": profile_name, "audio_samples": 0, "epochs_trained": 0}


def save_profile_data(profile_name: str, data: dict):
    data_file = PROFILES_DIR / profile_name / "metadata.json"
    with open(data_file, "w") as f:
        json.dump(data, f, indent=4)


def profile_exists(profile_name: str) -> bool:
    return (PROFILES_DIR / profile_name).is_dir()


def delete_profile(profile_name: str):
    profile_dir = PROFILES_DIR / profile_name
    if profile_dir.exists():
        shutil.rmtree(profile_dir)


# ─────────────────────────────────────────────
# Modal GPU Training Function
# ─────────────────────────────────────────────

@app.function(timeout=300, volumes={"/mnt/rvc_data": volume})
def upload_audio_file(profile_name: str, filename: str, file_bytes: bytes):
    """Uploads a single audio file to the Modal volume for training."""
    dataset_dir = Path(f"/mnt/rvc_data/datasets/{profile_name}")
    dataset_dir.mkdir(parents=True, exist_ok=True)
    with open(dataset_dir / filename, "wb") as f:
        f.write(file_bytes)
    volume.commit()


@app.function(image=image, gpu="A10G", timeout=3600, volumes={"/mnt/rvc_data": volume})
def process_audio_samples(profile_name: str):
    """
    RVC v2 Training Pipeline — runs on Modal A10G GPU.
    Returns a dict with status, message, and processed_files count.
    """
    dataset_dir = f"/mnt/rvc_data/datasets/{profile_name}"
    
    if not os.path.exists(dataset_dir):
        return {"status": "error", "message": f"Dataset directory not found for '{profile_name}'"}

    audio_files = []
    for ext in ["*.mp3", "*.m4a", "*.wav"]:
        audio_files.extend(list(Path(dataset_dir).rglob(ext)))
        
    print(f"[*] Found {len(audio_files)} audio file(s).")
    if not audio_files:
        return {"status": "error", "message": "No audio files found in the dataset directory."}

    # Calculate total duration to dynamically set epochs
    total_seconds = 0.0
    for f in audio_files:
        try:
            cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(f)]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            total_seconds += float(res.stdout.strip())
        except Exception:
            pass
            
    if total_seconds < 60:
        target_epochs = 200
    elif total_seconds < 180:
        target_epochs = 150
    elif total_seconds < 600:
        target_epochs = 100
    else:
        target_epochs = 50
        
    save_epoch = min(50, max(10, target_epochs // 2))
    print(f"[*] Total dataset duration: {total_seconds:.2f} seconds.")
    print(f"[*] Dynamically assigned Epochs: {target_epochs} (Save interval: {save_epoch})")

    exp_dir = f"/rvc/logs/{profile_name}"
    os.makedirs(exp_dir, exist_ok=True)

    # Step 1: Preprocess
    logs = "[*] Preprocessing audio (resample to 48k)...\n"
    try:
        res1 = subprocess.run(
            ["python", "infer/modules/train/preprocess.py", dataset_dir, "48000", "2", exp_dir, "False", "3.0"],
            check=True, capture_output=True, text=True
        )
        logs += f"[*] preprocess.py stdout:\n{res1.stdout}\n"
    except subprocess.CalledProcessError as e:
        return {"status": "error", "message": f"Preprocess failed:\n{e.stderr}", "logs": logs}

    # Step 2: Feature Extraction
    logs += "[*] Extracting pitch (RMVPE) and HuBERT features...\n"
    try:
        res2 = subprocess.run(
            ["python", "infer/modules/train/extract/extract_f0_print.py", exp_dir, "2", "rmvpe"],
            check=True, capture_output=True, text=True
        )
        logs += f"[*] extract_f0 stdout:\n{res2.stdout}\n"
        
        res3 = subprocess.run(
            ["python", "infer/modules/train/extract_feature_print.py", "cuda:0", "1", "0", "0", exp_dir, "v2", "True"],
            check=True, capture_output=True, text=True
        )
        logs += f"[*] extract_feature stdout:\n{res3.stdout}\n"
    except subprocess.CalledProcessError as e:
        return {"status": "error", "message": f"Feature extraction failed:\n{e.stderr}", "logs": logs}
        
    # Step 2.5: Generate filelist.txt and mute filelist
    logs += "[*] Generating filelist.txt for training...\n"
    try:
        opt = []
        gt_wavs_dir = f"{exp_dir}/0_gt_wavs"
        co256_dir = f"{exp_dir}/3_feature768"
        f0_dir = f"{exp_dir}/2a_f0"
        f0nsf_dir = f"{exp_dir}/2b-f0bak"
        
        # We find all .npy files in the feature directory
        for npy_file in os.listdir(co256_dir):
            name = npy_file.split(".")[0]
            # Verify the corresponding wav and f0 files exist
            if os.path.exists(f"{gt_wavs_dir}/{name}.wav") and os.path.exists(f"{f0_dir}/{name}.wav.npy") and os.path.exists(f"{f0nsf_dir}/{name}.wav.npy"):
                line = f"{gt_wavs_dir}/{name}.wav|{co256_dir}/{name}.npy|{f0_dir}/{name}.wav.npy|{f0nsf_dir}/{name}.wav.npy|0"
                opt.append(line)
        
        with open(f"{exp_dir}/filelist.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(opt))
            
        os.makedirs(f"{exp_dir}/mute", exist_ok=True)
        with open(f"{exp_dir}/mute/filelist.txt", "w", encoding="utf-8") as f:
            pass
            
        logs += f"[*] Generated filelist with {len(opt)} valid samples.\n"
    except Exception as e:
        return {"status": "error", "message": f"Filelist generation failed:\n{e}", "logs": logs}

    # Step 3: Train
    logs += f"[*] Starting RVC v2 model training ({target_epochs} epochs)...\n"
    try:
        shutil.copy("/rvc/configs/v2/48k.json", f"{exp_dir}/config.json")
        res = subprocess.run([
            "python", "infer/modules/train/train.py",
            "-e", profile_name,
            "-sr", "48k",
            "-f0", "1",
            "-bs", "4",
            "-te", str(target_epochs),
            "-se", str(save_epoch),
            "-pg", "/rvc/assets/pretrained_v2/f0G48k.pth",
            "-pd", "/rvc/assets/pretrained_v2/f0D48k.pth",
            "-l", "0",
            "-c", "0",
            "-sw", "1",
            "-v", "v2"
        ], capture_output=True, text=True)
        
        logs += f"[*] train.py stdout:\n{res.stdout}\n"
        if res.stderr:
            logs += f"[!] train.py stderr:\n{res.stderr}\n"
            
        if res.returncode != 0:
            return {"status": "error", "message": "Model training failed. See console for details.", "logs": logs}
            
    except Exception as e:
        return {"status": "error", "message": f"Model training crash: {e}", "logs": logs}

    # Step 4: Build FAISS Index
    print("[*] Building FAISS retrieval index...")
    try:
        subprocess.run(
            ["python", "infer/modules/train/train_index.py", profile_name, "v2"],
            check=True, capture_output=True, text=True
        )
    except subprocess.CalledProcessError as e:
        print(f"[!] Index build warning: {e.stderr}")

    # Step 5: Persist ALL model artifacts to volume
    dest_dir = Path(f"/mnt/rvc_data/models/{profile_name}")
    dest_dir.mkdir(parents=True, exist_ok=True)
    saved = []

    # Search the ENTIRE /rvc directory for .pth and .index files
    # RVC can sometimes save to assets/weights, weights, or logs.
    for f in Path("/rvc").rglob("*"):
        if f.is_file() and f.suffix in [".pth", ".index"]:
            # Make sure it belongs to this profile
            if profile_name.lower() in f.stem.lower() or profile_name.lower() in str(f.parent).lower():
                # Avoid copying the base pretrained models
                if "pretrained" not in str(f).lower() and "rmvpe" not in str(f).lower() and "hubert" not in str(f).lower():
                    target = dest_dir / f.name
                    if not target.exists():
                        shutil.copy(str(f), str(target))
                        saved.append(f.name)
                        logs += f"[*] Saved artifact: {f.name} (found at {f})\n"

    # Commit volume so files survive container shutdown
    volume.commit()
    
    if saved:
        logs += f"[*] Persisted {len(saved)} file(s) to volume at {dest_dir}\n"
    else:
        logs += "[!] WARNING: No model files were found to persist! Training may have failed silently.\n"

    logs += "[*] Training pipeline complete.\n"
    return {"status": "success", "processed_files": len(audio_files), "logs": logs}


# ─────────────────────────────────────────────
# High-Level API used by the UI
# ─────────────────────────────────────────────

def run_training(profile_name: str, local_files: list[str], log_callback=None) -> dict:
    """
    Orchestrates a full training run. Accepts an optional log_callback(str)
    that is called with status messages during the run.
    Returns the result dict from process_audio_samples.
    """
    def log(msg):
        print(msg)
        if log_callback:
            log_callback(msg)

    try:
        with app.run():
            if local_files:
                for idx, path in enumerate(local_files):
                    p = Path(path)
                    log(f"[*] Uploading {p.name} ({idx+1}/{len(local_files)})...")
                    with open(p, "rb") as f:
                        file_bytes = f.read()
                    upload_audio_file.remote(profile_name, p.name, file_bytes)
            
            log(f"[*] Dispatching training job for profile '{profile_name}'...")
            result = process_audio_samples.remote(profile_name)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}


def create_profile(profile_name: str, local_files: list[str], log_callback=None) -> dict:
    """Create a new profile and train it."""
    def log(msg):
        if log_callback:
            log_callback(msg)

    if not profile_name or " " in profile_name:
        return {"status": "error", "message": "Profile name cannot be empty or contain spaces."}
    if profile_exists(profile_name):
        return {"status": "error", "message": f"Profile '{profile_name}' already exists."}

    profile_dir = PROFILES_DIR / profile_name
    profile_dir.mkdir()
    save_profile_data(profile_name, {"name": profile_name, "audio_samples": 0, "epochs_trained": 0})

    result = run_training(profile_name, local_files, log_callback=log_callback)

    if result["status"] == "success":
        data = get_profile_data(profile_name)
        data["audio_samples"] = result.get("processed_files", 0)
        data["epochs_trained"] = 50
        save_profile_data(profile_name, data)
    else:
        # Cleanup on failure
        delete_profile(profile_name)

    return result


def refine_profile(profile_name: str, local_files: list[str], log_callback=None) -> dict:
    """Add new audio samples and continue training an existing profile."""
    if not profile_exists(profile_name):
        return {"status": "error", "message": f"Profile '{profile_name}' does not exist."}

    result = run_training(profile_name, local_files, log_callback=log_callback)

    if result["status"] == "success":
        data = get_profile_data(profile_name)
        data["audio_samples"] = data.get("audio_samples", 0) + result.get("processed_files", 0)
        data["epochs_trained"] = data.get("epochs_trained", 0) + 50
        save_profile_data(profile_name, data)

    return result


# ─────────────────────────────────────────────
# Modal: Model Download & File Inference
# ─────────────────────────────────────────────

@app.function(timeout=120, volumes={"/mnt/rvc_data": volume})
def list_volume_contents() -> dict:
    """Debug: list everything stored in the Modal persistent volume."""
    tree = {}
    base = Path("/mnt/rvc_data")
    if not base.exists():
        return {"error": "Volume mount not found"}
    for f in sorted(base.rglob("*")):
        rel = str(f.relative_to(base))
        tree[rel] = {"is_dir": f.is_dir(), "size_kb": round(f.stat().st_size / 1024, 1) if f.is_file() else 0}
    return tree


@app.function(timeout=120, volumes={"/mnt/rvc_data": volume})
def download_model_assets(profile_name: str) -> dict:
    """
    Returns trained model .pth and .index files as bytes for local inference.
    Searches both /mnt/rvc_data/models/<profile> and the entire volume as fallback.
    """
    # Primary location
    model_dir = Path(f"/mnt/rvc_data/models/{profile_name}")
    files = {}

    # Broad search across entire volume for this profile's files
    base = Path("/mnt/rvc_data")
    if base.exists():
        for f in base.rglob("*"):
            if f.is_file() and (profile_name.lower() in f.name.lower() or f.suffix in (".pth", ".index")):
                # Only grab files that look like model artifacts
                if f.suffix in (".pth", ".index"):
                    if profile_name.lower() in f.stem.lower() or profile_name.lower() in str(f.parent).lower():
                        with open(f, "rb") as fp:
                            files[f.name] = fp.read()

    if not files:
        # Return a listing so the user knows what's on the volume
        listing = [str(p.relative_to(base)) for p in base.rglob("*") if p.is_file()] if base.exists() else []
        return {
            "status": "error",
            "message": f"No model files found for '{profile_name}' anywhere on volume.",
            "volume_contents": listing
        }

    return {"status": "success", "files": files}


def _execute_rvc_inference(profile_name: str, audio_bytes: bytes, pitch_shift: int = 0) -> dict:
    """
    Core RVC file-to-file voice conversion.
    Accepts raw audio bytes (wav/mp3), returns converted wav bytes.
    """
    import io
    import sys
    import tempfile
    sys.path.insert(0, "/rvc")

    import soundfile as sf
    from configs.config import Config
    from infer.modules.vc.modules import VC

    model_dir = Path(f"/mnt/rvc_data/models/{profile_name}")
    pth_files = list(model_dir.glob("*.pth"))
    if not pth_files:
        return {"status": "error", "message": f"No trained model found for '{profile_name}'."}

    config = Config()
    vc_engine = VC(config)
    vc_engine.get_vc(str(pth_files[0]), 0.5, 0.33)

    # Write input audio to disk (soundfile needs a path)
    audio_io = io.BytesIO(audio_bytes)
    audio_data, in_sr = sf.read(audio_io)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
        sf.write(tf.name, audio_data, in_sr)
        input_path = tf.name

    index_files = list(Path(f"/rvc/logs/{profile_name}").rglob("*.index"))
    index_path = str(index_files[0]) if index_files else ""

    try:
        _, wav_opt = vc_engine.vc_single(
            0, input_path, pitch_shift, None,
            "rmvpe", index_path, None,
            0.75, 3, 0, 0.25, 0.33
        )

        if wav_opt is None:
            return {"status": "error", "message": "Inference returned no output."}

        out_sr, out_data = wav_opt
        out_io = io.BytesIO()
        sf.write(out_io, out_data, out_sr, format="WAV")
        return {"status": "success", "audio_bytes": out_io.getvalue(), "sample_rate": out_sr}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        Path(input_path).unlink(missing_ok=True)


@app.function(image=image, gpu="A10G", timeout=300, volumes={"/mnt/rvc_data": volume})
def infer_audio_modal(profile_name: str, audio_bytes: bytes, pitch_shift: int = 0) -> dict:
    """Architect tier voice conversion on A10G GPU."""
    return _execute_rvc_inference(profile_name, audio_bytes, pitch_shift)


@app.function(image=image, gpu="T4", timeout=300, scaledown_window=60, max_containers=1, volumes={"/mnt/rvc_data": volume})
def infer_audio_modal_eco(profile_name: str, audio_bytes: bytes, pitch_shift: int = 0) -> dict:
    """Economy tier voice conversion on cost-optimized T4 GPU with 60s scaledown."""
    return _execute_rvc_inference(profile_name, audio_bytes, pitch_shift)
