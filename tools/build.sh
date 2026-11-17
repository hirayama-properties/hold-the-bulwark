#!/usr/bin/env bash
# Rebuild every page of the site from design/Main.dc.html and tools/legal/*.md.
# usage: tools/build.sh            (from the repo root; needs Node.js 18+)
set -euo pipefail
cd "$(dirname "$0")/.."
SITE_URL="https://holdthebulwark.com/"
node tools/build.mjs design/Main.dc.html - . "$SITE_URL"
node tools/legal.mjs . "$SITE_URL"
node tools/version.mjs .
