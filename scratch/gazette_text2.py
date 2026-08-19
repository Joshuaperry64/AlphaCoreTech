import requests
import re
res = requests.get('https://thegeorgiagazette.com/fannin/james-parks-19/', headers={'User-Agent': 'Mozilla/5.0'})
html = res.text
text = re.sub(r'<[^>]+>', ' ', html)
print(" ".join(text.split())[:1000])
