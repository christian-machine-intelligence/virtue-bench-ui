#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/virtue-bench-ui-pages.XXXXXX")"

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

cd "$ROOT_DIR"

REMOTE_URL="$(git remote get-url origin)"
COMMIT_SHA="$(git rev-parse --short HEAD)"

vp build

cp -R dist/. "$TMP_DIR"/
touch "$TMP_DIR/.nojekyll"

cd "$TMP_DIR"

git init -b gh-pages >/dev/null
git config user.name "VirtueBench Pages"
git config user.email "pages@local"
git add -A
git commit -m "Publish ${COMMIT_SHA}" >/dev/null
git remote add origin "$REMOTE_URL"
git push --force origin gh-pages
