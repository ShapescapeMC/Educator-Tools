/**
 * This script generates 64x64 images with transparent backgrounds for each letter
 * in a string provided in the scope. It uses the Canvas library for image manipulation.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  type Canvas,
  createCanvas,
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

  // Determine the base directory for resolving relative paths
  // Use the module's directory as base, not Deno.cwd()
  const moduleUrl = new URL(import.meta.url);
  const modulePath = moduleUrl.pathname.replace(/^\/([A-Z]:)/, "$1"); // Fix Windows paths
  const baseDir = path.dirname(path.dirname(modulePath)); // Go up from plugins/ to letter_blocks/

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

  // Load background image if provided
  let backgroundImage: Canvas | null = null;
  const resolvedBackgroundPath = backgroundImagePath
    ? path.isAbsolute(backgroundImagePath)
      ? backgroundImagePath
      : path.resolve(baseDir, backgroundImagePath)
    : null;
  if (resolvedBackgroundPath && fs.existsSync(resolvedBackgroundPath)) {
    try {
      const bgImg = await loadImage(resolvedBackgroundPath);
      const bgCanvas = createCanvas(workSize[0], workSize[1]);
      const bgCtx = bgCanvas.getContext("2d");
      bgCtx.imageSmoothingEnabled = false;
      bgCtx.drawImage(bgImg, 0, 0, workSize[0], workSize[1]);
      backgroundImage = bgCanvas;
      console.log(`Using background image: ${resolvedBackgroundPath}`);
    } catch (e) {
      console.error(`Error loading background image: ${e}`);
      backgroundImage = null;
    }
  } else {
    console.log(
      `No background image provided or file not found. Using transparent background. Path: ${
        resolvedBackgroundPath || "None"
      }`,
    );
  }

  // Load and register custom font if provided
  const fontSizeUsed = fontSize * scale;
  let fontFamily = "sans-serif";

  const resolvedFontPath = fontPath
    ? path.isAbsolute(fontPath) ? fontPath : path.resolve(baseDir, fontPath)
    : null;

  if (resolvedFontPath && fs.existsSync(resolvedFontPath)) {
    try {
      // Read font file as buffer
      const fontData = fs.readFileSync(resolvedFontPath);

      // Extract font family name from file name (or use a default)
      const fontFileName = path.basename(
        resolvedFontPath,
        path.extname(resolvedFontPath),
      );
      fontFamily = fontFileName.replace(/[_-]/g, " ");

      console.log(
        `Loading custom font from '${resolvedFontPath}' as '${fontFamily}'`,
      );
    } catch (e) {
      console.error(`Error reading font file '${resolvedFontPath}': ${e}`);
      console.log("Falling back to sans-serif font");
      fontFamily = "sans-serif";
    }
  }

  // Create the oversampled canvas
  const canvas = createCanvas(workSize[0], workSize[1]);
  const ctx = canvas.getContext("2d");

  // Load custom font into this canvas if font path was provided
  if (resolvedFontPath && fs.existsSync(resolvedFontPath)) {
    try {
      const fontData = fs.readFileSync(resolvedFontPath);
      const fontFileName = path.basename(
        resolvedFontPath,
        path.extname(resolvedFontPath),
      );
      const customFontFamily = fontFileName.replace(/[_-]/g, " ");

      canvas.loadFont(fontData, { family: customFontFamily });
      fontFamily = customFontFamily;
    } catch (e) {
      console.error(`Error loading font into canvas: ${e}`);
    }
  }

  // Draw background if available
  if (backgroundImage) {
    ctx.drawImage(backgroundImage, 0, 0);
  }

  // Set up text properties
  ctx.font = `bold ${fontSizeUsed}px ${fontFamily}`;
  ctx.fillStyle = `rgba(${textColor[0]}, ${textColor[1]}, ${textColor[2]}, ${
    textColor[3] / 255
  })`;

  // Calculate text bounding box to center it precisely
  const metrics = ctx.measureText(char);

  // Calculate the actual visual bounds of the character
  const charWidth = metrics.actualBoundingBoxLeft +
    metrics.actualBoundingBoxRight;
  const charHeight = metrics.actualBoundingBoxAscent +
    metrics.actualBoundingBoxDescent;

  // Calculate position to center the character's visual bounding box
  const x = (workSize[0] - charWidth) / 2 +
    metrics.actualBoundingBoxLeft;
  const y = (workSize[1] - charHeight) / 2 +
    metrics.actualBoundingBoxAscent;

  // Draw the letter at calculated position
  ctx.fillText(char, x, y);

  // Downsample to final size if needed
  let finalCanvas: Canvas;
  if (scale > 1) {
    finalCanvas = createCanvas(imageSize[0], imageSize[1]);
    const finalCtx = finalCanvas.getContext("2d");
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
  console.log(`Generated: ${outputFilePath}`);
}
