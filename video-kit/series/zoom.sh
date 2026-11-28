#!/usr/bin/env bash
# Varianta hotového videa bez renderu: přiblížení (např. 1.05) nebo oddálení (např. 0.95) celého obrazu (trial reels,
# autor 28. 11. 2026). Při oddálení vyplní okraj rozmazaná a ztmavená kopie videa. Zvuk se jen zkopíruje.
#   bash video-kit/series/zoom.sh <video.mp4> <faktor> <výstup.mp4>
set -euo pipefail
IN="$1"; Z="$2"; OUT="$3"
if python3 -c "import sys; sys.exit(0 if float('$Z') >= 1 else 1)"; then
  VF="scale=trunc(1080*$Z/2)*2:trunc(1920*$Z/2)*2,crop=1080:1920"
else
  VF="split[a][b];[a]scale=1080:1920,boxblur=30:2,eq=brightness=-0.18[bg];[b]scale=trunc(1080*$Z/2)*2:trunc(1920*$Z/2)*2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2"
fi
ffmpeg -hide_banner -loglevel error -y -i "$IN" -filter_complex "$VF" -c:v libx264 -preset slow -crf 21 -maxrate 6500k -bufsize 13M -pix_fmt yuv420p \
  -profile:v high -level 4.2 -r 30 -c:a copy -movflags +faststart "$OUT"
echo "VIDEO: $OUT (zoom $Z)"
