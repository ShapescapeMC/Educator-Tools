export const MAP = [
	{
		source: "assignment_item.bp_item.json",
		target: ":autoFlat",
	},
	{
		source: "assignment_item.item.png",
		target: ":autoFlat",
	},
	{
		source: "item_texture.json",
		target: "RP/textures/item_texture.json",
		on_conflict: "merge",
	},
];
