import os
import json
import re

workspace_dir = r"C:\Users\josh6\workspace"
excluded_dirs = {"alphacoretech", ".agents", "node_modules", ".git", ".venv", "venv", "__pycache__"}

results = []

for entry in sorted(os.listdir(workspace_dir)):
    full_path = os.path.join(workspace_dir, entry)
    if not os.path.isdir(full_path):
        continue
    if entry.lower() in excluded_dirs or entry.startswith("."):
        continue

    py_files = []
    other_files = []
    dep_files = []
    all_imports = set()
    docstrings = []
    file_contents_summary = []

    for root, dirs, files in os.walk(full_path):
        dirs[:] = [d for d in dirs if d.lower() not in {"node_modules", ".git", ".venv", "venv", "__pycache__", "build", "dist"} and not d.startswith(".")]
        for f in files:
            rel_path = os.path.relpath(os.path.join(root, f), full_path)
            if f.endswith(".py"):
                py_files.append(rel_path)
            elif f.lower() in ["requirements.txt", "pyproject.toml", "setup.py", "pipfile", "environment.yml"]:
                dep_files.append(rel_path)
            else:
                other_files.append(rel_path)

    # Read top python files to analyze imports and functionality
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

    # Read key files for code summary
    read_targets = py_files[:5] + dep_files
    for target in read_targets:
        target_path = os.path.join(full_path, target)
        try:
            with open(target_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                if target.endswith(".py"):
                    for line in content.splitlines()[:50]:
                        line_str = line.strip()
                        if line_str.startswith("import ") or line_str.startswith("from "):
                            all_imports.add(line_str)
                    match = re.search(r'^(?:"""|\'\'\')(.*?)(?:"""|\'\'\')', content, re.DOTALL)
                    if match:
                        docstrings.append(match.group(1).strip()[:300])
                    # Add snippet
                    file_contents_summary.append(f"--- {target} ---\n" + content[:500])
                else:
                    file_contents_summary.append(f"--- {target} ---\n" + content[:500])
        except Exception as e:
            pass

    results.append({
        "name": entry,
        "path": full_path,
        "py_files": py_files,
        "dep_files": dep_files,
        "other_files_count": len(other_files),
        "main_script": main_script,
        "imports": sorted(list(all_imports)),
        "docstrings": docstrings,
        "code_snippets": file_contents_summary
    })

out_path = os.path.join(os.path.dirname(__file__), "catalog_analysis.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print(f"Analyzed {len(results)} directories in {workspace_dir}")
