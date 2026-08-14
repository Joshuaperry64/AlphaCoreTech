import requests
from bs4 import BeautifulSoup
import urllib.parse

class PornScraper:
    def __init__(self):
        # Flexible architecture for multiple targets
        self.targets = {
            "spankbang": {
                "search_url": "https://spankbang.com/s/{}/?o=all",
                "video_selector": "a.n",
                "base_domain": "https://spankbang.com"
            },
            "pornhub": {
                "search_url": "https://www.pornhub.com/video/search?search={}",
                "video_selector": "div.ph-video-block a.linkVideoThumb",
                "base_domain": "https://www.pornhub.com"
            }
        }
        self.active_target = "spankbang"
        self.session = requests.Session()

    def search(self, keywords):
        """
        Searches for content matching keywords across supported targets.
        Returns a list of direct page URLs.
        """
        results = []
        target = self.targets[self.active_target]
        # properly encode the search keywords before formatting them into the URL
        # replace spaces with hyphens as some target sites expect this format
        formatted_keywords = keywords.replace(' ', '-')
        safe_keywords = urllib.parse.quote(formatted_keywords)
        search_url = target["search_url"].format(safe_keywords)
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
            response = self.session.get(search_url, headers=headers, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find video links based on selector
            links = soup.select(target["video_selector"])

            for link in links:
                href = link.get('href')
                if href:
                    if href.startswith('/'):
                        results.append(target["base_domain"] + href)
                    elif href.startswith('http'):
                        results.append(href)

        except Exception as e:
            print(f"Error during scraping {self.active_target}: {e}")
        
        return results
