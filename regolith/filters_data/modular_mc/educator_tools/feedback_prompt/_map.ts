import { scope } from "./scope.ts";

export const MAP = [
	{
		source: "entities/*.geo.json",
		target: ":autoFlat",
	},
	{
		source: "entities/*.entity.png",
		target: ":autoFlat",
	},
	{
		source: "entities/*.behavior.json",
		target: ":autoFlat",
	},
	{
		source: "entities/*.entity.json",
		target: ":autoFlat",
	},
	{
		source: "entities/*.rc.json",
		target: ":autoFlat",
	},
	{
		source: "dialogues/*.dialogue.json",
		target: ":autoFlat",
		jsonTemplate: true,
		scope: scope,
	},
	{
		source: "translations/*.lang",
		target: ":autoFlat",
		onConflict: "appendEnd",
	},
];
