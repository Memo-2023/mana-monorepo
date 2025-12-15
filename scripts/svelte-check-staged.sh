#!/bin/bash
# Run svelte-check on web apps that have staged .svelte files
# This catches a11y warnings, Svelte 5 issues, and import errors before CI

set -e

# Get list of staged svelte files
STAGED_SVELTE=$(git diff --cached --name-only --diff-filter=ACM | grep '\.svelte$' || true)

if [ -z "$STAGED_SVELTE" ]; then
    echo "No staged .svelte files, skipping svelte-check"
    exit 0
fi

# Find unique web app directories that have changes
declare -A WEB_APPS

for file in $STAGED_SVELTE; do
    # Extract the web app path (e.g., apps/todo/apps/web)
    if [[ $file =~ ^(apps/[^/]+/apps/web)/ ]]; then
        WEB_APPS["${BASH_REMATCH[1]}"]=1
    elif [[ $file =~ ^(games/[^/]+/apps/web)/ ]]; then
        WEB_APPS["${BASH_REMATCH[1]}"]=1
    elif [[ $file =~ ^(packages/[^/]+)/ ]]; then
        # For shared packages, check all web apps that might use them
        # This is a simplified approach - just warn
        echo "⚠️  Changes in shared package: $file"
        echo "   Consider running: pnpm run build:check to verify all web apps"
    fi
done

if [ ${#WEB_APPS[@]} -eq 0 ]; then
    echo "No web app changes detected"
    exit 0
fi

echo "🔍 Running svelte-check on affected web apps..."
FAILED=0

for app in "${!WEB_APPS[@]}"; do
    if [ -f "$app/package.json" ]; then
        echo ""
        echo "━━━ Checking $app ━━━"

        # Get the package name for pnpm filter
        PKG_NAME=$(node -p "require('./$app/package.json').name" 2>/dev/null || echo "")

        if [ -n "$PKG_NAME" ]; then
            # Run svelte-check with threshold to fail on warnings
            if ! pnpm --filter "$PKG_NAME" exec svelte-check --tsconfig ./tsconfig.json --threshold warning 2>&1; then
                echo "❌ svelte-check failed for $app"
                FAILED=1
            else
                echo "✅ svelte-check passed for $app"
            fi
        fi
    fi
done

if [ $FAILED -eq 1 ]; then
    echo ""
    echo "❌ svelte-check failed! Fix the issues above before committing."
    echo ""
    echo "Common fixes:"
    echo "  - Add role and tabindex to interactive divs"
    echo "  - Add onkeydown handler alongside onclick"
    echo "  - Use \$state() for reactive variables in Svelte 5"
    echo "  - Check that all imports resolve correctly"
    exit 1
fi

echo ""
echo "✅ All svelte-checks passed!"
