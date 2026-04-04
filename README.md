# VirtueBench UI

Static viewer for exploring VirtueBench frame results across models.

Toolchain: Vite+ on top of Bun.

## Workflow

1. Refresh data from the benchmark repo:

```bash
vp run sync-data
```

This calls the exporter in `../virtue-bench` and copies normalized JSON into `public/data/`.

2. Install and verify:

```bash
vp install
vp check
vp build
```

3. Start the viewer:

```bash
vp dev
```

## Deploy

- Cloudflare Pages: build command `vp build`, output directory `dist`
- GitHub Pages fallback: set Pages to `Deploy from a branch`, branch `gh-pages`, folder `/(root)`, then run `vp run publish:pages`

The app is static. No backend.

- Local and root-hosted deploys build with `BASE_PATH=/`
- `publish:pages` derives the repo path, builds with that absolute base, and copies `index.html` to `404.html` so direct path loads still boot on GitHub Pages
- Cloudflare Pages uses [`public/_redirects`](/Users/h/dev/virtue-bench-ui/public/_redirects) for SPA fallback
