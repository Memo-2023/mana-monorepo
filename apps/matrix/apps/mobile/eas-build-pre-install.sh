#!/bin/bash
# EAS Build pre-install hook
# Creates .npmrc with node-linker=hoisted at the monorepo root
# so pnpm uses a flat node_modules structure compatible with
# React Native / Metro bundler module resolution.

MONOREPO_ROOT="$EAS_BUILD_WORKINGDIR"
if [ -z "$MONOREPO_ROOT" ]; then
  MONOREPO_ROOT=$(cd "$(dirname "$0")/../../../.." && pwd)
fi

echo "node-linker=hoisted" > "$MONOREPO_ROOT/.npmrc"
echo "Created .npmrc with node-linker=hoisted at $MONOREPO_ROOT"
