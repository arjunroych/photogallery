# photos.arjunroychowdhury.ca

A minimal, self-updating photo gallery. No CMS, no build tools to install —
GitHub Actions regenerates everything the moment you push photos.

## How it works

- Every **album** is a top-level folder containing a `photos/` subfolder and
  an `index.html` (copied from `template/`).
- A GitHub Action (`.github/workflows/build-galleries.yml`) runs on every
  push, scans all album folders, and writes a `photos.json` manifest per
  album plus a root `albums.json` for the homepage. It commits those files
  back automatically — you never touch them by hand.
- Each album page reads its own `photos.json` and lays the images out in a
  justified grid (same idea as Google Photos), with a full-screen lightbox
  for viewing. The album title is taken straight from the folder name, so
  there's nothing to edit in the HTML.

## Adding a new album

1. Duplicate the `template/` folder and rename it, e.g. `goa-trip-2026`.
   (The name becomes both the URL and the on-page title — hyphens become
   spaces and each word is capitalized: `goa-trip-2026` → "Goa Trip 2026".)
2. Drop your images into `goa-trip-2026/photos/`.
3. Commit and push to `main`.
4. Wait ~30–60 seconds for the "Build gallery manifests" Action to run and
   commit the manifests, then GitHub Pages redeploys automatically.
5. Share the link: `https://photos.arjunroychowdhury.ca/goa-trip-2026/`

Image files are sorted by filename, so prefix them (`001-`, `002-`, or a
date-based name from your camera) if you care about order.

**Tip:** resize photos to a sane web size before uploading (long edge
around 2000px, exported as JPEG/WebP at ~80% quality). The gallery doesn't
generate thumbnails, so it serves whatever you upload — smaller files load
faster for people opening the link on their phones.

## One-time setup

### 1. GitHub Pages
- Repo **Settings → Pages** → Source: `Deploy from a branch` → Branch:
  `main` / `/ (root)`.
- **Settings → Actions → General → Workflow permissions** → select
  **"Read and write permissions"** (the Action needs this to commit
  manifests back to the repo).

### 2. Custom domain via Cloudflare
- The `CNAME` file in this repo already contains
  `photos.arjunroychowdhury.ca` — GitHub Pages reads this automatically.
- In Cloudflare DNS, add a `CNAME` record:
  - Name: `photos`
  - Target: `<your-github-username>.github.io`
  - Proxy status: either is fine; **DNS only (grey cloud)** is simplest and
    avoids occasional SSL-handshake quirks with GitHub Pages behind
    Cloudflare's proxy. If you want the orange-cloud proxy for caching,
    set SSL/TLS mode to **Full** (not Flexible) in Cloudflare.
- Back in **Settings → Pages**, enter `photos.arjunroychowdhury.ca` as the
  custom domain and enable **Enforce HTTPS** once the certificate issues.

### 3. First push
Push this whole repo as-is. The Action will run once, find no albums yet
(the `template/` folder is skipped from the homepage), and the homepage
will show a friendly empty state until you add your first album.

## Folder structure

```
index.html              landing page — lists all albums
assets/
  style.css             shared styles
  gallery.js             justified grid + lightbox (album pages)
  home.js                 album list (landing page)
albums.json              generated — list of albums for the homepage
template/                duplicate this per event
  index.html
  photos/                put your images here
  photos.json            generated — file list for this album
scripts/
  generate-manifests.mjs the script the Action runs
.github/workflows/
  build-galleries.yml
CNAME                    photos.arjunroychowdhury.ca
```

## Customizing the look

Everything visual lives in `assets/style.css` — colors and fonts are set
as CSS variables at the top of the file (`--bg`, `--ink`, `--accent`,
`--font-display`, etc.), so you can retheme the whole site by changing a
handful of values.
