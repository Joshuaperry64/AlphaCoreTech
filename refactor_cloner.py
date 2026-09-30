
import re

with open("scripts/cloner.py", "r") as f:
    code = f.read()

# Replace upload_audio_file
code = code.replace(
    "@app.function(timeout=300, volumes={\"/mnt/rvc_data\": volume})\ndef upload_audio_file(profile_name: str, filename: str, file_bytes: bytes):",
    "@app.cls(timeout=300, volumes={\"/mnt/rvc_data\": volume})\nclass VoiceCloner_Storage:\n    @modal.method()\n    def upload_audio_file(self, profile_name: str, filename: str, file_bytes: bytes):"
)

# Indent body of upload_audio_file
code = re.sub(
    r"(def upload_audio_file.*?)(?=\n@|\n\n\n|\n[A-Za-z#])",
    lambda m: m.group(1).replace("\n    ", "\n        "),
    code,
    flags=re.DOTALL
)

# Replace list_volume_contents
code = code.replace(
    "@app.function(timeout=120, volumes={\"/mnt/rvc_data\": volume})\ndef list_volume_contents() -> dict:",
    "    @modal.method()\n    def list_volume_contents(self) -> dict:"
)

# Replace download_model_assets
code = code.replace(
    "@app.function(timeout=120, volumes={\"/mnt/rvc_data\": volume})\ndef download_model_assets(profile_name: str) -> dict:",
    "    @modal.method()\n    def download_model_assets(self, profile_name: str) -> dict:"
)

# Indent bodies of list_volume_contents and download_model_assets
# Actually this is a bit error prone with regex. Let us just do manual replace_file_content or a robust parser.

