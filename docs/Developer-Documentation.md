---
icon: material/book-open-page-variant
---

# 🔧 Developer Documentation

**This section is for developers and advanced users who want to contribute to Educator Tools, customize the pack, or understand how it works.**

**If you're a teacher looking to use Educator Tools in your classroom, see the [Quick Start Guide](Quick-Start-Guide.md) instead.**

---

## Overview

Educator Tools is an open-source Minecraft Education behavior pack built with modern development tools and workflows. This documentation will help you set up a development environment, understand the codebase, and contribute improvements.

---

## Getting Started as a Developer

### Prerequisites

Before you begin developing:

- **Minecraft Education Edition** installed and working
- **Basic coding knowledge** (JavaScript/TypeScript helpful but not required)
- **Git** installed for version control
- **Text editor** (VS Code recommended)
- **Node.js** (if working with build scripts)

### Quick Start for Developers

1. **[Development Setup](Development-Setup.md)** - Set up your development environment
2. **[Contributing Guide](Contributing.md)** - Understand the contribution workflow
3. **Clone the repository** and start exploring the code
4. **Make changes** and test them locally
5. **Submit a pull request** when ready

---

## Core Documentation

### [Development Setup](Development-Setup.md)

Learn how to set up your development environment to work on Educator Tools.

**Topics covered:**
- Installing required tools
- Cloning the repository
- Building the pack from source
- Running tests
- Debugging techniques

**[Read Development Setup Guide →](Development-Setup.md)**

---

### [Contributing](Contributing.md)

Guidelines for contributing code, features, or bug fixes to Educator Tools.

**Topics covered:**
- Contribution workflow
- Code style and standards
- Pull request process
- Issue reporting guidelines
- Testing requirements

**[Read Contributing Guide →](Contributing.md)**

---

### [Translations](Translations.md)

How to add or update language translations for Educator Tools.

**Topics covered:**
- Translation file structure
- Adding a new language
- Updating existing translations
- Testing translations in-game
- Localization best practices

**[Read Translations Guide →](Translations.md)**

---

### [Advanced Letter Blocks Configuration](Advanced-Letter-Blocks-Configuration.md)

Create custom letter block sets with your own fonts, colors, and backgrounds.

**Topics covered:**
- JSON configuration structure
- Adding custom fonts
- Creating background images
- Unicode character support
- Building and testing custom letter blocks

**[Read Advanced Configuration Guide →](Advanced-Letter-Blocks-Configuration.md)**

---

## Repository Structure

Understanding the codebase organization:

```
Educator-Tools/
├── regolith/                  # Build system configuration
│   ├── filters/              # Build filters and processors
│   └── filters_data/         # Filter data and templates
│       └── system_template/
│           └── letter_blocks/  # Letter blocks configuration
│               ├── _scope.json  # Letter sets definition
│               ├── fonts/       # Custom font files
│               └── *.png        # Background images
│
├── packs/                     # Output directory for built packs
│   └── BP/                   # Behavior Pack
│       ├── manifest.json     # Pack metadata
│       ├── scripts/          # Game scripts
│       └── items/            # Item definitions
│
├── src/                       # Source files
│   └── ...                   # TypeScript/JavaScript source
│
├── .github/                   # GitHub configuration
│   └── workflows/            # CI/CD workflows
│
└── docs/                      # Documentation (this wiki)
```

---

## Development Workflow

### Typical Development Cycle

1. **Fork and clone** the repository
2. **Create a feature branch** (`git checkout -b feature/my-new-feature`)
3. **Make your changes** in the source files
4. **Build the pack** using the build system
5. **Test in Minecraft** Education Edition
6. **Commit changes** with clear messages
7. **Push to your fork** and create a pull request
8. **Address review feedback** if needed
9. **Merge** when approved

### Testing Changes

**Local testing:**
1. Build the pack (`npm run build` or equivalent)
2. Copy output to Minecraft's behavior packs folder
3. Load into a test world
4. Verify functionality
5. Check console/logs for errors

**Automated testing:**
- Run test suite before committing
- CI/CD runs tests automatically on pull requests
- All tests must pass before merge

---

## Technical Architecture

### Key Technologies

**Build System:**
- **Regolith** - Minecraft addon build tool
- **Node.js** - Build scripts and tooling
- **TypeScript** - Type-safe scripting (if applicable)

**Game Integration:**
- **Behavior Packs** - Server-side logic and content
- **Script API** - Minecraft scripting interface
- **JSON** - Data definitions and configuration

### How It Works

1. **Source files** define tools and features
2. **Build system** processes and compiles source
3. **Behavior pack** is generated with all assets
4. **Minecraft** loads pack and executes scripts
5. **Teachers** interact through in-game UI

---

## Adding New Features

### Planning a New Feature

Before coding:

1. **Check existing issues** - Has it been suggested?
2. **Create a feature request issue** - Discuss the idea
3. **Get feedback** from maintainers
4. **Plan the implementation** - Design before coding

### Implementation Checklist

When adding a new tool or feature:

- [ ] Design the user interface (how teachers interact)
- [ ] Write the backend logic (scripts and data)
- [ ] Add localization strings for all languages
- [ ] Create documentation (wiki page)
- [ ] Write tests for the feature
- [ ] Test in multiple scenarios
- [ ] Update CHANGELOG
- [ ] Submit pull request with screenshots/videos

---

## Code Style Guidelines

### JavaScript/TypeScript

```javascript
// Use clear, descriptive variable names
const playerName = player.getName();

// Functions should be well-commented
/**
 * Teleports a player to a target location
 * @param {Player} player - The player to teleport
 * @param {Location} target - The destination
 */
function teleportPlayer(player, target) {
  // Implementation
}

// Use consistent formatting
if (condition) {
  doSomething();
} else {
  doSomethingElse();
}
```

### JSON Configuration

```json
{
  "id": "descriptive_identifier",
  "property": "value",
  "nested": {
    "formatted": "consistently",
    "indented": "properly"
  }
}
```

**Best practices:**
- Use 2-space indentation
- No trailing commas in JSON
- Validate JSON before committing
- Comment complex logic

---

## Debugging Tips

### Common Issues

**Pack doesn't load:**
- Check manifest.json format
- Verify pack UUID is valid
- Look for JSON syntax errors in definitions

**Scripts don't run:**
- Check console output in Minecraft
- Verify script module is enabled in manifest
- Test script syntax separately

**Items don't appear:**
- Confirm item definitions are correct
- Check creative inventory categories
- Verify identifiers are unique

### Debugging Tools

- **Minecraft logs** - `%localappdata%\Packages\Microsoft.MinecraftEducationEdition_8wekyb3d8bbwe\LocalState\logs`
- **Console commands** - Use `/reload` to reload behavior packs
- **JSON validators** - [JSONLint](https://jsonlint.com/), VS Code built-in
- **Script debugging** - Console.log() statements

---

## Contributing Back

### Pull Request Process

1. **Fork** the repository to your GitHub account
2. **Clone** your fork locally
3. **Branch** from main (`git checkout -b feature/your-feature`)
4. **Make changes** and test thoroughly
5. **Commit** with descriptive messages
6. **Push** to your fork
7. **Create PR** from your fork to the main repo
8. **Respond** to review feedback
9. **Merge** when approved

### What Makes a Good PR

✅ **Clear description** - Explain what and why
✅ **Small, focused changes** - One feature or fix per PR
✅ **Tests included** - Verify functionality
✅ **Documentation updated** - Wiki pages if needed
✅ **Clean commits** - Logical, well-described commits
✅ **No unrelated changes** - Stay on topic

---

## Community Resources

### Getting Help

- **[GitHub Discussions](https://github.com/ShapescapeMC/Educator-Tools/discussions)** - Ask questions
- **[GitHub Issues](https://github.com/ShapescapeMC/Educator-Tools/issues)** - Report bugs, suggest features
- **[Contributing Guide](Contributing.md)** - Contribution guidelines

### Staying Updated

- **Watch the repository** - Get notified of changes
- **Read release notes** - Understand what's new
- **Follow discussions** - Participate in design decisions

---

## Advanced Topics

### Custom Letter Blocks

See [Advanced Letter Blocks Configuration](Advanced-Letter-Blocks-Configuration.md) for detailed guide on:
- Creating custom font sets
- Adding Unicode characters
- Designing background images
- Building image-only blocks

### Internationalization

See [Translations](Translations.md) for information on:
- Translation file format
- Adding new languages
- Testing localized content
- Language fallback system

### Build System Customization

For advanced users wanting to modify the build process:
- Study `regolith` configuration
- Understand filter system
- Create custom build filters
- Optimize build performance

---

## License and Legal

Educator Tools is open-source software. When contributing:

- **Respect the license** - Follow terms of the project license
- **Original work only** - Don't include copyrighted content
- **Attribute properly** - Credit external resources
- **Follow Minecraft EULA** - Comply with Minecraft's terms

---

## Need Help?

**For development questions:**
→ [GitHub Discussions](https://github.com/ShapescapeMC/Educator-Tools/discussions)

**For bug reports:**
→ [GitHub Issues](https://github.com/ShapescapeMC/Educator-Tools/issues)

**For general usage (non-developer):**
→ [Getting Help](Getting-Help.md)

---

**Back to:** [Home](index.md) | [Contributing](Contributing.md) | [Development Setup](Development-Setup.md)
