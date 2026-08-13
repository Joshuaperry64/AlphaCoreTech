import json
import os

analysis_path = os.path.join(os.path.dirname(__file__), "catalog_analysis.json")
with open(analysis_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Classification rules and manual enrichments based on project inspection
processed = []

for item in data:
    name = item["name"]
    path = item["path"]
    py_files = item["py_files"]
    dep_files = item["dep_files"]
    main_script = item["main_script"]
    imports = item["imports"]
    docstrings = item["docstrings"]
    code_snippets = item["code_snippets"]

    # Combine text for heuristic analysis
    all_text = (name + " " + " ".join(py_files) + " " + " ".join(imports) + " " + " ".join(docstrings) + " " + " ".join(code_snippets)).lower()

    # Determine Domain/Topic
    domain = "Utilities"
    if any(k in all_text for k in ["apk", "android", "adb", "twrp", "mtk", "fastboot", "magisk"]):
        domain = "Mobile & Android"
    elif any(k in all_text for k in ["exploit", "jail", "hack", "payload", "bypass", "weapon", "broken", "fentanyl"]):
        domain = "Security & Cyber"
    elif any(k in all_text for k in ["voice", "audio", "sound", "mp3", "speech", "tts", "stt"]):
        domain = "Audio & Speech"
    elif any(k in all_text for k in ["comfy", "llm", "ai", "gemini", "modal", "prompt", "sillytavern", "openwebui", "reeldeep"]):
        domain = "AI & ML"
    elif any(k in all_text for k in ["eye", "browser", "scraper", "drive", "link", "sync", "nexus", "comms"]):
        domain = "Network & Web"
    elif any(k in all_text for k in ["obfuscate", "ghidra", "reverse", "asm", "decompile"]):
        domain = "Reverse Engineering & Security"
    elif any(k in all_text for k in ["sims", "roleplay", "concept", "dini", "vape"]):
        domain = "Simulation & Gaming"
    elif any(k in all_text for k in ["inventory", "requirements", "limiter", "dpms", "hats", "ignition", "pocket", "tmohs1", "jcac"]):
        domain = "System & Automation"

    # Assess Complexity
    # Complex if relies on heavy external packages (torch, cv2, ghidra, adb, mtk, pyaudio, flask/fastapi, selenium/playwright, etc.)
    # or hardware / device drivers
    is_complex = False
    complex_triggers = [
        "torch", "tensorflow", "cv2", "ghidra", "pyaudio", "sounddevice", "librosa",
        "scapy", "usb", "serial", "adb", "subprocess", "ctypes", "flask", "fastapi",
        "playwright", "selenium", "requests", "aiohttp", "socket", "win32api", "comtypes"
    ]

    for imp in imports:
        imp_lower = imp.lower()
        if any(trig in imp_lower for trig in complex_triggers):
            is_complex = True
            break

    if domain in ["Mobile & Android", "Reverse Engineering & Security", "Audio & Speech"]:
        is_complex = True

    # Known simple ports established in POC or pure rule-based logic
    if name in ["AlphaInventory", "AlphaRequirements", "AlphaPrompt", "AlphaConcepts", "AlphaObfuscate", "AlphaLimiter", "AlphaPocket", "AlphaSkills"]:
        # If it's pure logic / generator / data tool, check if it can be simple
        if name in ["AlphaInventory", "AlphaRequirements", "AlphaPrompt", "AlphaConcepts", "AlphaPocket", "AlphaSkills"]:
            is_complex = False

    complexity = "Complex" if is_complex else "Simple"
    fallback_reason = "Requires native Python dependencies / system APIs" if is_complex else "Client-side browser simulation / React component feasible"

    # Key features / description
    desc = []
    if docstrings:
        desc.append(docstrings[0].replace("\n", " "))
    else:
        desc.append(f"Python subroutine for {domain.lower()} operations.")

    features = []
    if py_files:
        features.append(f"{len(py_files)} Python file(s)")
    if main_script:
        features.append(f"Main entry: {main_script}")
    if dep_files:
        features.append(f"Dependencies: {', '.join(dep_files)}")
    if imports:
        features.append(f"Key imports: {', '.join([imp.split()[-1] for imp in imports[:5]])}")

    processed.append({
        "name": name,
        "path": path,
        "py_files": py_files,
        "dep_files": dep_files,
        "main_script": main_script or "N/A",
        "domain": domain,
        "complexity": complexity,
        "fallback_reason": fallback_reason,
        "description": " ".join(desc)[:200],
        "features": features
    })

# Write to markdown file survey_catalog.md
catalog_md_path = os.path.join(os.path.dirname(__file__), "survey_catalog.md")

with open(catalog_md_path, "w", encoding="utf-8") as f:
    f.write("# Workspace Python Projects Survey Catalog\n\n")
    f.write(f"**Total Cataloged Directories**: {len(processed)}\n")
    simple_count = sum(1 for p in processed if p['complexity'] == 'Simple')
    complex_count = sum(1 for p in processed if p['complexity'] == 'Complex')
    f.write(f"**Simple Projects (Client-Side Web Portable)**: {simple_count}\n")
    f.write(f"**Complex Projects (Backend / Native Required - Placeholder Candidate)**: {complex_count}\n\n")

    f.write("--- \n\n")
    f.write("## Summary Table\n\n")
    f.write("| # | Directory Name | Domain / Topic | Complexity | Main Script | Py Files | Dependencies |\n")
    f.write("|---|----------------|----------------|------------|-------------|----------|--------------|\n")
    for idx, p in enumerate(processed, 1):
        dep_str = ", ".join(p['dep_files']) if p['dep_files'] else "None"
        f.write(f"| {idx} | `{p['name']}` | {p['domain']} | **{p['complexity']}** | `{p['main_script']}` | {len(p['py_files'])} | {dep_str} |\n")

    f.write("\n\n--- \n\n")
    f.write("## Detailed Catalog\n\n")

    for idx, p in enumerate(processed, 1):
        f.write(f"### {idx}. `{p['name']}`\n")
        f.write(f"- **Absolute Path**: `{p['path']}`\n")
        f.write(f"- **Domain / Topic**: {p['domain']}\n")
        f.write(f"- **Complexity Assessment**: **{p['complexity']}** ({p['fallback_reason']})\n")
        f.write(f"- **Main Script**: `{p['main_script']}`\n")
        f.write(f"- **Python Files ({len(p['py_files'])})**: {', '.join([f'`{f}`' for f in p['py_files'][:10]])}{'...' if len(p['py_files']) > 10 else ''}\n")
        f.write(f"- **Dependency Files**: {', '.join([f'`{f}`' for f in p['dep_files']]) if p['dep_files'] else 'None'}\n")
        f.write(f"- **Description**: {p['description']}\n")
        f.write(f"- **Key Features**: {'; '.join(p['features'])}\n\n")

print(f"Generated {catalog_md_path} with {len(processed)} entries.")
