#!/usr/bin/env bash
# Výroba jednoho videa ze série: připraví pracovní kopii sady a spustí zvolený krok build.sh.
#   bash video-kit/series/run.sh <popis.js> <voice|preview|render|all|dry>
# Před prvním spuštěním musí být hotové: bash video-kit/build.sh setup && bash video-kit/build.sh sims
set -euo pipefail
S="$(cd "$(dirname "$0")" && pwd)"; KIT="$(dirname "$S")"; SPEC="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
T="$(node -e "console.log(require('$SPEC').title)")"; K="$KIT/work/kits/$T"
mkdir -p "$K/work/asr"
rm -rf "$K/engine" "$K/tools" "$K/sim"; cp -r "$KIT/build.sh" "$KIT/engine" "$KIT/tools" "$KIT/sim" "$K/"
for f in env fonts sim rider-art.svg.txt icon-512.png; do ln -sfn "$KIT/work/$f" "$K/work/$f"; done
ln -sfn "$KIT/work/asr/sherpa-onnx-zipformer-gigaspeech-2023-12-12" "$K/work/asr/sherpa-onnx-zipformer-gigaspeech-2023-12-12"
node "$S/make.js" "$SPEC" "$K"
export KIT_PORT=$((8200 + $(printf '%s' "$T" | cksum | cut -d' ' -f1) % 700))
# „dry“ = náhled bez hlasu se zkušební časovou osou (odhad podle počtu slov)
if [ "${2:-all}" = dry ]; then node "$S/dry.js" "$K"; bash "$K/build.sh" preview; exit 0; fi
# pojistka: z náhledu bez hlasu se nesmí vyrenderovat video
if [ "${2:-all}" = render ] && grep -q '"dry": true' "$K/work/timeline.json" 2>/dev/null; then echo "CHYBÍ hlas: časová osa je jen zkušební → nejdřív spusť krok voice"; exit 1; fi
bash "$K/build.sh" "${2:-all}"
if [ -f "$K/work/out/$T.mp4" ] && [ "${2:-all}" != voice ] && [ "${2:-all}" != preview ]; then cp -f "$K/work/out/$T.mp4" "$KIT/work/out/"; fi
