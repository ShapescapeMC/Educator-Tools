export const MAP = [
	{
		source: "educator_tool.bp_item.json",
		target: ":autoFlat",
	},
	{
		source: "educator_tool.item.png",
		target: ":autoFlat",
	},
	{
		source: "item_texture.json",
		target: "RP/textures/item_texture.json",
		onConflict: "merge",
	},
];
