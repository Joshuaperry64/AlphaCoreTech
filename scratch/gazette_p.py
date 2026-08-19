import requests
import re
res = requests.get('https://thegeorgiagazette.com/fannin/james-parks-19/', headers={'User-Agent': 'Mozilla/5.0'})
html = res.text
matches = re.findall(r'<p>(.*?)</p>', html, re.DOTALL)
for m in matches:
    print(re.sub(r'<[^>]+>', '', m).strip())
