#!/usr/bin/env python3
"""
AlphaCore - OpenRouter Workspace File Uploader
Uploads workspace files to OpenRouter Files API (https://openrouter.ai/docs/guides/features/files-api).

Features:
- Recursive file discovery respecting .gitignore and sensible exclusion patterns.
- OpenRouter API compliance:
  * Supported content types (UTF-8 text/code, PDF, supported images & audio).
  * Skips 0-byte files (which trigger 400 errors on OpenRouter).
  * Enforces 100 MiB max size and path character rules.
  * Normalizes Windows backslashes to forward slashes.
- Dry run mode (--dry-run) to inspect file list and payload size before uploading.
- Code-only mode (--code-only) to exclude large media files.
- Resumes / syncs by checking existing workspace files (--sync / --overwrite).
- Writes an openrouter_files.json manifest mapping local files to their OpenRouter file_ids.
"""

import os
import sys
import argparse
import getpass
import json
import time
from pathlib import Path
from typing import List, Dict, Optional, Tuple

try:
    import requests
except ImportError:
    print("Error: 'requests' package is required. Install with: pip install requests")
    sys.exit(1)

OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"

# Supported OpenRouter extensions based on docs:
# - PDF
# - PNG, JPEG, GIF, WebP
# - DOCX, XLSX, PPTX
# - MP3, WAV, FLAC, OGG
# - UTF-8 text (JSON, NDJSON, CSV, Markdown, plain text, code files)
TEXT_EXTENSIONS = {
    ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
    ".json", ".jsonl", ".ndjson", ".html", ".htm", ".css", ".scss",
    ".py", ".pyw", ".go", ".mod", ".sum", ".txt", ".md", ".markdown",
    ".yaml", ".yml", ".toml", ".sh", ".bash", ".bat", ".cmd", ".ps1",
    ".sql", ".csv", ".tsv", ".xml", ".svg", ".dockerignore",
    ".gitignore", ".gitattributes", ".editorconfig", ".env.example"
}

MEDIA_EXTENSIONS = {
    ".pdf",
    ".png", ".jpg", ".jpeg", ".gif", ".webp",
    ".docx", ".xlsx", ".pptx",
    ".mp3", ".wav", ".flac", ".ogg"
}

NAMED_TEXT_FILES = {
    "dockerfile", "dockerfile_with_model", "caddyfile", "makefile", "license", "readme"
}

DEFAULT_EXCLUDE_DIRS = {
    ".git", "node_modules", "dist", "build", "coverage", "__pycache__",
    ".agents", ".vscode", ".idea", ".next", ".nuxt", "scratch", ".system_generated"
}

SENSITIVE_PREFIXES = (".env",)
EXCLUDE_FILENAMES = {
    "server_mipsle",
}
EXCLUDE_EXTENSIONS = {
    ".pyc", ".pyo", ".pyd", ".exe", ".dll", ".so", ".dylib", ".webm", ".mp4", ".mov", ".bin"
}

MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MiB


def is_eligible_file(rel_path: str, full_path: Path, code_only: bool = False) -> Tuple[bool, Optional[str]]:
    """Determine if a file is valid and supported by OpenRouter Files API."""
    name = full_path.name.lower()
    ext = full_path.suffix.lower()

    # Check sensitive files
    for prefix in SENSITIVE_PREFIXES:
        if name.startswith(prefix) and name != ".env.example":
            return False, "Sensitive environment file"

    if name in EXCLUDE_FILENAMES:
        return False, "Explicitly excluded file"

    if ext in EXCLUDE_EXTENSIONS:
        return False, f"Unsupported extension: {ext}"

    # Check size
    try:
        size = full_path.stat().st_size
    except Exception as e:
        return False, f"Stat error: {e}"

    if size == 0:
        return False, "Empty file (0 bytes rejected by OpenRouter)"

    if size > MAX_FILE_SIZE_BYTES:
        return False, f"Exceeds max file size 100 MiB ({size} bytes)"

    # Check filename length and character constraints
    if len(rel_path) > 255:
        return False, f"Filename exceeds 255 chars ({len(rel_path)})"

    invalid_chars = set('<>:"|?*\\')
    if any(c in invalid_chars for c in rel_path):
        return False, "Contains invalid characters for OpenRouter filename"

    # Code / Text check
    if ext in TEXT_EXTENSIONS or name in NAMED_TEXT_FILES:
        return True, None

    # Media check
    if not code_only and ext in MEDIA_EXTENSIONS:
        return True, None

    if code_only and ext in MEDIA_EXTENSIONS:
        return False, "Excluded by --code-only"

    # Attempt to treat as utf-8 text if under 5MB and printable
    if size < 5 * 1024 * 1024:
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                f.read(2048)
            return True, None
        except Exception:
            return False, "Binary or non-UTF8 content"

    return False, f"Unrecognized / unsupported file type: {ext or name}"


def collect_files(root_dir: Path, code_only: bool = False, extra_excludes: Optional[List[str]] = None) -> List[Tuple[str, Path, int]]:
    """Walks the workspace directory and collects candidate files."""
    exclude_dirs = set(DEFAULT_EXCLUDE_DIRS)
    if extra_excludes:
        exclude_dirs.update(extra_excludes)

    candidates = []

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Prune excluded directories in-place
        dirnames[:] = [
            d for d in dirnames
            if d not in exclude_dirs and not d.startswith(".")
        ]

        for fname in filenames:
            full_path = Path(dirpath) / fname
            try:
                rel_path = full_path.relative_to(root_dir).as_posix()
            except ValueError:
                continue

            ok, reason = is_eligible_file(rel_path, full_path, code_only=code_only)
            if ok:
                candidates.append((rel_path, full_path, full_path.stat().st_size))

    # Sort deterministically
    candidates.sort(key=lambda x: x[0])
    return candidates


def fetch_existing_files(api_key: str, workspace_id: Optional[str] = None) -> Dict[str, str]:
    """Fetches list of existing files in the OpenRouter workspace: {filename: file_id}."""
    url = f"{OPENROUTER_API_BASE}/files"
    params = {"limit": 100}
    if workspace_id:
        params["workspace_id"] = workspace_id

    headers = {"Authorization": f"Bearer {api_key}"}
    existing = {}
    cursor = None

    while True:
        if cursor:
            params["cursor"] = cursor
        res = requests.get(url, headers=headers, params=params, timeout=30)
        if res.status_code != 200:
            print(f"[Warning] Failed to fetch existing files: {res.status_code} - {res.text}")
            break

        data = res.json()
        items = data.get("data", [])
        for item in items:
            fname = item.get("filename")
            fid = item.get("id")
            if fname and fid:
                existing[fname] = fid

        if data.get("has_more") and data.get("cursor"):
            cursor = data.get("cursor")
        else:
            break

    return existing


def delete_remote_file(api_key: str, file_id: str) -> bool:
    """Deletes a file by ID on OpenRouter."""
    url = f"{OPENROUTER_API_BASE}/files/{file_id}"
    headers = {"Authorization": f"Bearer {api_key}"}
    res = requests.delete(url, headers=headers, timeout=30)
    return res.status_code in (200, 204)


def upload_single_file(api_key: str, target_filename: str, full_path: Path, workspace_id: Optional[str] = None, max_retries: int = 3) -> Optional[dict]:
    """Uploads a single file to OpenRouter with automatic retries for rate limits."""
    url = f"{OPENROUTER_API_BASE}/files"
    params = {}
    if workspace_id:
        params["workspace_id"] = workspace_id

    headers = {"Authorization": f"Bearer {api_key}"}

    for attempt in range(1, max_retries + 1):
        try:
            with open(full_path, "rb") as f:
                files = {
                    "file": (target_filename, f)
                }
                res = requests.post(url, headers=headers, params=params, files=files, timeout=60)

            if res.status_code in (200, 201):
                return res.json()
            elif res.status_code == 429:
                wait_sec = attempt * 2
                print(f" [Rate-limited: waiting {wait_sec}s]...", end="", flush=True)
                time.sleep(wait_sec)
                continue
            else:
                print(f"\n[Error] Failed to upload {target_filename} ({res.status_code}): {res.text}")
                return None
        except requests.RequestException as e:
            if attempt < max_retries:
                time.sleep(attempt * 1.5)
                continue
            print(f"\n[Error] Network error uploading {target_filename}: {e}")
            return None

    return None


def main():
    parser = argparse.ArgumentParser(description="Upload workspace files to OpenRouter Files API")
    parser.add_argument("--api-key", help="OpenRouter API Key (or set OPENROUTER_API_KEY env var)")
    parser.add_argument("--workspace-id", help="Optional OpenRouter Workspace ID")
    parser.add_argument("--prefix", default="alphacoretech", help="Remote folder prefix (default: alphacoretech). Use empty string for root.")
    parser.add_argument("--no-prefix", action="store_true", help="Upload directly to root with no folder prefix")
    parser.add_argument("--dir", default=".", help="Root directory to upload (default: current directory)")
    parser.add_argument("--code-only", action="store_true", help="Upload only code and config text files (exclude images/audio)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate and list candidate files without uploading")
    parser.add_argument("--sync", action="store_true", help="Skip files that have already been uploaded")
    parser.add_argument("--overwrite", action="store_true", help="Delete and re-upload existing files")
    parser.add_argument("--manifest", default="openrouter_files.json", help="Output file for uploaded file metadata manifest")

    args = parser.parse_args()

    root_dir = Path(args.dir).resolve()
    prefix = "" if args.no_prefix else (args.prefix.strip("/") if args.prefix else "")

    print(f"==================================================")
    print(f" AlphaCore -> OpenRouter Workspace File Uploader")
    print(f"==================================================")
    print(f"Root Directory: {root_dir}")
    print(f"Remote Prefix:  {prefix or '(none - root)'}")
    print(f"Code Only:      {args.code_only}")
    print(f"Dry Run:        {args.dry_run}")
    print(f"Sync Mode:      {args.sync}")
    print(f"Overwrite Mode: {args.overwrite}")
    print(f"Manifest Path:  {args.manifest}")
    print(f"--------------------------------------------------")

    # 1. Discover files
    candidates = collect_files(root_dir, code_only=args.code_only)
    total_bytes = sum(sz for _, _, sz in candidates)
    print(f"Found {len(candidates)} candidate files ({total_bytes / (1024 * 1024):.2f} MB total).")

    if args.dry_run:
        print("\n--- Dry Run: Files to upload ---")
        for rel_path, _, sz in candidates:
            target_path = f"{prefix}/{rel_path}" if prefix else rel_path
            print(f"  [PENDING] {target_path:<65} ({sz:,} bytes)")
        print(f"\nDry run complete. No files were uploaded.")
        return

    # 2. Resolve API key
    api_key = args.api_key or os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        api_key = getpass.getpass("Enter your OpenRouter API Key (sk-or-...): ").strip()

    if not api_key:
        print("Error: OpenRouter API key is required.")
        sys.exit(1)

    # 3. Check existing remote files
    print("\nConnecting to OpenRouter Files API...")
    existing_files = fetch_existing_files(api_key, workspace_id=args.workspace_id)
    print(f"Found {len(existing_files)} existing files in the OpenRouter workspace.")

    uploaded_manifest = {}
    manifest_path = root_dir / args.manifest
    if manifest_path.exists():
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                uploaded_manifest = json.load(f)
        except Exception:
            pass

    success_count = 0
    skipped_count = 0
    failed_count = 0

    print(f"\nStarting upload of {len(candidates)} files...\n")
    start_time = time.time()

    for idx, (rel_path, full_path, sz) in enumerate(candidates, start=1):
        target_path = f"{prefix}/{rel_path}" if prefix else rel_path
        progress = f"[{idx}/{len(candidates)}]"

        # Check if file exists remotely
        remote_id = existing_files.get(target_path)
        if remote_id:
            if args.sync and not args.overwrite:
                print(f"{progress} [SKIP] {target_path} (Already exists: {remote_id})")
                uploaded_manifest[target_path] = {
                    "id": remote_id,
                    "filename": target_path,
                    "local_path": rel_path,
                    "size_bytes": sz,
                    "status": "existing"
                }
                skipped_count += 1
                continue
            elif args.overwrite:
                print(f"{progress} [OVERWRITE] Deleting previous {target_path} ({remote_id})...")
                delete_remote_file(api_key, remote_id)
                time.sleep(0.1)

        print(f"{progress} [UPLOADING] {target_path} ({sz:,} bytes)...", end="", flush=True)
        res_data = upload_single_file(api_key, target_path, full_path, workspace_id=args.workspace_id)

        if res_data and "id" in res_data:
            file_id = res_data["id"]
            print(f" OK -> {file_id}")
            uploaded_manifest[target_path] = {
                "id": file_id,
                "filename": res_data.get("filename", target_path),
                "local_path": rel_path,
                "size_bytes": res_data.get("size_bytes", sz),
                "mime_type": res_data.get("mime_type"),
                "created_at": res_data.get("created_at"),
                "status": "uploaded"
            }
            success_count += 1
        else:
            failed_count += 1

        # Throttle to prevent rate limiting
        time.sleep(0.1)

    elapsed = time.time() - start_time
    print(f"\n==================================================")
    print(f" Upload Complete in {elapsed:.1f}s")
    print(f" Succeeded: {success_count}")
    print(f" Skipped:   {skipped_count}")
    print(f" Failed:    {failed_count}")
    print(f"==================================================")

    # Save manifest
    try:
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(uploaded_manifest, f, indent=2)
        print(f"Manifest saved to: {manifest_path}")
    except Exception as e:
        print(f"[Warning] Failed to write manifest: {e}")


if __name__ == "__main__":
    main()
