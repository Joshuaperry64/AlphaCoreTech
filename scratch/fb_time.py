import requests
import re
import json

url1 = 'https://www.facebook.com/share/p/17y87grKpG/'
res = requests.get(url1, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}, timeout=10)
# facebook usually puts the publish time in a meta tag
time1 = re.search(r'"publish_time":"(.*?)"', res.text)
if not time1:
    time1 = re.search(r'creation_time&quot;:(\d+)', res.text)
print(time1.group(1) if time1 else 'None')
