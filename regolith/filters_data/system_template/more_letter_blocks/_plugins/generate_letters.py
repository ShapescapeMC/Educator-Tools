'''
This script generates 64x64 images with transparent backgrounds for each letter
in a string provided in the scope. It uses the Pillow library for image manipulation.
'''
from typing import Any, Dict, TypedDict
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import os
import re
import shutil

from array import array

def escape_to_char(escape_str):
    """
    Convert a string that might contain Unicode escape sequences to a character.
    If the string is already a direct character, it returns it unchanged.
    
    Args:
        escape_str: String that might contain Unicode escape sequences (e.g., '\u0041')
                   or a direct character (e.g., 'g')
                   
    Returns:
        The corresponding character
    """
    # Check if the string looks like it contains Unicode escape sequences
    if isinstance(escape_str, str) and re.search(r'\\u[0-9a-fA-F]{4}', escape_str):
        try:
            return escape_str.encode('utf-8').decode('unicode_escape')
        except Exception as e:
            raise ValueError(f"Error while decoding '{escape_str}': {e}")
    else:
        # If it doesn't contain escape sequences, return it as is
        return escape_str

def safe_filename(character: str) -> str:
    """
    Convert a character to a safe filename string using Unicode code point.
    
    Args:
        character: The character to convert
        
    Returns:
        A safe filename string in the format 'char_X' where X is the hex Unicode code point
    """
    # Get the Unicode code point and convert to hex
    code_point = ord(character)
    return f"char_{format(code_point, 'x')}"

class LetterItem(TypedDict):
    char: str
    safe_name: str
    group: str

def generate_letter_images(
        map_py_item: dict[str, Any],
        letters: list[LetterItem],
        output_dir: str = ".",
        font_path: str = None,
        font_size: int = 64,
        text_color: tuple = (255, 255, 255, 255),
        image_size: tuple = (64, 64),
        background_image_path: str = None,
        suffix: str = None,
        aliasing: bool = False
    ) -> dict[str, Any]:
    '''
    Generates an image for each letter in the provided string with transparent background.
    
    Args:
        map_py_item: The map_py item from system_template.
        letters: String containing all the letters to generate images for.
        output_dir: Directory where the images will be saved.
        font_path: Path to a custom font file. If None, default font will be used.
        font_size: Font size to use.
        text_color: RGBA color tuple for the text.
        image_size: Tuple with (width, height) of the output image.
        background_image_path: Path to background image. If None, transparent background will be used.
        aliasing: Enable aliasing via oversampling and downsampling
        
    Returns:
        The unmodified map_py_item.
    '''
    # Create output directory if it doesn't exist
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Extract background image name if provided
    background_subfolder = None
    if background_image_path:
        # Get the filename without directory path
        bg_filename = os.path.basename(background_image_path)
        # Remove .block.png suffix if present
        background_subfolder = bg_filename.replace('.block.png', '')
    
    # Adapt letters array → actual chars, filename and group
    decoded = [
        (escape_to_char(item["char"]),
         item.get("safe_name"),
         item.get("group"))
        for item in letters
    ]
    char_map = {
        char: ((safe_name or safe_filename(char)), group)
        for char, safe_name, group in decoded
    }

    # Create a reverse mapping for debugging and reference
    mapping_file_path = output_path / "character_mapping.txt"
    with open(mapping_file_path, "w", encoding="utf-8") as f:
        f.write("Character\tFilename\tUnicode\tGroup\n")
        for char, (filename, group) in char_map.items():
            f.write(f"{char}\t{filename}\t{ord(char)}\t{group}\n")
    print(f"Created character mapping reference at {mapping_file_path}")
    
    # Determine oversampling factor and working size before any image ops
    scale = 4 if aliasing else 1
    work_size = (image_size[0] * scale, image_size[1] * scale)

    # Load background image if provided
    background_image = None
    if background_image_path and os.path.exists(background_image_path):
        try:
            background_image = Image.open(background_image_path).convert('RGBA')
            background_image = background_image.resize(work_size, resample=Image.NEAREST)
            print(f"Using background image: {background_image_path}")
        except Exception as e:
            print(f"Error loading background image: {e}")
            background_image = None
    else:
        print("No background image provided or file not found. Using transparent background. Path: " + 
              str(os.path.abspath(background_image_path) if background_image_path else "None"))
    
    # Load font with better fallback handling
    font = None
    
    # Try to load the specified custom font
    font_size_used = font_size * (4 if aliasing else 1)
    if font_path and os.path.exists(font_path):
        try:
            font = ImageFont.truetype(font_path, font_size_used)
            print(f"Successfully loaded custom font '{font_path}' with size {font_size}")
        except Exception as e:
            print(f"Error loading custom font '{font_path}': {e}")
            font = None
    
    # Fallback to system fonts if custom font failed or wasn't specified
    if font is None:
        system_fonts = [
            "arial.ttf", "Arial.ttf",                  # Windows
            "DejaVuSans.ttf", "FreeSans.ttf",          # Linux
            "/System/Library/Fonts/Helvetica.ttc",     # macOS
            "/System/Library/Fonts/SFNSText.ttf"       # macOS
        ]
        
        for system_font in system_fonts:
            try:
                font = ImageFont.truetype(system_font, font_size_used)
                print(f"Using system font '{system_font}' with size {font_size}")
                break
            except Exception:
                continue
    
    # Last resort: Use a default font and scale it (though this might not be perfect)
    if font is None:
        print(f"Using default font. Font size may not appear as expected.")
        font = ImageFont.load_default()
        # Some versions of PIL don't support resizing the default font
    
    # Generate an image for each unique letter
    for char, (filename, group) in char_map.items():
        if char.strip():  # Skip whitespace-only characters
            output_path_group = output_path
            if group:
                output_path_group = output_path / group
                output_path_group.mkdir(parents=True, exist_ok=True)

            # Add background subfolder if available
            if background_subfolder:
                output_path_group = output_path_group / background_subfolder
                output_path_group.mkdir(parents=True, exist_ok=True)

            # create the oversampled image
            if background_image:
                img = background_image.copy()
            else:
                img = Image.new('RGBA', work_size, (0, 0, 0, 0))

            draw = ImageDraw.Draw(img)
            
            # Calculate text size to center it
            try:
                # For newer Pillow versions
                left, top, right, bottom = draw.textbbox((0, 0), char, font=font)
                text_width = right - left
                text_height = bottom - top
                
                # Account for the text's position relative to the origin for proper centering
                position = ((img.width - text_width) // 2 - left, (img.height - text_height) // 2 - top)
            except AttributeError:
                # For older Pillow versions
                text_width, text_height = draw.textsize(char, font=font)
                
                # Try to get offset information if available
                try:
                    offset_x, offset_y = font.getoffset(char)
                    position = ((img.width - text_width) // 2 - offset_x, (img.height - text_height) // 2 - offset_y)
                except (AttributeError, TypeError):
                    # Fallback to simple centering if offset isn't available
                    position = ((img.width - text_width) // 2, (img.height - text_height) // 2)
            
            # Draw the letter
            draw.text(position, char, font=font, fill=text_color)

            # downsample to final size with aliasing
            if aliasing:
                img = img.resize(image_size, resample=Image.LANCZOS)
            else:
                img = img.resize(image_size, resample=Image.NEAREST)

            # Determine filename with optional background suffix
            name = f"{filename}{suffix}.block.png" if suffix else f"{filename}.block.png"
            img.save(output_path_group / name)

    # Print a summary of all characters generated
    print("Generated characters: " + "".join(char_map.keys()))
    
    # Move files to backgrounds subdirectory
    output_path = Path(output_dir)
    backgrounds_dir = output_path / "custom"
    
    # Create backgrounds directory if it doesn't exist
    backgrounds_dir.mkdir(exist_ok=True)
    
    # Find all files (not directories) in output_dir
    for file_path in output_path.glob("letter_blocks/*.block.png"):
        if file_path.is_file() and not str(file_path).startswith(str(backgrounds_dir)):
            # Get filename without .block.png
            base_name = file_path.stem.removesuffix(".block")
            
            # Create target directory
            target_dir = backgrounds_dir / base_name
            target_dir.mkdir(exist_ok=True)
            
            # Create target file path
            target_file = target_dir / file_path.name
            
            # Move the file
            print(f"Moving {file_path} to {target_file}")
            shutil.copy2(file_path, target_file)
            os.remove(file_path)

    # Return unmodified map_py_item
    return map_py_item
