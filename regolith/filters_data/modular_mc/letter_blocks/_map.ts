import * as fs from "node:fs";
import * as path from "node:path";
import { generateLetterImages } from "./plugins/generateLetters.ts";
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
  const pngs = getLetterBlockPngs("letter_blocks");
  return pngs.map((p) => path.basename(p, ".block.png"));
}

// Get categories and their blocks
function getCategoriesData() {
  const letterBlocksDir = "letter_blocks";
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

// Generate letter images for each letter set (executed at build time)
const __dirname = path.dirname(import.meta.url.replace("file:///", ""));
scope.letter_sets.forEach((ls) => {
  generateLetterImages(
    {
      source: "letter_blocks/**/*.block.png",
      target: ":autoFlat",
      onConflict: "skip",
    },
    {
      letters: ls.letters,
      outputDir: "./letter_blocks",
      fontSize: ls.font_size,
      textColor: ls.text_color as [number, number, number, number],
      imageSize: ls.image_size as [number, number],
      fontPath: ls.font_path,
      backgroundImagePath: ls.background_image_path,
      suffix: ls.suffix,
      aliasing: ls.aliasing,
      workingDir: __dirname,
    },
  );
});

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
  ...getLetterBlockPngs("letter_blocks").map((pngPath) => {
    const letter = path.basename(pngPath, ".block.png");
    const parentDir = path.basename(path.dirname(pngPath));
    const background = parentDir !== "letter_blocks" ? parentDir : letter;

    return {
      source: "block/letter_block.block.json",
      target: `BP/blocks/${letter}.block.json`,
      jsonTemplate: true,
      scope: {
        letter,
        background,
      },
    };
  }),
  // Block loot - one for each PNG
  ...getLetterBlockPngs("letter_blocks").map((pngPath) => {
    const letter = path.basename(pngPath, ".block.png");

    return {
      source: "block/letter_block.loot.json",
      target: `BP/loot_tables/edu_tools/${letter}.loot.json`,
      jsonTemplate: true,
      scope: {
        letter,
      },
    };
  }),
  // Item definitions - one for each PNG
  ...getLetterBlockPngs("letter_blocks").map((pngPath) => {
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
  }),
  // Attachables - one for each PNG
  ...getLetterBlockPngs("letter_blocks").map((pngPath) => {
    const letter = path.basename(pngPath, ".block.png");

    return {
      source: "block/letter_block_placer.attachable.json",
      target: `RP/attachables/${letter}.attachable.json`,
      jsonTemplate: true,
      scope: {
        letter,
      },
    };
  }),
  // Attachable model and animation (shared)
  {
    source: "block/letter_block_placer.geo.json",
    target: ":autoFlat",
  },
  {
    source: "block/letter_block_placer.animation.json",
    target: ":autoFlat",
  },
  // Debug function for getting all block items
  {
    source: "block/letter_block.mcfunction",
    target: ":autoFlat",
    textTemplate: true,
    scope: {
      blocks: getLetterBlockPngs("letter_blocks").map((pngPath) => {
        const letter = path.basename(pngPath, ".block.png");
        return `edu_tools:letter_block_${letter}_placer`;
      }),
      ...getCategoriesData(),
    },
  },
];
