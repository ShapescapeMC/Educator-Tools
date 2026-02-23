# ⚙️ Advanced Letter Blocks Configuration

**⚠️ This guide is for advanced users and developers who want to create custom letter blocks with their own fonts, colors, and backgrounds.**

**If you're a teacher looking to use Letter Blocks in your classroom, see:**
- **[Letter Blocks - Getting Started](Letter-Blocks-Getting-Started.md)** for basic usage
- **[More Letter Blocks Extension](Extensions-More-Letter-Blocks.md)** for ready-made expansion packs

---

## Overview

This guide explains how to create custom letter block sets by editing the pack's configuration files and adding your own fonts and background images.

**Prerequisites:**
- Understanding of JSON file format
- Access to the Educator Tools source code
- Familiarity with the [Development Setup](Development-Setup.md)
- Basic image editing skills

---

## Before You Begin

### Requirements

✅ Review the [Contributing Guide](Contributing.md) to understand the development workflow

✅ Set up your development environment following [Development Setup](Development-Setup.md)

✅ Locate your working directory:
```text
regolith/filters_data/system_template/letter_blocks/
```

### File Structure

```
letter_blocks/
├── _scope.json              ← Configuration file (you'll edit this)
├── fonts/                   ← Place custom font files here (.ttf)
│   ├── AzeretMono-Black.ttf
│   └── YourCustomFont.ttf
├── rainbow.block.png        ← Background images go here
├── star.block.png
└── your_background.png
```

---

## Step 1: Prepare Your Assets

### Custom Font Files

1. Obtain a TrueType font file (`.ttf` format)
2. Place it in the `fonts/` subdirectory
3. Note the exact filename for use in configuration

**Example:**
```
fonts/AzeretMono-Black.ttf
fonts/MyCustomFont.ttf
```

### Background Images

1. Create or obtain a square PNG image (recommended: 64×64 pixels)
2. Place it directly in the `letter_blocks/` directory
3. Note the exact filename for use in configuration

**Example:**
```
letter_blocks/rainbow.block.png
letter_blocks/my_background.png
```

**Image Tips:**
- Use square dimensions (64×64, 128×128, 256×256)
- PNG format with transparency support
- Design should work well when repeated on all 6 block faces
- Test with different colors to ensure text is readable

---

## Step 2: Open the Configuration File

Locate and open the `_scope.json` file:

```text
regolith/filters_data/system_template/letter_blocks/_scope.json
```

This file contains an array named `letter_sets`. Each object within this array defines a distinct set of letter blocks.

---

## Step 3: Understanding the JSON Structure

### Basic Structure

```json
{
  "letter_sets": [
    {
      "id": "main_letter_set",
      "font_size": 48,
      "text_color": [10, 10, 10, 255],
      "image_size": [64, 64],
      "font_path": "fonts/AzeretMono-Black.ttf",
      "background_image_path": "letter_blocks/rainbow.block.png",
      "suffix": "rainbow",
      "antialias": true,
      "letters": [
        {
          "char": "A",
          "safe_name": "A",
          "group": "letter"
        }
      ]
    }
  ]
}
```

### Property Definitions

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `id` | String | Unique identifier for debugging and reference | `"my_custom_set"` |
| `font_size` | Number | Font size in pixels | `48` |
| `text_color` | Array | Text color in RGBA format [R, G, B, A] | `[10, 10, 10, 255]` (black) |
| `image_size` | Array | Texture dimensions [width, height] - must be square | `[64, 64]` |
| `font_path` | String | Path to font file relative to project root | `"fonts/MyFont.ttf"` |
| `background_image_path` | String | Path to background image | `"letter_blocks/bg.png"` |
| `suffix` | String | Required suffix for item names (must be unique) | `"custom"` |
| `antialias` | Boolean | Enable smooth edges on text | `true` |
| `letters` | Array | List of characters to generate (see below) | `[...]` |

### Letter Object Structure

Each letter in the `letters` array has these properties:

```json
{
  "char": "A",           // The actual character to render
  "safe_name": "A",      // Filename-safe identifier (no special chars)
  "group": "letter"      // Category: "letter", "number", "symbol", "punctuation"
}
```

**Examples:**

```json
// Regular letter
{
  "char": "A",
  "safe_name": "A",
  "group": "letter"
}

// Number
{
  "char": "5",
  "safe_name": "5",
  "group": "number"
}

// Symbol (using unicode escape)
{
  "char": "\u2665",      // ♥ heart symbol
  "safe_name": "heart",
  "group": "symbol"
}

// Special character
{
  "char": "!",
  "safe_name": "exclamation",
  "group": "punctuation"
}
```

---

## Step 4: Adding a New Letter Set

Insert your new letter set as an object within the `letter_sets` array:

### Example: Custom Rainbow Set

```json
{
  "letter_sets": [
    {
      "id": "main_letter_set"
      // ... existing properties
    },
    {
      "id": "my_custom_rainbow_set",
      "font_size": 48,
      "text_color": [255, 255, 255, 255],
      "image_size": [64, 64],
      "font_path": "fonts/AzeretMono-Black.ttf",
      "background_image_path": "letter_blocks/rainbow.block.png",
      "suffix": "rainbow",
      "antialias": true,
      "letters": [
        {
          "char": "A",
          "safe_name": "A",
          "group": "letter"
        },
        {
          "char": "B",
          "safe_name": "B",
          "group": "letter"
        },
        {
          "char": "1",
          "safe_name": "1",
          "group": "number"
        },
        {
          "char": "+",
          "safe_name": "plus",
          "group": "symbol"
        }
      ]
    }
  ]
}
```

### Color Reference (RGBA Format)

Colors are specified as `[Red, Green, Blue, Alpha]` with values from 0-255:

```json
[0, 0, 0, 255]         // Black
[255, 255, 255, 255]   // White
[255, 0, 0, 255]       // Red
[0, 255, 0, 255]       // Green
[0, 0, 255, 255]       // Blue
[255, 255, 0, 255]     // Yellow
[128, 128, 128, 255]   // Gray
[0, 0, 0, 128]         // Semi-transparent black
```

---

## Step 5: Creating Image-Only Blocks

To create blocks using a single image for all faces (no text), omit the `letters` array:

```json
{
  "id": "star_block",
  "background_image_path": "letter_blocks/star.block.png",
  "suffix": "star"
}
```

This creates blocks that display only the background image, useful for decorative blocks or symbols that don't need text overlays.

---

## Step 6: Unicode Characters and Special Symbols

You can include any Unicode character using escape sequences:

### Common Unicode Characters

```json
// Math symbols
{ "char": "\u00D7", "safe_name": "multiply", "group": "symbol" }  // ×
{ "char": "\u00F7", "safe_name": "divide", "group": "symbol" }    // ÷
{ "char": "\u221A", "safe_name": "sqrt", "group": "symbol" }      // √

// Arrows
{ "char": "\u2190", "safe_name": "arrow_left", "group": "symbol" }   // ←
{ "char": "\u2191", "safe_name": "arrow_up", "group": "symbol" }     // ↑
{ "char": "\u2192", "safe_name": "arrow_right", "group": "symbol" }  // →
{ "char": "\u2193", "safe_name": "arrow_down", "group": "symbol" }   // ↓

// Checkmarks and crosses
{ "char": "\u2713", "safe_name": "check", "group": "symbol" }     // ✓
{ "char": "\u2717", "safe_name": "cross", "group": "symbol" }     // ✗

// Currency
{ "char": "\u20AC", "safe_name": "euro", "group": "symbol" }      // €
{ "char": "\u00A3", "safe_name": "pound", "group": "symbol" }     // £
```

**Finding Unicode values:**
- Visit [Unicode Character Table](https://unicode-table.com/)
- Search for your character
- Copy the `\uXXXX` escape sequence

---

## Step 7: Save and Build

### JSON Validation

Before building, validate your JSON:

1. **Check syntax** - Ensure all brackets, braces, and commas are correct
2. **Unique suffixes** - Each letter set must have a unique `suffix` value
3. **Valid paths** - Confirm font and image paths are correct
4. **No trailing commas** - Remove commas after the last item in arrays/objects

**Tools for validation:**
- [JSONLint](https://jsonlint.com/)
- VS Code JSON validation (built-in)

### Building the Pack

1. Save the `_scope.json` file
2. Run the build command (see [Development Setup](Development-Setup.md))
3. The pack will generate textures and item definitions based on your configuration

### Testing

1. Load the built pack into Minecraft Education
2. Open Creative inventory
3. Search for your letter blocks using the suffix name
4. Place blocks and verify appearance
5. Check game logs for any errors

---

## Troubleshooting

### Problem: Blocks don't appear in inventory

**Solutions:**
- Verify suffix is unique (not used by another set)
- Check JSON syntax for errors
- Ensure paths to fonts and images are correct
- Rebuild the pack completely

### Problem: Text is cut off or positioned poorly

**Solutions:**
- Adjust `font_size` (try smaller values)
- Check `image_size` matches background image dimensions
- Ensure font file is valid and not corrupted
- Try a different font with better character sizing

### Problem: Background image looks stretched or wrong

**Solutions:**
- Use square dimensions (64×64, 128×128, etc.)
- Verify image path is correct
- Check image format is PNG
- Ensure image isn't corrupt

### Problem: Build fails with JSON error

**Solutions:**
- Validate JSON syntax using JSONLint
- Check for missing commas between objects
- Remove trailing commas after last items
- Ensure all strings are properly quoted

---

## Advanced Examples

### Example 1: Bilingual Letter Set (English + Spanish)

```json
{
  "id": "bilingual_set",
  "font_size": 44,
  "text_color": [0, 0, 0, 255],
  "image_size": [64, 64],
  "font_path": "fonts/AzeretMono-Black.ttf",
  "background_image_path": "letter_blocks/white.block.png",
  "suffix": "bilingual",
  "antialias": true,
  "letters": [
    { "char": "A", "safe_name": "A", "group": "letter" },
    { "char": "Á", "safe_name": "A_acute", "group": "letter" },
    { "char": "É", "safe_name": "E_acute", "group": "letter" },
    { "char": "Í", "safe_name": "I_acute", "group": "letter" },
    { "char": "Ñ", "safe_name": "N_tilde", "group": "letter" },
    { "char": "Ó", "safe_name": "O_acute", "group": "letter" },
    { "char": "Ú", "safe_name": "U_acute", "group": "letter" },
    { "char": "Ü", "safe_name": "U_umlaut", "group": "letter" }
  ]
}
```

### Example 2: Math Symbols Set

```json
{
  "id": "advanced_math",
  "font_size": 52,
  "text_color": [255, 255, 255, 255],
  "image_size": [64, 64],
  "font_path": "fonts/MathFont.ttf",
  "background_image_path": "letter_blocks/chalkboard.block.png",
  "suffix": "math",
  "antialias": true,
  "letters": [
    { "char": "+", "safe_name": "plus", "group": "symbol" },
    { "char": "-", "safe_name": "minus", "group": "symbol" },
    { "char": "\u00D7", "safe_name": "multiply", "group": "symbol" },
    { "char": "\u00F7", "safe_name": "divide", "group": "symbol" },
    { "char": "=", "safe_name": "equals", "group": "symbol" },
    { "char": "\u221A", "safe_name": "sqrt", "group": "symbol" },
    { "char": "\u03C0", "safe_name": "pi", "group": "symbol" },
    { "char": "\u2264", "safe_name": "less_equal", "group": "symbol" },
    { "char": "\u2265", "safe_name": "greater_equal", "group": "symbol" }
  ]
}
```

---

## Best Practices

✅ **Start small** - Create a test set with just a few characters before making a full alphabet

✅ **Test incrementally** - Build and test after adding each letter set to catch errors early

✅ **Use descriptive IDs** - Choose clear, meaningful IDs for easier debugging

✅ **Document your sets** - Add comments (outside JSON) explaining each custom set's purpose

✅ **Backup before editing** - Keep a copy of the original `_scope.json`

✅ **Version control** - Use Git to track changes and revert if needed

✅ **Share your creations** - Consider contributing custom sets back to the project

---

## Contributing Custom Letter Blocks

If you create custom letter blocks that would benefit other educators:

1. Follow the [Contributing Guide](Contributing.md)
2. Submit a pull request with your letter set configuration
3. Include sample images showing the blocks in use
4. Provide fonts (if openly licensed) or instructions for obtaining them

---

## Related Documentation

- **[Development Setup](Development-Setup.md)** - Set up your development environment
- **[Contributing](Contributing.md)** - How to contribute to Educator Tools
- **[Extensions](Extensions.md)** - Learn about creating extensions
- **[Letter Blocks - Getting Started](Letter-Blocks-Getting-Started.md)** - Basic usage guide for teachers
- **[More Letter Blocks Extension](Extensions-More-Letter-Blocks.md)** - Ready-made expansion packs

---

**Need Help?** Visit [Getting Help](Getting-Help.md) or create an issue on [GitHub](https://github.com/ShapescapeMC/Educator-Tools/issues).
