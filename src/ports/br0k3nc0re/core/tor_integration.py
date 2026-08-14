"""
Tor Integration for bR0k3nC0Re
Handles connection to Tor network for browsing and requests.
"""

import logging
import os
import subprocess
import urllib.parse
from typing import Optional, List, Tuple

import requests
from stem import Signal
from stem.control import Controller

logger = logging.getLogger("TOR_INTEGRATION")


class TorIntegration:
    """Tor browser and proxy integration"""

    def __init__(self, tor_port: int = 9050, control_port: int = 9051, tor_path: Optional[str] = None):
        self.tor_port = tor_port
        self.control_port = control_port
        self.tor_path = tor_path or self._find_tor_path()
        self.session = self._get_tor_session()
        self.is_available = self.check_tor_status()
        self.tor_process: Optional[subprocess.Popen] = None

    def _find_tor_path(self) -> Optional[str]:
        """Attempt to find Tor Browser executable"""
        # Common paths, add more as needed
        paths = [
            os.path.join(os.getcwd(), "tor", "Tor Browser", "Browser", "firefox.exe"),
            os.path.join(os.getcwd(), "tor", "Browser", "firefox.exe"),
            "C:\\Program Files\\Tor Browser\\Browser\\firefox.exe",
            "~/tor-browser/start-tor-browser.desktop",
            "/Applications/Tor Browser.app/Contents/MacOS/firefox"
        ]
        for path in paths:
            if os.path.exists(os.path.expanduser(path)):
                logger.info(f"Found Tor at: {path}")
                return path
        logger.warning("Tor Browser path not found, manual launch may be required.")
        return None

    def _get_tor_session(self) -> requests.Session:
        """Get a requests session configured for Tor proxy"""
        session = requests.Session()
        session.proxies = {
            'http': f'socks5h://localhost:{self.tor_port}',
            'https': f'socks5h://localhost:{self.tor_port}'
        }
        return session

    def check_tor_status(self) -> bool:
        """Check if Tor control port is open"""
        try:
            with Controller.from_port(port=self.control_port) as controller:
                controller.authenticate()
                logger.info("Tor connection successful.")
                return True
        except Exception as e:
            logger.warning(f"Tor connection failed: {e}")
            return False

    def test_connection(self) -> Tuple[bool, str]:
        """Test Tor connection and get exit node IP"""
        if not self.check_tor_status():
            return False, "Tor is not running or control port is not accessible."
        try:
            response = self.session.get("https://check.torproject.org/api/ip")
            response.raise_for_status()
            data = response.json()
            ip = data.get("IP")
            return True, f"Tor connection successful. Exit IP: {ip}"
        except Exception as e:
            return False, f"Tor test failed: {e}"

    def launch_browser(self, url: Optional[str] = None) -> bool:
        """Launch Tor Browser, optionally with a URL"""
        if not self.tor_path:
            logger.error("Tor Browser path not configured.")
            return False

        if url:
            try:
                parsed = urllib.parse.urlparse(url)
                if not all([parsed.scheme, parsed.netloc]) or parsed.scheme not in ['http', 'https']:
                    logger.error(f"Invalid URL provided: {url}")
                    return False

                # Reconstruct the URL to sanitize it and prevent any injection
                url = urllib.parse.urlunparse(parsed)
            except Exception as e:
                logger.error(f"Error parsing URL: {e}")
                return False

        try:
            command = [self.tor_path]
            if url:
                command.extend(["--new-window", url])
            self.tor_process = subprocess.Popen(command)
            logger.info(f"Launched Tor Browser with URL: {url}")
            return True
        except Exception as e:
            logger.error(f"Failed to launch Tor Browser: {e}")
            return False

    def stop_tor(self):
        """Stops the managed Tor Browser process if it's running."""
        if self.tor_process and self.tor_process.poll() is None:
            try:
                self.tor_process.terminate()
                self.tor_process.wait(timeout=5)
                logger.info("Tor Browser process terminated.")
            except subprocess.TimeoutExpired:
                self.tor_process.kill()
                logger.warning("Tor Browser process killed forcefully.")
            except Exception as e:
                logger.error(f"Error stopping Tor Browser process: {e}")
        self.tor_process = None

    def fetch_via_tor(self, url: str, timeout: int = 30) -> Tuple[bool, str]:
        """Fetch URL content through Tor"""
        if not self.is_available:
            return False, "Tor is not available."
        try:
            response = self.session.get(url, timeout=timeout)
            response.raise_for_status()
            return True, response.text
        except Exception as e:
            return False, f"Fetch failed: {e}"

    def generate_onion_urls(self, content_type: str, count: int = 10) -> List[str]:
        """
        This is a placeholder. In a real scenario, you would query a
        database or an API like ahmia.fi to find relevant .onion sites.
        For this application, we will generate plausible-looking but fake URLs.
        """
        base_chars = "abcdefghijklmnopqrstuvwxyz234567"
        import random
        urls = []
        for _ in range(count):
            domain = ''.join(random.choice(base_chars) for _ in range(56))
            urls.append(f"http://{domain}.onion")
        logger.info(f"Generated {count} mock onion URLs for '{content_type}'")
        return urls

    def renew_identity(self) -> bool:
        """Request a new Tor circuit and IP address"""
        if not self.check_tor_status():
            return False
        try:
            with Controller.from_port(port=self.control_port) as controller:
                controller.authenticate()
                controller.signal(Signal.NEWNYM)
                logger.info("Tor identity renewed.")
                return True
        except Exception as e:
            logger.error(f"Failed to renew Tor identity: {e}")
            return False

if __name__ == '__main__':
    # Example usage:
    tor = TorIntegration()
    status, message = tor.test_connection()
    logger.info(f"Test Connection: {status}, {message}")
    if status:
        # tor.launch_browser("https://check.torproject.org")
        urls = tor.generate_onion_urls("forums")
        logger.info(f"Generated URLs: {urls}")
        # status, content = tor.fetch_via_tor("https://check.torproject.org")
        # logger.info(f"Fetched content: {content[:100]}")
        tor.renew_identity()
        status, message = tor.test_connection()
        logger.info(f"Test Connection after renew: {status}, {message}")
