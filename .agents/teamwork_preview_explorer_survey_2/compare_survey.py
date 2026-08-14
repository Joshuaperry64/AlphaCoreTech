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

print(f"Parsed {len(prev_projects)} projects from previous survey catalog.")
print("Prev projects sample:", list(prev_projects.keys())[:5])

workspace = r"C:\Users\josh6\workspace"
entries = sorted(os.listdir(workspace))
exclude_dirs = {'AlphaCoreTech', '.agents', 'node_modules', '.git', 'venv', '.venv', 'env', '__pycache__', 'build', 'dist'}

current_projects = {}
for entry in entries:
    full_path = os.path.join(workspace, entry)
    if not os.path.isdir(full_path) or entry in exclude_dirs or entry.startswith('.'):
        continue

    py_count = 0
    for root, dirs, files in os.walk(full_path):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
        for f in files:
            if f.endswith('.py'):
                py_count += 1

    current_projects[entry] = py_count

new_projects = set(current_projects.keys()) - set(prev_projects.keys())
removed_projects = set(prev_projects.keys()) - set(current_projects.keys())

print("Newly added projects:", new_projects)
print("Removed projects:", removed_projects)

diff_counts = {}
for p in prev_projects:
    if p in current_projects:
        if prev_projects[p]['pythonFilesCount'] != current_projects[p]:
            diff_counts[p] = {'prev': prev_projects[p]['pythonFilesCount'], 'curr': current_projects[p]}

print("Updated py_file counts:", json.dumps(diff_counts, indent=2))
