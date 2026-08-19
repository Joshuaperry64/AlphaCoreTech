import requests
import re
import json
from datetime import datetime
import time
import os

URL = 'https://thegeorgiagazette.com/category/fannin/page/{}/'
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
TARGET_DATE = datetime(2025, 9, 18)

results = []
page = 1
running = True

print("Starting scraper...")
try:
    while running and page < 50:
        print(f"Scraping page {page}...")
        target_url = URL.format(page) if page > 1 else 'https://thegeorgiagazette.com/category/fannin/'
        res = requests.get(target_url, headers=HEADERS, timeout=10)
        
        if res.status_code != 200:
            print(f"Failed to fetch page {page}. Status code: {res.status_code}")
            break
        
        html = res.text
        # Extract all URLs that look like Fannin arrest posts
        links = re.findall(r'href="(https://thegeorgiagazette\.com/fannin/[^/]+/)"', html)
        if not links:
            print("No links found on page.")
            break
            
        print(f"Found {len(set(links))} unique links on page {page}.")
        for link in set(links):
            try:
                p_res = requests.get(link, headers=HEADERS, timeout=10)
                p_html = p_res.text
                
                date_match = re.search(r'Date of Booking:.*?</strong>\s*(?:<br>)?\s*(\d{2}/\d{2}/\d{4})', p_html, re.IGNORECASE)
                if not date_match:
                    continue
                    
                date_str = date_match.group(1)
                booking_date = datetime.strptime(date_str, '%m/%d/%Y')
                    
                if booking_date < TARGET_DATE:
                    print(f"Reached target date: {date_str}. Stopping.")
                    running = False
                    break
                    
                name_match = re.search(r'Name:.*?</strong>\s*(?:<br>)?\s*(.*?)\s*(?:</p>|<br>|<h)', p_html, re.IGNORECASE)
                name = name_match.group(1).replace('<[^>]+>', '').strip().upper() if name_match else 'UNKNOWN'
                
                charge_match = re.search(r'Reason\(s\) For Booking:.*?</strong>\s*(?:<br>)?\s*(.*?)\s*(?:</p>|<br>|<h)', p_html, re.IGNORECASE)
                charge = charge_match.group(1).replace('<[^>]+>', '').strip() if charge_match else 'PENDING REVIEW'
                
                img_match = re.search(r'<meta property="og:image" content="(.*?)"', p_html, re.IGNORECASE)
                img = img_match.group(1) if img_match else '/Images/ALPHA-LOGO.png'
                
                cat = 'MISDEMEANOR'
                c_low = charge.lower()
                if 'felony' in c_low or 'murder' in c_low or 'aggravated' in c_low or 'trafficking' in c_low:
                    cat = 'FELONY'
                elif 'warrant' in c_low or 'hold' in c_low:
                    cat = 'WARRANT'
                elif 'dui' in c_low or 'drugs' in c_low:
                    cat = 'DUI'
                    
                obj = {
                    'id': f'gazette_{int(time.time()*1000)}_{len(results)}',
                    'name': name,
                    'photoUrl': img,
                    'createdTime': booking_date.isoformat(),
                    'rawMessage': charge,
                    'charges': [charge],
                    'bond': 'Not Specified',
                    'age': 'N/A',
                    'category': cat,
                    'fbUrl': link
                }
                results.append(obj)
                print(f'Added {name} - {date_str}')
            except Exception as e:
                print(f"Error on {link}: {e}")
                
        page += 1

    print(f"Finished scraping. Total records: {len(results)}")
    archive_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'mugshots-archive.json')
    with open(archive_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
except Exception as e:
    print(f"Scraper crashed: {e}")
