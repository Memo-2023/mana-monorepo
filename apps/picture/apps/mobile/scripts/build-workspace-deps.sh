#!/bin/bash
set -e

# Only run during EAS builds, skip for local development
if [ -z "$EAS_BUILD" ]; then
  echo "ℹ️  Skipping workspace deps build (not an EAS build)"
  exit 0
fi

echo "🔨 Building workspace dependencies for EAS..."

# Build design-tokens package
if [ -d "../../packages/design-tokens" ]; then
  echo "Building @picture/design-tokens..."
  cd ../../packages/design-tokens

  # Check if already built
  if [ -f "dist/index.js" ]; then
    echo "✅ Already built, skipping"
  else
    echo "Building..."
    pnpm build
  fi

  cd -
else
  echo "⚠️  design-tokens package not found, skipping"
fi

echo "✅ Workspace dependencies ready"
