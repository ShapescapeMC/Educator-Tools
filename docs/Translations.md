---
icon: material/translate
---

# Translations

Educator Tools supports multiple languages to make the add-on accessible to educators and students worldwide. This guide explains how to add or improve translations for the project.

## Current Translation System

The translation system is located in the main repository under:

```
regolith/filters_data/modular_mc/educator_tools/translations/
```

Each language is represented by a `.lang` file named with the appropriate locale code (e.g., `en_US.lang`, `it_IT.lang`, `fr_FR.lang`).

## Adding a New Translation

### Step 1: Set Up Your Development Environment

Before adding translations, make sure you have:

- Forked and cloned the main repository (see [Contributing Guide](Contributing.md))
- Set up the development environment with all dependencies

### Step 2: Create the Translation File

1. **Navigate to the translations directory:**

   ```bash
   cd regolith/filters_data/modular_mc/educator_tools/translations
   ```

2. **Copy the base English file:**
   ```bash
   cp en_US.lang your_locale.lang
   ```
   Replace `your_locale` with the appropriate language code:
   - `it_IT.lang` for Italian (Italy)
   - `es_ES.lang` for Spanish (Spain)
   - `fr_FR.lang` for French (France)
   - `de_DE.lang` for German (Germany)
   - `pt_BR.lang` for Portuguese (Brazil)
   - And so on...

### Step 3: Translate the Content

1. **Open your new language file** in your preferred text editor.

2. **Translate the strings** while keeping the keys unchanged:

   ```
   # Example structure:
   educator_tools.ui.timer.start=Start Timer
   educator_tools.ui.timer.stop=Stop Timer
   ```

   **Important:** Only translate the text after the `=` sign. The keys (before `=`) must remain in English.

3. **Maintain consistency** with UI terminology and keep translations concise to fit UI elements.

### Step 4: Test Your Translation

1. **Build the project** using one of the methods described in the [Contributing Guide](Contributing.md#5-building-the-project--running-regolith).

2. **Test in Minecraft Education** by:
   - Installing the compiled add-on
   - Changing your Minecraft language settings to match your translation
   - Verifying that translated text appears correctly in the UI

### Step 5: Submit Your Translation

1. **Commit your changes:**

#### Using Command Line

   ```bash
   git add regolith/filters_data/modular_mc/educator_tools/translations/your_locale.lang
   git commit -m "Add [Language Name] translation (your_locale)"
   ```

#### Using GitHub Desktop

   1. **Open GitHub Desktop** and make sure your repository is selected
   2. **Review your changes** in the "Changes" tab - you should see your new `.lang` file listed
   3. **Write a commit message** in the "Summary" field (e.g., "Add Italian translation (it_IT)")
   4. **Add a description** (optional) explaining any specific translation choices
   5. **Click "Commit to main"** to save your changes locally

2. **Push to your fork:**

#### Using Command Line

   ```bash
   git push origin main
   ```

#### Using GitHub Desktop

   1. **Click "Push origin"** in the top bar to upload your changes to your fork on GitHub
   2. If this is your first push, GitHub Desktop may prompt you to publish the branch

3. **Create a Pull Request** following the guidelines in the [Contributing Guide](Contributing.md#7-creating-a-pull-request).

## Improving Existing Translations

If you notice errors or want to improve existing translations:

1. **Edit the appropriate `.lang` file** in the translations directory.
2. **Test your changes** as described above.
3. **Submit a Pull Request** with a clear description of the improvements made.

## Translation Guidelines

### Best Practices

- **Keep it concise:** UI elements have limited space
- **Be consistent:** Use the same terminology throughout
- **Consider context:** Some English terms may not translate directly
- **Test thoroughly:** Verify translations work in the actual Minecraft UI

### Common Locale Codes

| Language              | Locale Code |
| --------------------- | ----------- |
| English (US)          | `en_US`     |
| English (UK)          | `en_GB`     |
| Afrikaans             | `af_ZA`     |
| Arabic                | `ar_SA`     |
| Bulgarian             | `bg_BG`     |
| Catalan               | `ca_ES`     |
| Chinese (Simplified)  | `zh_CN`     |
| Chinese (Traditional) | `zh_TW`     |
| Czech                 | `cs_CZ`     |
| Danish                | `da_DK`     |
| Dutch                 | `nl_NL`     |
| Finnish               | `fi_FI`     |
| French (France)       | `fr_FR`     |
| French (Canada)       | `fr_CA`     |
| German (Germany)      | `de_DE`     |
| Greek                 | `el_GR`     |
| Hungarian             | `hu_HU`     |
| Indonesian            | `id_ID`     |
| Italian (Italy)       | `it_IT`     |
| Japanese              | `ja_JP`     |
| Korean                | `ko_KR`     |
| Norwegian (Bokmål)    | `nb_NO`     |
| Polish                | `pl_PL`     |
| Portuguese (Brazil)   | `pt_BR`     |
| Portuguese (Portugal) | `pt_PT`     |
| Russian               | `ru_RU`     |
| Spanish (Spain)       | `es_ES`     |
| Spanish (Mexico)      | `es_MX`     |
| Swedish               | `sv_SE`     |
| Turkish               | `tr_TR`     |
| Ukrainian             | `uk_UA`     |

## Getting Help

If you need assistance with translations:

- **Check existing translations** for reference and consistency
- **Ask questions** in the project's GitHub Issues
- **Review the main Contributing guide** for general development setup

Thank you for helping make Educator Tools accessible to more educators and students worldwide! 🌍
