#!/usr/bin/env bash
# Výroba vysvětlovacího aero videa. Spouštěj z kořene repozitáře:
#   bash video-kit/build.sh setup     jednorázově: knihovny, písma, model pro rozpoznání řeči (asi 3 min)
#   bash video-kit/build.sh sims      jednorázově: simulace proudění kolem jezdce, válce a kapky (asi 10 min)
#   bash video-kit/build.sh voice     hlas podle script.json, přepis a časová osa
#   bash video-kit/build.sh preview   náhledové archy klíčových snímků (work/stills/sheet-*.jpg)
#   bash video-kit/build.sh render    celé video se zvukem → work/out/<title>.mp4 (asi 12 min)
#   bash video-kit/build.sh all       voice + preview + render
set -euo pipefail
KIT="$(cd "$(dirname "$0")" && pwd)"; WORK="$KIT/work"; PY="$WORK/env/bin/python"; PORT="${KIT_PORT:-8140}"
mkdir -p "$WORK"/{tts,asr,sim,stills,frames,out,fonts}
# pomocný server, který si krok sám spustil, se na konci zase vypne (jinak příkaz zůstane viset)
SRV=""; trap '[ -z "$SRV" ] || kill "$SRV" 2>/dev/null || true' EXIT

server() { curl -s -o /dev/null "http://localhost:$PORT/engine/index.html" || { (cd "$KIT" && exec python3 -m http.server "$PORT" </dev/null >/dev/null 2>&1) & SRV=$!; sleep 1; }; }
need() { [ -e "$1" ] || { echo "CHYBÍ $1 → nejdřív spusť: bash video-kit/build.sh $2"; exit 1; }; }

setup() {
  [ -x "$PY" ] || python3 -m venv "$WORK/env"
  "$WORK/env/bin/pip" install -q numpy soundfile pillow sherpa-onnx 2>&1 | grep -v notice || true
  if [ ! -f "$WORK/fonts/inter-latin-800-normal.woff2" ]; then
    (cd "$WORK" && { [ -f package.json ] || npm init -y >/dev/null; } && npm install --silent @fontsource/unbounded @fontsource/inter)
    cp "$WORK"/node_modules/@fontsource/unbounded/files/unbounded-latin-{700,800}-normal.woff2 "$WORK"/node_modules/@fontsource/inter/files/inter-latin-{600,700,800}-normal.woff2 "$WORK/fonts/"
  fi
  if [ ! -d "$WORK/asr/sherpa-onnx-zipformer-gigaspeech-2023-12-12" ]; then
    curl -sS -L -m 600 -o "$WORK/asr/m.tar.bz2" "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-zipformer-gigaspeech-2023-12-12.tar.bz2"
    tar xjf "$WORK/asr/m.tar.bz2" -C "$WORK/asr" && rm "$WORK/asr/m.tar.bz2"
  fi
  cp "$KIT/../icons/icon-512.png" "$WORK/icon-512.png"
  echo "setup hotový"
}

sims() {
  need "$PY" setup
  node "$KIT/sim/mkmask.js" "$KIT/../icons/logo.svg" "$WORK"
  "$PY" "$KIT/sim/potential.py" "$WORK/sim"
  if [ -f "$WORK/sim/cyl.bin" ] && [ -f "$WORK/sim/rider.bin" ]; then echo "simulace válce a jezdce už existují"; return; fi
  echo "počítám proudění kolem válce a jezdce (asi 10 minut)…"
  "$PY" "$KIT/sim/lbm.py" cyl "$WORK/sim" > "$WORK/sim/cyl.log" 2>&1 & P1=$!
  "$PY" "$KIT/sim/lbm.py" rider "$WORK/sim" > "$WORK/sim/rider.log" 2>&1 & P2=$!
  wait $P1 $P2; tail -n 1 "$WORK/sim/cyl.log" "$WORK/sim/rider.log"
}

voice() {
  need "$PY" setup
  "$PY" "$KIT/tools/tts.py" "$KIT" "$WORK"
  "$PY" "$KIT/tools/align.py" "$WORK" 2>&1 | grep -v -i "warn"
  "$PY" "$KIT/tools/timeline.py" "$KIT" "$WORK"
}

preview() {
  need "$WORK/timeline.json" voice; need "$WORK/sim/rider.bin" sims; server
  rm -f "$WORK"/stills/*.jpg
  local fail=0
  node "$KIT/engine/render.js" stills "$("$PY" "$KIT/tools/sheet.py" frames "$WORK")" | tee "$WORK/preview.log" || fail=1
  if grep -q '^CHYBA' "$WORK/preview.log"; then echo "Náhled se nevykreslil celý. Příčina je na řádku CHYBA výše (nejčastěji překlep ve scenes.js)."; exit 1; fi
  "$PY" "$KIT/tools/sheet.py" make "$WORK"
  [ "$fail" -eq 0 ] || { echo "POZOR: náhled hlásil chybu nebo text mimo obraz (viz výše). Oprav scenes.js a spusť preview znovu."; exit 1; }
}

render() {
  need "$WORK/timeline.json" voice; need "$WORK/sim/rider.bin" sims; server
  local N; N=$("$PY" -c "import json;print(json.load(open('$WORK/timeline.json'))['frames'])"); local Q=$(( (N + 3) / 4 ))
  find "$WORK/frames" -name '*.jpg' -delete
  local pids=() fail=0
  for i in 0 1 2 3; do node "$KIT/engine/render.js" frames $((i * Q)) $(((i + 1) * Q)) > "$WORK/render-$i.log" 2>&1 & pids+=($!); done
  for p in "${pids[@]}"; do wait "$p" || fail=1; done
  cat "$WORK"/render-?.log
  [ "$(find "$WORK/frames" -name '*.jpg' | wc -l)" -eq "$N" ] || { echo "CHYBA: vykreslilo se míň snímků než $N"; exit 1; }
  "$PY" "$KIT/tools/audio.py" "$WORK"
  local T; T=$("$PY" -c "import json;print(json.load(open('$KIT/script.json'))['title'])")
  ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "$WORK/frames/%05d.jpg" -i "$WORK/audio.wav" -c:v libx264 -preset slow -crf 21 -maxrate 6500k -bufsize 13M \
    -pix_fmt yuv420p -profile:v high -level 4.2 -r 30 -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart -shortest "$WORK/out/$T.mp4"
  ffprobe -v error -select_streams v -show_entries stream=width,height -show_entries format=duration,size -of compact "$WORK/out/$T.mp4"
  echo "VIDEO: $WORK/out/$T.mp4"
  [ "$fail" -eq 0 ] || { echo "POZOR: render hlásil chybu nebo text mimo obraz (viz výše). Oprav a spusť znovu."; exit 1; }
}

case "${1:-}" in
  setup) setup ;; sims) sims ;; voice) voice ;; preview) preview ;; render) render ;;
  all) voice; preview; render ;;
  *) sed -n '2,9p' "$0" ;;
esac
