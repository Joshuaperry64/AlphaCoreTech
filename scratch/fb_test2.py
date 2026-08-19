import requests
import re

url1 = 'https://www.facebook.com/share/p/17y87grKpG/'
res = requests.get(url1, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}, timeout=10)
title = re.search(r'<title>(.*?)</title>', res.text)
print(f"Title 1: {title.group(1) if title else 'None'}")

url2 = 'https://www.facebook.com/share/p/1DaXEKTFaP/'
res2 = requests.get(url2, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}, timeout=10)
title2 = re.search(r'<title>(.*?)</title>', res2.text)
print(f"Title 2: {title2.group(1) if title2 else 'None'}")
