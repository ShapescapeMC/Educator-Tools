/**
 * This script generates 64x64 images with transparent backgrounds for each letter
 * in a string provided in the scope. It uses the Canvas library for image manipulation.
 */

import * as fs from "fs";
import * as path from "path";
import { createCanvas, loadImage, registerFont, Canvas } from "canvas";

export interface LetterItem {
	char: string;
	safe_name: string;
	group: string;
}

export interface GenerateLetterImagesOptions {
	letters: LetterItem[];
	outputDir: string;
	fontPath?: string;
	fontSize: number;
	textColor: [number, number, number, number];
	imageSize: [number, number];
	backgroundImagePath?: string;
	suffix?: string | null;
	aliasing: boolean;
}

interface MapEntry {
	source: string;
	target: string | { path: string };
	onConflict?: string;
	scope?: Record<string, any>;
	jsonTemplate?: boolean;
}

function safeFilename(character: string): string {
	/**
	 * Convert a character to a safe filename string using Unicode code point.
	 */
	const codePoint = character.charCodeAt(0);
	return `char_${codePoint.toString(16)}`;
}

export async function generateLetterImages(
	mapEntry: MapEntry,
	options: GenerateLetterImagesOptions,
): Promise<MapEntry> {
	/**
	 * Generates an image for each letter in the provided array with transparent background.
	 */
	const {
		letters,
		outputDir = ".",
		fontPath,
		fontSize = 64,
		textColor = [255, 255, 255, 255],
		imageSize = [64, 64],
		backgroundImagePath,
		suffix,
		aliasing = false,
	} = options;

	// Create output directory if it doesn't exist
	const outputPath = path.resolve(outputDir);
	if (!fs.existsSync(outputPath)) {
		fs.mkdirSync(outputPath, { recursive: true });
	}

	// Extract background image name if provided
	let backgroundSubfolder: string | null = null;
	if (backgroundImagePath) {
		const bgFilename = path.basename(backgroundImagePath);
		backgroundSubfolder = bgFilename.replace(".block.png", "");
	}

	// Build character map
	const charMap = new Map<string, { filename: string; group: string }>();
	for (const item of letters) {
		const char = item.char;
		const safeName = item.safe_name || safeFilename(char);
		const group = item.group;
		charMap.set(char, { filename: safeName, group });
	}

	// Create a character mapping reference file
	const mappingFilePath = path.join(outputPath, "character_mapping.txt");
	const mappingLines = ["Character\tFilename\tUnicode\tGroup"];
	for (const [char, { filename, group }] of charMap.entries()) {
		mappingLines.push(`${char}\t${filename}\t${char.charCodeAt(0)}\t${group}`);
	}
	fs.writeFileSync(mappingFilePath, mappingLines.join("\n"), "utf-8");
	console.log(`Created character mapping reference at ${mappingFilePath}`);

	// Determine oversampling factor and working size
	const scale = aliasing ? 4 : 1;
	const workSize: [number, number] = [
		imageSize[0] * scale,
		imageSize[1] * scale,
	];

	// Load background image if provided
	let backgroundImage: Canvas | null = null;
	if (backgroundImagePath && fs.existsSync(backgroundImagePath)) {
		try {
			const bgImg = await loadImage(backgroundImagePath);
			const bgCanvas = createCanvas(workSize[0], workSize[1]);
			const bgCtx = bgCanvas.getContext("2d");
			bgCtx.imageSmoothingEnabled = false;
			bgCtx.drawImage(bgImg, 0, 0, workSize[0], workSize[1]);
			backgroundImage = bgCanvas;
			console.log(`Using background image: ${backgroundImagePath}`);
		} catch (e) {
			console.error(`Error loading background image: ${e}`);
			backgroundImage = null;
		}
	} else {
		console.log(
			`No background image provided or file not found. Using transparent background. Path: ${
				backgroundImagePath || "None"
			}`,
		);
	}

	// Register font if provided
	const fontSizeUsed = fontSize * scale;
	if (fontPath && fs.existsSync(fontPath)) {
		try {
			registerFont(fontPath, { family: "CustomFont" });
			console.log(
				`Successfully loaded custom font '${fontPath}' with size ${fontSize}`,
			);
		} catch (e) {
			console.error(`Error loading custom font '${fontPath}': ${e}`);
		}
	}

	// Generate an image for each unique letter
	for (const [char, { filename, group }] of charMap.entries()) {
		if (char.trim()) {
			let outputPathGroup = outputPath;
			if (group) {
				outputPathGroup = path.join(outputPath, group);
				if (!fs.existsSync(outputPathGroup)) {
					fs.mkdirSync(outputPathGroup, { recursive: true });
				}
			}

			// Add background subfolder if available
			if (backgroundSubfolder) {
				outputPathGroup = path.join(outputPathGroup, backgroundSubfolder);
				if (!fs.existsSync(outputPathGroup)) {
					fs.mkdirSync(outputPathGroup, { recursive: true });
				}
			}

			// Create the oversampled canvas
			const canvas = createCanvas(workSize[0], workSize[1]);
			const ctx = canvas.getContext("2d");

			// Draw background if available
			if (backgroundImage) {
				ctx.drawImage(backgroundImage, 0, 0);
			}

			// Set up text properties
			const fontFamily = fontPath ? "CustomFont" : "sans-serif";
			ctx.font = `${fontSizeUsed}px ${fontFamily}`;
			ctx.fillStyle = `rgba(${textColor[0]}, ${textColor[1]}, ${
				textColor[2]
			}, ${textColor[3] / 255})`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			// Draw the letter centered
			ctx.fillText(char, workSize[0] / 2, workSize[1] / 2);

			// Downsample to final size
			let finalCanvas: Canvas;
			if (scale > 1) {
				finalCanvas = createCanvas(imageSize[0], imageSize[1]);
				const finalCtx = finalCanvas.getContext("2d");
				finalCtx.imageSmoothingEnabled = !aliasing;
				finalCtx.drawImage(canvas, 0, 0, imageSize[0], imageSize[1]);
			} else {
				finalCanvas = canvas;
			}

			// Save the image
			const name = suffix
				? `${filename}${suffix}.block.png`
				: `${filename}.block.png`;
			const outputFilePath = path.join(outputPathGroup, name);
			const buffer = finalCanvas.toBuffer("image/png");
			fs.writeFileSync(outputFilePath, buffer);
		}
	}

	// Print summary
	const chars = Array.from(charMap.keys()).join("");
	console.log(`Generated characters: ${chars}`);

	// Move files to custom subdirectory
	const backgroundsDir = path.join(outputPath, "custom");
	if (!fs.existsSync(backgroundsDir)) {
		fs.mkdirSync(backgroundsDir, { recursive: true });
	}

	const letterBlocksPattern = path.join(
		outputPath,
		"letter_blocks",
		"*.block.png",
	);
	const letterBlocksDir = path.join(outputPath, "letter_blocks");
	if (fs.existsSync(letterBlocksDir)) {
		const files = fs
			.readdirSync(letterBlocksDir)
			.filter((f) => f.endsWith(".block.png"));
		for (const file of files) {
			const filePath = path.join(letterBlocksDir, file);
			const stat = fs.statSync(filePath);
			if (stat.isFile() && !filePath.startsWith(backgroundsDir)) {
				const baseName = path.basename(file, ".block.png");
				const targetDir = path.join(backgroundsDir, baseName);
				if (!fs.existsSync(targetDir)) {
					fs.mkdirSync(targetDir, { recursive: true });
				}
				const targetFile = path.join(targetDir, file);
				console.log(`Moving ${filePath} to ${targetFile}`);
				fs.copyFileSync(filePath, targetFile);
				fs.unlinkSync(filePath);
			}
		}
	}

	// Return unmodified mapEntry
	return mapEntry;
}
