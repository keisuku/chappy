#!/bin/bash
# CoinBattle Saki — Asset Pipeline
# Resizes raw hero images to standard sizes using ImageMagick
# Usage: bash scripts/resize_assets.sh
# Requires: ImageMagick (convert command)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
RAW_DIR="$ROOT_DIR/assets/raw"
OUT_BASE="$ROOT_DIR/assets/processed"

# Output directories
mkdir -p "$OUT_BASE/1200x1800" "$OUT_BASE/800x800" "$OUT_BASE/1600x900"

# Check for source images
if [ -z "$(ls -A "$RAW_DIR"/*.png 2>/dev/null)" ]; then
  echo "No PNG files found in $RAW_DIR"
  echo "Place generated hero images there and re-run."
  exit 1
fi

count=0
for f in "$RAW_DIR"/*.png; do
  base=$(basename "$f" .png)
  echo "Processing: $base"

  # Hero card (3:4)
  convert "$f" -resize 1200x1800^ -gravity center -extent 1200x1800 \
    "$OUT_BASE/1200x1800/${base}_1200x1800.png"

  # Avatar (1:1)
  convert "$f" -resize 800x800^ -gravity center -extent 800x800 \
    "$OUT_BASE/800x800/${base}_800x800.png"

  # Banner (16:9)
  convert "$f" -resize 1600x900^ -gravity center -extent 1600x900 \
    "$OUT_BASE/1600x900/${base}_1600x900.png"

  count=$((count + 1))
done

echo "Done. Processed $count images into 3 sizes."
echo "Output: $OUT_BASE/{1200x1800,800x800,1600x900}/"
