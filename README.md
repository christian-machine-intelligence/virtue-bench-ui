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

The app is static. No backend. Vite uses a relative base so `public/data/` works on local dev and static hosts.
