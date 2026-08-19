import requests
from bs4 import BeautifulSoup
import re

url1 = 'https://www.facebook.com/share/p/17y87grKpG/'
res = requests.get(url1, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}, timeout=10)
print(f"URL1: {res.status_code}")
soup = BeautifulSoup(res.text, 'html.parser')
title = soup.find('title')
print(f"Title 1: {title.text if title else 'None'}")

url2 = 'https://www.facebook.com/share/p/1DaXEKTFaP/'
res2 = requests.get(url2, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}, timeout=10)
print(f"URL2: {res2.status_code}")
soup2 = BeautifulSoup(res2.text, 'html.parser')
title2 = soup2.find('title')
print(f"Title 2: {title2.text if title2 else 'None'}")
