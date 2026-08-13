import os
import json

workspace_dir = r"C:\Users\josh6\workspace"

analysis_path = os.path.join(os.path.dirname(__file__), "catalog_analysis.json")
with open(analysis_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for item in data:
    if not item["py_files"]:
        full_path = item["path"]
        files = []
        for root, dirs, fnames in os.walk(full_path):
            dirs[:] = [d for d in dirs if d.lower() not in {"node_modules", ".git", ".venv", "venv", "__pycache__", "build", "dist"} and not d.startswith(".")]
            for f in fnames:
                rel = os.path.relpath(os.path.join(root, f), full_path)
                files.append(rel)
        item["all_files_sample"] = files[:15]

# Refine domain and feature descriptions for all projects
for item in data:
    name = item["name"]
    py_files = item["py_files"]
    dep_files = item["dep_files"]
    main_script = item["main_script"]
    sample_files = item.get("all_files_sample", [])
    
    # Specific Domain & Capability Mapping based on workspace project knowledge
    domain_map = {
        "AlphaAPK": ("Mobile & Android", "Complex", "APK reverse engineering, decompression, and Android manifest inspection utility."),
        "AlphaAgency": ("AI & ML", "Simple", "Agent swarm orchestration GUI and task delegation visualizer."),
        "AlphaAssistant": ("AI & ML", "Complex", "Multi-modal AI assistant suite with audio manager, agent loops, and API routes."),
        "AlphaBrowser": ("Network & Web", "Complex", "Automated browser controller, web scraper, and DOM layout extractor."),
        "AlphaComfy": ("AI & ML", "Complex", "ComfyUI workflow bridge and image generation pipeline runner."),
        "AlphaComms": ("Network & Web", "Complex", "Encrypted peer-to-peer communication node and socket protocol listener."),
        "AlphaConcepts": ("AI & ML", "Simple", "AI concept design explorer, prompt rule manager, and architectural layout helper."),
        "AlphaCoreTech": ("Web & Platform", "Excluded", "Main platform repository."),
        "AlphaDPMS": ("System & Automation", "Simple", "Data Protection & Memory System (MCP server for persistent memory storage)."),
        "AlphaDiagnostics": ("Hardware & System", "Complex", "Hardware telemetry monitor and diagnostic dashboard (Laptop & RasPi GUIs)."),
        "AlphaDrive": ("Data & Storage", "Complex", "Automated cloud/local file drive synchronizer and payload backup engine."),
        "AlphaExploit": ("Security & Cyber", "Complex", "Cybersecurity vulnerability scanner, fuzzing suite, and exploit payload builder."),
        "AlphaEye": ("AI & ML", "Complex", "Computer vision pipeline, web-camera object tracking, and OpenCV video analyzer."),
        "AlphaGemini": ("AI & ML", "Simple", "Google Gemini API wrapper, multi-turn chat manager, and prompt optimizer."),
        "AlphaGhidra": ("Reverse Engineering & Security", "Complex", "Ghidra headless disassembler automation & binary analysis bridge."),
        "AlphaGirl": ("Audio & Speech", "Complex", "Voice synthesis suite integrating ElevenLabs, Silero TTS, and Whisper STT."),
        "AlphaHATS": ("Security & Cyber", "Complex", "Hardware-Assisted Telemetry & Security auditor for embedded hardware."),
        "AlphaIOS": ("Mobile & iOS", "Complex", "iOS IPA analysis, plist inspector, and mobile device pairing toolkit."),
        "AlphaIgnition": ("System & Automation", "Simple", "RasPi boot ignition sequence manager and remote hardware trigger."),
        "AlphaInventory": ("Data & System", "Simple", "Hardware & software asset inventory tracker, component list generator, and JSON exporter."),
        "AlphaJail": ("Security & Cyber", "Simple", "LLM jailbreak safety tester, adversarial prompt benchmark, and guardrail evaluator."),
        "AlphaLLM": ("AI & ML", "Complex", "Local LLM model downloader, quantization switcher, and inference server."),
        "AlphaLink": ("Network & Web", "Complex", "High-speed WebSocket bridge, tunnel manager, and remote control link."),
        "AlphaMP3": ("Audio & Speech", "Complex", "Audio processing, MP3 tag editor, waveform analyzer, and format converter."),
        "AlphaMTK": ("Mobile & Android", "Complex", "MediaTek (MTK) chipset low-level flasher, exploit toolkit, and partition dumper."),
        "AlphaMainframe": ("System & Platform", "Simple", "Terminal mainframe interface, system command hub, and ASCII status board."),
        "AlphaModal": ("AI & ML", "Complex", "Modal serverless cloud function runner, Whisper fine-tuning, and scalable worker."),
        "AlphaNexus": ("Network & Web", "Complex", "Distributed microservices gateway, message queue broker, and RPC dispatcher."),
        "AlphaObfuscate": ("Reverse Engineering & Security", "Simple", "Python / JS code obfuscator, string encryptor, and AST transformer."),
        "AlphaPocket": ("Audio & Speech", "Simple", "Pocket-sized offline audio note transcriber and micro voice logger."),
        "AlphaPrompt": ("AI & ML", "Simple", "Interactive prompt engineering studio, system prompt builder, and template library."),
        "AlphaRequirements": ("System & Utilities", "Simple", "Python package dependency audit tool, vulnerability scanner, and requirements builder."),
        "AlphaScraper": ("Network & Web", "Simple", "Web scraping rules engine, HTML parser, and structured data extractor."),
        "AlphaSims": ("Simulation & Gaming", "Simple", "Text-based life simulator, multi-agent sandbox world, and state machine simulation."),
        "AlphaSkills": ("System & Utilities", "Simple", "Antigravity skill package builder, custom command provider, and lambda function builder."),
        "AlphaSync": ("Data & Storage", "Complex", "Real-time filesystem watcher, differential file sync, and backup daemon."),
        "AlphaTMOHS1": ("Hardware & Mobile", "Complex", "T-Mobile High-Speed Internet Gateway (TMOHS1) custom router firmware/management tool."),
        "AlphaTWRP": ("Mobile & Android", "Complex", "TWRP recovery device tree generator (`twrpdtgen`) and boot image unpacker."),
        "AlphaVoice": ("Audio & Speech", "Complex", "Low-latency voice activity detector (VAD) and real-time audio streamer."),
        "AlphaWallet": ("Crypto & Data", "Simple", "Cryptocurrency wallet tracker, offline key generator simulation, and transaction viewer."),
        "AlphaWeapon": ("Security & Cyber", "Simple", "Adversarial payload generator, shellcode encoder, and security test suite."),
        "AndroidAlpha": ("Mobile & Android", "Complex", "Android device management suite, ADB shell controller, and app installer."),
        "ApocalypticAlpha": ("Simulation & Gaming", "Complex", "Survival RPG game core, post-apocalyptic narrative engine, and AI companion interface."),
        "AudioAlpha": ("Audio & Speech", "Complex", "Comprehensive audio processing engine, PyAudio recorder, and signal filter bank."),
        "DiniVapePro": ("Hardware & IoT", "Complex", "Smart vaping hardware custom firmware flasher and Bluetooth LE telemetry viewer."),
        "Fentanyl Research": ("Security & Data", "Simple", "Research document database, safety protocol reference, and chemical structure catalog."),
        "ForbiddenArchive": ("Security & Cyber", "Complex", "Encrypted document archive, stealth vault system, and secure file shredder."),
        "JCAC10003": ("Hardware & Mobile", "Complex", "Custom Android build script, TWRP ZIP installer packager, and flash script."),
        "LiveAPI": ("Network & AI", "Complex", "Real-time streaming API gateway, WebSocket live handler, and Gemini Live bridge."),
        "OGAD": ("AI & ML", "Simple", "Stable Diffusion GGUF model quantization utility and publisher script."),
        "OpenWebUI": ("AI & ML", "Complex", "Self-hosted web UI frontend for local LLMs (`heretic` backend integration)."),
        "ReelDeep": ("AI & ML", "Simple", "Deepfake detection benchmark dataset and video frame feature analyzer."),
        "RoleplayAlpha": ("Simulation & AI", "Complex", "SillyTavern/Roleplay backend plugin and Modal cloud deployment app."),
        "SillyTavern": ("AI & ML", "Simple", "LLM roleplay character card creator, preset manager, and chat interface."),
        "TripleAlpha": ("AI & ML", "Simple", "Triple-redundant AI reasoning engine, consensus voter, and multi-model aggregator."),
        "alphalimiter": ("System & Network", "Complex", "Bandwidth throttling daemon, network speed limiter, and packet delay simulation."),
        "bR0k3nC0Re": ("Security & Cyber", "Complex", "System crash analyzer, core dump inspector, and kernel exploitation playground.")
    }

    if name in domain_map:
        dom, comp, desc = domain_map[name]
        item["domain"] = dom
        item["complexity"] = comp
        item["description"] = desc
    else:
        item["domain"] = item.get("domain", "Utilities")
        item["complexity"] = item.get("complexity", "Complex")
        item["description"] = "Python project module."

    item["fallback_reason"] = "Requires native Python binaries, low-level OS drivers, hardware APIs, or heavy AI models" if item["complexity"] == "Complex" else "Client-side interactive React component / browser simulation feasible"

# Write updated survey_catalog.md
catalog_md_path = os.path.join(os.path.dirname(__file__), "survey_catalog.md")

with open(catalog_md_path, "w", encoding="utf-8") as f:
    f.write("# Workspace Python Projects Survey Catalog\n\n")
    f.write(f"**Total Cataloged Projects**: {len(data)}\n")
    simple_count = sum(1 for p in data if p['complexity'] == 'Simple')
    complex_count = sum(1 for p in data if p['complexity'] == 'Complex')
    f.write(f"**Simple Projects (Client-Side Web Portable)**: {simple_count}\n")
    f.write(f"**Complex Projects (Backend / Native Required - Placeholder Candidate)**: {complex_count}\n\n")

    f.write("--- \n\n")
    f.write("## Summary Table\n\n")
    f.write("| # | Project Directory | Domain / Topic | Complexity | Main Script | Py Files | Key Capability / Focus |\n")
    f.write("|---|-------------------|----------------|------------|-------------|----------|------------------------|\n")
    for idx, p in enumerate(data, 1):
        f.write(f"| {idx} | `{p['name']}` | {p['domain']} | **{p['complexity']}** | `{p['main_script'] or 'N/A'}` | {len(p['py_files'])} | {p['description'][:60]}... |\n")

    f.write("\n\n--- \n\n")
    f.write("## Detailed Catalog\n\n")

    for idx, p in enumerate(data, 1):
        f.write(f"### {idx}. `{p['name']}`\n")
        f.write(f"- **Absolute Path**: `{p['path']}`\n")
        f.write(f"- **Domain / Topic**: {p['domain']}\n")
        f.write(f"- **Complexity Assessment**: **{p['complexity']}** ({p['fallback_reason']})\n")
        f.write(f"- **Main Script**: `{p['main_script'] or 'N/A'}`\n")
        f.write(f"- **Python Files ({len(p['py_files'])})**: {', '.join([f'`{f}`' for f in p['py_files'][:8]])}{'...' if len(p['py_files']) > 8 else (' (None)' if not p['py_files'] else '')}\n")
        f.write(f"- **Dependency Files**: {', '.join([f'`{f}`' for f in p['dep_files']]) if p['dep_files'] else 'None'}\n")
        f.write(f"- **Description**: {p['description']}\n")
        if p.get('imports'):
            f.write(f"- **Key Libraries / Imports**: {', '.join([imp.split()[-1] for imp in p['imports'][:6]])}\n")
        f.write("\n")

print(f"Refined {catalog_md_path} successfully!")
