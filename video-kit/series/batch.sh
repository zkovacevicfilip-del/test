#!/usr/bin/env bash
# Víc videí ze série za sebou:  bash video-kit/series/batch.sh <voice|preview|render|all> <popis.js> [další popisy…]
S="$(cd "$(dirname "$0")" && pwd)"; STEP="$1"; shift
for f in "$@"; do
  echo "=== $(basename "$f") $(date +%T)"
  bash "$S/run.sh" "$f" "$STEP" 2>&1 | grep -vE "^  (akt|věta)|^[a-z0-9_]+ +[0-9.]+ s  |^PŘEPIS|^náhled|^snímky|^zvuk|^celkem"
done
echo "HOTOVO $(date +%T)"
