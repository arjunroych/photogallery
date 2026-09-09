// Scans /photos and writes /photos.json describing every image found.
// No dependencies — runs on the default Node install in GitHub Actions.

import { readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const PHOTOS_DIR = "photos";
const OUTPUT_FILE = "photos.json";
const VALID_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function titleFromFilename(filename) {
  const base = filename.replace(extname(filename), "");
  return base
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function main() {
  let files = [];
  try {
    files = readdirSync(PHOTOS_DIR);
  } catch {
    console.log(`No ${PHOTOS_DIR}/ directory found — writing empty manifest.`);
    writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
    return;
  }

  const images = files
    .filter((f) => VALID_EXT.has(extname(f).toLowerCase()))
    .map((f) => {
      const full = join(PHOTOS_DIR, f);
      const stats = statSync(full);
      return {
        file: f,
        title: titleFromFilename(f),
        modified: stats.mtime.toISOString(),
      };
    })
    // Newest first — most recently added/edited photos lead the sheet.
    .sort((a, b) => new Date(b.modified) - new Date(a.modified))
    .map((img, i) => ({ frame: String(i + 1).padStart(2, "0"), ...img }));

  writeFileSync(OUTPUT_FILE, JSON.stringify(images, null, 2));
  console.log(`Wrote ${images.length} image(s) to ${OUTPUT_FILE}`);
}

main();
