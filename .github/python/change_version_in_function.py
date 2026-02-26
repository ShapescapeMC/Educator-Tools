from pathlib import Path
import sys
import re

TAG = sys.argv[1]

function_path = Path(
    "./regolith/filters_data/modular_mc/educator_tools/logic/subscripts/utils/addon-version.ts"
)

if function_path.exists():
    # Read the existing file content
    with open(function_path, "r") as f:
        content = f.read()

    # Extract version from TAG
    version = TAG.split(".")
    version = f"{version[0]}.{version[1]}.{version[2]}"

    # Replace the version string in the TypeScript function
    updated_content = re.sub(
        r'return\s+"[^"]+";',
        f'return "{version}";',
        content
    )

    # Write the updated content back to the file
    with open(function_path, "w") as f:
        f.write(updated_content)
else:
    print(f"Not able to find addon-version.ts at path {function_path}")
    print("Skipping step.")
