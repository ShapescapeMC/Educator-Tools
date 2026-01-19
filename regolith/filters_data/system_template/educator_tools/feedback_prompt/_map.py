[
    {"source": "entities/*.geo.json", "target": AUTO_FLAT, "json_template": True},
    {"source": "entities/*.entity.png", "target": AUTO_FLAT},
    {"source": "entities/*.behavior.json", "target": AUTO_FLAT, "json_template": True},
    {"source": "entities/*.entity.json", "target": AUTO_FLAT, "json_template": True},
    {"source": "entities/*.rc.json", "target": AUTO_FLAT, "json_template": True},
    {"source": "dialogues/*.dialogue.json", "target": AUTO_FLAT, "json_template": True},
    {
        "source": "translations/*.lang",
        "subfunctions": True,
        "target": AUTO_FLAT,
        "on_conflict": "append_end",
    },
]