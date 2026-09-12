import requests, re

r = requests.get('https://thegeorgiagazette.com/fannin/', headers={'User-Agent': 'Mozilla/5.0'})
links = re.findall(r'href="(https://thegeorgiagazette.com/[^"]+)"', r.text)
links = list(set(links))
fannin_links = [l for l in links if 'fannin' in l and '/page/' not in l and l != 'https://thegeorgiagazette.com/fannin/']
print('Total links:', len(links), 'Fannin links:', len(fannin_links))
for l in fannin_links[:10]:
    print(' *', l)
