import urllib.request
import re
import html as html_lib
import concurrent.futures
import time

def scrape_profile(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode('utf-8')
        
        # Name
        h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
        name = html_lib.unescape(h1_match.group(1).strip()) if h1_match else ''
        
        # Mugshot Image
        imgs = re.findall(r'<img[^>]+(?:src|data-src)=["\']([^"\']+)["\']', content)
        mugshot = ''
        for img in imgs:
            if 'wp-content/uploads' in img and not any(x in img.lower() for x in ['logo', 'icon', 'advert', 'banner']):
                mugshot = img
                break
        
        # Text extraction for fields
        clean = re.sub(r'<script.*?</script>', '', content, flags=re.DOTALL | re.IGNORECASE)
        clean = re.sub(r'<style.*?</style>', '', clean, flags=re.DOTALL | re.IGNORECASE)
        clean = re.sub(r'<[^>]+>', '\n', clean)
        lines = [html_lib.unescape(l.strip()) for l in clean.split('\n') if l.strip()]
        
        booking_date = ''
        charges = []
        age = 'N/A'
        bond = 'Not Specified'
        
        for i, l in enumerate(lines):
            low = l.lower()
            if 'date of booking' in low and i + 1 < len(lines):
                booking_date = lines[i+1].strip()
            elif 'reason(s) for booking' in low and i + 1 < len(lines):
                for j in range(i + 1, min(len(lines), i + 6)):
                    ch = lines[j].strip()
                    if ch.lower().startswith(('premium', 'keep scrolling', 'sign up', 'read the news', '©', 'all rights')):
                        break
                    if len(ch) > 2:
                        charges.append(ch)
            elif low.startswith('age:') or low.startswith('age -'):
                m = re.search(r'\d+', l)
                if m: age = m.group(0)
            elif 'bond:' in low:
                bond = re.sub(r'bond\s*[:\-]\s*', '', l, flags=re.I).strip()
        
        slug_match = re.search(r'/fannin/([a-z0-9\-]+)/', url)
        slug = slug_match.group(1) if slug_match else re.sub(r'[^a-zA-Z0-9]', '_', name.lower())

        return {
            'id': f"gazette_{slug}",
            'name': name.upper(),
            'charges': charges if charges else ['PENDING CHARGE DOCUMENTATION'],
            'bond': bond,
            'age': age,
            'created_time': booking_date or time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'full_picture': mugshot or '/Images/ALPHA-LOGO.png',
            'permalink_url': url,
            'message': f"NAME: {name}\nCHARGES: {', '.join(charges)}\nBOOKING DATE: {booking_date}\nBOND: {bond}"
        }
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None

def scrape_listing(page):
    url = f'https://thegeorgiagazette.com/fannin/' if page == 1 else f'https://thegeorgiagazette.com/fannin/page/{page}/'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8')
            matches = list(set(re.findall(r'https://thegeorgiagazette\.com/fannin/([a-z0-9\-]+)/', html)))
            urls = [f'https://thegeorgiagazette.com/fannin/{m}/' for m in matches if m not in ['page', 'feed']]
            return urls
    except Exception as e:
        print(f"Listing page {page} failed: {e}")
        return []

t0 = time.time()
print("Starting multi-page benchmark...")

# Step 1: 5 listing pages
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
    listing_batches = list(ex.map(scrape_listing, range(1, 6)))

all_urls = list(dict.fromkeys([u for batch in listing_batches for u in batch]))
print(f"Found {len(all_urls)} unique profile URLs in {time.time() - t0:.2f}s")

# Step 2: enrich profiles
t1 = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
    profiles = list(ex.map(scrape_profile, all_urls))

valid_profiles = [p for p in profiles if p and p.get('name')]
print(f"Enriched {len(valid_profiles)} profiles in {time.time() - t1:.2f}s")
print(f"Total time elapsed: {time.time() - t0:.2f}s")
if valid_profiles:
    print("Sample record:", valid_profiles[0])





# Text content lines
# Strip tags
clean_text = re.sub(r'<script.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
clean_text = re.sub(r'<style.*?</style>', '', clean_text, flags=re.DOTALL | re.IGNORECASE)
clean_text = re.sub(r'<[^>]+>', '\n', clean_text)
lines = [l.strip() for l in clean_text.split('\n') if l.strip()]

for i, l in enumerate(lines):
    if 'reason(s) for booking' in l.lower() or 'date of booking' in l.lower() or 'age' in l.lower() or 'bond' in l.lower():
        print("---")
        for j in range(max(0, i-1), min(len(lines), i+5)):
            print(f"[{j}] {lines[j]}")


