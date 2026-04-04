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

if [[ "$REMOTE_URL" == git@*:* ]]; then
  REMOTE_PATH="${REMOTE_URL#*:}"
else
  REMOTE_PATH="${REMOTE_URL#https://github.com/}"
  REMOTE_PATH="${REMOTE_PATH#http://github.com/}"
  REMOTE_PATH="${REMOTE_PATH#ssh://git@github.com/}"
fi

REPO_NAME="${REMOTE_PATH##*/}"
REPO_NAME="${REPO_NAME%.git}"
BASE_PATH="/${REPO_NAME}/"

BASE_PATH="$BASE_PATH" vp build
cp dist/index.html dist/404.html

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
