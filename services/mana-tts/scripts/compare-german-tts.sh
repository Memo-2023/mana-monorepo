#!/usr/bin/env bash
#
# Compare Orpheus vs Zonos vs Piper for German interview questions.
# Run this after both models are installed on the GPU box.
#
# Usage: ./compare-german-tts.sh [TTS_URL] [API_KEY]
#
# Generates WAV files in ./comparison/ for side-by-side listening.

set -euo pipefail

TTS_URL="${1:-https://gpu-tts.mana.how}"
API_KEY="${2:-${MANA_TTS_API_KEY:-}}"
OUT="./comparison"

mkdir -p "$OUT"

# Sample interview questions (subset)
QUESTIONS=(
  "Was machst du beruflich?"
  "Wo lebst du?"
  "Welche Sprachen sprichst du?"
  "Erzähl kurz von dir."
  "Wann stehst du normalerweise auf?"
  "Was sind deine Interessen und Hobbys?"
  "Was sind deine aktuellen Ziele?"
)

AUTH_HEADER=""
if [ -n "$API_KEY" ]; then
  AUTH_HEADER="Authorization: Bearer $API_KEY"
fi

echo "=== German TTS Comparison ==="
echo "Server: $TTS_URL"
echo "Output: $OUT/"
echo ""

for i in "${!QUESTIONS[@]}"; do
  q="${QUESTIONS[$i]}"
  idx=$(printf "%02d" $((i + 1)))
  echo "[$idx] \"$q\""

  # Piper (baseline)
  echo "  → Piper..."
  curl -s -X POST "$TTS_URL/synthesize/auto" \
    ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"$q\", \"voice\": \"de_kerstin\"}" \
    -o "$OUT/${idx}_piper.wav" 2>/dev/null || echo "  ✗ Piper failed"

  # Orpheus
  echo "  → Orpheus..."
  curl -s -X POST "$TTS_URL/synthesize/orpheus" \
    ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"$q\", \"voice\": \"tara\"}" \
    -o "$OUT/${idx}_orpheus.wav" 2>/dev/null || echo "  ✗ Orpheus failed"

  # Zonos (friendly)
  echo "  → Zonos..."
  curl -s -X POST "$TTS_URL/synthesize/zonos" \
    ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"$q\", \"language\": \"de\", \"emotion\": \"friendly\"}" \
    -o "$OUT/${idx}_zonos.wav" 2>/dev/null || echo "  ✗ Zonos failed"

  echo ""
done

echo "Done! Compare files in $OUT/"
echo ""
echo "Quick listen (macOS):"
echo "  for f in $OUT/01_*.wav; do echo \"\$f\"; afplay \"\$f\"; sleep 1; done"
