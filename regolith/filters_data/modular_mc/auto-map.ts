import scope from "../scope.json" with { type: "json" };

export const AUTO_MAP = {
	".bp_ac.json": "BP/animation_controllers",
	".bp_anim.json": "BP/animations",
	".biome.json": "BP/biomes",
	".block.json": "BP/blocks",
	".dialogue.json": "BP/dialogue",
	".behavior.json": "BP/entities",
	".feature_rule.json": {
		path: "BP/feature_rules",
		extension: ".json",
	},
	".feature.json": {
		path: "BP/features",
		extension: ".json",
	},
	".mcfunction": `BP/functions/${scope.path_namespace}/`,
	".bp_item.json": "BP/items",
	".loot.json": `BP/loot_tables/${scope.path_namespace}`,
	".recipe.json": "BP/recipes",
	".spawn_rule.json": "BP/spawn_rules",
	".mcstructure": `BP/structures/${scope.path_namespace}`,
	".trade.json": `BP/trading/${scope.path_namespace}`,
	".cam_preset.json": `BP/cameras/${scope.path_namespace}`,
	".rp_ac.json": "RP/animation_controllers",
	".animation.json": "RP/animations",
	".attachable.json": "RP/attachables",
	".entity.json": "RP/entity",
	".rpe.json": "RP/entity",
	".fog.json": "RP/fogs",
	".rp_item.json": "RP/items",
	".geo.json": "RP/models/entity",
	".particle.json": "RP/particles",
	".rc.json": "RP/render_controllers",
	".bp_ac.py": {
		path: "BP/animation_controllers",
		extension: ".bp_ac.json",
	},
	".bp_anim.py": {
		path: "BP/animations",
		extension: ".bp_anim.json",
	},
	".biome.py": {
		path: "BP/biomes",
		extension: ".biome.json",
	},
	".block.py": {
		path: "BP/blocks",
		extension: ".block.json",
	},
	".dialogue.py": {
		path: "BP/dialogue",
		extension: ".dialogue.json",
	},
	".behavior.py": {
		path: "BP/entities",
		extension: ".behavior.json",
	},
	".feature_rule.py": {
		path: "BP/feature_rules",
		extension: ".json",
	},
	".feature.py": {
		path: "BP/features",
		extension: ".json",
	},
	".bp_item.py": {
		path: "BP/items",
		extension: ".bp_item.json",
	},
	".loot.py": {
		path: `BP/loot_tables/${scope.path_namespace}`,
		extension: ".loot.json",
	},
	".recipe.py": {
		path: "BP/recipes",
		extension: ".recipe.json",
	},
	".spawn_rule.py": {
		path: "BP/spawn_rules",
		extension: ".spawn_rule.json",
	},
	".trade.py": {
		path: `BP/trading/${scope.path_namespace}`,
		extension: ".trade.json",
	},
	".rp_ac.py": {
		path: "RP/animation_controllers",
		extension: ".rp_ac.json",
	},
	".animation.py": {
		path: "RP/animations",
		extension: ".animation.json",
	},
	".attachable.py": {
		path: "RP/attachables",
		extension: ".attachable.json",
	},
	".entity.py": {
		path: "RP/entity",
		extension: ".entity.json",
	},
	".rpe.py": {
		path: "RP/entity",
		extension: ".rpe.json",
	},
	".fog.py": {
		path: "RP/fogs",
		extension: ".fog.json",
	},
	".rp_item.py": {
		path: "RP/items",
		extension: ".rp_item.json",
	},
	".geo.py": {
		path: "RP/models/entity",
		extension: ".geo.json",
	},
	".particle.py": {
		path: "RP/particles",
		extension: ".particle.json",
	},
	".rc.py": {
		path: "RP/render_controllers",
		extension: ".rc.json",
	},
	".fsb": `RP/sounds/${scope.path_namespace}`,
	".mp4": `RP/sounds/${scope.path_namespace}`,
	".ogg": `RP/sounds/${scope.path_namespace}`,
	".wav": `RP/sounds/${scope.path_namespace}`,
	".lang": "RP/texts",
	"_attachable.tga": `RP/textures/${scope.path_namespace}/attachables`,
	"_block.tga": `RP/textures/${scope.path_namespace}/blocks`,
	"_item.tga": `RP/textures/${scope.path_namespace}/items`,
	"_entity.tga": `RP/textures/${scope.path_namespace}/entity`,
	"_particle.tga": `RP/textures/${scope.path_namespace}/particle`,
	"_attachable.png": `RP/textures/${scope.path_namespace}/attachables`,
	"_block.png": `RP/textures/${scope.path_namespace}/blocks`,
	"_item.png": `RP/textures/${scope.path_namespace}/items`,
	"_entity.png": `RP/textures/${scope.path_namespace}/entity`,
	"_particle.png": `RP/textures/${scope.path_namespace}/particle`,
	".attachable.tga": {
		path: `RP/textures/${scope.path_namespace}/attachables`,
		extension: ".tga",
	},
	".block.tga": {
		path: `RP/textures/${scope.path_namespace}/blocks`,
		extension: ".tga",
	},
	".item.tga": {
		path: `RP/textures/${scope.path_namespace}/items`,
		extension: ".tga",
	},
	".entity.tga": {
		path: `RP/textures/${scope.path_namespace}/entity`,
		extension: ".tga",
	},
	".particle.tga": {
		path: `RP/textures/${scope.path_namespace}/particle`,
		extension: ".tga",
	},
	".attachable.png": {
		path: `RP/textures/${scope.path_namespace}/attachables`,
		extension: ".png",
	},
	".block.png": {
		path: `RP/textures/${scope.path_namespace}/blocks`,
		extension: ".png",
	},
	".item.png": {
		path: `RP/textures/${scope.path_namespace}/items`,
		extension: ".png",
	},
	".entity.png": {
		path: `RP/textures/${scope.path_namespace}/entity`,
		extension: ".png",
	},
	".particle.png": {
		path: `RP/textures/${scope.path_namespace}/particle`,
		extension: ".png",
	},
	".ui.png": {
		path: `RP/textures/${scope.path_namespace}/ui`,
		extension: ".png",
	},
	".material": "RP/materials",
};