import requests
import re
res = requests.get('https://thegeorgiagazette.com/fannin/james-parks-19/', headers={'User-Agent': 'Mozilla/5.0'})
html = res.text
# the charges are usually listed in a <p> tag inside the content
content = re.search(r'<div class="post56__content.*?>(.*?)</div>', html, re.DOTALL)
if content:
    text = re.sub(r'<[^>]+>', '\n', content.group(1))
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    print("\n".join(lines))
else:
    print("No content found")
