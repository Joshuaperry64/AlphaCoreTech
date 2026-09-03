# ---
# output-directory: "/tmp/img2img-output"
# ---

import io
import json
import base64
import time
from pathlib import Path
from io import BytesIO

import modal

from core import app

# --- CACHE & VOLUME SETUP ---
CACHE_DIR = "/hf-hub-cache"
cache_volume = modal.Volume.from_name("hf-hub-cache", create_if_missing=True)
outputs_volume = modal.Volume.from_name("outputs", create_if_missing=True)
OUTPUTS_DIR = Path("/outputs")
volumes = {CACHE_DIR: cache_volume, OUTPUTS_DIR: outputs_volume}
secrets = [modal.Secret.from_name("huggingface-secret")]

# --- UNIFIED DEPENDENCIES ---
image = (
    modal.Image.from_registry("nvidia/cuda:12.8.1-devel-ubuntu22.04", add_python="3.12")
    .entrypoint([])
    .apt_install("git")
    .uv_pip_install(
        "Pillow",
        "accelerate",
        "fastapi[standard]",
        "git+https://github.com/huggingface/diffusers.git",
        "git+https://github.com/huggingface/transformers.git",
        "huggingface-hub",
        "safetensors",
        "torch",
        "einops", "timm", "transformers-stream-generator",
        "peft",
        "python-multipart",
        extra_options="--index-strategy unsafe-best-match",
        extra_index_url="https://download.pytorch.org/whl/cu128",
    )
    .env({"HF_XET_HIGH_PERFORMANCE": "1", "HF_HOME": str(CACHE_DIR), "FORCE_REBUILD": "2"})
)

# --- MODEL CONSTANTS ---
FLUX_BASE = "black-forest-labs/FLUX.1-schnell"
QWEN_BASE = "Qwen/Qwen-Image-Edit-2511"
LORA_REPO = "ScottzillaSystems/qwen-image-edit-plus-nsfw-lora"
LORA_WEIGHT = "qwen-image-edit-plus-nsfw-lora.safetensors"
LORA_ADAPTER = "mcnl-nsfw-v1"

@app.cls(image=image, gpu="A100-80GB", volumes=volumes, secrets=secrets)
class UnifiedModel:
    @modal.enter()
    def enter(self):
        self.current_model = None
        self.pipe = None
        
    def _load_model(self, model_choice: str):
        if self.current_model == model_choice and self.pipe is not None:
            return
            
        if self.pipe is not None:
            print(f"Unloading {self.current_model} from VRAM...")
            del self.pipe
            import torch
            torch.cuda.empty_cache()
            
        import torch
        
        if model_choice == "flux":
            print(f"Loading base model {FLUX_BASE}...")
            from diffusers import AutoPipelineForImage2Image
            self.pipe = AutoPipelineForImage2Image.from_pretrained(
                FLUX_BASE, 
                torch_dtype=torch.float16,
                cache_dir=CACHE_DIR
            )
            self.pipe.to("cuda")
            
        elif model_choice == "qwen":
            from diffusers import QwenImageEditPlusPipeline
            print(f"Loading base model {QWEN_BASE}...")
            self.pipe = QwenImageEditPlusPipeline.from_pretrained(
                QWEN_BASE,
                torch_dtype=torch.bfloat16,
                cache_dir=CACHE_DIR,
                trust_remote_code=True,
            ).to("cuda")

            print(f"Loading and setting LoRA adapter from {LORA_REPO}...")
            self.pipe.load_lora_weights(
                LORA_REPO,
                weight_name=LORA_WEIGHT,
                adapter_name=LORA_ADAPTER,
                cache_dir=CACHE_DIR,
            )
            self.pipe.set_adapters([LORA_ADAPTER])

            print("Disabling safety checker.")
            self.pipe.safety_checker = lambda images, **kwargs: (images, [False] * len(images))
            
        self.current_model = model_choice
        print(f"✅ {model_choice.upper()} loaded successfully!")

    @modal.method(is_generator=True)
    def run_stream(
        self,
        image_bytes: bytes,
        prompt: str,
        Qwen: int = 1,              # 1 = Qwen Image Edit
        Flux: int = 0,              # 1 = Flux.1 Schnell
        model_name: str = "",       # Fallback string
        negative_prompt: str = "worst quality, low quality",
        true_cfg_scale: float = 4.0,
        num_inference_steps: int = 20,
        batch_size: int = 1,
        lora: str = "none",
        seed: int | None = None,
        image_bytes2: bytes | None = None,
        refs: list[bytes] = [],
    ):
        from diffusers.utils import load_image
        from PIL import Image
        import queue
        import threading
        import torch
        import base64
        
        # Resolve model selection from integer toggles or string fallback
        if Flux == 1 or model_name.lower().startswith("flux"):
            selected_model = "flux"
        elif Qwen == 1 or model_name.lower().startswith("qwen"):
            selected_model = "qwen"
        else:
            selected_model = "qwen"
        
        self._load_model(selected_model)
        
        pil_images = [load_image(Image.open(BytesIO(image_bytes))).convert("RGB")]
        if image_bytes2:
            pil_images.append(load_image(Image.open(BytesIO(image_bytes2))).convert("RGB"))
        for ref_bytes in refs:
            if ref_bytes:
                pil_images.append(load_image(Image.open(BytesIO(ref_bytes))).convert("RGB"))
            
        generator = torch.Generator(device="cuda").manual_seed(seed) if seed is not None else None
        q = queue.Queue()

        def generate_task():
            all_images_b64 = []
            try:
                images_completed = 0
                while images_completed < batch_size:
                    current_batch_size = min(batch_size - images_completed, 10)

                    def chunk_callback(pipe, step_index, timestep, callback_kwargs):
                        q.put({"step": step_index, "max_steps": num_inference_steps, "images_completed": images_completed, "total_images": batch_size})
                        return callback_kwargs

                    if self.current_model == "flux":
                        strength = float(true_cfg_scale) / 10.0
                        chunk_images = self.pipe(
                            prompt=prompt,
                            image=pil_images[0],
                            num_inference_steps=num_inference_steps,
                            strength=strength,
                            guidance_scale=0.0,
                            num_images_per_prompt=current_batch_size,
                            generator=generator,
                            callback_on_step_end=chunk_callback
                        ).images
                        
                    elif self.current_model == "qwen":
                        if lora and lora != "none" and lora != LORA_ADAPTER:
                            loras_to_load = [l.strip() for l in lora.split(",") if l.strip() and l.strip() != "none"]
                            loaded_adapters = [LORA_ADAPTER]
                            for l in loras_to_load:
                                lora_path = Path("/hf-hub-cache/loras") / f"{l}.safetensors"
                                if lora_path.exists():
                                    self.pipe.load_lora_weights(str(lora_path.parent), weight_name=lora_path.name, adapter_name=l)
                                    loaded_adapters.append(l)
                            self.pipe.set_adapters(loaded_adapters)

                        chunk_images = self.pipe(
                            image=pil_images,
                            prompt=prompt,
                            negative_prompt=negative_prompt,
                            num_images_per_prompt=current_batch_size,
                            num_inference_steps=num_inference_steps,
                            true_cfg_scale=true_cfg_scale,
                            generator=generator,
                            callback_on_step_end=chunk_callback
                        ).images

                    chunk_b64 = []
                    for img in chunk_images:
                        with BytesIO() as buf:
                            img.save(buf, format="PNG")
                            b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
                            chunk_b64.append(b64)
                            all_images_b64.append(b64)

                    images_completed += current_batch_size
                    q.put({"image_b64_partial": chunk_b64, "images_completed": images_completed, "total_images": batch_size})

                q.put({"image_b64": all_images_b64})
            except Exception as e:
                q.put({"error": str(e)})

        threading.Thread(target=generate_task).start()

        while True:
            msg = q.get()
            yield msg
            if "image_b64" in msg or "error" in msg:
                break

    @modal.method()
    def inference(
        self,
        image_bytes: bytes,
        prompt: str,
        Qwen: int = 1,
        Flux: int = 0,
        model_name: str = "",
        negative_prompt: str = "worst quality, low quality",
        true_cfg_scale: float = 4.0,
        num_inference_steps: int = 20,
        batch_size: int = 1,
        lora: str = "none",
        seed: int | None = None,
    ) -> list[bytes]:
        import base64
        msgs = list(self.run_stream.local(
            image_bytes=image_bytes, prompt=prompt, Qwen=Qwen, Flux=Flux, model_name=model_name,
            negative_prompt=negative_prompt, true_cfg_scale=true_cfg_scale, num_inference_steps=num_inference_steps,
            batch_size=batch_size, lora=lora, seed=seed, image_bytes2=None, refs=[]
        ))
        final_msg = msgs[-1]
        if "error" in final_msg:
            raise Exception(final_msg["error"])
        return [base64.b64decode(b64) for b64 in final_msg["image_b64"]]

    @modal.asgi_app()
    def web_img2img(self):
        import fastapi
        from fastapi.middleware.cors import CORSMiddleware
        from fastapi import Response, UploadFile, File, Form

        web_app = fastapi.FastAPI(title="AlphaCore Img2Img", version="1.0.0")
        web_app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

        @web_app.post("/v1/images/edits")
        async def openai_compatible_edits(request: fastapi.Request):
            import base64
            form = await request.form()
            prompt = form.get("prompt", "Apply standard edits")
            n = int(form.get("n", 1))
            model_str = str(form.get("model", "qwen")).lower()
            
            flux_toggle = 1 if "flux" in model_str else 0
            qwen_toggle = 1 if "qwen" in model_str or flux_toggle == 0 else 0
            
            image_file = form.get("image")
            if not image_file:
                return fastapi.responses.JSONResponse(status_code=400, content={"error": "Image is required for editing."})
            image_bytes = await image_file.read()
            
            output_bytes_list = self.inference.local(
                image_bytes=image_bytes,
                prompt=prompt,
                Qwen=qwen_toggle,
                Flux=flux_toggle,
                negative_prompt="worst quality, low quality",
                true_cfg_scale=4.0,
                num_inference_steps=20,
                batch_size=n,
                lora="none",
                seed=-1,
            )
            
            b64_list = [{"b64_json": base64.b64encode(img).decode('utf-8')} for img in output_bytes_list]
            return {"data": b64_list}

        @web_app.post("/stream")
        def web_endpoint_stream(
            image: UploadFile = File(...),
            image2: UploadFile | None = File(None),
            ref1: UploadFile | None = File(None),
            ref2: UploadFile | None = File(None),
            Qwen: int = Form(1),
            Flux: int = Form(0),
            model_name: str = Form(""),
            prompt: str = Form("input requested image edits here."),
            negative_prompt: str = Form("worst quality, low quality"),
            true_cfg_scale: float = Form(4.0),
            num_inference_steps: int = Form(20),
            batch_size: int = Form(1),
            lora: str = Form("none"),
            seed: int = Form(-1),
        ):
            from fastapi.responses import StreamingResponse
            
            image_bytes = image.file.read()
            image_bytes2 = image2.file.read() if image2 else None
            refs_bytes = [ref.file.read() for ref in [ref1, ref2] if ref]
            seed_val = None if seed == -1 else seed
            
            def event_generator():
                for msg in self.run_stream.local(
                    image_bytes=image_bytes, prompt=prompt, Qwen=Qwen, Flux=Flux, model_name=model_name,
                    negative_prompt=negative_prompt, true_cfg_scale=true_cfg_scale, num_inference_steps=num_inference_steps,
                    batch_size=batch_size, lora=lora, seed=seed_val, image_bytes2=image_bytes2, refs=refs_bytes,
                ):
                    yield f"data: {json.dumps(msg)}\n\n"
                    
                    if "image_b64" in msg:
                        for idx, b64 in enumerate(msg["image_b64"]):
                            out_bytes = base64.b64decode(b64)
                            out_dir = OUTPUTS_DIR / "img2img"
                            out_dir.mkdir(parents=True, exist_ok=True)
                            (out_dir / f"img2img_{int(time.time() * 1000)}_{idx}.png").write_bytes(out_bytes)
                        outputs_volume.commit()

            return StreamingResponse(event_generator(), media_type="text/event-stream")

        @web_app.post("/")
        def web_endpoint(
            image: UploadFile = File(...),
            Qwen: int = Form(1),
            Flux: int = Form(0),
            model_name: str = Form(""),
            prompt: str = Form("input requested image edits here."),
            negative_prompt: str = Form("worst quality, low quality"),
            true_cfg_scale: float = Form(4.0),
            num_inference_steps: int = Form(20),
            batch_size: int = Form(1),
            lora: str = Form("none"),
            seed: int = Form(-1),
        ):
            image_bytes = image.file.read()
            seed_val = None if seed == -1 else seed
            
            output_bytes_list = self.inference.local(
                image_bytes=image_bytes, prompt=prompt, Qwen=Qwen, Flux=Flux, model_name=model_name,
                negative_prompt=negative_prompt, true_cfg_scale=true_cfg_scale, num_inference_steps=num_inference_steps,
                batch_size=batch_size, lora=lora, seed=seed_val,
            )

            out_dir = OUTPUTS_DIR / "img2img"
            out_dir.mkdir(parents=True, exist_ok=True)
            for idx, out_bytes in enumerate(output_bytes_list):
                (out_dir / f"img2img_{int(time.time() * 1000)}_{idx}.png").write_bytes(out_bytes)
            outputs_volume.commit()

            return Response(content=output_bytes_list[0], media_type="image/png")

        return web_app

@app.local_entrypoint()
def main_img2img(
    image_path=Path(__file__).parent / "demo_images/woman.png",
    output_path=Path("/tmp/img2img-output/output.png"),
    Qwen: int = 1,
    Flux: int = 0,
    prompt: str = "input requested image edits here.",
    num_steps: int = 20,
):
    input_image_bytes = Path(image_path).read_bytes()
    selected = "Flux" if Flux == 1 else "Qwen"
    print(f"🎨 Editing image using {selected} with instruction: '{prompt}'")
    
    output_image_bytes = UnifiedModel().inference.remote(
        image_bytes=input_image_bytes,
        prompt=prompt,
        Qwen=Qwen,
        Flux=Flux,
        negative_prompt="worst quality",
        true_cfg_scale=4.0,
        num_inference_steps=num_steps,
        batch_size=1,
    )[0]

    output_path = Path(output_path)
    output_path.parent.mkdir(exist_ok=True, parents=True)
    output_path.write_bytes(output_image_bytes)
    print(f"✅ Saved generated image to {output_path}")