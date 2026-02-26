---
icon: material/cog
---

!!! warning "Advanced Users Only"
    This page is intended for experienced users with knowledge of file modification and JSON editing. If you are not comfortable working with configuration files and technical setup, please refer to the [Getting Started](Letter-Blocks-Getting-Started.md) guide instead.

## Creating Custom Letter Blocks

This document explains how to create custom letter blocks using Educator Tools, enabling you to utilize personalized fonts, colors, and backgrounds.

### Before You Begin

* Review the [Contributing Guide](Contributing.md).
* Locate your working directory:

  ```text
  regolith/filters_data/modular_mc/letter_blocks/
  ```
* Place your custom font files into the `fonts/` subdirectory.
* Put your background images directly into the current working directory (`letter_blocks/`).

---

### Step 1: Open the Template

Locate and open the `scope.ts` file:

```text
regolith/filters_data/modular_mc/letter_blocks/_scope.ts
```

### Step 2: JSON Structure Overview

The `scope.jtsson` file contains an array named `letter_sets`. Each object within this array defines a distinct set of letter blocks.

---

### Step 3: Adding a New Letter Set

Add your new letter set as a new object within the existing `letter_sets` array:

```json
{
  "id": "my_custom_rainbow_set",            // Unique identifier for debugging
  "font_size": 48,                            // Font size in pixels
  "text_color": [10, 10, 10, 255],            // Text color in RGBA format
  "image_size": [64, 64],                     // Texture size; must be square
  "font_path": "fonts/AzeretMono-Black.ttf", // Path to your font file
  "background_image_path": "letter_blocks/rainbow.block.png", // Path to background image
  "suffix": "rainbow",                      // Required suffix for item names
  "antialias": true,                          // Enable smooth edges
  "letters": [                                // Characters included in the set
    {
      "char": "A",                           // Character or escape sequence (e.g., "\u2665" for ♥)
      "safe_name": "A",                      // Filename-safe identifier
      "group": "letter"                      // Category (e.g., letter, symbol)
    },
    {
      "char": "B",
      "safe_name": "B",
      "group": "symbol"
    }
  ]
}
```

---

### Step 4: Using a Single Image for All Block Faces

To create blocks using a single image for all faces, place the PNG image in the `letter_blocks/` directory and omit the `letters` array in your JSON:

```json
{
  "background_image_path": "letter_blocks/star.block.png"
}
```

---

### Step 5: Editing the `_scope.json` Safely

* **Do not remove existing entries unless intentional.**
* Always insert your new objects correctly formatted to avoid JSON errors.

Example insertion point:

```json
"letter_sets": [
  {
    "id": "main_letter_set"
    // ... existing properties
  },
  // Your new object here
  {
    "id": "my_custom_set",
    "font_size": 48,
    "text_color": [10, 10, 10, 255],
    "image_size": [64, 64],
    "font_path": "fonts/YourFont.ttf",
    "background_image_path": "letter_blocks/your_background.png",
    "suffix": "custom",
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
```

---

### Final Step: Save and Test

After making your changes:

* Rebuild the addon.
* Load it into Minecraft.
* Check logs for potential issues.

Feel free to experiment with various fonts, colors, and images to create engaging educational materials!
