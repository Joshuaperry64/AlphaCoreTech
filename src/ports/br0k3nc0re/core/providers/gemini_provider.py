"""
Gemini Provider for bR0k3nC0Re
Handles all interactions with the Google Gemini API, including multi-key and multi-model failover.
"""
import os
import time
import logging
import json
from typing import List, Dict, Any, Optional

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from PIL import Image
from .base_provider import BaseProvider

logger = logging.getLogger("GEMINI_PROVIDER")

class GeminiProvider(BaseProvider):
    """Handles logic for interacting with the Gemini API."""

    def __init__(self, api_keys: List[str], model_name: str, api_url: Optional[str] = None, config_manager=None):
        # Initialize with the first key if available, else None
        first_key = api_keys[0] if api_keys and isinstance(api_keys, list) else (api_keys if isinstance(api_keys, str) else None)
        super().__init__(first_key, model_name, api_url, config_manager)
        
        self.api_keys = api_keys if isinstance(api_keys, list) else [api_keys] if api_keys else []
        self.client = genai
        self.chat = None
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
        if not self.api_key:
            raise ValueError("Gemini provider requires at least one API key.")
        
        self.current_key_index = 0
        self.client.configure(api_key=self.api_key)

    def _get_storage_dir(self):
        storage_dir = self.config_manager.get("storage_dir")
        if not storage_dir:
            root_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            storage_dir = os.path.join(root_path, "storage")
        os.makedirs(storage_dir, exist_ok=True)
        return storage_dir

    def _mark_key_exhausted(self, api_key: str):
        """Mark an API key as exhausted with a timestamp."""
        try:
            storage_dir = self._get_storage_dir()
            exhausted_file = os.path.join(storage_dir, "exhausted_keys.json")
            
            exhausted_keys = {}
            if os.path.exists(exhausted_file):
                with open(exhausted_file, 'r') as f:
                    exhausted_keys = json.load(f)
            
            exhausted_keys[api_key] = time.time()
            
            with open(exhausted_file, 'w') as f:
                json.dump(exhausted_keys, f, indent=2)
            logger.info(f"Marked key as exhausted: ...{api_key[-4:]}")
        except Exception as e:
            logger.error(f"Failed to mark key as exhausted: {e}")

    def _is_key_exhausted(self, api_key: str, cooldown_hours: int = 24) -> bool:
        """Check if a key is still within its cooldown period."""
        try:
            storage_dir = self._get_storage_dir()
            exhausted_file = os.path.join(storage_dir, "exhausted_keys.json")
            
            if not os.path.exists(exhausted_file):
                return False
            
            with open(exhausted_file, 'r') as f:
                exhausted_keys = json.load(f)
            
            if api_key in exhausted_keys:
                exhaustion_time = exhausted_keys[api_key]
                if (time.time() - exhaustion_time) < (cooldown_hours * 3600):
                    return True
            return False
        except Exception as e:
            logger.error(f"Failed to check key exhaustion: {e}")
            return False

    def _rotate_key(self):
        """Rotate to the next available API key."""
        # In a single-key model, we don't rotate, just report exhaustion.
        # The multi-key logic is now in the AI Core.
        logger.warning(f"Gemini key ...{self.api_key[-4:]} is exhausted.")
        self._mark_key_exhausted(self.api_key)
        return False

    def start_chat(self, system_prompt: str, history: List[Dict[str, str]]):
        """Starts a new chat session with the given context and history."""
        # Re-configure client in case the key was changed by AI Core
        self.client.configure(api_key=self.api_key)
        
        # Convert generic history to Gemini format
        gemini_history = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            content = msg.get("content", "")
            if content:
                gemini_history.append({
                    "role": role,
                    "parts": [{"text": content}]
                })

        model = self.client.GenerativeModel(
            model_name=self.model_name,
            safety_settings=self.safety_settings,
            system_instruction=system_prompt
        )
        self.chat = model.start_chat(history=gemini_history)

    def send_message(self, message: str, history: List[Dict[str, str]], system_prompt: str, generation_config: Dict[str, Any]) -> Dict[str, Any]:
        """Sends a message to the Gemini model with failover and key rotation."""
        if not self.chat:
            self.start_chat(system_prompt, history)

        try:
            response = self.chat.send_message(message, generation_config=generation_config)
            return {
                "text": response.text,
                "status": "success",
                "metadata": {
                    "provider": "gemini",
                    "model": self.model_name,
                    "api_key_used": f"...{self.api_key[-4:]}"
                }
            }
        except Exception as e:
            err_str = str(e).lower()
            if "quota" in err_str or "rate limit" in err_str or "429" in err_str:
                logger.warning(f"Gemini quota error with key ...{self.api_key[-4:]}. Marking as exhausted.")
                self._mark_key_exhausted(self.api_key)
                # Signal to AI Core that rotation is needed
                return {"text": "API key quota exhausted.", "status": "error", "metadata": {"reason": "quota_exhausted"}}
            elif "block" in err_str or "safety" in err_str or "filter" in err_str:
                logger.warning(f"Response from model {self.model_name} was blocked by safety filters.")
                return {"text": "Response blocked by safety filters.", "status": "error", "metadata": {"reason": "safety_filter"}}
            else:
                logger.error(f"An unexpected Gemini API error occurred: {e}", exc_info=True)
                return {"text": f"An unexpected Gemini error occurred: {e}", "status": "error"}

    def generate_with_image(self, prompt: str, image_bytes: bytes) -> str:
        """Generates content based on a prompt and a single image."""
        models_to_try = ['gemini-1.5-flash', 'gemini-pro-vision']
        
        for model_name in models_to_try:
            try:
                # Re-configure client in case the key was changed
                self.client.configure(api_key=self.api_key)
                
                model = self.client.GenerativeModel(model_name)
                
                # The vision model can take a list of parts, text and image
                image_part = {"mime_type": "image/png", "data": image_bytes}
                
                response = model.generate_content([prompt, image_part])
                
                return response.text
            except Exception as e:
                logger.warning(f"Gemini Vision API error with model {model_name}: {e}")
                # If one model fails, the loop will try the next one
                continue
        
        # If all models fail
        return "Error: All vision models failed or are unavailable."

    def send_vision_message(self, prompt: str, image_data: list, history: list) -> dict:
        """Sends a vision message to the Gemini model."""
        models_to_try = ['gemini-1.5-flash', 'gemini-pro-vision']
        
        context_prompt = prompt
        if history:
            history_str = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history[-5:]])
            context_prompt = (
                "Based on the following conversation history, analyze the image.\n\n"
                f"--- History ---\n{history_str}\n\n"
                f"--- Your Task ---\n{prompt}"
            )

        for model_name in models_to_try:
            try:
                model = self.client.GenerativeModel(model_name)
                
                image_parts = [Image.open(io.BytesIO(base64.b64decode(b64_string))) for b64_string in image_data]
                
                response = model.generate_content([context_prompt] + image_parts)
                return {"content": response.text}
            except Exception as e:
                logger.warning(f"Gemini Vision API error with model {model_name}: {e}")
                continue
        
        return {"content": "Error: All vision models failed or are unavailable."}

    @staticmethod
    def test_connection(api_key: str, model_name: str, api_url: Optional[str]) -> dict:
        """Statically tests the connection to the Gemini API."""
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(model_name or 'gemini-1.5-flash-latest')
            model.generate_content("test", generation_config={"max_output_tokens": 1})
            return {"success": True, "message": "Gemini connection successful"}
        except Exception as e:
            return {"success": False, "error": f"Test failed: {str(e)}"}
