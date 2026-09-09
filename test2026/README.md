# Contact Sheet — auto-updating photo gallery

Drop images into `/photos`, push, and the gallery updates itself. No HTML editing, no PHP, no server.

## How it works

- `photos/` — put your images here (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`).
- `.github/workflows/gallery.yml` — runs automatically on every push that touches `photos/`. It regenerates `photos.json` (the list of images) and commits it back.
- `index.html` — reads `photos.json` and renders the gallery + lightbox. Nothing here needs to change when you add photos.

## One-time setup

1. **Create the repo.** Push this folder's contents to a new GitHub repo (public, or private if your plan supports Pages on private repos).

2. **Allow the workflow to commit.** Go to `Settings → Actions → General → Workflow permissions` and select **Read and write permissions**, then save. Without this, the bot can't push the updated `photos.json` back.

3. **Enable GitHub Pages.** Go to `Settings → Pages`, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`. Save. GitHub will give you a URL like `https://yourname.github.io/repo-name/`.

4. **Point Cloudflare at it.**
   - In Cloudflare DNS for your domain, add a `CNAME` record: name = `photos` (or whatever subdomain you want), target = `yourname.github.io`.
   - Set proxy status to **Proxied** (orange cloud) if you want Cloudflare's CDN/SSL in front of it, or **DNS only** if you'd rather GitHub handle TLS directly.
   - Back in `Settings → Pages` on GitHub, add your custom domain (e.g. `photos.yourdomain.com`) under **Custom domain** and let GitHub issue the certificate.

5. **Upload your first photos.** Add a few files to `photos/` via the GitHub web UI (drag and drop works fine), or `git add photos/*.jpg && git commit -m "add photos" && git push`. Watch the **Actions** tab — the workflow runs, `photos.json` updates, and the live site reflects it within a minute or two.

## Day-to-day use

To add or remove photos going forward: just add/delete files in `photos/` and push (or use GitHub's web upload). No other step is needed — the manifest and the page both stay in sync automatically.
