"""
SSH Manager for tunneling and remote command execution.
This is a recreated module based on its usage in sd_service.py.
It uses the 'sshtunnel' library to create an SSH tunnel.
"""

import logging
from threading import Thread
from sshtunnel import SSHTunnelForwarder

logger = logging.getLogger(__name__)

class SSHManager:
    def __init__(self, settings_manager):
        self.settings_manager = settings_manager
        self.server: SSHTunnelForwarder = None
        self.status_callback = None
        self._load_settings()

    def _load_settings(self):
        self.ssh_host = self.settings_manager.get("ssh_host")
        self.ssh_port = self.settings_manager.get("ssh_port", 22)
        self.ssh_user = self.settings_manager.get("ssh_user")
        self.ssh_pass = self.settings_manager.get("ssh_pass") # Can be password or path to key
        self.remote_bind_address = self.settings_manager.get("remote_bind_address", '127.0.0.1')
        self.remote_port = self.settings_manager.get("remote_port", 7860)
        self.local_bind_address = self.settings_manager.get("local_bind_address", '127.0.0.1')
        self.local_port = self.settings_manager.get("local_port", 7861)

    def _update_status(self, message):
        if self.status_callback:
            self.status_callback(message)
        logger.info(message)

    def connect_and_get_gradio_link(self) -> str:
        if not all([self.ssh_host, self.ssh_user, self.ssh_pass]):
            self._update_status("SSH credentials are not fully configured.")
            return None

        try:
            self._update_status(f"Connecting to {self.ssh_host}...")
            self.server = SSHTunnelForwarder(
                (self.ssh_host, self.ssh_port),
                ssh_username=self.ssh_user,
                ssh_password=self.ssh_pass, # Note: sshtunnel can also use key files
                remote_bind_address=(self.remote_bind_address, self.remote_port),
                local_bind_address=(self.local_bind_address, self.local_port)
            )

            # Start the tunnel in a separate thread
            self.thread = Thread(target=self.server.start)
            self.thread.daemon = True
            self.thread.start()
            
            # Give it a moment to establish the connection
            # A more robust implementation would check the server's is_active property in a loop
            import time
            time.sleep(5) 

            if self.server.is_active:
                url = f"http://{self.local_bind_address}:{self.local_port}"
                self._update_status(f"SSH tunnel established. Remote Gradio UI is available at: {url}")
                return url
            else:
                self._update_status("Failed to establish SSH tunnel.")
                return None

        except Exception as e:
            self._update_status(f"SSH connection failed: {e}")
            logger.error(f"SSH connection failed: {e}", exc_info=True)
            return None

    def disconnect(self):
        if self.server and self.server.is_active:
            self._update_status("Disconnecting SSH tunnel...")
            self.server.stop()
            self.server = None
            self._update_status("SSH tunnel closed.")

    def get_url(self) -> str:
        if self.server and self.server.is_active:
            return f"http://{self.local_bind_address}:{self.local_port}"
        return None
