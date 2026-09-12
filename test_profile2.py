import requests, re

url = 'https://thegeorgiagazette.com/fannin/ashton-evans-2/'
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
text = r.text

h1 = re.search(r'<h1[^>]*>(.*?)</h1>', text)
name = h1.group(1).strip() if h1 else ''

img = re.search(r'<img[^>]+src="([^"]+wp-content/uploads/[^"]+\.jpg)"', text)
img_url = img.group(1) if img else ''

booking_match = re.search(r'Date of Booking:\s*</strong\s*>\s*([^<]+)', text, re.I)
if not booking_match:
    booking_match = re.search(r'Date of Booking:\s*([^\n<]+)', text, re.I)
booking_date = booking_match.group(1).strip() if booking_match else ''

charges = []
charges_match = re.search(r'Reason\(?s?\)?\s*For\s*Booking:\s*</strong\s*>\s*(.*?)(?=<p|<h|Date of Release)', text, re.I | re.DOTALL)
if charges_match:
    clean_charges = re.sub(r'<[^>]+>', '\n', charges_match.group(1))
    charges = [c.strip() for c in clean_charges.splitlines() if c.strip() and len(c.strip()) > 3]

print('Name:', name)
print('Booking Date:', booking_date)
print('Charges:', charges)
print('Img:', img_url)
