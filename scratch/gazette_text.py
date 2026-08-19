import requests
import re
res = requests.get('https://thegeorgiagazette.com/fannin/james-parks-19/', headers={'User-Agent': 'Mozilla/5.0'})
html = res.text
import bs4
soup = bs4.BeautifulSoup(html, 'html.parser')
print(soup.text[:2000])
