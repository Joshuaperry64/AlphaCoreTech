"""
AI Memory System - Persistent memory for AI interactions
Merged from AlphaNSFW
"""

import sqlite3
import json
import os
import threading
from datetime import datetime
from typing import Optional, List, Tuple, Dict, Any


class MemorySystem:
    """Manages persistent AI memory storage"""
    
    def __init__(self, db_path: str = None):
        """Initialize memory system
        
        Args:
            db_path: Path to SQLite database file. If None, uses default location.
        """
        if db_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_dir = os.path.join(base_dir, "data")
            os.makedirs(data_dir, exist_ok=True)
            db_path = os.path.join(data_dir, "ai_memory.db")
        
        self.db_path = db_path
        self._conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._lock = threading.Lock()
        self.init_database()
    
    def init_database(self):
        """Initialize the memory database with required tables"""
        with self._lock:
            cursor = self._conn.cursor()

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS memories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,
                    key TEXT NOT NULL,
                    value TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    metadata TEXT
                )
            ''')

            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_type ON memories(type)
            ''')

            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_key ON memories(key)
            ''')

            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_timestamp ON memories(timestamp)
            ''')

            self._conn.commit()
    
    def save_memory(self, memory_type: str, key: str, value: str, 
                   metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Save a memory to the database
        
        Args:
            memory_type: Category of memory (e.g., 'conversation', 'user_action')
            key: Memory key/identifier
            value: Memory content
            metadata: Optional additional metadata
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with self._lock:
                timestamp = datetime.now().isoformat()
                metadata_json = json.dumps(metadata) if metadata else None

                with self._conn:
                    self._conn.execute('''
                        INSERT INTO memories (type, key, value, timestamp, metadata)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (memory_type, key, value, timestamp, metadata_json))

                return True
        except Exception as e:
            print(f"Error saving memory: {e}")
            return False
    
    def get_memories(self, memory_type: Optional[str] = None, 
                    search_term: Optional[str] = None,
                    limit: Optional[int] = None) -> List[Tuple]:
        """Retrieve memories from the database
        
        Args:
            memory_type: Filter by memory type (None for all types)
            search_term: Search in keys and values (None for no search)
            limit: Maximum number of results (None for all)
            
        Returns:
            List of memory tuples (id, type, key, value, timestamp, metadata)
        """
        try:
            with self._lock:
                cursor = self._conn.cursor()

                query = "SELECT * FROM memories"
                params = []
                conditions = []

                if memory_type:
                    conditions.append("type = ?")
                    params.append(memory_type)

                if search_term:
                    conditions.append("(key LIKE ? OR value LIKE ?)")
                    search_pattern = f"%{search_term}%"
                    params.extend([search_pattern, search_pattern])

                if conditions:
                    query += " WHERE " + " AND ".join(conditions)

                query += " ORDER BY timestamp DESC"

                if limit:
                    query += " LIMIT ?"
                    params.append(limit)

                cursor.execute(query, params)
                results = cursor.fetchall()

                return results
        except Exception as e:
            print(f"Error retrieving memories: {e}")
            return []
    
    def delete_memory(self, memory_id: int) -> bool:
        """Delete a memory by ID
        
        Args:
            memory_id: ID of memory to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with self._lock:
                cursor = self._conn.cursor()

                cursor.execute("DELETE FROM memories WHERE id = ?", (memory_id,))

                self._conn.commit()
                return True
        except Exception as e:
            print(f"Error deleting memory: {e}")
            return False
    
    def get_recent_conversation(self, limit: int = 10) -> List[Tuple]:
        """Get recent conversation memories
        
        Args:
            limit: Number of recent entries to retrieve
            
        Returns:
            List of conversation memory tuples
        """
        return self.get_memories(memory_type="conversation", limit=limit)
    
    def get_user_preferences(self) -> Dict[str, Any]:
        """Get stored user preferences
        
        Returns:
            Dictionary of user preferences
        """
        preferences = {}
        memories = self.get_memories(memory_type="user_preference")
        
        for memory in memories:
            _, _, key, value, _, _ = memory
            try:
                preferences[key] = json.loads(value)
            except:
                preferences[key] = value
        
        return preferences
    
    def clear_old_memories(self, days: int = 30) -> int:
        """Clear memories older than specified days
        
        Args:
            days: Number of days to keep
            
        Returns:
            Number of memories deleted
        """
        try:
            from datetime import timedelta
            
            with self._lock:
                cursor = self._conn.cursor()

                cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()

                cursor.execute("DELETE FROM memories WHERE timestamp < ?", (cutoff_date,))
                deleted_count = cursor.rowcount

                self._conn.commit()
                return deleted_count
        except Exception as e:
            print(f"Error clearing old memories: {e}")
            return 0
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get memory statistics
        
        Returns:
            Dictionary with memory statistics
        """
        try:
            with self._lock:
                cursor = self._conn.cursor()

                # Total memories
                cursor.execute("SELECT COUNT(*) FROM memories")
                total = cursor.fetchone()[0]

                # Memories by type
                cursor.execute("SELECT type, COUNT(*) FROM memories GROUP BY type")
                by_type = dict(cursor.fetchall())

                # Oldest and newest
                cursor.execute("SELECT MIN(timestamp), MAX(timestamp) FROM memories")
                oldest, newest = cursor.fetchone()

                return {
                    "total": total,
                    "by_type": by_type,
                    "oldest": oldest,
                    "newest": newest
                }
        except Exception as e:
            print(f"Error getting statistics: {e}")
            return {}
