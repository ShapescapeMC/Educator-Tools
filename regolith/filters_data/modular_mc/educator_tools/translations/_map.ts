const translationFiles = Array.from(
	Deno.readDirSync(new URL(".", import.meta.url)),
	(entry) => entry.name,
)
	.filter((name) => name.endsWith(".lang"))
	.map((name) => name.replace(".lang", ""));

export const MAP = [
	{
		source: "*.lang",
		target: ":autoFlat",
		onConflict: "appendEnd",
	},
	{
		source: "languages.json",
		target: "RP/texts/languages.json",
		onConflict: "merge",
		jsonTemplate: true,
		scope: {
			languages: translationFiles,
		},
	},
];
