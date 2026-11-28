#!/usr/bin/env bash
# Varianta hotového videa s jiným háčkem pro trial reels (autor 28. 11. 2026): přerenderuje jen první akt (asi 6 s),
# zbytek snímků vezme ze základního videa. Varianty jsou v popisu videa ve „variants“.
#   bash video-kit/series/variant.sh <popis.js> <id varianty>
# Před tím musí být hotový render základního videa (run.sh … render) a jeho snímky v work/kits/<title>/work/frames.
set -euo pipefail
S="$(cd "$(dirname "$0")" && pwd)"; KIT="$(dirname "$S")"; SPEC="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; ID="$2"
BT="$(node -e "console.log(require('$SPEC').title)")"; BK="$KIT/work/kits/$BT"; VT="$BT-$ID"; VK="$KIT/work/kits/$VT"; PY="$KIT/work/env/bin/python"
N="$(python3 -c "import json;print(json.load(open('$BK/work/timeline.json'))['frames'])")"
[ "$(find "$BK/work/frames" -name '*.jpg' | wc -l)" -eq "$N" ] || { echo "CHYBÍ snímky základního videa → nejdřív: bash video-kit/series/run.sh $1 render"; exit 1; }
node -e "const s=require('$SPEC'); if(!s.variants||!s.variants['$ID']){console.error('varianta $ID v popisu není');process.exit(1)}"
# pracovní kopie sady pro variantu (jako run.sh) a popis s jiným háčkem
mkdir -p "$VK/work/asr" "$VK/work/frames" "$VK/work/out"
rm -rf "$VK/engine" "$VK/tools" "$VK/sim"; cp -r "$KIT/build.sh" "$KIT/engine" "$KIT/tools" "$KIT/sim" "$VK/"
for f in env fonts sim rider-art.svg.txt icon-512.png; do ln -sfn "$KIT/work/$f" "$VK/work/$f"; done
ln -sfn "$KIT/work/asr/sherpa-onnx-zipformer-gigaspeech-2023-12-12" "$VK/work/asr/sherpa-onnx-zipformer-gigaspeech-2023-12-12"
cat > "$VK/spec.js" <<JS
const s = require('$SPEC'), v = s.variants['$ID'], k = s.acts[0][1];
module.exports = Object.assign({}, s, { title: '$VT', lines: Object.assign({}, s.lines, { [k]: Object.assign({}, s.lines[k], v) }) });
JS
node "$S/make.js" "$VK/spec.js" "$VK"
# hlas: hotové věty ze základního videa (namluví se jen nový háček), přepis, časová osa základu s novým háčkem
rm -rf "$VK/work/tts"; cp -r "$BK/work/tts" "$VK/work/tts"
"$PY" "$KIT/tools/tts.py" "$VK" "$VK/work"
"$PY" "$KIT/tools/align.py" "$VK/work" 2>&1 | grep -v -i warn || true
"$PY" "$KIT/tools/variant_timeline.py" "$BK/work/timeline.json" "$VK/script.json" "$VK/work"
# snímky: první akt (do konce aktu + 2 snímky) znovu, o jeden víc na kontrolu napojení
CUT="$(python3 -c "import json;print(int(json.load(open('$BK/work/timeline.json'))['acts'][0]['end']*30)+2)")"
find "$VK/work/frames" -name '*.jpg' -delete; find "$VK/work/frames" -type l -delete
export KIT_PORT=$((8200 + $(printf '%s' "$VT" | cksum | cut -d' ' -f1) % 700))
(cd "$VK" && exec python3 -m http.server "$KIT_PORT" </dev/null >/dev/null 2>&1) & SRV=$!; trap 'kill $SRV 2>/dev/null' EXIT; sleep 1
Q=$(( (CUT + 2 + 3) / 4 )); pids=()
for i in 0 1 2 3; do A=$((i * Q)); B=$(((i + 1) * Q)); [ "$B" -gt $((CUT + 2)) ] && B=$((CUT + 2)); [ "$A" -lt "$B" ] && { node "$VK/engine/render.js" frames $A $B > "$VK/work/render-$i.log" 2>&1 & pids+=($!); }; done
fail=0; for p in "${pids[@]}"; do wait "$p" || fail=1; done; cat "$VK"/work/render-?.log
[ "$fail" -eq 0 ] || { echo "CHYBA při renderu úvodu"; exit 1; }
# kontrola napojení: snímek CUT+1 varianty a základu musí být skoro stejný
"$PY" -c "
import numpy as np; from PIL import Image
a=np.asarray(Image.open('$VK/work/frames/%05d.jpg'%($CUT+1)).convert('L'),dtype=float); b=np.asarray(Image.open('$BK/work/frames/%05d.jpg'%($CUT+1)).convert('L'),dtype=float)
d=np.abs(a-b).mean(); print(f'NAPOJENÍ: rozdíl snímku {$CUT+1} proti základu {d:.2f} (0 = stejné)'); raise SystemExit(0 if d < 2.5 else 3)"
# zbytek snímků ze základu
for ((f = CUT + 1; f < N; f++)); do ln -sfn "$BK/work/frames/$(printf %05d $f).jpg" "$VK/work/frames/$(printf %05d $f).jpg"; done
"$PY" "$KIT/tools/audio.py" "$VK/work"
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "$VK/work/frames/%05d.jpg" -i "$VK/work/audio.wav" -c:v libx264 -preset slow -crf 21 -maxrate 6500k -bufsize 13M \
  -pix_fmt yuv420p -profile:v high -level 4.2 -r 30 -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart -shortest "$VK/work/out/$VT.mp4"
cp -f "$VK/work/out/$VT.mp4" "$KIT/work/out/"
echo "VIDEO: $KIT/work/out/$VT.mp4 (přerenderováno $((CUT + 2)) z $N snímků)"
