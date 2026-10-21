"""
Sector Zero gate (vgate).

A standalone Modal app that sits in front of the existing txt2img / img2img / img2vid
endpoints (which are NOT modified). Every Sector Zero studio request is routed through here.

Hard rules enforced server-side (cannot be bypassed from the UI):
  1. No minors or age-ambiguous subjects (prompt + LoRA names).
  2. No real-person likeness: no face references / IP-Adapter / ControlNet inputs, no
     arbitrary uploads. img2img and img2vid only accept images that this gateway itself
     generated (HMAC-signed token bound to the image hash).

Deploy:   modal deploy scripts/guard.py
Secrets:  modal secret create alphacore-sz-gate SZ_GATE_SECRET=<random> SZ_GATE_KEY=<random>
          (the same SZ_GATE_KEY / SZ_GATEWAY_URL must be set for server.js)

NOTE: the raw upstream endpoints stay publicly callable. This gateway only protects
traffic routed through it, so the frontend must never call the raw endpoints for the studio tab.
"""

import base64
import hashlib
import hmac
import json
import os
import re

# --------------------------------------------------------------------------
# Pure guard logic (no Modal dependency, unit-testable)
# --------------------------------------------------------------------------

# Minor / youth / age-ambiguous terms.
_YOUTH_TERMS = (
    r"child(?:ren|like|ish)?|kids?|kiddie|minors?|under\s?-?age[d]?|teen(?:s|age|ager|agers)?|"
    r"loli(?:ta)?|shota|cunny|school\s?-?(?:girl|boy|age|aged|uniform)|toddlers?|infants?|babies|baby\s?-?face[d]?|"
    r"pre\s?-?teen|tween|juvenile|youth(?:ful)?|young(?:er|est)?|petite|flat\s?-?chest(?:ed)?|"
    r"jailbait|barely\s+legal|little\s+(?:girl|boy|sister|brother)|small\s+child|"
    r"(?:1[0-7]|[1-9])\s?-?\s?(?:y/?o|yo|years?\s?-?old|yrs?)|age\s*(?:of\s*)?(?:1[0-7]|[1-9])\b|"
    r"high\s?-?school(?:er)?|middle\s?-?school(?:er)?|elementary|kindergarten|preschool|"
    r"daughter|stepdaughter|niece|lolicon"
)
DENY_A = re.compile(r"(?<![a-z0-9])(?:" + _YOUTH_TERMS + r")(?![a-z0-9])", re.I)

# Real-person likeness / deepfake indicators.
_LIKENESS_TERMS = (
    r"deep\s?-?fake|face\s?-?swap|faceswap|celebrity|celeb|look[s]?\s?-?\s?like|lookalike|look\s?-?alike|"
    r"real\s+person|photo\s+of\s+my|my\s+(?:ex|wife|girlfriend|coworker|neighbor|boss|teacher|classmate)|"
    r"nude\s+of\s+(?:her|him)|without\s+(?:her|his|their)\s+consent|non\s?-?consensual|rape|"
    r"@[a-z0-9_.]{3,}|instagram\.com|onlyfans\.com|twitter\.com|tiktok\.com"
)
DENY_B = re.compile(r"(?<![a-z0-9])(?:" + _LIKENESS_TERMS + r")(?![a-z0-9])", re.I)

BASE_ANCHOR = "adult, mature, 25+ years old"
BASE_NEG = "child, minor, teen, underage, young, youthful, childlike, baby face, loli, school uniform"

# Params that would allow likeness cloning or external structure injection; always stripped.
DROP_KEYS = {
    "ip_adapter_image", "ip_adapter_image_b64", "ip_image", "ip_adapter_scale", "ip_adapter_mode",
    "control_image_b64", "control_type", "controlnet_conditioning_scale",
    "image2", "mask", "ref1", "ref2", "mask_b64", "regional_mode", "regional_prompts",
}


class GateError(ValueError):
    """Raised when a request violates a hard guard rule."""


def vet_text(text: str, field: str = "prompt") -> None:
    value = str(text or "")
    if DENY_A.search(value):
        raise GateError("Request declined.")
    if DENY_B.search(value):
        raise GateError("Request declined.")


def gate_text(prompt: str, negative: str = ""):
    """Validate a prompt and return (safe_prompt, safe_negative) with forced anchors."""
    vet_text(prompt, "prompt")
    # Negative prompt is only ever extended, never trusted to remove the forced terms.
    safe_prompt = f"{BASE_ANCHOR}, {str(prompt).strip()}"
    safe_negative = f"{BASE_NEG}, {str(negative or '').strip()}".strip(", ")
    return safe_prompt, safe_negative


def gate_tags(lora: str) -> str:
    """Validate a comma separated LoRA list; reject youth-related names."""
    names = [n.strip() for n in str(lora or "none").split(",") if n.strip()]
    for n in names:
        vet_text(n.replace("_", " ").replace("-", " "), "LoRA name")
    return ",".join(names) if names else "none"


def trim_params(params: dict) -> dict:
    return {k: v for k, v in (params or {}).items() if k not in DROP_KEYS}


def vet_age(age) -> int:
    try:
        n = int(age)
    except (TypeError, ValueError):
        raise GateError("Request declined.")
    if n < 18:
        raise GateError("Request declined.")
    return n


def img_digest(b64: str) -> str:
    raw = base64.b64decode(b64.split(",", 1)[1] if "," in b64 else b64)
    return hashlib.sha256(raw).hexdigest()


def seal_img(b64: str, secret: str) -> str:
    return hmac.new(secret.encode(), img_digest(b64).encode(), hashlib.sha256).hexdigest()


def verify_seal(b64: str, token: str, secret: str) -> bool:
    if not b64 or not token or not secret:
        return False
    try:
        expected = seal_img(b64, secret)
    except Exception:
        return False
    return hmac.compare_digest(expected, str(token))


# --------------------------------------------------------------------------
# Modal gateway
# --------------------------------------------------------------------------

try:
    import modal
except Exception:  # pragma: no cover - allows pure-logic imports without modal installed
    modal = None

TXT2IMG_URL = os.environ.get(
    "SZ_UP_TXT2IMG",
    "https://josh627764--alphacore-aio-backend-txt2img-web-txt2img.us-east.modal.run",
)
IMG2IMG_URL = os.environ.get(
    "SZ_UP_IMG2IMG",
    "https://josh627764--alphacore-aio-backend-img2img-web-img2img.us-east.modal.run",
)
IMG2VID_URL = os.environ.get(
    "SZ_UP_IMG2VID",
    "https://josh627764--alphacore-aio-backend-img2vid-web-img2vid.us-east.modal.run",
)


def _read_sse_final(resp):
    """Return the last JSON message from an SSE stream, raising on error messages."""
    last = None
    for line in resp.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data: "):
            continue
        try:
            msg = json.loads(line[6:])
        except Exception:
            continue
        if isinstance(msg, dict) and msg.get("error"):
            raise RuntimeError(str(msg["error"]))
        last = msg
    if last is None:
        raise RuntimeError("Upstream returned no data.")
    return last


if modal is not None:
    app = modal.App("alphacore-sz-gate")
    gateway_image = modal.Image.debian_slim(python_version="3.12").pip_install("fastapi[standard]==0.115.4", "requests")
    guard_secret = modal.Secret.from_name("alphacore-sz-gate")

    @app.function(image=gateway_image, secrets=[guard_secret], timeout=900, min_containers=0)
    @modal.asgi_app()
    def sz_gateway():
        import fastapi
        import requests
        from fastapi.responses import JSONResponse

        web = fastapi.FastAPI(title="AlphaCore SZ Gate")

        def _auth(request: fastapi.Request):
            key = os.environ.get("SZ_GATE_KEY", "")
            if not key or not hmac.compare_digest(request.headers.get("x-sz-key", ""), key):
                raise fastapi.HTTPException(status_code=401, detail="Unauthorized")

        def _secret():
            s = os.environ.get("SZ_GATE_SECRET", "")
            if not s:
                raise fastapi.HTTPException(status_code=500, detail="Gateway secret not configured")
            return s

        @web.exception_handler(GateError)
        async def _guard_handler(_req, exc):
            return JSONResponse(status_code=422, content={"error": str(exc)})

        @web.get("/ping")
        def ping():
            return {"status": "ok"}

        @web.post("/sz/txt2img")
        async def txt2img(request: fastapi.Request):
            _auth(request)
            body = trim_params(await request.json())
            prompt, negative = gate_text(body.get("prompt", ""), body.get("negative_prompt", ""))
            lora = gate_tags(body.get("lora", "none"))
            params = {
                "prompt": prompt,
                "negative_prompt": negative,
                "model_name": str(body.get("model_name", "epicrealismXL_pureFix")),
                "lora": lora,
                "seed": int(body.get("seed", -1)),
                "batch_size": max(1, min(int(body.get("batch_size", 1)), 4)),
                "width": int(body.get("width", 1024)),
                "height": int(body.get("height", 1024)),
            }
            r = requests.get(TXT2IMG_URL, params=params, stream=True, timeout=600)
            r.raise_for_status()
            final = _read_sse_final(r)
            images = final.get("image_b64") or []
            secret = _secret()
            return {"images": [{"b64": b, "token": seal_img(b, secret)} for b in images]}

        @web.post("/sz/txt2img/stream")
        async def txt2img_stream(request: fastapi.Request):
            """Relays upstream SSE progress, signs final images so they can be used for img2img/img2vid."""
            from fastapi.responses import StreamingResponse
            _auth(request)
            body = trim_params(await request.json())
            prompt, negative = gate_text(body.get("prompt", ""), body.get("negative_prompt", ""))
            lora = gate_tags(body.get("lora", "none"))
            secret = _secret()
            params = {
                "prompt": prompt,
                "negative_prompt": negative,
                "model_name": str(body.get("model_name", "epicrealismXL_pureFix")),
                "lora": lora,
                "seed": int(body.get("seed", -1)),
                "batch_size": max(1, min(int(body.get("batch_size", 1)), 4)),
                "width": int(body.get("width", 1024)),
                "height": int(body.get("height", 1024)),
            }

            def events():
                try:
                    with requests.get(TXT2IMG_URL, params=params, stream=True, timeout=600) as r:
                        r.raise_for_status()
                        for line in r.iter_lines(decode_unicode=True):
                            if not line or not line.startswith("data: "):
                                continue
                            try:
                                msg = json.loads(line[6:])
                            except Exception:
                                continue
                            if isinstance(msg, dict) and msg.get("image_b64"):
                                msg = {"images": [{"b64": b, "token": seal_img(b, secret)} for b in msg["image_b64"]]}
                            yield f"data: {json.dumps(msg)}\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"

            return StreamingResponse(events(), media_type="text/event-stream")

        @web.post("/sz/img2img")
        async def img2img(request: fastapi.Request):
            _auth(request)
            body = trim_params(await request.json())
            init_b64 = body.get("init_image_b64", "")
            if not verify_seal(init_b64, body.get("token", ""), _secret()):
                raise GateError("Request declined.")
            prompt, negative = gate_text(body.get("prompt", ""), body.get("negative_prompt", ""))
            lora = gate_tags(body.get("lora", "none"))
            raw = base64.b64decode(init_b64.split(",", 1)[1] if "," in init_b64 else init_b64)
            data = {
                "prompt": prompt,
                "negative_prompt": negative,
                "checkpoint": str(body.get("checkpoint", "epicrealismXL_pureFix")),
                "strength": float(body.get("strength", 0.35)),
                "lora": lora,
                "seed": int(body.get("seed", -1)),
                "batch_size": 1,
            }
            r = requests.post(IMG2IMG_URL + "/stream", files={"image": ("init.png", raw, "image/png")},
                              data=data, stream=True, timeout=600)
            r.raise_for_status()
            final = _read_sse_final(r)
            images = final.get("image_b64") or []
            secret = _secret()
            return {"images": [{"b64": b, "token": seal_img(b, secret)} for b in images]}

        @web.post("/sz/img2vid")
        async def img2vid(request: fastapi.Request):
            _auth(request)
            body = trim_params(await request.json())
            init_b64 = body.get("init_image_b64", "")
            if not verify_seal(init_b64, body.get("token", ""), _secret()):
                raise GateError("Request declined.")
            prompt, negative = gate_text(body.get("prompt", ""), body.get("negative_prompt", ""))
            payload = {
                "image": init_b64.split(",", 1)[1] if "," in init_b64 else init_b64,
                "prompt": prompt,
                "negative_prompt": negative,
                "resolution": str(body.get("resolution", "480p")),
                "seed": int(body.get("seed", -1)),
            }
            r = requests.post(IMG2VID_URL + "/stream", json=payload, stream=True, timeout=900)
            r.raise_for_status()
            final = _read_sse_final(r)
            return {"video_b64": final.get("video_b64")}

        return web
