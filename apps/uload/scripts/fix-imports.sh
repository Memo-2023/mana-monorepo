#!/bin/bash

# Fix all problematic card imports
FILES=$(find src -name "*.svelte" -type f -exec grep -l "from '\$lib/components/cards/\(BaseCard\|ThemeProvider\|SafeHTMLCard\|CardListV2\|Card\)\.svelte'" {} \; 2>/dev/null)

for file in $FILES; do
  echo "Fixing imports in: $file"
  
  # Replace imports
  sed -i '' "s|import.*from '\$lib/components/cards/Card\.svelte'.*|import CardRenderer from '\$lib/components/cards/CardRenderer.svelte';|g" "$file"
  sed -i '' "s|import.*from '\$lib/components/cards/BaseCard\.svelte'.*||g" "$file"
  sed -i '' "s|import.*from '\$lib/components/cards/ThemeProvider\.svelte'.*||g" "$file"
  sed -i '' "s|import.*from '\$lib/components/cards/SafeHTMLCard\.svelte'.*||g" "$file"
  sed -i '' "s|import.*from '\$lib/components/cards/CardListV2\.svelte'.*||g" "$file"
  
  # Replace component usage (common patterns)
  sed -i '' "s|<Card |<CardRenderer |g" "$file"
  sed -i '' "s|<BaseCard |<CardRenderer |g" "$file"
  sed -i '' "s|<SafeHTMLCard |<CardRenderer |g" "$file"
  
  # Fix type imports
  sed -i '' "s|UnifiedCard|Card|g" "$file"
done

echo "Import fixes completed!"