import os
import json
import glob
import re

workspace_dir = r"C:\Users\josh6\workspace"
excluded_dirs = {"alphacoretech", ".agents", "node_modules", ".git", ".venv", "venv", "__pycache__"}

projects = []

for entry in os.listdir(workspace_dir):
    full_path = os.path.join(workspace_dir, entry)
    if not os.path.isdir(full_path):
        continue
    if entry.lower() in excluded_dirs or entry.startswith("."):
        continue

    # Search for python files in this project directory
    py_files = []
    dep_files = []
    
    for root, dirs, files in os.walk(full_path):
        # Prune excluded subdirs
        dirs[:] = [d for d in dirs if d.lower() not in {"node_modules", ".git", ".venv", "venv", "__pycache__", "build", "dist"} and not d.startswith(".")]
        
        for f in files:
            rel_f = os.path.relpath(os.path.join(root, f), full_path)
            if f.endswith(".py"):
                py_files.append(rel_f)
            elif f.lower() in ["requirements.txt", "pyproject.toml", "setup.py", "pipfile", "environment.yml"]:
                dep_files.append(rel_f)

    if not py_files and not dep_files:
        # Check if there are nested python projects or if this directory is not a python project
        continue

    # Determine main script
    main_script = None
    priority_mains = ["main.py", "app.py", "cli.py", "index.py", "run.py", "gui.py", f"{entry.lower()}.py"]
    for pm in priority_mains:
        for pf in py_files:
            if os.path.basename(pf).lower() == pm:
                main_script = pf
                break
        if main_script:
            break
    if not main_script and py_files:
        main_script = py_files[0]

    # Read content of main script and requirement files to extract docstrings, imports, description
    docstrings = []
    imports = set()
    req_contents = []

    for dep_f in dep_files:
        dep_path = os.path.join(full_path, dep_f)
        try:
            with open(dep_path, "r", encoding="utf-8", errors="ignore") as f:
                req_contents.append(f"{dep_f}:\n" + f.read())
        except Exception:
            pass

    for pf in py_files[:10]: # Read first few python files for inspection
        pf_path = os.path.join(full_path, pf)
        try:
            with open(pf_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                # extract imports
                for line in content.splitlines():
                    line_str = line.strip()
                    if line_str.startswith("import ") or line_str.startswith("from "):
                        imports.add(line_str)
                # extract docstring if any
                match = re.search(r'^(?:"""|\'\'\')(.*?)(?:"""|\'\'\')', content, re.DOTALL)
                if match:
                    docstrings.append(match.group(1).strip())
        except Exception:
            pass

    projects.append({
        "name": entry,
        "path": full_path,
        "py_files": py_files,
        "dep_files": dep_files,
        "main_script": main_script,
        "imports": sorted(list(imports))[:20],
        "docstrings": docstrings[:3],
        "requirements_summary": "\n".join(req_contents)[:1000]
    })

out_path = os.path.join(os.path.dirname(__file__), "scan_results.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(projects, f, indent=2)

print(f"Scanned {len(projects)} Python projects in {workspace_dir}")
