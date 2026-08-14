"""
Provider Factory for bR0k3nC0Re
Dynamically loads and initializes the correct AI provider based on configuration.
"""
import importlib
import logging
from typing import Dict, Any, Optional, List, Type

from .base_provider import BaseProvider

logger = logging.getLogger(__name__)

class ProviderFactory:
    """Factory for creating AI provider instances."""
    
    _providers: Dict[str, Type[BaseProvider]] = {}

    @classmethod
    def register_provider(cls, name: str, provider_class: Type[BaseProvider]):
        """Registers a provider class."""
        cls._providers[name] = provider_class

    @classmethod
    def get_provider(
        cls,
        provider_name: str,
        config_manager
    ) -> Optional[BaseProvider]:
        """
        Dynamically imports and creates an instance of an AI provider.

        Args:
            provider_name (str): The name of the provider (e.g., "gemini").
            config_manager: The configuration manager instance.

        Returns:
            Optional[BaseProvider]: An instance of the provider, or None if not found.
        """
        if provider_name not in cls._providers:
            try:
                # Dynamically import the provider module
                module = importlib.import_module(f".{provider_name}_provider", package="core.providers")
                
                # The provider class is expected to be named in CamelCase, e.g., GeminiProvider
                class_name = f"{provider_name.capitalize()}Provider"
                provider_class = getattr(module, class_name)
                
                cls.register_provider(provider_name, provider_class)
                logger.info(f"Successfully registered provider: {provider_name}")

            except (ImportError, AttributeError) as e:
                logger.error(f"Failed to load provider '{provider_name}': {e}", exc_info=True)
                return None

        # Retrieve provider settings from config
        try:
            provider_settings = config_manager.get_provider_settings(provider_name)
            if not provider_settings:
                logger.error(f"No configuration found for provider: {provider_name}")
                return None

            api_keys = provider_settings.get("api_keys", [])
            model = provider_settings.get("model")
            api_url = provider_settings.get("api_url")

            # Instantiate the provider
            provider_instance = cls._providers[provider_name](
                api_keys=api_keys,
                model_name=model,
                api_url=api_url,
                config_manager=config_manager
            )
            logger.info(f"Successfully created instance of provider: {provider_name}")
            return provider_instance

        except Exception as e:
            logger.error(f"Error creating provider instance for '{provider_name}': {e}", exc_info=True)
            return None

    @staticmethod
    def test_provider_connection(provider_name: str, api_key: str, model_name: str, api_url: Optional[str]) -> dict:
        """
        Statically tests a provider's connection without a full instance.
        """
        try:
            module = importlib.import_module(f".{provider_name}_provider", package="core.providers")
            class_name = f"{provider_name.capitalize()}Provider"
            provider_class = getattr(module, class_name)
            return provider_class.test_connection(api_key, model_name, api_url)
        except (ImportError, AttributeError, Exception) as e:
            logger.error(f"Failed to test connection for provider '{provider_name}': {e}")
            return {"success": False, "error": str(e)}
