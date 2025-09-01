from pathlib import Path
import shutil
import json
import sys
import re

# --- Constants and Arguments ---
ZIP_FILES_PATH = sys.argv[1]  # Path to copy files into before zipping
ROOT_PATH = sys.argv[2]       # Root of the addon
MCADDON_FILE_ROOT = sys.argv[3]  # Directory to put the mcaddon file into
ZIP_FILE_SUFFIX = sys.argv[4]    # Suffix for the zip file name (version tag)
SUB_PRODUCT_NAME = sys.argv[5]   # Sub product name

# Supported language codes
LANGUAGES = [
    "de_DE", "ru_RU", "zh_CN", "fr_FR", "it_IT", "pt_BR", "fr_CA", "zh_TW",
    "es_MX", "es_ES", "pt_PT", "en_GB", "ko_KR", "ja_JP", "nl_NL", "bg_BG",
    "cs_CZ", "da_DK", "el_GR", "fi_FI", "hu_HU", "id_ID", "nb_NO", "pl_PL",
    "sk_SK", "sv_SE", "tr_TR", "uk_UA",
]


def rename_lang_file(path, product_name, product_description, pack_count, index):
    """
    Update pack.name and pack.description in a .lang file.
    If multiple packs, append pack index to the name.
    """
    with open(path, "r", encoding="utf-8-sig") as file:
        if pack_count > 1:
            product_name = f"{product_name} pack {index}"
        data = file.readlines()
        modified_data = []
        for line in data:
            if line.startswith("pack.name"):
                modified_data.append(f"pack.name={product_name}\n")
            elif line.startswith("pack.description"):
                modified_data.append(f"pack.description={product_description}\n")
            else:
                modified_data.append(line)
    with open(path, "w", encoding="utf8") as file:
        file.writelines(modified_data)


def update_manifest_version(manifest_path, version_str):
    """
    Update the version fields in a manifest.json file.
    """
    with open(manifest_path, "r") as f:
        manifest = json.load(f)
    # Remove leading 'v' and any suffix after '-'
    if version_str.startswith("v"):
        version_str = version_str[1:]
    version_core = version_str.split("-")[0]
    version_components = version_core.split(".")
    numeric_version = [int(num) for num in version_components]
    manifest["header"]["version"] = numeric_version
    if "dependencies" in manifest and len(manifest["dependencies"]) > 0:
        manifest["dependencies"][0]["version"] = numeric_version
    for module in manifest.get("modules", []):
        if module.get("language") == "javascript":
            module["version"] = numeric_version
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=4)


def copy_and_prepare_pack(pack, dest_path, pack_icon_path, product_name, product_description, pack_count, index, version_str, is_behavior_pack):
    """
    Copy a pack (behavior/resource) to the destination, update manifest and language files.
    """
    shutil.copytree(pack, dest_path)
    if pack_icon_path is not None:
        shutil.copy(pack_icon_path, dest_path / "pack_icon.png")
    update_manifest_version(dest_path / "manifest.json", version_str)
    # Update language files
    texts_path = dest_path / "texts"
    en_us_path = texts_path / "en_US.lang"
    if not en_us_path.exists():
        raise Exception(
            f"Unable to find en_US.lang file in {pack}.\n"
            f"The lang file should be in the location:\n"
            f"- {'behavior' if is_behavior_pack else 'resource'}_pack/{{pack}}/texts/en_US.lang\n"
        )
    rename_lang_file(
        path=en_us_path,
        product_name=product_name,
        product_description=product_description,
        pack_count=pack_count,
        index=index,
    )
    # Copy en_US.lang to other languages if missing
    for language in LANGUAGES:
        lang_path = texts_path / f"{language}.lang"
        if not lang_path.exists():
            shutil.copy(en_us_path, lang_path)
    # Write languages.json
    with open(texts_path / "languages.json", "w") as f:
        rp_languages = ["en_US"] + LANGUAGES
        json.dump(rp_languages, f, indent=4)


def clean_pack_name_in_texts(texts_dir):
    """
    Remove ' pack N' suffix from pack.name in all language files in the given directory.
    """
    languages = LANGUAGES + ["en_US"]
    for language in languages:
        path = texts_dir / f"{language}.lang"
        if path.exists():
            with open(path, "r", encoding="utf8") as file:
                data = file.readlines()
            modified_data = []
            for line in data:
                if line.startswith("pack.name"):
                    # Remove ' pack N' at the end
                    pattern = r" pack \d$"
                    modified_data.append(re.sub(pattern, "", line))
                else:
                    modified_data.append(line)
            with open(path, "w", encoding="utf8") as file:
                file.writelines(modified_data)


def main():
    print("create_testing_files.py: Script started")
    zip_path = Path(ZIP_FILES_PATH)
    root_path = Path(ROOT_PATH)
    pack_path = root_path / "pack" / SUB_PRODUCT_NAME
    mcaddon_file_root = Path(MCADDON_FILE_ROOT)

    # Load project config
    with (pack_path / "release_config.json").open("r") as f:
        config = json.load(f)
    product_creator = config["product_creator"]
    product_name = config["product_name"]
    product_key = config["product_key"]
    product_description = config["product_description"]

    # Find pack_icon
    pack_icon_path = None
    for ext in [".png", ".jpg"]:
        candidate = pack_path / f"pack_icon{ext}"
        if candidate.exists():
            pack_icon_path = candidate
            break
    if pack_icon_path is None:
        print(
            "Unable to find pack_icon file.\n"
            "The pack_icon should be in one of the locations:\n"
            "- pack/pack_icon.png\n"
            "- pack/pack_icon.jpg\n"
        )

    # --- Copy and process Behavior Packs ---
    bp_dir_list = [item for item in root_path.glob("behavior_packs/*") if item.is_dir()]
    bp_pack_count = len(bp_dir_list)
    for index, pack in enumerate(bp_dir_list):
        bp_path = zip_path / f"behavior_packs/{index}"
        copy_and_prepare_pack(
            pack=pack,
            dest_path=bp_path,
            pack_icon_path=pack_icon_path,
            product_name=product_name,
            product_description=product_description,
            pack_count=bp_pack_count,
            index=index,
            version_str=ZIP_FILE_SUFFIX,
            is_behavior_pack=True
        )
        # For the first pack, copy texts to the root zip texts folder and clean pack index
        if index == 0:
            shutil.copytree(bp_path / "texts", zip_path / "texts")
            clean_pack_name_in_texts(zip_path / "texts")

    # --- Copy and process Resource Packs ---
    rp_dir_list = [item for item in root_path.glob("resource_packs/*") if item.is_dir()]
    rp_pack_count = len(rp_dir_list)
    for index, pack in enumerate(rp_dir_list):
        rp_path = zip_path / f"resource_packs/{index}"
        copy_and_prepare_pack(
            pack=pack,
            dest_path=rp_path,
            pack_icon_path=pack_icon_path,
            product_name=product_name,
            product_description=product_description,
            pack_count=rp_pack_count,
            index=index,
            version_str=ZIP_FILE_SUFFIX,
            is_behavior_pack=False
        )

    # --- Clean up unnecessary folders ---
    for path in ["texts", "db"]:
        try:
            shutil.rmtree(zip_path / path)
        except Exception:
            print("Could not remove the path " + path)
            pass

    # --- Create .mcaddon file ---
    mcaddon_file_path = (
        mcaddon_file_root / f"{product_creator}_{SUB_PRODUCT_NAME.title().replace('_', ' ')}_{ZIP_FILE_SUFFIX}"
    )
    print(
        f"package_release.py: Creating mcaddon file at {mcaddon_file_path.as_posix()}"
    )
    mcaddon_file_root.mkdir(exist_ok=True, parents=True)
    shutil.make_archive(mcaddon_file_path, "zip", zip_path)
    shutil.move(
        f"{mcaddon_file_path.as_posix()}.zip", f"{mcaddon_file_path.as_posix()}.mcaddon"
    )

    print("package_release.py: Finished with no errors!")


if __name__ == "__main__":
    main()
