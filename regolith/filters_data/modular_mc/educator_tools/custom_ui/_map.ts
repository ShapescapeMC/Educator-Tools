const uiFiles = Array.from(
	Deno.readDirSync(new URL("ui", import.meta.url)),
	(entry) => entry.name,
);

export const MAP = [
	// Ui
	{
		source: "_ui_defs.json",
		target: "RP/ui/_ui_defs.json",
		jsonTemplate: true,
		scope: {
			ui_files: uiFiles,
		},
	},
	...uiFiles.map((filename) => ({
		source: `ui/${filename}`,
		target: `RP/ui/${filename}`,
		jsonTemplate: true,
	})),
	{
		source: "*.ui.png",
		target: ":autoFlat",
	},
];
