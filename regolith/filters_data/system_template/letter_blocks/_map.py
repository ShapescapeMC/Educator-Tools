(
    [
        # Generate letter images for each letter_set
        *[
            generate_letter_images(
                map_py_item={"source": "letter_blocks/**/*.block.png", "target": AUTO_FLAT_SUBFOLDER,"on_conflict": "skip"},
                letters=ls["letters"],
                output_dir="./letter_blocks",
                font_size=ls["font_size"],
                text_color=tuple(ls["text_color"]),
                image_size=tuple(ls["image_size"]),
                font_path=ls["font_path"],
                background_image_path=ls["background_image_path"],
                suffix=ls["suffix"],
                aliasing=ls["aliasing"]
            )
            for ls in letter_sets
        ]
    ]
    + [
        # Textures
        #{"source": "letter_blocks/**/*.block.png", "target": AUTO_FLAT_SUBFOLDER},
        # Item texture / Terrain Texture for block and item icon
        {
            "source": "block/item_texture.json",
            "target": "RP/textures/item_texture.json",
            "on_conflict": "merge",
            "scope": {
                "letters": [
                    p.stem.removesuffix(".block")
                    for p in Path("letter_blocks").glob("**/*.png")
                ]
            },
            "json_template": True,
        },
        {
            "source": "block/terrain_texture.json",
            "target": "RP/textures/terrain_texture.json",
            "on_conflict": "merge",
            "scope": {
                "letters": [
                    p.stem.removesuffix(".block")
                    for p in Path("letter_blocks").glob("**/*.png")
                ]
            },
            "json_template": True,
        },
        # Assign the texture to the block
        {
            "source": "block/blocks.json",
            "target": "RP/blocks.json",
            "on_conflict": "merge",
            "scope": {
                "letters": [
                    p.stem.removesuffix(".block")
                    for p in Path("letter_blocks").glob("**/*.png")
                ]
            },
            "json_template": True,
        },
    ]
    + [
        # Block definition
        {
            "source": "block/letter_block.block.json",
            "target": f"BP/blocks/{p.stem.removesuffix('.block')}.block.json",
            "scope": {"letter": p.stem.removesuffix(".block"), "background": p.parent.name if p.parent.name != "letter_blocks" else p.name.removesuffix('.block.png')},
            "json_template": True,
        }
        for p in Path("letter_blocks").glob("**/*.png")
    ]
    + [
        # Block loot
        {
            "source": "block/letter_block.loot.json",
            "target": f"BP/loot_tables/edu_tools/{p.stem.removesuffix('.block')}.loot.json",
            "scope": {"letter": p.stem.removesuffix(".block")},
            "json_template": True,
        }
        for p in Path("letter_blocks").glob("**/*.png")
    ]
    + [
        # Item definition
        {
            "source": "block/letter_block_placer.bp_item.json",
            "target": f"BP/items/{p.stem.removesuffix('.block')}.bp_item.json",
            "scope": {
                "letter": p.stem.removesuffix(".block"),
                "group": p.parent.parent.name,
            },
            "json_template": True,
        }
        for p in Path("letter_blocks").glob("**/*.png")
    ]
    + [
        # Attachable
        {
            "source": "block/letter_block_placer.attachable.json",
            "target": f"RP/attachables/{p.stem.removesuffix('.block')}.attachable.json",
            "scope": {"letter": p.stem.removesuffix(".block")},
            "json_template": True,
        }
        for p in Path("letter_blocks").glob("**/*.png")
    ]
    + [
        # Attachable model and animaiton
        {"source": "block/letter_block_placer.geo.json", "target": AUTO_FLAT},
        {"source": "block/letter_block_placer.animation.json", "target": AUTO_FLAT},
    ]
    + [
        # The debug function for getting all block items
        {
            "source": "block/letter_block.mcfunction",
            "target": AUTO_FLAT,
            "scope": {
                "blocks": [
                    f'edu_tools:letter_block_{p.stem.removesuffix(".block")}_placer'
                    for p in Path("letter_blocks").glob("**/*.png")
                ],
                "categories": [
                    [
                        f'edu_tools:letter_block_{p.stem.removesuffix(".block")}_placer'
                        for p in subfolder.glob("**/*.png")
                    ]
                    for subfolder in Path("letter_blocks").iterdir()
                    if subfolder.is_dir()
                ],
                "category_names": [
                    subfolder.name
                    for subfolder in Path("letter_blocks").iterdir()
                    if subfolder.is_dir()
                ],
            },
        }
    ]
)
