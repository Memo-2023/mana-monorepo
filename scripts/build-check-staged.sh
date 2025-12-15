#!/bin/bash
# Run production builds on web apps that have changes since main/dev
# This catches issues that only appear in production builds
#
# Usage:
#   ./scripts/build-check-staged.sh          # Check changes vs origin/dev
#   ./scripts/build-check-staged.sh main     # Check changes vs origin/main
#   ./scripts/build-check-staged.sh --all    # Check all web apps

set -e

BASE_BRANCH="${1:-origin/dev}"

# Handle --all flag
if [ "$1" = "--all" ]; then
    echo "🔨 Building ALL web apps..."
    APPS_TO_BUILD=(
        "apps/todo/apps/web"
        "apps/chat/apps/web"
        "apps/calendar/apps/web"
        "apps/clock/apps/web"
        "apps/manacore/apps/web"
        "apps/contacts/apps/web"
        "apps/zitare/apps/web"
        "apps/picture/apps/web"
        "apps/manadeck/apps/web"
    )
else
    echo "🔍 Finding changed files since $BASE_BRANCH..."

    # Get list of changed files
    CHANGED_FILES=$(git diff --name-only "$BASE_BRANCH"...HEAD 2>/dev/null || git diff --name-only HEAD~10...HEAD)

    if [ -z "$CHANGED_FILES" ]; then
        echo "No changes detected"
        exit 0
    fi

    # Find unique web app directories that have changes
    declare -A WEB_APPS

    for file in $CHANGED_FILES; do
        # Direct changes in web app
        if [[ $file =~ ^(apps/[^/]+/apps/web)/ ]]; then
            WEB_APPS["${BASH_REMATCH[1]}"]=1
        elif [[ $file =~ ^(games/[^/]+/apps/web)/ ]]; then
            WEB_APPS["${BASH_REMATCH[1]}"]=1
        # Changes in shared packages affect all web apps using them
        elif [[ $file =~ ^packages/shared- ]]; then
            echo "⚠️  Shared package changed: $file"
            echo "   All web apps may be affected"
            # Add major web apps
            WEB_APPS["apps/todo/apps/web"]=1
            WEB_APPS["apps/chat/apps/web"]=1
            WEB_APPS["apps/calendar/apps/web"]=1
            WEB_APPS["apps/manacore/apps/web"]=1
        fi
    done

    APPS_TO_BUILD=("${!WEB_APPS[@]}")
fi

if [ ${#APPS_TO_BUILD[@]} -eq 0 ]; then
    echo "No web app changes detected"
    exit 0
fi

echo ""
echo "🔨 Building affected web apps..."
echo "   Apps: ${APPS_TO_BUILD[*]}"
echo ""

# First build shared packages (needed for web apps)
echo "━━━ Building shared packages ━━━"
pnpm run build:packages || {
    echo "❌ Failed to build shared packages"
    exit 1
}

FAILED=0

for app in "${APPS_TO_BUILD[@]}"; do
    if [ -f "$app/package.json" ]; then
        echo ""
        echo "━━━ Building $app ━━━"

        PKG_NAME=$(node -p "require('./$app/package.json').name" 2>/dev/null || echo "")

        if [ -n "$PKG_NAME" ]; then
            if ! pnpm --filter "$PKG_NAME" build 2>&1; then
                echo "❌ Build failed for $app"
                FAILED=1
            else
                echo "✅ Build passed for $app"
            fi
        fi
    fi
done

if [ $FAILED -eq 1 ]; then
    echo ""
    echo "❌ Build check failed! Fix the issues above before pushing."
    exit 1
fi

echo ""
echo "✅ All builds passed!"
