import requests, re

r = requests.get('https://thegeorgiagazette.com/fannin/', headers={'User-Agent': 'Mozilla/5.0'})
links = re.findall(r'<a[^>]+href="(https://thegeorgiagazette.com/fannin/[^"/]+/?)"[^>]*>(.*?)</a>', r.text, re.DOTALL)
print('Total /fannin/ links found:', len(links))
for href, inner in links:
    clean_inner = re.sub(r'<[^>]+>', '', inner).strip()
    if clean_inner and len(clean_inner.split()) <= 5 and 'health' not in clean_inner.lower() and clean_inner.lower() != 'fannin county':
        print(f"  Name: {clean_inner} -> {href}")
