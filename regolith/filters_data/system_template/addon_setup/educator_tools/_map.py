[
    ## BP Setup
    {
        "source": "bp/manifest.json",
        "target": "BP/manifest.json",
        "json_template": True,
    },
    {
        "source": "bp/pack_icon.png",
        "target": "BP/pack_icon.png"
    },
    {
        "source": "bp/texts/languages.json",
        "target": "BP/texts/languages.json"
    },
    {
        "source": "bp/texts/en_US.lang",
        "target": "BP/texts/en_US.lang",
    },
    ## RP Setup
    {
        "source": "rp/manifest.json",
        "target": "RP/manifest.json",
        "json_template": True,
    },
    {
        "source": "rp/pack_icon.png",
        "target": "RP/pack_icon.png"
    },
    {
        "source": "rp/texts/languages.json",
        "target": "RP/texts/languages.json"
    },
    {
        "source": "rp/texts/en_US.lang",
        "target": "RP/texts/en_US.lang",
    },
    {
        "source": "rp/textures/item_texture.json",
        "target": "RP/textures/item_texture.json",
        "on_conflict": "merge"
    }
]
