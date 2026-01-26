
[
    # Ui
    {
        "source": "_ui_defs.json",
        "target": "RP/ui/_ui_defs.json",
        "json_template": True
    },
    *[{
        "source": p.as_posix(),
        "target": f"RP/ui/{p.name}",
        "json_template": True
    } for p in Path("ui").glob("*")],
    {"source": "*ui.png", "target": AUTO_FLAT},

]
