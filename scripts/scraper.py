import modal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import re
import json
import time

from shared_app import app
web_app = FastAPI()

web_app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Build image with Playwright dependencies
image = (
    modal.Image.debian_slim()
    .pip_install('requests', 'beautifulsoup4', 'fastapi', 'playwright')
    .run_commands('playwright install-deps', 'playwright install chromium')
)

FB_APP_ID = '1342941991353756'
FB_APP_SECRET = 'a6ca1b29c5b8cff96e725df2564e807f'

@web_app.get('/api/mugshots')
def fetch_mugshots():
    posts = []
    
    # ---------------------------------------------------------
    # VECTOR 1: Official Meta Graph API
    # ---------------------------------------------------------
    try:
        token_url = f'https://graph.facebook.com/oauth/access_token?client_id={FB_APP_ID}&client_secret={FB_APP_SECRET}&grant_type=client_credentials'
        token_res = requests.get(token_url, timeout=5).json()
        
        if 'access_token' in token_res:
            access_token = token_res['access_token']
            graph_url = f'https://graph.facebook.com/v19.0/FanninCountyCrime/posts?fields=id,message,created_time,full_picture,permalink_url,attachments{{media,subattachments,title,description}}&limit=100&access_token={access_token}'
            graph_res = requests.get(graph_url, timeout=10).json()
            
            if 'data' in graph_res and len(graph_res['data']) > 0:
                posts = graph_res['data']
                return {'status': 'success', 'source': 'graph_api', 'count': len(posts), 'data': posts}
    except Exception as e:
        print('Graph API Vector failed:', e)
        pass 

    # ---------------------------------------------------------
    # VECTOR 2: Headless Chromium Facebook Scraper (Playwright)
    # ---------------------------------------------------------
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            page.goto('https://www.facebook.com/FanninCountyCrime', wait_until='networkidle', timeout=25000)
            
            # Aggressive Deep Scroll Engine (Reach ~6 months back)
            for _ in range(15):
                # Attempt to close login/cookie walls
                try: page.click('div[aria-label="Close"]', timeout=100)
                except: pass
                page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                time.sleep(1.5)
            
            html = page.content()
            browser.close()
            
            # Parse full DOM
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            
            # Find all text blocks that look like Fannin arrest posts
            text_blocks = soup.find_all('div', attrs={'dir': 'auto', 'style': 'text-align: start;'})
            
            for i, text_div in enumerate(text_blocks):
                clean_text = text_div.get_text(separator='\n').strip()
                if clean_text and len(clean_text) > 15 and ('booked for' in clean_text.lower() or 'charge' in clean_text.lower() or 'hold' in clean_text.lower()):
                    safe_id = f'fb_{i}_{re.sub(r"[^a-zA-Z0-9]", "_", clean_text[:20])}'
                    
                    # Try to find nearest image
                    img_url = '/Images/ALPHA-LOGO.png'
                    parent = text_div.find_parent('div', role='article')
                    if parent:
                        img_tag = parent.find('img', src=re.compile('scontent'))
                        if img_tag:
                            img_url = img_tag['src'].replace('&amp;', '&')
                    
                    posts.append({
                        'id': safe_id,
                        'message': clean_text,
                        'full_picture': img_url,
                        'created_time': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                        'permalink_url': 'https://www.facebook.com/FanninCountyCrime'
                    })

        if len(posts) > 0:
            return {'status': 'success', 'source': 'playwright_scraper', 'count': len(posts), 'data': posts}

    except Exception as e:
        print('Playwright Vector failed:', e)
        pass
        
    # ---------------------------------------------------------
    # VECTOR 3: The Georgia Gazette — Full Profile Scraper
    # Scrapes listing pages then follows each profile URL to
    # extract actual structured charge data per person.
    # ---------------------------------------------------------
    try:
        from bs4 import BeautifulSoup
        import concurrent.futures

        def scrape_profile_page(profile_url):
            """Follow an individual arrest profile and extract structured fields."""
            try:
                res = requests.get(profile_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=12)
                if res.status_code != 200:
                    return {}
                soup = BeautifulSoup(res.text, 'html.parser')

                name = ''
                age = ''
                bond = ''
                booking_date = ''
                charges = []
                img_url = ''

                # -- Name --
                h1 = soup.find('h1')
                if h1:
                    name = h1.get_text(strip=True)

                # -- Mugshot image --
                img_tag = soup.find('img', class_=re.compile('mugshot|arrest|booking', re.I))
                if not img_tag:
                    img_tag = soup.find('img', src=re.compile(r'\.(jpg|jpeg|png|webp)', re.I))
                if img_tag:
                    img_url = img_tag.get('data-src') or img_tag.get('src') or ''

                # -- Structured metadata rows --
                text = soup.get_text(separator='\n')
                for line in text.split('\n'):
                    line = line.strip()
                    lower = line.lower()
                    if re.match(r'age\s*[:\-]', lower):
                        m = re.search(r'\d+', line)
                        if m:
                            age = m.group()
                    elif re.match(r'bond\s*[:\-]', lower):
                        bond = re.sub(r'bond\s*[:\-]\s*', '', line, flags=re.I).strip()
                    elif re.match(r'(booking|arrest)\s*date\s*[:\-]', lower):
                        booking_date = re.sub(r'(booking|arrest)\s*date\s*[:\-]\s*', '', line, flags=re.I).strip()

                # -- Charges: look for "Reason(s) For Booking" block or labeled charge rows --
                booking_section = re.search(
                    r'Reason\(?s?\)?\s*For\s*Booking[:\s]*(.*?)(?=\n\n|\Z)',
                    text, re.IGNORECASE | re.DOTALL
                )
                if booking_section:
                    raw_charges = booking_section.group(1).strip()
                    charges = [c.strip() for c in re.split(r'[\n;,]+', raw_charges) if c.strip() and len(c.strip()) > 3]
                
                if not charges:
                    # Fallback: grab any li items or lines mentioning legal keywords
                    charge_keywords = re.compile(
                        r'(felony|misdemeanor|assault|battery|theft|dui|drug|possession|warrant|burglary|trafficking|probation|murder|robbery|fraud|trespass|disorderly|resist|flee)',
                        re.I
                    )
                    for li in soup.find_all('li'):
                        t = li.get_text(strip=True)
                        if charge_keywords.search(t):
                            charges.append(t)
                    if not charges:
                        for line in text.split('\n'):
                            line = line.strip()
                            if charge_keywords.search(line) and len(line) > 8 and len(line) < 200:
                                charges.append(line)

                return {
                    'name': name,
                    'age': age,
                    'bond': bond,
                    'booking_date': booking_date,
                    'charges': list(dict.fromkeys(charges))[:10],  # dedupe, cap at 10
                    'img_url': img_url,
                }
            except Exception as e:
                print(f'Profile scrape failed for {profile_url}: {e}')
                return {}

        def scrape_gazette_listing(page_num):
            """Scrape a listing page and collect profile URLs + basic metadata."""
            url = 'https://thegeorgiagazette.com/fannin/' if page_num == 1 else f'https://thegeorgiagazette.com/fannin/page/{page_num}/'
            page_posts = []
            try:
                res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
                if res.status_code != 200:
                    return []
                soup = BeautifulSoup(res.text, 'html.parser')
                for art in soup.find_all('article'):
                    img_tag = art.find('img')
                    img_url = ''
                    if img_tag:
                        img_url = img_tag.get('data-src') or img_tag.get('src') or ''
                    title_h2 = art.find('h2')
                    if title_h2 and title_h2.find('a'):
                        a_tag = title_h2.find('a')
                        name = a_tag.text.strip()
                        link = a_tag['href']
                        if len(name.split()) <= 5 and 'health inspection' not in name.lower():
                            date_el = art.find('time')
                            created = date_el['datetime'] if date_el and date_el.get('datetime') else time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                            safe_id = re.sub(r'[^a-zA-Z0-9]', '_', name.lower())
                            page_posts.append({
                                'id': f'gazette_{safe_id}_{page_num}',
                                'name': name,
                                'message': f'NAME: {name}\nSource: The Georgia Gazette',
                                'full_picture': img_url,
                                'created_time': created,
                                'permalink_url': link,
                            })
            except Exception as e:
                print(f'Gazette listing page {page_num} failed: {e}')
            return page_posts

        # Phase 1: Collect listing pages (15 pages ≈ 150-200 records)
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            listing_results = list(executor.map(scrape_gazette_listing, range(1, 16)))

        for batch in listing_results:
            posts.extend(batch)

        print(f'Gazette: collected {len(posts)} profiles from listings, now fetching charge details...')

        # Phase 2: Follow each profile URL to get actual charges (parallel, capped)
        def enrich_post(post_item):
            profile_data = scrape_profile_page(post_item['permalink_url'])
            if profile_data:
                if profile_data.get('name'):
                    post_item['name'] = profile_data['name']
                if profile_data.get('charges'):
                    post_item['charges'] = profile_data['charges']
                if profile_data.get('age'):
                    post_item['age'] = profile_data['age']
                if profile_data.get('bond'):
                    post_item['bond'] = profile_data['bond']
                if profile_data.get('booking_date'):
                    post_item['created_time'] = profile_data['booking_date']
                if profile_data.get('img_url'):
                    post_item['full_picture'] = profile_data['img_url']
            return post_item

        with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
            enriched_posts = list(executor.map(enrich_post, posts))

        return {'status': 'success', 'source': 'gazette_full_profile', 'count': len(enriched_posts), 'data': enriched_posts}

    except Exception as e:
        return {'status': 'error', 'message': str(e), 'data': []}

@app.function(image=image, timeout=120)
@modal.asgi_app()
def Fannin_Scraper_API():
    return web_app
