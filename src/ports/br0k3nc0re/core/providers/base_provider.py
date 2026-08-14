"""
Base Provider for AI integrations in bR0k3nC0Re
Defines the common interface for all AI provider handlers.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseProvider(ABC):
    """Abstract base class for all AI providers."""

    def __init__(self, api_key: str = None, model_name: str = None, api_url: str = None, config: Dict[str, Any] = None):
        """
        Initialize the provider.

        Args:
            api_key (str, optional): The API key for the provider.
            model_name (str, optional): The specific model to use.
            api_url (str, optional): The base URL for the API (for local/custom endpoints).
            config (Dict[str, Any], optional): Full application config for more complex setups.
        """
        self.api_key = api_key
        self.model_name = model_name
        self.api_url = api_url
        self.config = config or {}

    @abstractmethod
    def send_message(self, message: str, chat_history: List[Dict[str, str]], system_prompt: str, generation_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send a message to the provider and get a response.

        Args:
            message (str): The user's message.
            chat_history (List[Dict[str, str]]): The conversation history.
            system_prompt (str): The system directive/prompt.
            generation_config (Dict[str, Any]): Parameters for generation (temp, top_p, etc.).

        Returns:
            Dict[str, Any]: A dictionary containing the response text, status, and metadata.
        """
        pass

    @staticmethod
    @abstractmethod
    def test_connection(api_key: str, model_name: str, api_url: str) -> Dict[str, Any]:
        """
        Test the connection to the provider's API.

        Returns:
            Dict[str, Any]: A dictionary with 'success' status and details.
        """
        pass
