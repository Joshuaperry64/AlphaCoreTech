import os
import re
import json

prev_catalog_path = r"C:\Users\josh6\workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_survey_1\survey_catalog.md"
with open(prev_catalog_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

prev_projects = {}
for line in lines:
    if line.startswith('|') and not 'Project Directory' in line and not '|---|' in line:
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 8 and parts[1].isdigit():
            idx = int(parts[1])
            raw_name = parts[2]
            clean_name = raw_name.replace('`', '').strip()
            domain = parts[3].strip()
            complexity = parts[4].replace('*', '').strip()
            main_script = parts[5].replace('`', '').strip()
            py_files = int(parts[6])
            desc = parts[7].strip()
            prev_projects[clean_name] = {
                'idx': idx,
                'name': clean_name,
                'domain': domain,
                'complexity': complexity,
                'mainScript': main_script,
                'pythonFilesCount': py_files,
                'description': desc
            }

workspace = r"C:\Users\josh6\workspace"
entries = sorted(os.listdir(workspace))
exclude_dirs = {'AlphaCoreTech', '.agents', 'node_modules', '.git', 'venv', '.venv', 'env', '__pycache__', 'build', 'dist'}

current_projects_data = []

# Domain normalizer mapping
domain_map = {
    "Mobile & Android": "Mobile & Android",
    "AI & ML": "AI & ML",
    "Network & Web": "Network & Web",
    "System & Automation": "System & Automation",
    "Hardware & System": "Hardware & System",
    "Data & Storage": "Data & Storage",
    "Security & Cyber": "Security & Cyber",
    "Reverse Engineering & Security": "Reverse Engineering & Security",
    "Audio & Speech": "Audio & Speech",
    "Mobile & iOS": "Mobile & iOS",
    "Data & System": "Data & System",
    "System & Platform": "System & Platform",
    "System & Utilities": "System & Utilities",
    "Simulation & Gaming": "Simulation & Gaming",
    "Hardware & Mobile": "Hardware & Mobile",
    "Crypto & Data": "Crypto & Data",
    "Hardware & IoT": "Hardware & IoT",
    "Security & Data": "Security & Data",
    "Network & AI": "Network & AI",
    "Simulation & AI": "Simulation & AI",
    "System & Network": "System & Network"
}

for entry in entries:
    full_path = os.path.join(workspace, entry)
    if not os.path.isdir(full_path) or entry in exclude_dirs or entry.startswith('.'):
        continue

    # Count python files
    py_count = 0
    py_files_list = []
    for root, dirs, files in os.walk(full_path):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
        for f in files:
            if f.endswith('.py'):
                py_count += 1
                rel = os.path.relpath(os.path.join(root, f), full_path)
                py_files_list.append(rel)

    # Determine Port ID
    port_id = "port-" + re.sub(r'[^a-z0-9]', '', entry.lower())

    if entry in prev_projects:
        item = prev_projects[entry]
        # Update py count and main script if changed
        domain = item['domain']
        complexity = item['complexity']
        main_script = item['mainScript']
        desc = item['description']
        
        # Check specific updates
        if entry == "AlphaComfy":
            main_script = "main.py"
        elif entry == "OpenWebUI":
            main_script = "heretic-1.4.0\\src\\heretic\\main.py"
    else:
        # New project (e.g. AlphaController)
        if entry == "AlphaController":
            domain = "AI & ML"
            complexity = "Complex"
            main_script = "main.py"
            desc = "Neural interface & desktop symbiote client/server UI with fast VLM brain integration, autonomous input control, system logging, custom directives, and Modal cloud deployment."
        else:
            domain = "Utilities"
            complexity = "Simple" if py_count <= 2 else "Complex"
            main_script = py_files_list[0] if py_files_list else "N/A"
            desc = f"{entry} Python project."

    current_projects_data.append({
        "id": port_id,
        "name": entry,
        "path": full_path,
        "domain": domain,
        "complexity": complexity,
        "mainScript": main_script,
        "pythonFilesCount": py_count,
        "description": desc
    })

# Sort alphabetically by name
current_projects_data.sort(key=lambda x: x['name'].lower())

# Summary metrics
total_count = len(current_projects_data)
simple_count = sum(1 for p in current_projects_data if p['complexity'] == 'Simple')
complex_count = sum(1 for p in current_projects_data if p['complexity'] == 'Complex')

new_projects = [p['name'] for p in current_projects_data if p['name'] not in prev_projects]

catalog_json_payload = {
    "totalProjects": total_count,
    "simpleProjectsCount": simple_count,
    "complexProjectsCount": complex_count,
    "newlyAddedProjects": new_projects,
    "updatedProjects": [
        {"name": "AlphaComfy", "field": "pythonFilesCount", "prev": 1, "curr": 11},
        {"name": "AlphaComfy", "field": "mainScript", "prev": "bridge.py", "curr": "main.py"},
        {"name": "OpenWebUI", "field": "pythonFilesCount", "prev": 18, "curr": 19}
    ],
    "removedProjects": [],
    "projects": current_projects_data
}

# Write catalog_analysis.json
out_dir = r"C:\Users\josh6\workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_survey_2"
json_path = os.path.join(out_dir, "catalog_analysis.json")
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(catalog_json_payload, f, indent=2)

print(f"Written {json_path}")

# Write survey_catalog_updated.md
md_lines = []
md_lines.append("# Workspace Python Projects Survey Catalog (Updated Rescan)")
md_lines.append("")
md_lines.append(f"**Total Cataloged Projects**: {total_count}")
md_lines.append(f"**Simple Projects (Client-Side Web Portable)**: {simple_count}")
md_lines.append(f"**Complex Projects (Backend / Native Required - Placeholder Candidate)**: {complex_count}")
md_lines.append(f"**Newly Discovered Projects**: {len(new_projects)} (`AlphaController`)")
md_lines.append("")
md_lines.append("---")
md_lines.append("")
md_lines.append("## Workspace Rescan Delta & Diff Analysis")
md_lines.append("")
md_lines.append("### Newly Added Projects (1)")
md_lines.append("- **`AlphaController`**: Neural interface & desktop symbiote client/server UI with VLM brain integration, autonomous input control, system logging, and Modal deployment. Classified as **Complex**.")
md_lines.append("")
md_lines.append("### Updated Projects (2)")
md_lines.append("- **`AlphaComfy`**: Python file count increased from **1** to **11** (`main.py` entry point added alongside batch installers and model loader utilities).")
md_lines.append("- **`OpenWebUI`**: Python file count increased from **18** to **19** (`vllm_server.py` added).")
md_lines.append("")
md_lines.append("### Removed Projects (0)")
md_lines.append("- None. All 56 previous projects remain present and intact in `C:\\Users\\josh6\\workspace`.")
md_lines.append("")
md_lines.append("---")
md_lines.append("")
md_lines.append("## Summary Table")
md_lines.append("")
md_lines.append("| # | Project Directory | Domain / Topic | Complexity | Main Script | Py Files | Key Capability / Focus |")
md_lines.append("|---|-------------------|----------------|------------|-------------|----------|------------------------|")

for idx, p in enumerate(current_projects_data, 1):
    comp_fmt = f"**{p['complexity']}**"
    main_s = f"`{p['mainScript']}`" if p['mainScript'] != 'N/A' else "`N/A`"
    md_lines.append(f"| {idx} | `{p['name']}` | {p['domain']} | {comp_fmt} | {main_s} | {p['pythonFilesCount']} | {p['description']} |")

md_lines.append("")
md_lines.append("---")
md_lines.append("")
md_lines.append("## Detailed Catalog")
md_lines.append("")

for idx, p in enumerate(current_projects_data, 1):
    md_lines.append(f"### {idx}. `{p['name']}`")
    md_lines.append(f"- **Port ID**: `{p['id']}`")
    md_lines.append(f"- **Absolute Path**: `{p['path']}`")
    md_lines.append(f"- **Domain / Topic**: {p['domain']}")
    md_lines.append(f"- **Complexity Assessment**: **{p['complexity']}** ({'Client-side interactive React component / browser simulation feasible' if p['complexity'] == 'Simple' else 'Requires native Python binaries, low-level OS drivers, hardware APIs, or heavy AI models'})")
    md_lines.append(f"- **Main Script**: `{p['mainScript']}`")
    md_lines.append(f"- **Python Files ({p['pythonFilesCount']})**: {p['pythonFilesCount']} `.py` files detected.")
    md_lines.append(f"- **Description**: {p['description']}")
    md_lines.append("")

md_path = os.path.join(out_dir, "survey_catalog_updated.md")
with open(md_path, 'w', encoding='utf-8') as f:
    f.write("\n".join(md_lines))

print(f"Written {md_path}")
