#!/usr/bin/env node
// Scans every album folder, generates a resized thumbnail for any photo
// that doesn't already have one, and writes a photos.json manifest with
// { thumb, full } pairs. Run automatically by
// .github/workflows/build-galleries.yml on every push to main.
//
// v1.3 changes:
//   - A6 — thumbnail generation via sharp: ~600px long edge, quality
//     ~80, written to a per-album thumbs/ folder.
//   - A7 — skip-if-exists: a thumbnail is only (re)generated if it
//     doesn't already exist, so re-running on every push doesn't
//     reprocess an album's entire history each time.
//   - F8 — photos.json schema changed from a flat filename list to
//     { thumb, full } pairs per photo.
//
// v1.1 changes (still in effect):
//   - No root-level albums.json (F5, removed).
//   - No folder-name -> title derivation (A2, retired).

import {
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
} from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const SKIP_DIRS = new Set(['template', 'assets', 'scripts', '.github', '.git', 'node_modules']);

const THUMB_LONG_EDGE = 600;
const THUMB_QUALITY = 80;

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

async function ensureThumbnail(albumName, filename) {
  const photosDir = join(ROOT, albumName, 'photos');
  const thumbsDir = join(ROOT, albumName, 'thumbs');
  const sourcePath = join(photosDir, filename);
  const thumbPath = join(thumbsDir, filename);

  if (existsSync(thumbPath)) {
    // A7 — already generated on a previous run, nothing to do.
    console.log(`Thumbnail already exists, skipping: ${albumName}/thumbs/${filename}`);
    return;
  }

  if (!existsSync(thumbsDir)) {
    mkdirSync(thumbsDir, { recursive: true });
  }

  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();

  if (ext === '.gif') {
    // Animated GIFs are passed through untouched rather than resized —
    // sharp would flatten an animated GIF down to a single static frame.
    copyFileSync(sourcePath, thumbPath);
    console.log(`Copied GIF as-is (not resized): ${albumName}/thumbs/${filename}`);
    return;
  }

  const pipeline = sharp(sourcePath).resize({
    width: THUMB_LONG_EDGE,
    height: THUMB_LONG_EDGE,
    fit: 'inside',
    withoutEnlargement: true,
  });

  if (ext === '.png') {
    await pipeline.png({ quality: THUMB_QUALITY }).toFile(thumbPath);
  } else if (ext === '.webp') {
    await pipeline.webp({ quality: THUMB_QUALITY }).toFile(thumbPath);
  } else {
    await pipeline.jpeg({ quality: THUMB_QUALITY }).toFile(thumbPath);
  }

  console.log(`Generated thumbnail: ${albumName}/thumbs/${filename}`);
}

async function buildManifestForAlbum(albumName) {
  const photosDir = join(ROOT, albumName, 'photos');

  if (!existsSync(photosDir) || !statSync(photosDir).isDirectory()) {
    console.log(`Skipping "${albumName}" — no photos/ folder found.`);
    return;
  }

  const filenames = readdirSync(photosDir)
    .filter(isImage)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  for (const filename of filenames) {
    await ensureThumbnail(albumName, filename);
  }

  const photos = filenames.map((filename) => ({
    thumb: `thumbs/${filename}`,
    full: `photos/${filename}`,
  }));

  const manifestPath = join(ROOT, albumName, 'photos.json');
  writeFileSync(manifestPath, JSON.stringify({ photos }, null, 2) + '\n');
  console.log(`Wrote ${photos.length} photo(s) to ${albumName}/photos.json`);
}

async function main() {
  const albums = getAlbumDirs();
  console.log(`Found ${albums.length} album folder(s): ${albums.join(', ') || '(none)'}`);
  for (const albumName of albums) {
    await buildManifestForAlbum(albumName);
  }
}

main();
