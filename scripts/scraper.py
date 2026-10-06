import modal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import re
import json
import time
import html as html_lib
import concurrent.futures

from shared_app import app
web_app = FastAPI()

web_app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Build image with requests and beautifulsoup4 and local source
image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install('requests', 'beautifulsoup4', 'fastapi')
    .add_local_python_source("shared_app")
)

FB_APP_ID = '1342941991353756'
FB_APP_SECRET = 'a6ca1b29c5b8cff96e725df2564e807f'

session = requests.Session()
adapter = requests.adapters.HTTPAdapter(pool_connections=15, pool_maxsize=15, max_retries=2)
session.mount('https://', adapter)
session.headers.update({'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

def scrape_profile_page(profile_url):
    """Follow an individual arrest profile and extract structured fields."""
    try:
        req = session.get(profile_url, timeout=12)
        if req.status_code != 200:
            return None
        content = req.text

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

        slug_match = re.search(r'/fannin/([a-z0-9\-]+)/', profile_url)
        slug = slug_match.group(1) if slug_match else re.sub(r'[^a-zA-Z0-9]', '_', name.lower())

        return {
            'id': f"gazette_{slug}",
            'name': name.upper(),
            'charges': charges if charges else ['PENDING CHARGE DOCUMENTATION'],
            'bond': bond,
            'age': age,
            'created_time': booking_date or time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'full_picture': mugshot or '/Images/ALPHA-LOGO.png',
            'permalink_url': profile_url,
            'message': f"NAME: {name}\nCHARGES: {', '.join(charges)}\nBOOKING DATE: {booking_date}\nBOND: {bond}"
        }
    except Exception as e:
        print(f"Profile scrape failed for {profile_url}: {e}")
        return None

def scrape_listing_page(page_num):
    """Scrape a listing page and collect profile URLs."""
    url = 'https://thegeorgiagazette.com/fannin/' if page_num == 1 else f'https://thegeorgiagazette.com/fannin/page/{page_num}/'
    try:
        res = session.get(url, timeout=12)
        if res.status_code != 200:
            return []
        matches = list(set(re.findall(r'https://thegeorgiagazette\.com/fannin/([a-z0-9\-]+)/', res.text)))
        urls = [f'https://thegeorgiagazette.com/fannin/{m}/' for m in matches if m not in ['page', 'feed']]
        return urls
    except Exception as e:
        print(f"Listing page {page_num} failed: {e}")
        return []

@web_app.get('/api/mugshots')
def fetch_mugshots():
    # ---------------------------------------------------------
    # VECTOR 1: The Georgia Gazette — High Velocity Profile Scraper
    # ---------------------------------------------------------
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            listing_batches = list(executor.map(scrape_listing_page, range(1, 5)))

        all_urls = list(dict.fromkeys([u for batch in listing_batches for u in batch]))

        if all_urls:
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
                profiles = list(executor.map(scrape_profile_page, all_urls))

            valid_profiles = [p for p in profiles if p and p.get('name')]
            if len(valid_profiles) > 0:
                return {
                    'status': 'success',
                    'source': 'the_georgia_gazette',
                    'count': len(valid_profiles),
                    'data': valid_profiles
                }
    except Exception as e:
        print('Georgia Gazette scraping failed:', e)

    # ---------------------------------------------------------
    # VECTOR 2: Official Meta Graph API Fallback
    # ---------------------------------------------------------
    try:
        token_url = f'https://graph.facebook.com/oauth/access_token?client_id={FB_APP_ID}&client_secret={FB_APP_SECRET}&grant_type=client_credentials'
        token_res = requests.get(token_url, timeout=5).json()
        
        if 'access_token' in token_res:
            access_token = token_res['access_token']
            graph_url = f'https://graph.facebook.com/v19.0/FanninCountyCrime/posts?fields=id,message,created_time,full_picture,permalink_url,attachments{{media,subattachments,title,description}}&limit=100&access_token={access_token}'
            graph_res = requests.get(graph_url, timeout=8).json()
            
            if 'data' in graph_res and len(graph_res['data']) > 0:
                posts = graph_res['data']
                return {'status': 'success', 'source': 'graph_api', 'count': len(posts), 'data': posts}
    except Exception as e:
        print('Graph API Vector failed:', e)

    return {'status': 'error', 'message': 'All intel acquisition vectors failed', 'data': []}

@web_app.get('/api/sectorzero')
def fetch_sector_zero(query: str = ""):
    """Acquisition Matrix Scraper for Darkened State."""
    results = []
    
    def scrape_generic_tube(url, source_name, base_url):
        try:
            res = session.get(url, timeout=6)
            if res.status_code == 200:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(res.text, 'html.parser')
                links = soup.find_all('a', href=True)
                count = 0
                for a in links:
                    img = a.find('img')
                    if img and count < 8:
                        link = a['href']
                        if not link.startswith('http'):
                            link = base_url.rstrip('/') + '/' + link.lstrip('/')
                        thumb = img.get('data-src') or img.get('src')
                        title = img.get('alt') or img.get('title') or a.get('title') or ""
                        if not title:
                            title = a.text.strip()
                        
                        if thumb and len(link) > 10 and len(title) > 2:
                            if not any(r['url'] == link for r in results):
                                results.append({
                                    'title': title,
                                    'url': link,
                                    'thumb': thumb,
                                    'source': source_name
                                })
                                count += 1
        except Exception as e:
            print(f"[{source_name}] scrape error:", e)

    q_plus = query.replace(' ', '+')
    q_dash = query.replace(' ', '-')

    try:
        # 1. XVideos
        scrape_generic_tube(f"https://www.xvideos.com/?k={q_plus}", "xvideos", "https://www.xvideos.com")
        
        # 2. XNXX
        scrape_generic_tube(f"https://www.xnxx.com/search/{q_plus}", "xnxx", "https://www.xnxx.com")

        # 3. Leak-Sex-Tape
        scrape_generic_tube(f"https://leak-sex-tape.com/?s={q_plus}", "leak-sex-tape", "https://leak-sex-tape.com")

        # 4. Cums.net
        cums_url = f"https://cums.net/search/video/?s={q_plus}" if query else "https://cums.net/search/video/?s=real+incest&o=viewed"
        scrape_generic_tube(cums_url, "cums", "https://cums.net")

        # 5. Sick-r
        sickr_url = f"https://sick-r.com/search/{q_dash}/" if query else "https://sick-r.com/categories/incest/"
        scrape_generic_tube(sickr_url, "sick-r", "https://sick-r.com")

        # 6. MadnessPorn
        madness_url = f"https://madnessporn.com/search/{q_dash}/" if query else "https://madnessporn.com/channels/94/incest-porn/"
        scrape_generic_tube(madness_url, "madnessporn", "https://madnessporn.com")

        # 7. Forced.love
        forced_url = f"https://forced.love/search/{q_dash}/" if query else "https://forced.love/r/incest.html"
        scrape_generic_tube(forced_url, "forced.love", "https://forced.love")
        
        # 8. YouPorn
        scrape_generic_tube(f"https://www.youporn.com/search/?query={q_plus}", "youporn", "https://www.youporn.com")

        # 9. Taboosensations
        ts_url = f"https://taboosensations.com/search/{q_dash}/" if query else "https://taboosensations.com/"
        scrape_generic_tube(ts_url, "taboosensations", "https://taboosensations.com")

        # 10. Family-taboos
        ft_url = f"https://family-taboos.com/search/{q_dash}/" if query else "https://family-taboos.com/"
        scrape_generic_tube(ft_url, "family-taboos", "https://family-taboos.com")

        # 11. Tabooheat
        th_url = f"https://tabooheat.com/search/{q_dash}/" if query else "https://tabooheat.com/"
        scrape_generic_tube(th_url, "tabooheat", "https://tabooheat.com")

        # 12. Taboo-desires
        td_url = f"https://taboo-desires.com/search/{q_dash}/" if query else "https://taboo-desires.com/"
        scrape_generic_tube(td_url, "taboo-desires", "https://taboo-desires.com")

        # 13. 9vids
        scrape_generic_tube(f"https://9vids.com/search/{q_dash}/", "9vids", "https://9vids.com")

        # 14. Myfamilypies
        mfp_url = f"https://myfamilypies.com/search/{q_dash}/" if query else "https://myfamilypies.com/"
        scrape_generic_tube(mfp_url, "myfamilypies", "https://myfamilypies.com")

    except Exception as e:
        print("General scrape error:", e)

    if results:
        return {'status': 'success', 'count': len(results), 'data': results}
    return {'status': 'error', 'message': 'Acquisition failed', 'data': []}

@app.function(image=image, timeout=120)
@modal.asgi_app()
def Mugshots():
    return web_app


