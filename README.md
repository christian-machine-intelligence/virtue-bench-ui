# VirtueBench Viewer

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

- GitHub Pages:
  - push to `main`
  - enable Pages for the repo and set source to `GitHub Actions`
  - workflow uses `setup-vp`, runs `vp install`, then publishes `dist/`
- Cloudflare Pages: build command `vp build`, output directory `dist`

The app is static. No backend. Vite uses a relative base so `public/data/` works on local dev, Pages, and other static hosts.
