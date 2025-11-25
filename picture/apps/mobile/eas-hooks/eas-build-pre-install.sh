#!/usr/bin/env bash

# EAS Build Pre-Install Hook
# This hook builds all workspace packages before the main build
# Runs before dependencies are installed

set -e

echo "📦 EAS Build: Pre-install hook started"
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"

# Build all workspace packages that need compilation
echo "🔨 Building workspace packages..."

# Build design-tokens package
if [ -d "../../packages/design-tokens" ]; then
  echo "Building @picture/design-tokens..."
  cd ../../packages/design-tokens
  pnpm install --frozen-lockfile
  pnpm build
  cd -
  echo "✅ @picture/design-tokens built successfully"
fi

# Build shared package if it has a build script
if [ -d "../../packages/shared" ]; then
  echo "Checking @picture/shared..."
  cd ../../packages/shared
  if grep -q '"build"' package.json; then
    echo "Building @picture/shared..."
    pnpm install --frozen-lockfile
    pnpm build
    echo "✅ @picture/shared built successfully"
  else
    echo "ℹ️  @picture/shared has no build script, skipping"
  fi
  cd -
fi

echo "✅ EAS Build: Pre-install hook completed"
