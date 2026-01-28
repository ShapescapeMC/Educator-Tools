/**
 * This script generates 64x64 images with transparent backgrounds for each letter
 * in a string provided in the scope. It uses the Canvas library for image manipulation.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
	type Canvas,
	createCanvas,
	type Image,
	loadImage,
} from "https://deno.land/x/canvas/mod.ts";

export interface GenerateLetterImageOptions {
	char: string;
	safeName?: string;
	group?: string;
	outputDir: string;
	fontPath?: string;
	fontSize: number;
	textColor: [number, number, number, number];
	imageSize: [number, number];
	backgroundImagePath?: string;
	suffix?: string | null;
	aliasing: boolean;
}

// Cache for font data to avoid repeated file reads
const fontCache = new Map<string, Uint8Array>();

// Cache for background images to avoid repeated loading
const backgroundImageCache = new Map<string, Image>();

// Reusable canvas pool to avoid creating new canvases for each character
interface CanvasPool {
	main: Canvas | null;
	tmp: Canvas | null;
	final: Canvas | null;
	background: Canvas | null;
	mainSize: [number, number];
	tmpSize: [number, number];
	finalSize: [number, number];
}

const canvasPool: CanvasPool = {
	main: null,
	tmp: null,
	final: null,
	background: null,
	mainSize: [0, 0],
	tmpSize: [0, 0],
	finalSize: [0, 0],
};

/**
 * Get or create a canvas from the pool with the specified size.
 */
function getPooledCanvas(
	poolKey: "main" | "tmp" | "final" | "background",
	width: number,
	height: number,
): Canvas | null {
	const sizeKey = poolKey === "background"
		? "mainSize"
		: `${poolKey}Size` as keyof CanvasPool;
	const currentSize = canvasPool[sizeKey] as [number, number];

	// If canvas exists and size matches, clear and reuse it
	if (
		canvasPool[poolKey] &&
		currentSize[0] === width &&
		currentSize[1] === height
	) {
		const ctx = canvasPool[poolKey]!.getContext("2d");
		if (ctx) {
			ctx.clearRect(0, 0, width, height);
		}
		return canvasPool[poolKey];
	}

	// Create new canvas and store in pool
	const canvas = createCanvas(width, height);
	if (canvas) {
		canvasPool[poolKey] = canvas;
		if (sizeKey !== "mainSize" || poolKey === "main") {
			(canvasPool as Record<string, unknown>)[sizeKey] = [width, height];
		}
	}
	return canvas;
}

/**
 * Get the base directory for resolving relative paths.
 * Cached to avoid repeated URL parsing.
 */
let cachedBaseDir: string | null = null;
function getBaseDir(): string {
	if (cachedBaseDir === null) {
		const moduleUrl = new URL(import.meta.url);
		const modulePath = moduleUrl.pathname.replace(/^\/([A-Z]:)/, "$1"); // Fix Windows paths
		cachedBaseDir = path.dirname(path.dirname(modulePath)); // Go up from plugins/ to letter_blocks/
	}
	return cachedBaseDir;
}

/**
 * Get cached font data or load it from disk.
 */
function getFontData(fontPath: string): Uint8Array | null {
	if (fontCache.has(fontPath)) {
		return fontCache.get(fontPath)!;
	}

	const baseDir = getBaseDir();
	const resolvedPath = path.isAbsolute(fontPath)
		? fontPath
		: path.resolve(baseDir, fontPath);

	if (!fs.existsSync(resolvedPath)) {
		return null;
	}

	try {
		const fontData = fs.readFileSync(resolvedPath);
		fontCache.set(fontPath, fontData);
		return fontData;
	} catch (e) {
		console.error(`Error reading font file '${resolvedPath}': ${e}`);
		return null;
	}
}

/**
 * Get cached background image or load it from disk.
 */
async function getBackgroundImage(
	backgroundPath: string,
): Promise<Image | null> {
	if (backgroundImageCache.has(backgroundPath)) {
		return backgroundImageCache.get(backgroundPath)!;
	}

	const baseDir = getBaseDir();
	const resolvedPath = path.isAbsolute(backgroundPath)
		? backgroundPath
		: path.resolve(baseDir, backgroundPath);

	if (!fs.existsSync(resolvedPath)) {
		return null;
	}

	try {
		const img = await loadImage(resolvedPath);
		backgroundImageCache.set(backgroundPath, img);
		return img;
	} catch (e) {
		console.error(`Error loading background image '${resolvedPath}': ${e}`);
		return null;
	}
}

/**
 * Get font family name from font path.
 */
function getFontFamily(fontPath: string): string {
	const fontFileName = path.basename(fontPath, path.extname(fontPath));
	return fontFileName.replace(/[_-]/g, " ");
}

function safeFilename(character: string): string {
	/**
	 * Convert a character to a safe filename string using Unicode code point.
	 */
	const codePoint = character.charCodeAt(0);
	return `char_${codePoint.toString(16)}`;
}

export async function generateLetterImage(
	options: GenerateLetterImageOptions,
): Promise<void> {
	/**
	 * Generates an image for a single letter with optional background.
	 */
	const {
		char,
		safeName,
		group,
		outputDir = ".",
		fontPath,
		fontSize = 64,
		textColor = [255, 255, 255, 255],
		imageSize = [64, 64],
		backgroundImagePath,
		suffix,
		aliasing = false,
	} = options;

	// Skip whitespace-only characters
	if (!char.trim()) {
		return;
	}

	// Determine filename
	const filename = safeName || safeFilename(char);

	// Create output directory path
	// outputDir should be relative to Deno.cwd() (the tmp directory)
	const outputPath = path.isAbsolute(outputDir)
		? outputDir
		: path.resolve(Deno.cwd(), outputDir);

	// Add group subdirectory if specified
	let finalOutputPath = outputPath;
	if (group) {
		finalOutputPath = path.join(outputPath, group);
	}

	// Add background subfolder if available
	if (backgroundImagePath) {
		const bgFilename = path.basename(backgroundImagePath);
		const backgroundSubfolder = bgFilename.replace(".block.png", "");
		finalOutputPath = path.join(finalOutputPath, backgroundSubfolder);
	}

	// Create output directory if it doesn't exist
	if (!fs.existsSync(finalOutputPath)) {
		fs.mkdirSync(finalOutputPath, { recursive: true });
	}

	// Determine oversampling factor and working size
	const scale = aliasing ? 4 : 1;
	const workSize: [number, number] = [
		imageSize[0] * scale,
		imageSize[1] * scale,
	];

	// Get font data from cache
	const fontSizeUsed = fontSize * scale;
	let fontFamily = "sans-serif";
	let fontData: Uint8Array | null = null;

	if (fontPath) {
		fontData = getFontData(fontPath);
		if (fontData) {
			fontFamily = getFontFamily(fontPath);
		}
	}

	// Get or create the main canvas from pool
	const canvas = getPooledCanvas("main", workSize[0], workSize[1]);
	if (!canvas) {
		console.error(`[${char}] Failed to create main canvas, skipping`);
		return;
	}
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		console.error(`[${char}] Failed to get main canvas context, skipping`);
		return;
	}

	// Clear the canvas
	ctx.clearRect(0, 0, workSize[0], workSize[1]);

	// Load font into canvas
	if (fontData) {
		try {
			canvas.loadFont(fontData, { family: fontFamily });
		} catch (_e) {
			// Font may already be loaded, ignore
		}
	}

	// Draw background if provided
	if (backgroundImagePath) {
		const bgImg = await getBackgroundImage(backgroundImagePath);
		if (bgImg) {
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(bgImg, 0, 0, workSize[0], workSize[1]);
		}
	}

	// Set up text properties
	ctx.font = `bold ${fontSizeUsed}px ${fontFamily}`;
	ctx.fillStyle = `rgba(${textColor[0]}, ${textColor[1]}, ${textColor[2]}, ${
		textColor[3] / 255
	})`;

	// Center the glyph using the same approach as Pillow's textbbox:
	// 1. Render the character at (0, 0) on a temporary canvas
	// 2. Scan pixels to find the actual bounding box (left, top, right, bottom)
	// 3. Compute the draw position so the visual bounding box is centered
	//
	// This avoids relying on measureText's actualBoundingBox* properties,
	// which may be undefined or inaccurate in Deno canvas (skia).

	ctx.textAlign = "left";
	ctx.textBaseline = "alphabetic";

	// Use a temporary canvas to measure the glyph's true pixel bounds.
	// Draw at a safe origin offset so glyphs extending left/above aren't clipped.
	const tmpCanvas = getPooledCanvas("tmp", workSize[0] * 2, workSize[1] * 2);
	if (!tmpCanvas) {
		console.error(`[${char}] Failed to create temporary canvas, skipping`);
		return;
	}
	const tmpCtx = tmpCanvas.getContext("2d");
	if (!tmpCtx) {
		console.error(
			`[${char}] Failed to get temporary canvas context, skipping`,
		);
		return;
	}

	// Clear tmp canvas
	tmpCtx.clearRect(0, 0, workSize[0] * 2, workSize[1] * 2);

	// Load font into tmp canvas too
	if (fontData) {
		try {
			tmpCanvas.loadFont(fontData, { family: fontFamily });
		} catch (_e) {
			/* font already loaded, ignore */
		}
	}

	tmpCtx.font = ctx.font;
	tmpCtx.fillStyle = "white";
	tmpCtx.textAlign = "left";
	tmpCtx.textBaseline = "alphabetic";

	// Draw at the center of the oversized tmp canvas to avoid clipping
	const tmpOriginX = workSize[0];
	const tmpOriginY = workSize[1];
	tmpCtx.fillText(char, tmpOriginX, tmpOriginY);

	// Scan pixels to find bounding box of non-zero alpha
	const tmpW = tmpCanvas.width;
	const tmpH = tmpCanvas.height;
	let imgData: ImageData | null = null;
	try {
		imgData = tmpCtx.getImageData(0, 0, tmpW, tmpH);
	} catch (e) {
		console.error(`[${char}] Error getting image data: ${e}`);
		return;
	}

	if (!imgData || !imgData.data || imgData.data.length === 0) {
		console.warn(
			`[${char}] Failed to get valid image data (char code: ${
				char.charCodeAt(0).toString(16)
			}), skipping`,
		);
		return;
	}

	const pixels = imgData.data;

	let minX = tmpW,
		minY = tmpH,
		maxX = 0,
		maxY = 0;
	for (let py = 0; py < tmpH; py++) {
		for (let px = 0; px < tmpW; px++) {
			const alpha = pixels[(py * tmpW + px) * 4 + 3];
			if (alpha > 0) {
				if (px < minX) minX = px;
				if (px > maxX) maxX = px;
				if (py < minY) minY = py;
				if (py > maxY) maxY = py;
			}
		}
	}

	if (maxX < minX || maxY < minY) {
		// No visible pixels found - glyph is empty, skip
		console.warn(`[${char}] No visible pixels found, skipping`);
		return;
	}

	// Bounding box relative to draw origin (like Pillow's textbbox at (0,0))
	const bbLeft = minX - tmpOriginX; // offset from origin to left edge
	const bbTop = minY - tmpOriginY; // offset from origin to top edge
	const bbRight = maxX - tmpOriginX; // offset from origin to right edge
	const bbBottom = maxY - tmpOriginY; // offset from origin to bottom edge

	const textWidth = bbRight - bbLeft;
	const textHeight = bbBottom - bbTop;

	// Pillow-equivalent centering:
	// position = ((canvasW - textWidth) / 2 - left, (canvasH - textHeight) / 2 - top)
	const x = (workSize[0] - textWidth) / 2 - bbLeft;
	const y = (workSize[1] - textHeight) / 2 - bbTop;

	ctx.fillText(char, x, y);

	// Downsample to final size if needed
	let finalCanvas: Canvas;
	if (scale > 1) {
		const pooledFinal = getPooledCanvas(
			"final",
			imageSize[0],
			imageSize[1],
		);
		if (!pooledFinal) {
			console.error(`[${char}] Failed to create final canvas, skipping`);
			return;
		}
		finalCanvas = pooledFinal;
		const finalCtx = finalCanvas.getContext("2d");
		if (!finalCtx) {
			console.error(
				`[${char}] Failed to get final canvas context, skipping`,
			);
			return;
		}
		finalCtx.clearRect(0, 0, imageSize[0], imageSize[1]);
		finalCtx.imageSmoothingEnabled = !aliasing;
		finalCtx.imageSmoothingQuality = "high";
		finalCtx.drawImage(canvas, 0, 0, imageSize[0], imageSize[1]);
	} else {
		finalCanvas = canvas;
	}

	// Save the image
	const name = suffix
		? `${filename}${suffix}.block.png`
		: `${filename}.block.png`;
	const outputFilePath = path.join(finalOutputPath, name);
	const buffer = finalCanvas.toBuffer("image/png");
	fs.writeFileSync(outputFilePath, buffer);
}

/**
 * Clear all caches. Call this after batch processing to free memory.
 */
export function clearCaches(): void {
	fontCache.clear();
	backgroundImageCache.clear();
	cachedBaseDir = null;
	// Clear canvas pool
	canvasPool.main = null;
	canvasPool.tmp = null;
	canvasPool.final = null;
	canvasPool.background = null;
	canvasPool.mainSize = [0, 0];
	canvasPool.tmpSize = [0, 0];
	canvasPool.finalSize = [0, 0];
}
