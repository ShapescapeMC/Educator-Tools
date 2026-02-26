#!/usr/bin/env python3
"""
Update GitHub release description with download buttons.

This script reads the release_downloads_config.json and generates
markdown download buttons for the release assets.
"""

import json
import os
import subprocess
import fnmatch

def get_release_assets(tag_name: str) -> list[dict]:
    """Get the list of assets for a release using gh CLI."""
    result = subprocess.run(
        ["gh", "release", "view", tag_name, "--json", "assets"],
        capture_output=True,
        text=True,
        check=True
    )
    data = json.loads(result.stdout)
    return data.get("assets", [])

def get_release_body(tag_name: str) -> str:
    """Get the current release body using gh CLI."""
    result = subprocess.run(
        ["gh", "release", "view", tag_name, "--json", "body"],
        capture_output=True,
        text=True,
        check=True
    )
    data = json.loads(result.stdout)
    return data.get("body", "")

def find_asset_by_pattern(assets: list[dict], pattern: str) -> dict | None:
    """Find an asset matching the given glob pattern."""
    for asset in assets:
        if fnmatch.fnmatch(asset["name"], pattern):
            return asset
    return None

def generate_download_section(config: dict, assets: list[dict]) -> str:
    """Generate the markdown download section."""
    lines = []

    # Separator
    lines.append("")
    lines.append("---")
    lines.append("")

    # Header section (custom text before downloads)
    header = config.get("header")
    if header:
        title = header.get("title", "").strip()
        content = header.get("content", "").strip()

        # Only include header section if there's actual content
        if title or content:
            if title:
                lines.append(f"## {title}")
                lines.append("")

            if content:
                # Support multi-line content from JSON (newlines as \n)
                lines.append(content)
                lines.append("")

            lines.append("---")
            lines.append("")

    # Main download section
    main_download = config.get("main_download")
    if main_download:
        asset = find_asset_by_pattern(assets, main_download["file_pattern"])
        if asset:
            lines.append("## Downloads")
            lines.append("")

            # Main download button (large, centered)
            download_url = asset["url"]
            name = main_download["name"]
            description = main_download.get("description", "")
            color = main_download.get("color", "00D26A")  # Bright green default

            lines.append(f"### {name}")
            if description:
                lines.append(f"> {description}")
            lines.append("")

            # Large download button with bright color using for-the-badge style
            # Format: badge/LABEL-MESSAGE-COLOR
            badge_url = f"https://img.shields.io/badge/%E2%AC%87%EF%B8%8F_DOWNLOAD-{name.replace(' ', '_').replace('-', '--')}-{color}?style=for-the-badge&logoColor=white"
            lines.append(f"[![DOWNLOAD {name}]({badge_url})]({download_url})")
            lines.append("")
            lines.append(f"**File:** `{asset['name']}` ({format_size(asset.get('size', 0))})")
            lines.append("")

    # Extensions section
    extensions = config.get("extensions", [])
    if extensions:
        extension_assets = []
        for ext in extensions:
            asset = find_asset_by_pattern(assets, ext["file_pattern"])
            if asset:
                extension_assets.append((ext, asset))

        if extension_assets:
            lines.append("---")
            lines.append("")
            lines.append("### Extensions")
            lines.append("")

            for ext, asset in extension_assets:
                download_url = asset["url"]
                name = ext["name"]
                description = ext.get("description", "")
                color = ext.get("color", "7C3AED")  # Bright purple default for extensions

                lines.append(f"#### {name}")
                if description:
                    lines.append(f"> {description}")
                lines.append("")

                # Extension download button - also for-the-badge but with different color
                badge_url = f"https://img.shields.io/badge/%E2%AC%87%EF%B8%8F_DOWNLOAD-{name.replace(' ', '_').replace('-', '--')}-{color}?style=for-the-badge&logoColor=white"
                lines.append(f"[![DOWNLOAD {name}]({badge_url})]({download_url})")
                lines.append("")
                lines.append(f"**File:** `{asset['name']}` ({format_size(asset.get('size', 0))})")
                lines.append("")

    return "\n".join(lines)

def format_size(size_bytes: int) -> str:
    """Format file size in human readable format."""
    if size_bytes == 0:
        return "Unknown size"
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"

def update_release_body(tag_name: str, new_body: str) -> None:
    """Update the release body using gh CLI."""
    subprocess.run(
        ["gh", "release", "edit", tag_name, "--notes", new_body],
        check=True
    )

def main():
    # Get environment variables
    tag_name = os.environ.get("RELEASE_TAG")
    if not tag_name:
        print("ERROR: RELEASE_TAG environment variable not set")
        return 1

    # Load configuration
    config_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "release_downloads_config.json"
    )

    if not os.path.exists(config_path):
        print(f"ERROR: Configuration file not found: {config_path}")
        return 1

    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    # Get release assets
    print(f"Fetching assets for release {tag_name}...")
    assets = get_release_assets(tag_name)
    print(f"Found {len(assets)} assets")

    if not assets:
        print("WARNING: No assets found, skipping description update")
        return 0

    # Get current release body
    current_body = get_release_body(tag_name)
    print(f"Current release body length: {len(current_body)} characters")

    # Check if download section already exists
    if "## Downloads" in current_body:
        print("Download section already exists, skipping update")
        return 0

    # Generate download section
    download_section = generate_download_section(config, assets)

    # Append to current body
    new_body = current_body + download_section

    # Update release
    print("Updating release description...")
    update_release_body(tag_name, new_body)
    print("Release description updated successfully!")

    return 0

if __name__ == "__main__":
    exit(main())
