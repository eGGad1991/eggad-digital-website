# Mila Website

This repository contains the Mila website and its Cloudflare Pages Functions.

## Current project layout

- `site/` — current public website. Static HTML, CSS, JavaScript, images, and the public downloads page live here.
- `functions/` — Cloudflare Pages Functions. This directory must remain at the repository root so Pages can discover the server-side routes.
- `database/storage/` — retained Supabase Storage policy SQL files. Review them before running; they contain historical policy-name variants.
- `docs/history/` — historical implementation notes and restoration notes.
- `archive/legacy-root/` — former root-level website generation, preserved for reference and rollback. It is not the current website source.

## Cloudflare Pages deployment

The current website files are under `site/`, while Pages Functions are in the repository-root `functions/` directory.

Expected Pages configuration:
- Root directory: repository root (`/`)
- Build output directory: `site`
- Build command: empty for static files, or the currently configured no-op command

The Cloudflare Pages project settings were not changed in this cleanup. Confirm that the output directory is still `site` before changing deployment settings. Do not move `functions/` into `site/`.

## Public Valheim download

The downloads page is `site/downloads/index.html`. The Valheim archive is attached to a public GitHub Release and is linked directly from that page. It is not stored in the Pages source directory.

## Supabase and security

- Browser configuration in `site/supabase-config.js` contains only the public publishable key.
- Never add a Supabase service-role key or other secret to website files.
- The private archive and public gallery use separate Supabase Storage buckets and admin checks.
- Keep private files out of `site/` and out of public GitHub Releases.

## Cleanup policy

Legacy files were moved, not deleted. The original content remains in `archive/legacy-root/`, and historical notes remain in `docs/history/`. The current live website in `site/` and Pages Functions in `functions/` were not moved or rewritten as part of the folder cleanup.
