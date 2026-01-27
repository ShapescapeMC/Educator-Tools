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
  const tmpCanvas = createCanvas(workSize[0] * 2, workSize[1] * 2);
  const tmpCtx = tmpCanvas.getContext("2d");

  // Load font into tmp canvas too
  if (resolvedFontPath && fs.existsSync(resolvedFontPath)) {
    try {
      const tmpFontData = fs.readFileSync(resolvedFontPath);
      tmpCanvas.loadFont(tmpFontData, { family: fontFamily });
    } catch (_e) { /* font already loaded, ignore */ }
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
  const imgData = tmpCtx.getImageData(0, 0, tmpW, tmpH);
  const pixels = imgData.data;

  let minX = tmpW, minY = tmpH, maxX = 0, maxY = 0;
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
    // No visible pixels found — glyph is empty, skip
    console.warn(`[${char}] No visible pixels found, skipping`);
    return;
  }

  // Bounding box relative to draw origin (like Pillow's textbbox at (0,0))
  const bbLeft = minX - tmpOriginX;   // offset from origin to left edge
  const bbTop = minY - tmpOriginY;    // offset from origin to top edge
  const bbRight = maxX - tmpOriginX;  // offset from origin to right edge
  const bbBottom = maxY - tmpOriginY; // offset from origin to bottom edge

  const textWidth = bbRight - bbLeft;
  const textHeight = bbBottom - bbTop;

  // Pillow-equivalent centering:
  // position = ((canvasW - textWidth) / 2 - left, (canvasH - textHeight) / 2 - top)
  const x = (workSize[0] - textWidth) / 2 - bbLeft;
  const y = (workSize[1] - textHeight) / 2 - bbTop;

  console.log(
    `[${char}] bbox: left=${bbLeft}, top=${bbTop}, right=${bbRight}, bottom=${bbBottom}, textW=${textWidth}, textH=${textHeight}`,
  );
  console.log(
    `[${char}] draw position: x=${x}, y=${y}, canvas=${workSize[0]}x${workSize[1]}`,
  );

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
