#!/usr/bin/env node
// Scans every album folder in the repo root and writes a photos.json
// manifest listing that album's images. Run automatically by
// .github/workflows/build-galleries.yml on every push to main.
//
// v1.1 changes:
//   - No longer writes a root-level albums.json (F5). The homepage
//     is fully decoupled from albums — see /index.html.
//   - No longer derives album titles from folder names (A2, retired).
//     Titles, dates, and descriptions are now edited by hand directly
//     in each album's index.html (F6.1 / F6.2 / F6.3 / F6.4).

import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const SKIP_DIRS = new Set(['template', 'assets', 'scripts', '.github', '.git', 'node_modules']);

function isImage(filename) {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

function getAlbumDirs() {
  return readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !SKIP_DIRS.has(name) && !name.startsWith('.'));
}

function buildManifestForAlbum(albumName) {
  const photosDir = join(ROOT, albumName, 'photos');

  if (!existsSync(photosDir) || !statSync(photosDir).isDirectory()) {
    console.log(`Skipping "${albumName}" — no photos/ folder found.`);
    return;
  }

  const photos = readdirSync(photosDir)
    .filter(isImage)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((filename) => `photos/${filename}`);

  const manifestPath = join(ROOT, albumName, 'photos.json');
  writeFileSync(manifestPath, JSON.stringify({ photos }, null, 2) + '\n');
  console.log(`Wrote ${photos.length} photo(s) to ${albumName}/photos.json`);
}

const albums = getAlbumDirs();
console.log(`Found ${albums.length} album folder(s): ${albums.join(', ') || '(none)'}`);
albums.forEach(buildManifestForAlbum);
