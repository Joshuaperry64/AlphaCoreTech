"""
Character Manager for bR0k3nC0Re - Cyberpunk Edition
Handles creation, loading, saving, and management of character profiles
"""

import os
import json
import uuid
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger("CHARACTER_MANAGER")


class CharacterManager:
    """
    Manages character profiles and persistence
    """
    
    def __init__(self):
        """Initialize character manager"""
        self.root_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.characters_path = os.path.join(self.root_path, "data", "characters")
        self.characters: Dict[str, Dict[str, Any]] = {}
        
        # Create characters directory if it doesn't exist
        os.makedirs(self.characters_path, exist_ok=True)
        
        # Load characters
        self.load_all_characters()
        
    def load_all_characters(self) -> bool:
        """
        Load all character profiles from files
        
        Returns:
            bool: True if loaded successfully, False otherwise
        """
        try:
            # Clear current characters
            self.characters = {}
            
            # Load characters from the new build directory
            if os.path.exists(self.characters_path):
                for filename in os.listdir(self.characters_path):
                    if filename.endswith('.json'):
                        try:
                            file_path = os.path.join(self.characters_path, filename)
                            with open(file_path, 'r', encoding='utf-8') as f:
                                character_data = json.load(f)
                                
                                # Get character ID from filename or use ID in data
                                char_id = os.path.splitext(filename)[0]
                                if "id" not in character_data:
                                    character_data["id"] = char_id
                                    
                                self.characters[char_id] = character_data
                        except Exception as e:
                            logger.error(f"Failed to load character {filename}: {e}")
            
            # Also load from the original characters directory for compatibility
            original_characters_path = os.path.join(self.root_path, "characters")
            if os.path.exists(original_characters_path):
                for filename in os.listdir(original_characters_path):
                    if filename.endswith('.json'):
                        try:
                            file_path = os.path.join(original_characters_path, filename)
                            with open(file_path, 'r', encoding='utf-8') as f:
                                character_data = json.load(f)
                                
                                # Get character ID from filename or use ID in data
                                char_id = os.path.splitext(filename)[0]
                                if "id" not in character_data:
                                    character_data["id"] = char_id
                                
                                # Only add if not already loaded from new build
                                if char_id not in self.characters:
                                    self.characters[char_id] = character_data
                        except Exception as e:
                            logger.error(f"Failed to load original character {filename}: {e}")
                            
            logger.info(f"Loaded {len(self.characters)} characters")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load characters: {e}")
            return False
            
    def get_character(self, character_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a character profile by ID
        
        Args:
            character_id: The ID of the character to get
            
        Returns:
            Optional[Dict[str, Any]]: The character data or None if not found
        """
        return self.characters.get(character_id)
        
    def get_all_characters(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all character profiles
        
        Returns:
            Dict[str, Dict[str, Any]]: Dictionary of character IDs to character data
        """
        return self.characters.copy()
        
    def create_character(self, character_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new character profile
        
        Args:
            character_data: The character data
            
        Returns:
            Dict[str, Any]: The created character data with ID
        """
        try:
            # Generate ID if not provided
            if "id" not in character_data:
                character_data["id"] = str(uuid.uuid4())
                
            # Add creation timestamp
            if "created_at" not in character_data:
                character_data["created_at"] = datetime.now().isoformat()
                
            # Ensure required fields
            required_fields = ["name", "gender", "description", "personality", "background"]
            for field in required_fields:
                if field not in character_data:
                    character_data[field] = f"No {field} specified"
                    
            # Add character to dictionary
            char_id = character_data["id"]
            self.characters[char_id] = character_data
            
            # Save character to file
            self.save_character(char_id)
            
            return character_data
            
        except Exception as e:
            logger.error(f"Failed to create character: {e}")
            raise
            
    def update_character(self, character_id: str, character_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update an existing character profile
        
        Args:
            character_id: The ID of the character to update
            character_data: The updated character data
            
        Returns:
            Optional[Dict[str, Any]]: The updated character data or None if not found
        """
        if character_id not in self.characters:
            logger.error(f"Character {character_id} not found")
            return None
            
        try:
            # Update character
            updated_data = self.characters[character_id].copy()
            updated_data.update(character_data)
            
            # Add modification timestamp
            updated_data["updated_at"] = datetime.now().isoformat()
            
            # Update in dictionary
            self.characters[character_id] = updated_data
            
            # Save to file
            self.save_character(character_id)
            
            return updated_data
            
        except Exception as e:
            logger.error(f"Failed to update character {character_id}: {e}")
            return None
            
    def delete_character(self, character_id: str) -> bool:
        """
        Delete a character profile
        
        Args:
            character_id: The ID of the character to delete
            
        Returns:
            bool: True if deleted successfully, False otherwise
        """
        if character_id not in self.characters:
            logger.error(f"Character {character_id} not found")
            return False
            
        try:
            # Remove from dictionary
            del self.characters[character_id]
            
            # Remove file
            file_path = os.path.join(self.characters_path, f"{character_id}.json")
            if os.path.exists(file_path):
                os.remove(file_path)
                
            logger.info(f"Character {character_id} deleted")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete character {character_id}: {e}")
            return False
            
    def save_character(self, character_id: str) -> bool:
        """
        Save a character profile to file
        
        Args:
            character_id: The ID of the character to save
            
        Returns:
            bool: True if saved successfully, False otherwise
        """
        if character_id not in self.characters:
            logger.error(f"Character {character_id} not found")
            return False
            
        try:
            # Ensure directory exists
            os.makedirs(self.characters_path, exist_ok=True)
            
            # Save to file
            file_path = os.path.join(self.characters_path, f"{character_id}.json")
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(self.characters[character_id], f, indent=2)
                
            logger.info(f"Character {character_id} saved to {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save character {character_id}: {e}")
            return False
            
    def save_all_characters(self) -> bool:
        """
        Save all character profiles to files
        
        Returns:
            bool: True if saved successfully, False otherwise
        """
        try:
            success = True
            for character_id in self.characters:
                if not self.save_character(character_id):
                    success = False
                    
            return success
            
        except Exception as e:
            logger.error(f"Failed to save all characters: {e}")
            return False
            
    def search_characters(self, query: str) -> List[Dict[str, Any]]:
        """
        Search characters by name, description, or other fields
        
        Args:
            query: The search query
            
        Returns:
            List[Dict[str, Any]]: List of matching character data
        """
        query = query.lower()
        results = []
        
        for character in self.characters.values():
            # Search in name
            if query in character.get('name', '').lower():
                results.append(character)
                continue
                
            # Search in description
            if query in character.get('description', '').lower():
                results.append(character)
                continue
                
            # Search in personality
            if query in character.get('personality', '').lower():
                results.append(character)
                continue
                
            # Search in background
            if query in character.get('background', '').lower():
                results.append(character)
                continue
                
        return results