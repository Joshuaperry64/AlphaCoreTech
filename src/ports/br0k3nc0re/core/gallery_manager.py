"""
Media Gallery Manager
Manages image and video galleries for the application.
"""

import os
import shutil
import json
from typing import List, Optional, Tuple, Dict, Any
from pathlib import Path
from PIL import Image
from datetime import datetime
from core.security_utils import secure_filename


class GalleryManager:
    """Manages image and video galleries"""
    
    def __init__(self, storage_dir="storage/gallery"):
        """Initialize gallery manager
        
        Args:
            storage_dir: Base directory for galleries. If None, uses a default 'storage' directory.
        """
        self.storage_dir = storage_dir
        self.public_gallery_path = os.path.join(self.storage_dir, "images")
        self.private_gallery_path = os.path.join(self.storage_dir, "sin_bin") # New private gallery
        self.video_dir = os.path.join(self.storage_dir, "videos")
        os.makedirs(self.public_gallery_path, exist_ok=True)
        os.makedirs(self.private_gallery_path, exist_ok=True)
        os.makedirs(self.video_dir, exist_ok=True)

    def get_gallery_images(self, is_private=False) -> list:
        """Get list of all images in gallery
        
        Returns:
            List of image filenames
        """
        gallery_path = self.private_gallery_path if is_private else self.public_gallery_path
        if not os.path.exists(gallery_path):
            return []
        
        valid_extensions = ('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp')
        images = [f for f in os.listdir(gallery_path) 
                 if f.lower().endswith(valid_extensions)]
        return sorted(images)
    
    def get_videos(self) -> List[str]:
        """Get list of all videos in gallery
        
        Returns:
            List of video filenames
        """
        if not os.path.exists(self.video_dir):
            return []
        
        valid_extensions = ('.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm')
        videos = [f for f in os.listdir(self.video_dir) 
                 if f.lower().endswith(valid_extensions)]
        return sorted(videos)
    
    def add_image(self, source_path: str, filename: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None, is_private: bool = False) -> Tuple[bool, str]:
        """Add image to gallery and save metadata.
        
        Args:
            source_path: Path to source image
            filename: Optional custom filename. If None, uses original.
            metadata: Optional dictionary of metadata to save with the image.
            is_private: Whether the image should be saved to the private gallery
            
        Returns:
            Tuple of (success, message/path)
        """
        try:
            if not os.path.exists(source_path):
                return False, "Source file not found"
            
            if filename is None:
                filename = os.path.basename(source_path)
            
            filename = secure_filename(filename)
            if not filename:
                filename = f"image_{datetime.now().strftime('%Y%m%d%H%M%S')}"

            dest_path = os.path.join(self.private_gallery_path if is_private else self.public_gallery_path, filename)
            
            # Check if file already exists and create a unique name
            if os.path.exists(dest_path):
                base, ext = os.path.splitext(filename)
                counter = 1
                while os.path.exists(dest_path):
                    filename = f"{base}_{counter}{ext}"
                    dest_path = os.path.join(self.private_gallery_path if is_private else self.public_gallery_path, filename)
                    counter += 1
            
            shutil.copy2(source_path, dest_path)

            # Save metadata if provided
            if metadata:
                self.save_media_metadata(filename, metadata, media_type='image')

            return True, dest_path
        except Exception as e:
            return False, f"Error adding image: {str(e)}"
    
    def add_video(self, source_path: str, filename: Optional[str] = None) -> Tuple[bool, str]:
        """Add video to gallery
        
        Args:
            source_path: Path to source video
            filename: Optional custom filename. If None, uses original.
            
        Returns:
            Tuple of (success, message/path)
        """
        try:
            if not os.path.exists(source_path):
                return False, "Source file not found"
            
            if filename is None:
                filename = os.path.basename(source_path)
            
            filename = secure_filename(filename)
            if not filename:
                filename = f"video_{datetime.now().strftime('%Y%m%d%H%M%S')}"

            dest_path = os.path.join(self.video_dir, filename)
            
            # Check if file already exists
            if os.path.exists(dest_path):
                base, ext = os.path.splitext(filename)
                counter = 1
                while os.path.exists(dest_path):
                    filename = f"{base}_{counter}{ext}"
                    dest_path = os.path.join(self.video_dir, filename)
                    counter += 1
            
            shutil.copy2(source_path, dest_path)
            return True, dest_path
        except Exception as e:
            return False, f"Error adding video: {str(e)}"

    def _get_metadata_path(self, media_filename: str, media_type: str = 'image') -> str:
        """Constructs the path for a media's metadata JSON file."""
        base_name = os.path.splitext(media_filename)[0]
        json_filename = f"{base_name}.json"
        
        if media_type == 'image':
            return os.path.join(self.public_gallery_path, json_filename)
        elif media_type == 'video':
            return os.path.join(self.video_dir, json_filename)
        else:
            raise ValueError("Invalid media type specified.")

    def save_media_metadata(self, media_filename: str, metadata: Dict[str, Any], media_type: str = 'image'):
        """Saves metadata for a given media file to a corresponding JSON file.

        Args:
            media_filename (str): The filename of the media (e.g., 'my_image.png').
            metadata (Dict[str, Any]): The dictionary of metadata to save.
            media_type (str, optional): 'image' or 'video'. Defaults to 'image'.
        """
        metadata_path = self._get_metadata_path(media_filename, media_type)
        
        # Add or update standard metadata fields
        metadata['filename'] = media_filename
        metadata['saved_at'] = datetime.now().isoformat()

        try:
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=4)
        except Exception as e:
            print(f"Error saving metadata for {media_filename}: {e}")

    def load_media_metadata(self, media_filename: str, media_type: str = 'image') -> Optional[Dict[str, Any]]:
        """Loads metadata for a given media file from its corresponding JSON file.

        Args:
            media_filename (str): The filename of the media (e.g., 'my_image.png').
            media_type (str, optional): 'image' or 'video'. Defaults to 'image'.

        Returns:
            Optional[Dict[str, Any]]: The loaded metadata dictionary, or None if not found or on error.
        """
        metadata_path = self._get_metadata_path(media_filename, media_type)
        if not os.path.exists(metadata_path):
            return None
        
        try:
            with open(metadata_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading metadata for {media_filename}: {e}")
            return None
    
    def delete_image(self, filename: str) -> Tuple[bool, str]:
        """Delete image from gallery
        
        Args:
            filename: Name of image file to delete
            
        Returns:
            Tuple of (success, message)
        """
        try:
            file_path = os.path.join(self.public_gallery_path, filename)
            if not os.path.exists(file_path):
                return False, "File not found"
            
            os.remove(file_path)

            return True, "Image deleted successfully"
        except Exception as e:
            return False, f"Error deleting image: {str(e)}"
    
    def delete_video(self, filename: str) -> Tuple[bool, str]:
        """Delete video from gallery
        
        Args:
            filename: Name of video file to delete
            
        Returns:
            Tuple of (success, message)
        """
        try:
            file_path = os.path.join(self.video_dir, filename)
            if not os.path.exists(file_path):
                return False, "File not found"
            
            os.remove(file_path)

            return True, "Video deleted successfully"
        except Exception as e:
            return False, f"Error deleting video: {str(e)}"
    
    def get_image_path(self, filename: str) -> Optional[str]:
        """Get full path to image
        
        Args:
            filename: Image filename
            
        Returns:
            Full path to image or None if not found
        """
        path = os.path.join(self.public_gallery_path, filename)
        return path if os.path.exists(path) else None
    
    def get_video_path(self, filename: str) -> Optional[str]:
        """Get full path to video
        
        Args:
            filename: Video filename
            
        Returns:
            Full path to video or None if not found
        """
        path = os.path.join(self.video_dir, filename)
        return path if os.path.exists(path) else None
    
    def find_images_by_tag(self, tag: str) -> List[str]:
        """Finds images that have a specific tag in their metadata.

        Args:
            tag (str): The tag to search for.

        Returns:
            List[str]: A list of image filenames that match the tag.
        """
        matching_files = []
        search_tag = tag.lower()
        for filename in self.get_gallery_images():
            metadata = self.load_media_metadata(filename, media_type='image')
            if metadata and 'tags' in metadata and isinstance(metadata['tags'], list):
                # Use any() generator to avoid creating a new list, creating an efficient tag lookup data structure
                if any(search_tag == t.lower() for t in metadata['tags']):
                    matching_files.append(filename)
        return matching_files

    def create_thumbnail(self, image_filename: str, size: Tuple[int, int] = (200, 200)) -> Optional[str]:
        """Create thumbnail for image
        
        Args:
            image_filename: Name of image file
            size: Thumbnail size as (width, height)
            
        Returns:
            Path to thumbnail or None on error
        """
        try:
            image_path = self.get_image_path(image_filename)
            if not image_path:
                return None
            
            # Create thumbnails directory
            thumb_dir = os.path.join(self.public_gallery_path, "thumbnails")
            os.makedirs(thumb_dir, exist_ok=True)
            
            # Generate thumbnail
            with Image.open(image_path) as img:
                img.thumbnail(size, Image.Resampling.LANCZOS)
                
                thumb_filename = f"thumb_{image_filename}"
                thumb_path = os.path.join(thumb_dir, thumb_filename)
                
                img.save(thumb_path)
                return thumb_path
        except Exception as e:
            print(f"Error creating thumbnail: {e}")
            return None
    
    def get_gallery_stats(self) -> dict:
        """Get gallery statistics
        
        Returns:
            Dictionary with gallery statistics
        """
        images = self.get_gallery_images()
        videos = self.get_videos()
        
        # Calculate total size
        image_size = sum(os.path.getsize(os.path.join(self.public_gallery_path, f)) 
                        for f in images if os.path.exists(os.path.join(self.public_gallery_path, f)))
        video_size = sum(os.path.getsize(os.path.join(self.video_dir, f)) 
                        for f in videos if os.path.exists(os.path.join(self.video_dir, f)))
        
        return {
            "image_count": len(images),
            "video_count": len(videos),
            "total_count": len(images) + len(videos),
            "image_size_mb": image_size / (1024 * 1024),
            "video_size_mb": video_size / (1024 * 1024),
            "total_size_mb": (image_size + video_size) / (1024 * 1024)
        }
