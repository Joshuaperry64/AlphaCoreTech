"""
Screenshot and Image Analysis Tools
Merged from AlphaNSFW
"""

from typing import Optional, Tuple
from PIL import Image, ImageGrab, ImageEnhance, ImageFilter


class AnalysisTools:
    """Tools for screenshot capture and image/file analysis"""
    
    def __init__(self, gemini_model=None):
        """Initialize analysis tools
        
        Args:
            gemini_model: Configured Gemini model for analysis
        """
        self.gemini_model = gemini_model
    
    def capture_screenshot(self, save_path: Optional[str] = None) -> Tuple[bool, str]:
        """Capture screenshot
        
        Args:
            save_path: Optional path to save screenshot
            
        Returns:
            Tuple of (success, path/message)
        """
        try:
            screenshot = ImageGrab.grab()
            
            if save_path is None:
                # Generate default path
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                save_dir = os.path.join(base_dir, "data", "screenshots")
                os.makedirs(save_dir, exist_ok=True)
                
                from datetime import datetime
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                save_path = os.path.join(save_dir, f"screenshot_{timestamp}.png")
            
            screenshot.save(save_path)
            return True, save_path
        except Exception as e:
            return False, f"Error capturing screenshot: {str(e)}"
    
    def analyze_image(self, image_path: str, prompt: Optional[str] = None) -> Tuple[bool, str]:
        """Analyze image using Gemini Vision
        
        Args:
            image_path: Path to image file
            prompt: Optional custom analysis prompt
            
        Returns:
            Tuple of (success, analysis_result)
        """
        if not self.gemini_model:
            return False, "Gemini model not configured"
        
        try:
            # Load image
            img = Image.open(image_path)
            
            # Default prompt if none provided
            if prompt is None:
                prompt = "Analyze this image in detail. Describe what you see, identify objects, people, text, and any notable features."
            
            # Generate response
            response = self.gemini_model.generate_content([prompt, img])
            
            return True, response.text
        except Exception as e:
            return False, f"Error analyzing image: {str(e)}"
    
    def analyze_screenshot(self, prompt: Optional[str] = None) -> Tuple[bool, str]:
        """Capture and analyze screenshot
        
        Args:
            prompt: Optional custom analysis prompt
            
        Returns:
            Tuple of (success, analysis_result)
        """
        # Capture screenshot
        success, path_or_error = self.capture_screenshot()
        if not success:
            return False, path_or_error
        
        # Analyze
        return self.analyze_image(path_or_error, prompt)
    
    def enhance_image(self, image_path: str, enhancement_type: str = "auto", save_path: Optional[str] = None) -> Tuple[bool, str]:
        """Enhance image using PIL
        
        Args:
            image_path: Path to source image
            enhancement_type: Type of enhancement ('auto', 'brightness', 'contrast', 'sharpness', 'color')
            save_path: Optional path to save enhanced image
            
        Returns:
            Tuple of (success, path/message)
        """
        try:
            img = Image.open(image_path)
            
            if enhancement_type == "auto" or enhancement_type == "brightness":
                enhancer = ImageEnhance.Brightness(img)
                img = enhancer.enhance(1.2)
            
            if enhancement_type == "auto" or enhancement_type == "contrast":
                enhancer = ImageEnhance.Contrast(img)
                img = enhancer.enhance(1.3)
            
            if enhancement_type == "auto" or enhancement_type == "sharpness":
                enhancer = ImageEnhance.Sharpness(img)
                img = enhancer.enhance(1.5)
            
            if enhancement_type == "color":
                enhancer = ImageEnhance.Color(img)
                img = enhancer.enhance(1.2)
            
            # Generate save path if not provided
            if save_path is None:
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                save_dir = os.path.join(base_dir, "data", "enhanced")
                os.makedirs(save_dir, exist_ok=True)
                
                filename = os.path.basename(image_path)
                name, ext = os.path.splitext(filename)
                save_path = os.path.join(save_dir, f"{name}_enhanced{ext}")
            
            img.save(save_path)
            return True, save_path
        
        except Exception as e:
            return False, f"Error enhancing image: {str(e)}"
    
    def apply_artistic_filter(self, image_path: str, filter_name: str, save_path: Optional[str] = None) -> Tuple[bool, str]:
        """Apply artistic filter to image

        Args:
            image_path: Path to source image
            filter_name: Name of filter to apply
            save_path: Optional save path

        Returns:
            Tuple of (success, path/message)
        """
        try:
            img = Image.open(image_path)

            filter_map = {
                "smooth": ImageFilter.SMOOTH,
                "blur": ImageFilter.BLUR,
                "sharpen": ImageFilter.SHARPEN,
                "edge_enhance": ImageFilter.EDGE_ENHANCE,
                "emboss": ImageFilter.EMBOSS,
                "contour": ImageFilter.CONTOUR
            }

            if filter_name in filter_map:
                img = img.filter(filter_map[filter_name])
            else:
                return False, f"Unknown filter: {filter_name}"

            if save_path is None:
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                save_dir = os.path.join(base_dir, "data", "filtered")
                os.makedirs(save_dir, exist_ok=True)

                filename = os.path.basename(image_path)
                name, ext = os.path.splitext(filename)
                save_path = os.path.join(save_dir, f"{name}_{filter_name}{ext}")

            img.save(save_path)
            return True, save_path

        except Exception as e:
            return False, f"Error applying filter: {str(e)}"

    def blur_image(self, image_path: str, radius: int = 5, save_path: Optional[str] = None) -> Tuple[bool, str]:
        """Apply blur to image
        
        Args:
            image_path: Path to source image
            radius: Blur radius
            save_path: Optional save path
            
        Returns:
            Tuple of (success, path/message)
        """
        try:
            img = Image.open(image_path)
            blurred = img.filter(ImageFilter.GaussianBlur(radius=radius))
            
            if save_path is None:
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                save_dir = os.path.join(base_dir, "data", "processed")
                os.makedirs(save_dir, exist_ok=True)
                
                filename = os.path.basename(image_path)
                name, ext = os.path.splitext(filename)
                save_path = os.path.join(save_dir, f"{name}_blurred{ext}")
            
            blurred.save(save_path)
            return True, save_path
        
        except Exception as e:
            return False, f"Error blurring image: {str(e)}"
    
    def detect_text(self, image_path: str) -> Tuple[bool, str]:
        """Detect and extract text from image using Gemini Vision
        
        Args:
            image_path: Path to image
            
        Returns:
            Tuple of (success, extracted_text)
        """
        if not self.gemini_model:
            return False, "Gemini model not configured"
        
        try:
            img = Image.open(image_path)
            prompt = "Extract all visible text from this image. Provide only the text content, maintaining original formatting where possible."
            response = self.gemini_model.generate_content([prompt, img])
            return True, response.text
        
        except Exception as e:
            return False, f"Error detecting text: {str(e)}"
