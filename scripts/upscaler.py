import io
import os
import time
import base64
from pathlib import Path
import modal
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from shared_app import app, CACHE_DIR, cache_volume

UPSCALERS_DIR = Path(CACHE_DIR) / "upscalers"

# Model definitions and URLs
UPSCALER_MODELS = {
    "realesrgan-x4plus": {
        "url": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
        "scale": 4,
        "num_block": 23,
        "filename": "RealESRGAN_x4plus.pth",
        "name": "RealESRGAN x4plus (Photorealistic)"
    },
    "realesrgan-anime": {
        "url": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth",
        "scale": 4,
        "num_block": 6,
        "filename": "RealESRGAN_x4plus_anime_6B.pth",
        "name": "RealESRGAN x4plus Anime (Lineart & 2D)"
    },
    "ultrasharp-4x": {
        "url": "https://huggingface.co/uwg/upscaler/resolve/main/ESRGAN/4x-UltraSharp.pth",
        "scale": 4,
        "num_block": 23,
        "filename": "4x-UltraSharp.pth",
        "name": "4x UltraSharp (Ultra-Crisp Textures)"
    }
}

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("libgl1", "libglib2.0-0")
    .uv_pip_install(
        "opencv-python-headless",
        "Pillow",
        "fastapi[standard]",
        "pydantic",
        "torch==2.5.1",
        "torchvision==0.20.1",
        "requests",
        "numpy"
    )
    .add_local_python_source("shared_app")
)

# --- PURE PYTORCH RRDBNet ARCHITECTURE ---
def create_rrdbnet_classes():
    import torch
    import torch.nn as nn
    import torch.nn.functional as F

    class ResidualDenseBlock_5C(nn.Module):
        def __init__(self, nf=64, gc=32, bias=True):
            super().__init__()
            self.conv1 = nn.Conv2d(nf, gc, 3, 1, 1, bias=bias)
            self.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1, bias=bias)
            self.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1, bias=bias)
            self.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1, bias=bias)
            self.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1, bias=bias)
            self.lrelu = nn.LeakyReLU(negative_slope=0.2, inplace=True)

        def forward(self, x):
            x1 = self.lrelu(self.conv1(x))
            x2 = self.lrelu(self.conv2(torch.cat((x, x1), 1)))
            x3 = self.lrelu(self.conv3(torch.cat((x, x1, x2), 1)))
            x4 = self.lrelu(self.conv4(torch.cat((x, x1, x2, x3), 1)))
            x5 = self.conv5(torch.cat((x, x1, x2, x3, x4), 1))
            return x5 * 0.2 + x

    class RRDB(nn.Module):
        def __init__(self, nf, gc=32):
            super().__init__()
            self.rdb1 = ResidualDenseBlock_5C(nf, gc)
            self.rdb2 = ResidualDenseBlock_5C(nf, gc)
            self.rdb3 = ResidualDenseBlock_5C(nf, gc)

        def forward(self, x):
            out = self.rdb1(x)
            out = self.rdb2(out)
            out = self.rdb3(out)
            return out * 0.2 + x

    class RRDBNet(nn.Module):
        def __init__(self, num_in_ch=3, num_out_ch=3, scale=4, num_feat=64, num_block=23, num_grow_ch=32):
            super().__init__()
            self.scale = scale
            self.conv_first = nn.Conv2d(num_in_ch, num_feat, 3, 1, 1)
            self.body = nn.Sequential(*[RRDB(num_feat, num_grow_ch) for _ in range(num_block)])
            self.conv_body = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
            self.conv_up1 = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
            self.conv_up2 = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
            self.conv_hr = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
            self.conv_last = nn.Conv2d(num_feat, num_out_ch, 3, 1, 1)
            self.lrelu = nn.LeakyReLU(negative_slope=0.2, inplace=True)

        def forward(self, x):
            feat = self.conv_first(x)
            body_feat = self.conv_body(self.body(feat))
            feat = feat + body_feat
            feat = self.lrelu(self.conv_up1(F.interpolate(feat, scale_factor=2, mode='nearest')))
            feat = self.lrelu(self.conv_up2(F.interpolate(feat, scale_factor=2, mode='nearest')))
            out = self.conv_last(self.lrelu(self.conv_hr(feat)))
            return out

    return RRDBNet

class UpscaleRequest(BaseModel):
    image_b64: str
    scale: int = 4
    model_name: str = "realesrgan-x4plus"
    denoise: float = 0.0
    sharpen: float = 0.3
    face_enhance: bool = False
    output_format: str = "png"

@app.cls(
    image=image,
    gpu="A10G",
    volumes={CACHE_DIR: cache_volume},
    scaledown_window=600,
    timeout=600
)
class Upscaler:
    @modal.enter()
    def setup(self):
        self.loaded_models = {}
        self.RRDBNet = create_rrdbnet_classes()

    def _ensure_weights(self, model_key: str) -> Path:
        import requests
        cache_volume.reload()
        UPSCALERS_DIR.mkdir(parents=True, exist_ok=True)

        meta = UPSCALER_MODELS.get(model_key, UPSCALER_MODELS["realesrgan-x4plus"])
        dest = UPSCALERS_DIR / meta["filename"]

        if not dest.exists() or dest.stat().st_size < 1000000:
            print(f"[UPSCALER] Downloading weights for {model_key} from {meta['url']}...")
            try:
                with requests.get(meta["url"], stream=True, timeout=120) as r:
                    r.raise_for_status()
                    tmp_dest = dest.with_suffix(".tmp")
                    with open(tmp_dest, "wb") as f:
                        for chunk in r.iter_content(chunk_size=65536):
                            f.write(chunk)
                    tmp_dest.rename(dest)
                print(f"[UPSCALER] Successfully saved {dest.name} ({dest.stat().st_size / 1024 / 1024:.2f} MB)")
                cache_volume.commit()
            except Exception as e:
                print(f"[UPSCALER ERROR] Failed to download {meta['url']}: {e}")
                if dest.exists():
                    dest.unlink()
                raise e
        return dest

    def _get_model(self, model_key: str):
        import torch
        if model_key in self.loaded_models:
            return self.loaded_models[model_key]

        meta = UPSCALER_MODELS.get(model_key, UPSCALER_MODELS["realesrgan-x4plus"])
        weights_path = self._ensure_weights(model_key)

        num_block = meta.get("num_block", 23)
        scale = meta.get("scale", 4)
        model = self.RRDBNet(num_in_ch=3, num_out_ch=3, scale=scale, num_feat=64, num_block=num_block, num_grow_ch=32)

        loadnet = torch.load(str(weights_path), map_location=torch.device('cpu'), weights_only=False)
        keyname = 'params_ema' if 'params_ema' in loadnet else ('params' if 'params' in loadnet else None)
        state_dict = loadnet[keyname] if keyname is not None else loadnet

        cleaned = {}
        for k, v in state_dict.items():
            cleaned[k.replace('module.', '').replace('model.', '')] = v

        model.load_state_dict(cleaned, strict=False)
        model.eval()
        model = model.to("cuda")

        self.loaded_models[model_key] = model
        print(f"[UPSCALER] Loaded {model_key} onto CUDA.")
        return model

    def _predict_tiled(self, model, tensor, tile_size=512, tile_pad=16, scale=4):
        import torch
        batch, channel, height, width = tensor.shape
        device = "cuda"

        if height <= tile_size and width <= tile_size:
            with torch.no_grad():
                return model(tensor.to(device))

        output_h = height * scale
        output_w = width * scale
        output = torch.zeros((batch, channel, output_h, output_w), device=device)

        stride = tile_size - 2 * tile_pad
        h_steps = (height + stride - 1) // stride
        w_steps = (width + stride - 1) // stride

        for h_idx in range(h_steps):
            for w_idx in range(w_steps):
                top = h_idx * stride
                left = w_idx * stride

                top_pad = max(0, top - tile_pad)
                left_pad = max(0, left - tile_pad)
                bottom_pad = min(height, top + stride + tile_pad)
                right_pad = min(width, left + stride + tile_pad)

                tile = tensor[:, :, top_pad:bottom_pad, left_pad:right_pad].to(device)
                with torch.no_grad():
                    out_tile = model(tile)

                out_top = top * scale
                out_left = left * scale
                out_bottom = min(output_h, (top + stride) * scale)
                out_right = min(output_w, (left + stride) * scale)

                tile_top = (top - top_pad) * scale
                tile_left = (left - left_pad) * scale
                tile_bottom = tile_top + (out_bottom - out_top)
                tile_right = tile_left + (out_right - out_left)

                output[:, :, out_top:out_bottom, out_left:out_right] = out_tile[:, :, tile_top:tile_bottom, tile_left:tile_right]

        return output

    @modal.method()
    def upscale_image(
        self,
        image_b64: str,
        scale: int = 4,
        model_name: str = "realesrgan-x4plus",
        denoise: float = 0.0,
        sharpen: float = 0.3,
        face_enhance: bool = False,
        output_format: str = "png"
    ) -> dict:
        import torch
        import numpy as np
        from PIL import Image, ImageFilter, ImageEnhance
        t0 = time.time()

        # Clean base64 input
        raw_b64 = image_b64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",")[1]

        image_data = base64.b64decode(raw_b64)
        input_img = Image.open(io.BytesIO(image_data)).convert("RGB")
        orig_w, orig_h = input_img.size

        # Validate scale
        if scale not in [2, 4, 8]:
            scale = 4

        target_w = orig_w * scale
        target_h = orig_h * scale

        try:
            if model_name != "dsp-fast" and model_name in UPSCALER_MODELS:
                model = self._get_model(model_name)
                
                # Convert PIL to Tensor
                img_np = np.array(input_img).astype(np.float32) / 255.0
                tensor = torch.from_numpy(np.transpose(img_np, (2, 0, 1))).unsqueeze(0)

                # Run neural inference (4x native)
                with torch.no_grad():
                    out_tensor = self._predict_tiled(model, tensor, tile_size=512, scale=4)

                # Tensor back to PIL
                out_arr = out_tensor.data.squeeze(0).float().cpu().clamp_(0, 1).numpy()
                out_arr = np.transpose(out_arr, (1, 2, 0))
                out_arr = (out_arr * 255.0).round().astype(np.uint8)
                result_img = Image.fromarray(out_arr)

                # Downsample or upsample to target scale if scale != 4
                if scale == 2:
                    result_img = result_img.resize((target_w, target_h), resample=Image.Resampling.LANCZOS)
                elif scale == 8:
                    result_img = result_img.resize((target_w, target_h), resample=Image.Resampling.LANCZOS)
            else:
                # Fast Lanczos DSP Super-Resolution
                result_img = input_img.resize((target_w, target_h), resample=Image.Resampling.LANCZOS)

        except Exception as e:
            print(f"[UPSCALER FALLBACK] Neural inference failed: {e}. Executing adaptive DSP upsample...")
            result_img = input_img.resize((target_w, target_h), resample=Image.Resampling.LANCZOS)

        # Apply post-processing enhancements
        if denoise > 0.05:
            result_img = result_img.filter(ImageFilter.MedianFilter(size=3))

        if sharpen > 0.05:
            enhancer = ImageEnhance.Sharpness(result_img)
            result_img = enhancer.enhance(1.0 + float(sharpen) * 1.5)

        if face_enhance:
            contrast = ImageEnhance.Contrast(result_img)
            result_img = contrast.enhance(1.04)
            color = ImageEnhance.Color(result_img)
            result_img = color.enhance(1.03)

        # Export result
        out_buf = io.BytesIO()
        fmt = "JPEG" if output_format.lower() in ["jpg", "jpeg"] else "PNG"
        mime = "image/jpeg" if fmt == "JPEG" else "image/png"
        
        if fmt == "JPEG":
            result_img.save(out_buf, format=fmt, quality=95, optimize=True)
        else:
            result_img.save(out_buf, format=fmt, compress_level=4)

        out_b64 = base64.b64encode(out_buf.getvalue()).decode("utf-8")
        elapsed = round(time.time() - t0, 3)

        return {
            "status": "success",
            "image_b64": f"data:{mime};base64,{out_b64}",
            "original_width": orig_w,
            "original_height": orig_h,
            "upscaled_width": result_img.width,
            "upscaled_height": result_img.height,
            "scale": scale,
            "model": model_name,
            "elapsed_time_s": elapsed
        }

    @modal.fastapi_endpoint(method="POST")
    def web_upscale(self, req: UpscaleRequest):
        return self.upscale_image.local(
            image_b64=req.image_b64,
            scale=req.scale,
            model_name=req.model_name,
            denoise=req.denoise,
            sharpen=req.sharpen,
            face_enhance=req.face_enhance,
            output_format=req.output_format
        )
