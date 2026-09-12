import requests, re

url = 'https://thegeorgiagazette.com/fannin/ashton-evans-2/'
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
print('Profile status:', r.status_code)
h1 = re.search(r'<h1[^>]*>(.*?)</h1>', r.text)
print('H1:', h1.group(1).strip() if h1 else 'None')
img = re.search(r'<img[^>]+src="([^"]+wp-content/uploads/[^"]+)"', r.text)
print('Mugshot:', img.group(1) if img else 'None')
text = re.sub(r'<[^>]+>', '\n', r.text)
for line in text.splitlines():
    l = line.strip()
    if any(k in l.lower() for k in ['charge', 'booking', 'bond', 'age', 'arrest']):
        print('  >', l[:100])
