import requests
from bs4 import BeautifulSoup
import json

res = requests.get('https://thegeorgiagazette.com/fannin/', headers={'User-Agent': 'Mozilla/5.0'})
soup = BeautifulSoup(res.text, 'html.parser')
posts = []

# Find all articles
articles = soup.find_all('article')
for art in articles:
    img_tag = art.find('img')
    img_url = img_tag['src'] if img_tag else ''
    
    # Title link
    title_h3 = art.find('h3')
    if title_h3 and title_h3.find('a'):
        a_tag = title_h3.find('a')
        name = a_tag.text.strip()
        link = a_tag['href']
        
        # Exclude random news articles, only keep mugshots (usually just names)
        if len(name.split()) <= 4 and 'health inspection' not in name.lower():
            posts.append({
                'name': name,
                'img': img_url,
                'link': link
            })

print(f"Found {len(posts)} records")
print(json.dumps(posts[:3], indent=2))
