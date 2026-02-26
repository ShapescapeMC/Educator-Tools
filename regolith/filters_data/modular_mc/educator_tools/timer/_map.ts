export const MAP = [
	{
		source: "*.geo.json",
		target: ":autoFlat",
	},
	{
		source: "timer.behavior.json",
		target: ":autoFlat",
		jsonTemplate: true,
	},
	{
		source: "timer.entity.json",
		target: ":autoFlat",
	},
	{
		source: "timer.animation.json",
		target: ":autoFlat",
	},
];
