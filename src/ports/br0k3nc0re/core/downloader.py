import requests
import os
from urllib.parse import urlparse
from datetime import datetime
from core.security_utils import secure_filename

class Downloader:
    def __init__(self, gallery_manager):
        self.gallery_manager = gallery_manager
        self.session = requests.Session()

    def download_to_sin_bin(self, url):
        """
        Downloads content from a URL and saves it to the "sin_bin" directory.
        It attempts to handle both direct media links and pages containing media.
        """
        import hashlib

        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = self.session.get(url, headers=headers, stream=True)
            response.raise_for_status()

            # Create a unique filename based on a safe hash of the URL
            parsed_url = urlparse(url)
            ext = os.path.splitext(parsed_url.path)[1]
            # Ensure the extension itself is safe (alphanumeric and dot)
            # secure_filename strips leading dots, so we re-add it if needed
            safe_ext = ""
            if ext:
                cleaned_ext = secure_filename(ext)
                if cleaned_ext:
                    safe_ext = f".{cleaned_ext}"

            url_hash = hashlib.sha256(url.encode('utf-8')).hexdigest()[:16]
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            filename = f"download_{timestamp}_{url_hash}{safe_ext}"
            
            # We don't know the extension for sure, so we save the raw content
            # and let the gallery manager handle it. A more robust solution
            # would inspect content-type headers.
            # Using the unique hash for the temp file prevents race conditions
            temp_path = os.path.join(self.gallery_manager.storage_dir, f"temp_download_{url_hash}")
            with open(temp_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            # Add the downloaded file to the private gallery (sin_bin)
            # We assume it's a video for now, but this could be more dynamic
            success, final_path = self.gallery_manager.add_video(temp_path, filename=filename)
            
            # The add_video method copies the file, so we can remove the temp file
            os.remove(temp_path)

            if success:
                print(f"Successfully downloaded and saved to {final_path}")
                return True, final_path
            else:
                print(f"Failed to save downloaded file to gallery: {final_path}")
                return False, final_path

        except requests.exceptions.RequestException as e:
            print(f"Error downloading content from {url}: {e}")
            return False, str(e)
