#!/usr/bin/env node
/**
 * Scans every top-level album folder (anything with a /photos subfolder)
 * and writes:
 *   <album>/photos.json   - { title, files: [...] }
 *   albums.json (repo root) - [{ slug, title, count, cover }]
 *
 * Runs in CI on every push that touches a photos/ folder. No dependencies.
 */
import { readdirSync, statSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const IGNORE = new Set(['.git', '.github', 'assets', 'scripts', 'node_modules']);
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

function humanize(slug) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function listImages(dir) {
  return readdirSync(dir)
    .filter((f) => IMAGE_EXT.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function writeIfChanged(path, contents) {
  const next = JSON.stringify(contents, null, 2) + '\n';
  if (existsSync(path)) {
    const prev = readFileSync(path, 'utf8');
    if (prev === next) return false;
  }
  writeFileSync(path, next);
  return true;
}

const entries = readdirSync(ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !IGNORE.has(e.name) && !e.name.startsWith('.'));

const albums = [];
let changed = false;

for (const entry of entries) {
  const albumDir = join(ROOT, entry.name);
  const photosDir = join(albumDir, 'photos');
  if (!existsSync(photosDir) || !statSync(photosDir).isDirectory()) continue;

  const files = listImages(photosDir);
  const manifestPath = join(albumDir, 'photos.json');
  const title = humanize(entry.name);

  if (writeIfChanged(manifestPath, { title, files })) changed = true;

  if (entry.name !== 'template' && files.length > 0) {
    albums.push({
      slug: entry.name,
      title,
      count: files.length,
      cover: files[0],
    });
  }
}

// Newest event first, assuming a trailing -YYYY (or -YYYY-MM-DD) in the folder name.
albums.sort((a, b) => b.slug.localeCompare(a.slug, undefined, { numeric: true }));

if (writeIfChanged(join(ROOT, 'albums.json'), albums)) changed = true;

console.log(changed ? 'Manifests updated.' : 'No changes.');
// Expose to the workflow so it only commits when needed.
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`, { flag: 'a' });
}
