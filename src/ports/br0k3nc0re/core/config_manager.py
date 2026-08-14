"""
Configuration Manager for bR0k3nC0Re - Cyberpunk Edition
Handles loading, saving, and managing application configuration settings
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger("CONFIG")


class ConfigManager:
    """
    Handles application configuration settings and persistence
    """
    
    DEFAULT_CONFIG = {
        "api_key": "",
        "api_keys": [],
        "model_name": "gemini-2.5-pro",
        "model": "gemini-2.5-pro",
        "api_url": "https://generativelanguage.googleapis.com",
        "ai_provider": "gemini",
        "model_type": "api",  # "api" or "local"
        "provider_api_keys": {
            "gemini": [""],
            "ollama": ["ea02827fb3644f07be8533b0b74a8f35.hHTFBFQ6lu4IZHs-wREED9J8"],
            "openai": [""],
            "mistral": [""],
            "huggingface": [""]
        },
        "lm_studio_models_path": "C:\\Users\\josh6\\.lmstudio\\models",
        "ollama_models_path": "",
        "theme": "cyberpunk_neon",
        "fullscreen": True,
        "enable_animations": True,
        "animations": True,
        "system_directive_path": None,
        "auto_save": True,
        "auto_save_interval": 300,  # 5 minutes
        "font_size": 14,
        "enable_sound_effects": True,
        "enable_voice_input": False,
        "enable_voice_output": False,
        "last_active_character": None,
        "interface_language": "en",
        "show_typing_animation": True,
        "debug_mode": False,
        "storage_dir": "",
        "autosave": True,
        "export_format": "json",
        "runpod_api_key": "rpa_FL8PCOIP0N9KR5NAKQJMENRKG2ML2QGEYDB4WOMO1kffje",
        "runpod_endpoint_id": "67ufiqwve90z7o",
        "comfyui_workflow_file": "config/workflow_api.json",
        "active_character_id": None,
        "prompt_reframer_model": "gemini-2.5-flash",
        "runpod_generation_settings": {},
        "comfyui_workflow_id": "",
        "comfyui_nsfw_workflow_id": ""
    }
    def get_api_keys(self) -> list:
        """Return the list of API keys, falling back to single api_key if needed."""
        keys = self.config.get("api_keys", [])
        if not keys and self.config.get("api_key"):
            return [self.config["api_key"]]
        return keys

    def set_api_keys(self, keys: list):
        self.config["api_keys"] = keys
        self.save_config()

    from typing import Optional, Set
    def get_next_api_key(self, exhausted_keys: Optional[set] = None) -> Optional[str]:
        """Return the next available API key not in exhausted_keys."""
        keys = self.get_api_keys()
        if exhausted_keys is None:
            exhausted_keys = set()
        for key in keys:
            if key not in exhausted_keys:
                return key
        return None
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize configuration manager
        
        Args:
            config_path: Optional path to config file. If None, uses default location
        """
        self.root_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.config_path = config_path or os.path.join(self.root_path, "config", "config.json")
        self.config = self.DEFAULT_CONFIG.copy()
        
        # Load existing config if available first
        self.load_config()
        
        # Then load API keys from .env file to override empties
        self._load_env_keys()
        
        # Save updated config with .env keys
        self.save_config()
    
    def _load_env_keys(self):
        """Load API keys from .env file"""
        env_keys = {
            "gemini": os.getenv("GEMINI_API_KEY"),
            "openai": os.getenv("OPENAI_API_KEY"),
            "mistral": os.getenv("MISTRAL_API_KEY"),
            "huggingface": os.getenv("HUGGINGFACE_API_KEY"),
            "runpod": os.getenv("RUNPOD_API_KEY")
        }
        
        # Load RunPod workflow IDs
        comfyui_workflow = os.getenv("COMFYUI_WORKFLOW_ID")
        comfyui_nsfw_workflow = os.getenv("COMFYUI_NSFW_WORKFLOW_ID")
        
        if comfyui_workflow and comfyui_workflow != "your_comfyui_workflow_id_here":
            self.config["comfyui_workflow_id"] = comfyui_workflow
        
        if comfyui_nsfw_workflow and comfyui_nsfw_workflow != "your_nsfw_workflow_id_here":
            self.config["comfyui_nsfw_workflow_id"] = comfyui_nsfw_workflow
        
        # Initialize provider_api_keys if not exists
        if "provider_api_keys" not in self.config:
            self.config["provider_api_keys"] = {}
        
        # Remove old anthropic key if present
        if "anthropic" in self.config["provider_api_keys"]:
            del self.config["provider_api_keys"]["anthropic"]
        
        # Add to config if found in .env, overriding empty strings
        for provider, key in env_keys.items():
            if key and key != f"your_{provider}_api_key_here":
                logger.info(f"Processing {provider} key from .env: {key[:20]}...")
                
                if provider == "gemini":
                    self.config["api_key"] = key
                    if key not in self.config.get("api_keys", []):
                        self.config.setdefault("api_keys", []).append(key)
                
                # Store RunPod API key
                if provider == "runpod":
                    self.config["runpod_api_key"] = key
                
                # Store provider-specific keys in provider_api_keys dictionary
                if provider in ["gemini", "openai", "mistral", "huggingface", "ollama"]:
                    if provider not in self.config["provider_api_keys"]:
                        self.config["provider_api_keys"][provider] = []
                    # Replace if empty or add if not present
                    existing = self.config["provider_api_keys"][provider]
                    logger.info(f"Existing keys for {provider}: {existing}")
                    if not existing or (len(existing) == 1 and existing[0] == ""):
                        self.config["provider_api_keys"][provider] = [key]
                        logger.info(f"Replaced empty keys for {provider} with .env key")
                    elif key not in existing:
                        self.config["provider_api_keys"][provider].append(key)
                        logger.info(f"Added .env key to {provider}")
        
        logger.info(f"Loaded API keys from .env for providers: {[k for k, v in env_keys.items() if v]}")
    
    def _update_env_file(self):
        """Update .env file with current API keys from config"""
        try:
            env_path = os.path.join(self.root_path, ".env")
            
            # Read existing .env content
            env_lines = []
            if os.path.exists(env_path):
                with open(env_path, 'r', encoding='utf-8') as f:
                    env_lines = f.readlines()
            
            # Prepare key mappings
            env_key_map = {
                "gemini": "GEMINI_API_KEY",
                "openai": "OPENAI_API_KEY",
                "mistral": "MISTRAL_API_KEY",
                "huggingface": "HUGGINGFACE_API_KEY",
                "runpod": "RUNPOD_API_KEY"
            }
            
            # Track which keys we've updated
            updated_keys = set()
            
            # Update existing lines
            for i, line in enumerate(env_lines):
                line_stripped = line.strip()
                if not line_stripped or line_stripped.startswith('#'):
                    continue
                
                for provider, env_key in env_key_map.items():
                    if line_stripped.startswith(f"{env_key}="):
                        # Get the first key for this provider
                        keys = self.get_provider_api_keys(provider) if provider != "runpod" else []
                        if provider == "runpod":
                            key = self.config.get("runpod_api_key", "")
                        else:
                            key = keys[0] if keys else ""
                        
                        if key:
                            env_lines[i] = f"{env_key}={key}\n"
                            logger.info(f"Updated {env_key} in .env")
                        updated_keys.add(env_key)
                        break
            
            # Add workflow IDs
            workflow_keys = {
                "COMFYUI_WORKFLOW_ID": self.config.get("comfyui_workflow_id", ""),
                "COMFYUI_NSFW_WORKFLOW_ID": self.config.get("comfyui_nsfw_workflow_id", "")
            }
            
            for workflow_key, workflow_value in workflow_keys.items():
                found = False
                for i, line in enumerate(env_lines):
                    if line.strip().startswith(f"{workflow_key}="):
                        if workflow_value:
                            env_lines[i] = f"{workflow_key}={workflow_value}\n"
                        found = True
                        updated_keys.add(workflow_key)
                        break
                
                # Add if not found
                if not found and workflow_value:
                    env_lines.append(f"{workflow_key}={workflow_value}\n")
                    updated_keys.add(workflow_key)
            
            # Add missing keys
            for provider, env_key in env_key_map.items():
                if env_key not in updated_keys:
                    keys = self.get_provider_api_keys(provider) if provider != "runpod" else []
                    if provider == "runpod":
                        key = self.config.get("runpod_api_key", "")
                    else:
                        key = keys[0] if keys else ""
                    
                    if key:
                        env_lines.append(f"{env_key}={key}\n")
                        logger.info(f"Added {env_key} to .env")
            
            # Write back to .env
            with open(env_path, 'w', encoding='utf-8') as f:
                f.writelines(env_lines)
            
            logger.info("Updated .env file with current API keys")
            
        except Exception as e:
            logger.error(f"Failed to update .env file: {e}")
        
    def load_config(self) -> bool:
        """
        Load configuration from file
        
        Returns:
            bool: True if loaded successfully, False otherwise
        """
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    loaded_config = json.load(f)

                    # Merge loaded config on top of defaults.
                    # NOTE: We intentionally keep unknown keys to avoid silently
                    # dropping settings added by new versions (e.g. RunPod).
                    if isinstance(loaded_config, dict):
                        self.config.update(loaded_config)

                    # Back-compat: if legacy ComfyUI workflow id exists but RunPod
                    # endpoint id is missing, mirror it.
                    if not self.config.get("runpod_endpoint_id") and self.config.get("comfyui_workflow_id"):
                        self.config["runpod_endpoint_id"] = self.config["comfyui_workflow_id"]
                            
                logger.info(f"Configuration loaded from {self.config_path}")
                return True
            else:
                logger.info("Configuration file not found, using defaults")
                self.save_config()  # Save default config
                return False
                
        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            return False
            
    def save_config(self) -> bool:
        """
        Save configuration to file and update .env
        
        Returns:
            bool: True if saved successfully, False otherwise
        """
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2)
                
            logger.info(f"Configuration saved to {self.config_path}")
            
            # Update .env file with API keys
            self._update_env_file()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to save configuration: {e}")
            return False
            
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get configuration value
        
        Args:
            key: The configuration key to retrieve
            default: Default value if key not found
            
        Returns:
            The configuration value or default
        """
        return self.config.get(key, default)
        
    def set(self, key: str, value: Any) -> None:
        """
        Set configuration value
        
        Args:
            key: The configuration key to set
            value: The value to set
        """
        self.config[key] = value
        
    def update(self, config_dict: Dict[str, Any]) -> None:
        """
        Update multiple configuration values at once
        
        Args:
            config_dict: Dictionary of config keys and values to update
        """
        for key, value in config_dict.items():
            self.config[key] = value

    def set_settings(self, settings: Dict[str, Any]) -> None:
        """Convenience method to update settings and save immediately."""
        # Maintain compatibility between keys
        if "model" in settings:
            settings["model_name"] = settings["model"]
        self.update(settings)
        self.save_config()
            
    def get_all(self) -> Dict[str, Any]:
        """
        Get all configuration values
        
        Returns:
            Dict[str, Any]: Dictionary of all configuration values
        """
        return self.config.copy()
        
    def reset_to_defaults(self) -> None:
        """Reset all configuration to default values"""
        self.config = self.DEFAULT_CONFIG.copy()
        self.save_config()
        
    def get_theme_settings(self) -> Dict[str, Any]:
        """
        Get theme-specific settings
        
        Returns:
            Dict[str, Any]: Theme settings including colors and styles
        """
        theme_name = self.get("theme", "cyberpunk-dark")
        
        # Define theme settings
        themes = {
            "cyberpunk-dark": {
                "primary_color": "#00FFFF",  # Cyan
                "secondary_color": "#FF00FF",  # Magenta
                "background_color": "#121212",  # Dark
                "text_color": "#E0E0E0",  # Light grey
                "accent_color": "#FFA500",  # Orange
                "highlight_color": "#00FF00",  # Green
                "user_message_color": "#00BFFF",  # Deep sky blue
                "ai_message_color": "#FF6347",  # Tomato red
                "font_family": "Rajdhani, 'Segoe UI', sans-serif",
                "border_style": "1px solid #33C7FF",
                "ui_blur_amount": "5px",
                "ui_glow_effect": "0 0 10px rgba(0, 255, 255, 0.7)",
                "button_style": "gradient",
                "button_gradient": "linear-gradient(45deg, #00C9FF, #92FE9D)"
            },
            "cyberpunk-neon": {
                "primary_color": "#FF00FF",  # Magenta
                "secondary_color": "#00FF00",  # Green
                "background_color": "#0D0221",  # Deep blue-black
                "text_color": "#F0F0F0",  # Off-white
                "accent_color": "#FFFF00",  # Yellow
                "highlight_color": "#00FFFF",  # Cyan
                "user_message_color": "#FF9E00",  # Orange
                "ai_message_color": "#FF3864",  # Pink-red
                "font_family": "Orbitron, 'Segoe UI', sans-serif",
                "border_style": "2px solid #FF00FF",
                "ui_blur_amount": "8px",
                "ui_glow_effect": "0 0 15px rgba(255, 0, 255, 0.8)",
                "button_style": "neon",
                "button_gradient": "linear-gradient(45deg, #FF00FF, #00FF00)"
            },
            "cyberpunk-corporate": {
                "primary_color": "#3E92CC",  # Blue
                "secondary_color": "#FF5A5F",  # Coral
                "background_color": "#1B1B1B",  # Dark grey
                "text_color": "#C8C8C8",  # Light grey
                "accent_color": "#FFD700",  # Gold
                "highlight_color": "#2ED9C3",  # Teal
                "user_message_color": "#4A90E2",  # Blue
                "ai_message_color": "#50C878",  # Emerald
                "font_family": "Inconsolata, Consolas, monospace",
                "border_style": "1px solid #3E92CC",
                "ui_blur_amount": "3px",
                "ui_glow_effect": "0 0 5px rgba(62, 146, 204, 0.5)",
                "button_style": "minimal",
                "button_gradient": "none"
            },
            "light": {
                "primary_color": "#0078D7",  # Blue
                "secondary_color": "#FF4081",  # Pink
                "background_color": "#F8F8F8",  # Light grey
                "text_color": "#333333",  # Dark grey
                "accent_color": "#FF8C00",  # Dark orange
                "highlight_color": "#00C853",  # Green
                "user_message_color": "#0078D7",  # Blue
                "ai_message_color": "#9C27B0",  # Purple
                "font_family": "'Segoe UI', Arial, sans-serif",
                "border_style": "1px solid #DDDDDD",
                "ui_blur_amount": "0px",
                "ui_glow_effect": "none",
                "button_style": "flat",
                "button_gradient": "none"
            }
        }
        
        return themes.get(theme_name, themes["cyberpunk-dark"])
    
    def add_api_key(self, provider: str, api_key: str):
        """Add an API key to a specific provider, ensuring no duplicates."""
        if "provider_api_keys" not in self.config:
            self.config["provider_api_keys"] = {}
        
        keys = self.get_provider_api_keys(provider)
        if api_key not in keys:
            keys.append(api_key)
            self.set_provider_api_keys(provider, keys)
            logger.info(f"Added new API key for {provider}.")
        else:
            logger.info(f"API key for {provider} already exists.")

    def get_provider_api_keys(self, provider: str) -> list:
        """Get all API keys for a specific provider"""
        provider_keys = self.config.get("provider_api_keys", {})
        keys = provider_keys.get(provider, [])
        # Ensure it's always a list for backward compatibility
        if isinstance(keys, str):
            return [keys] if keys else []
        return keys if isinstance(keys, list) else []
    
    def set_provider_api_keys(self, provider: str, api_keys: list):
        """Set all API keys for a specific provider"""
        if "provider_api_keys" not in self.config:
            self.config["provider_api_keys"] = {}
        self.config["provider_api_keys"][provider] = api_keys
        self.save_config()
    
    def add_provider_api_key(self, provider: str, api_key: str):
        """Add an API key to a specific provider"""
        keys = self.get_provider_api_keys(provider)
        if api_key not in keys:
            keys.append(api_key)
            self.set_provider_api_keys(provider, keys)
    
    def remove_provider_api_key(self, provider: str, api_key: str):
        """Remove an API key from a specific provider"""
        keys = self.get_provider_api_keys(provider)
        if api_key in keys:
            keys.remove(api_key)
            self.set_provider_api_keys(provider, keys)
    
    def get_provider_api_key(self, provider: str) -> str:
        """Get the first available API key for a specific provider (backward compatibility)"""
        keys = self.get_provider_api_keys(provider)
        return keys[0] if keys else ""
    
    def set_provider_api_key(self, provider: str, api_key: str):
        """Set API key for a specific provider (backward compatibility - replaces all keys)"""
        self.set_provider_api_keys(provider, [api_key] if api_key else [])
    
    def get_provider_settings(self, provider_name: str) -> Optional[Dict[str, Any]]:
        """Get all settings for a specific provider by name."""
        if provider_name not in self.config.get("provider_api_keys", {}):
            return None
        
        # Default model and URL can be stored per-provider in the future.
        # For now, we use the global ones as a fallback.
        return {
            "provider": provider_name,
            "model_type": self.get("model_type", "api"), # Assuming this is global for now
            "api_keys": self.get_provider_api_keys(provider_name),
            "model": self.get("model"), # Fallback to global model
            "api_url": self.get("api_url") # Fallback to global URL
        }

    def get_current_provider_settings(self) -> Dict[str, Any]:
        """Get settings for the currently selected AI provider"""
        provider = self.get("ai_provider", "gemini")
        return self.get_provider_settings(provider) or {}