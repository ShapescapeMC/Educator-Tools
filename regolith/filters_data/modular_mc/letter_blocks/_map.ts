import * as fs from "node:fs";
import * as path from "node:path";
import { generateLetterImage } from "./plugins/generateLetters.ts";
import { scope } from "./scope.ts";

// Get all PNG files from letter_blocks directory
function getLetterBlockPngs(dir: string): string[] {
	const results: string[] = [];
	if (!fs.existsSync(dir)) {
		return results;
	}

	const files = fs.readdirSync(dir);
	for (const file of files) {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			results.push(...getLetterBlockPngs(filePath));
		} else if (file.endsWith(".block.png")) {
			results.push(filePath);
		}
	}
	return results;
}

// Get letters from generated PNG files
function getLettersFromPngs(): string[] {
	const pngs = getLetterBlockPngs(
		"data/modular_mc/letter_blocks/letter_blocks",
	);
	return pngs.map((p) => path.basename(p, ".block.png"));
}

// Get categories and their blocks
function getCategoriesData() {
	const letterBlocksDir = "data/modular_mc/letter_blocks/letter_blocks";
	if (!fs.existsSync(letterBlocksDir)) {
		return { categories: [], categoryNames: [] };
	}

	const subfolders = fs.readdirSync(letterBlocksDir).filter((f) => {
		const fullPath = path.join(letterBlocksDir, f);
		return fs.statSync(fullPath).isDirectory();
	});

	const categories = subfolders.map((subfolder) => {
		const subfolderPath = path.join(letterBlocksDir, subfolder);
		return getLetterBlockPngs(subfolderPath).map((pngPath) => {
			const letter = path.basename(pngPath, ".block.png");
			return `edu_tools:letter_block_${letter}_placer`;
		});
	});

	return {
		categories,
		categoryNames: subfolders,
	};
}

// Build lang entries from scope data and generated PNGs
function getLangEntries() {
	const entries: { safe_name: string; display_name: string }[] = [];
	const seen = new Set<string>();

	// Add entries from scope (with group-based display names)
	for (const ls of scope.letter_sets) {
		for (const letter of ls.letters) {
			if (seen.has(letter.safe_name)) continue;
			seen.add(letter.safe_name);

			let displayName: string;
			if (letter.group === "letter") {
				displayName = `Letter ${letter.char}`;
			} else if (letter.group === "number") {
				displayName = `Number ${letter.char}`;
			} else {
				displayName = letter.safe_name
					.replace(/_/g, " ")
					.split(" ")
					.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
					.join(" ");
			}

			entries.push({
				safe_name: letter.safe_name,
				display_name: displayName,
			});
		}
	}

	// Add entries for any additional PNGs not in scope (e.g., blank)
	const allLetters = getLettersFromPngs();
	for (const letter of allLetters) {
		if (seen.has(letter)) continue;
		seen.add(letter);

		const displayName = letter
			.replace(/_/g, " ")
			.split(" ")
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" ");

		entries.push({ safe_name: letter, display_name: displayName });
	}

	return entries;
}

// Generate letter images for each letter set (executed at build time)
// Generate all letter images synchronously before building the MAP
for (const ls of scope.letter_sets) {
	for (const letter of ls.letters) {
		await generateLetterImage({
			char: letter.char,
			safeName: letter.safe_name,
			group: letter.group,
			outputDir: "./data/modular_mc/letter_blocks/letter_blocks",
			fontSize: ls.font_size,
			textColor: ls.text_color as [number, number, number, number],
			imageSize: ls.image_size as [number, number],
			fontPath: ls.font_path,
			backgroundImagePath: ls.background_image_path,
			suffix: ls.suffix,
			aliasing: ls.aliasing,
		});
	}
}

export const MAP = [
	// Textures - Item texture for block and item icon
	{
		source: "block/item_texture.json",
		target: "RP/textures/item_texture.json",
		onConflict: "merge",
		jsonTemplate: true,
		scope: {
			letters: getLettersFromPngs(),
		},
	},
	// Terrain texture for blocks
	{
		source: "block/terrain_texture.json",
		target: "RP/textures/terrain_texture.json",
		onConflict: "merge",
		jsonTemplate: true,
		scope: {
			letters: getLettersFromPngs(),
		},
	},
	// Assign the texture to the block
	{
		source: "block/blocks.json",
		target: "RP/blocks.json",
		onConflict: "merge",
		jsonTemplate: true,
		scope: {
			letters: getLettersFromPngs(),
		},
	},
	// Block definitions - one for each PNG
	...getLetterBlockPngs("data/modular_mc/letter_blocks/letter_blocks").map(
		(pngPath) => {
			const letter = path.basename(pngPath, ".block.png");
			const parentDir = path.basename(path.dirname(pngPath));
			const background = parentDir !== "letter_blocks"
				? parentDir
				: letter;

			return {
				source: "block/letter_block.block.json",
				target: `BP/blocks/${letter}.block.json`,
				jsonTemplate: true,
				scope: {
					letter,
					background,
				},
			};
		},
	),
	// Block loot - one for each PNG
	...getLetterBlockPngs("data/modular_mc/letter_blocks/letter_blocks").map(
		(pngPath) => {
			const letter = path.basename(pngPath, ".block.png");

			return {
				source: "block/letter_block.loot.json",
				target: `BP/loot_tables/edu_tools/${letter}.loot.json`,
				jsonTemplate: true,
				scope: {
					letter,
				},
			};
		},
	),
	// Item definitions - one for each PNG
	...getLetterBlockPngs("data/modular_mc/letter_blocks/letter_blocks").map(
		(pngPath) => {
			const letter = path.basename(pngPath, ".block.png");
			const group = path.basename(path.dirname(path.dirname(pngPath)));

			return {
				source: "block/letter_block_placer.bp_item.json",
				target: `BP/items/${letter}.bp_item.json`,
				jsonTemplate: true,
				scope: {
					letter,
					group,
				},
			};
		},
	),
	// Attachables - one for each PNG
	...getLetterBlockPngs("data/modular_mc/letter_blocks/letter_blocks").map(
		(pngPath) => {
			const letter = path.basename(pngPath, ".block.png");

			return {
				source: "block/letter_block_placer.attachable.json",
				target: `RP/attachables/${letter}.attachable.json`,
				jsonTemplate: true,
				scope: {
					letter,
				},
			};
		},
	),
	// Attachable model and animation (shared)
	{
		source: "block/letter_block_placer.geo.json",
		target: ":autoFlat",
	},
	{
		source: "block/letter_block_placer.animation.json",
		target: ":autoFlat",
	},
	{
		source: "letter_blocks/**/*.block.png",
		target: ":autoFlat",
	},
	// Lang entries for block/item display names
	{
		source: "lang/en_US.lang",
		target: "RP/texts/en_US.lang",
		onConflict: "appendEnd",
		textTemplate: true,
		scope: {
			entries: getLangEntries(),
		},
	},
	// Debug function for getting all block items
	{
		source: "block/letter_block.mcfunction",
		target: ":autoFlat",
		textTemplate: true,
		scope: {
			blocks: getLetterBlockPngs(
				"data/modular_mc/letter_blocks/letter_blocks",
			)
				.map((pngPath) => {
					const letter = path.basename(pngPath, ".block.png");
					return `edu_tools:letter_block_${letter}_placer`;
				}),
			...getCategoriesData(),
		},
	},
];
