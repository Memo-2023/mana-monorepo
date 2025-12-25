#!/bin/sh
# Build shared packages in dependency order for Docker builds
# This script is used by backend Dockerfiles to build shared packages

set -e

echo "Building shared packages in dependency order..."

# Build packages in dependency order
cd /app

# 1. Build base packages with no dependencies
echo "Building better-auth-types..."
cd packages/better-auth-types && pnpm build && cd /app

echo "Building shared-errors..."
cd packages/shared-errors && pnpm build && cd /app

# 2. Build packages that depend on base packages
echo "Building shared-nestjs-cors..."
cd packages/shared-nestjs-cors && pnpm build && cd /app

echo "Building shared-nestjs-auth..."
cd packages/shared-nestjs-auth && pnpm build && cd /app

echo "✅ All shared packages built successfully!"
