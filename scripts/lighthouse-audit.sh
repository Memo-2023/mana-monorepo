#!/bin/bash
# Lighthouse Performance Audit for all Mana web apps
# Requires: npx (for lighthouse CLI)
# Usage: ./scripts/lighthouse-audit.sh [--json]

set -e

JSON_MODE=false
[ "$1" = "--json" ] && JSON_MODE=true

APPS=(
  "mana.how"
  "chat.mana.how"
  "todo.mana.how"
  "calendar.mana.how"
  "clock.mana.how"
  "contacts.mana.how"
  "storage.mana.how"
  "presi.mana.how"
  "food.mana.how"
  "zitare.mana.how"
  "photos.mana.how"
  "skilltree.mana.how"
  "picture.mana.how"
  "music.mana.how"
)

RESULTS_DIR="lighthouse-results"
mkdir -p "$RESULTS_DIR"

echo "=== Mana Lighthouse Audit ==="
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

for app in "${APPS[@]}"; do
  echo -n "$app... "
  URL="https://$app"

  OUTPUT="$RESULTS_DIR/$(echo $app | tr '.' '-').json"

  npx lighthouse "$URL" \
    --output=json \
    --output-path="$OUTPUT" \
    --chrome-flags="--headless --no-sandbox" \
    --only-categories=performance,accessibility,best-practices,seo \
    --quiet 2>/dev/null

  if [ -f "$OUTPUT" ]; then
    PERF=$(cat "$OUTPUT" | python3 -c "import sys,json; print(int(json.load(sys.stdin)['categories']['performance']['score']*100))" 2>/dev/null || echo "?")
    A11Y=$(cat "$OUTPUT" | python3 -c "import sys,json; print(int(json.load(sys.stdin)['categories']['accessibility']['score']*100))" 2>/dev/null || echo "?")
    BP=$(cat "$OUTPUT" | python3 -c "import sys,json; print(int(json.load(sys.stdin)['categories']['best-practices']['score']*100))" 2>/dev/null || echo "?")
    SEO=$(cat "$OUTPUT" | python3 -c "import sys,json; print(int(json.load(sys.stdin)['categories']['seo']['score']*100))" 2>/dev/null || echo "?")
    echo "Perf:$PERF A11y:$A11Y BP:$BP SEO:$SEO"
  else
    echo "FAILED"
  fi
done

echo ""
echo "Results saved to $RESULTS_DIR/"
