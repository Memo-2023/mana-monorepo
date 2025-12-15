#!/usr/bin/env bash
# Build web apps that have changes compared to the remote branch
# This catches build failures (like npm package incompatibilities) before push

set -e

# Get the remote branch we're pushing to (default to origin/dev)
REMOTE_BRANCH="${1:-origin/dev}"

echo "🔍 Checking for changed web apps compared to $REMOTE_BRANCH..."

# Get list of changed files
CHANGED_FILES=$(git diff --name-only "$REMOTE_BRANCH" HEAD 2>/dev/null || git diff --name-only HEAD~1 HEAD)

if [ -z "$CHANGED_FILES" ]; then
    echo "No changes detected, skipping build check"
    exit 0
fi

# Find unique web app directories that have changes
WEB_APPS=""

for file in $CHANGED_FILES; do
    app_path=""
    if [[ $file =~ ^(apps/[^/]+/apps/web)/ ]]; then
        app_path="${BASH_REMATCH[1]}"
    elif [[ $file =~ ^(games/[^/]+/apps/web)/ ]]; then
        app_path="${BASH_REMATCH[1]}"
    elif [[ $file =~ ^(packages/[^/]+)/ ]]; then
        pkg_name="${BASH_REMATCH[1]}"
        # Shared packages affect multiple apps - check which ones depend on them
        echo "⚠️  Changes in shared package: $pkg_name"

        # For critical shared packages, build the main apps
        case "$pkg_name" in
            packages/shared-ui|packages/shared-auth|packages/shared-theme)
                # These affect most web apps - build the main ones
                for main_app in "apps/manacore/apps/web" "apps/todo/apps/web" "apps/chat/apps/web"; do
                    if [ -d "$main_app" ] && [[ ! " $WEB_APPS " =~ " $main_app " ]]; then
                        WEB_APPS="$WEB_APPS $main_app"
                    fi
                done
                ;;
        esac
    fi

    # Add to list if not already present
    if [ -n "$app_path" ] && [ -d "$app_path" ]; then
        if [[ ! " $WEB_APPS " =~ " $app_path " ]]; then
            WEB_APPS="$WEB_APPS $app_path"
        fi
    fi
done

# Trim leading space
WEB_APPS=$(echo "$WEB_APPS" | xargs)

if [ -z "$WEB_APPS" ]; then
    echo "✅ No web app changes detected, skipping build"
    exit 0
fi

echo ""
echo "📦 Building changed web apps..."
echo "   Apps to build: $WEB_APPS"
echo ""

FAILED=0

for app in $WEB_APPS; do
    if [ -f "$app/package.json" ]; then
        # Get the package name for pnpm filter
        PKG_NAME=$(node -p "require('./$app/package.json').name" 2>/dev/null || echo "")

        if [ -n "$PKG_NAME" ]; then
            echo "━━━ Building $PKG_NAME ━━━"

            if pnpm --filter "$PKG_NAME" build 2>&1; then
                echo "✅ Build passed for $PKG_NAME"
            else
                echo "❌ Build failed for $PKG_NAME"
                FAILED=1
            fi
            echo ""
        fi
    fi
done

if [ $FAILED -eq 1 ]; then
    echo ""
    echo "❌ Build failed! Fix the issues above before pushing."
    echo ""
    echo "Common issues:"
    echo "  - npm package incompatibility (check node_modules versions)"
    echo "  - Missing workspace dependencies in Dockerfile"
    echo "  - TypeScript errors in production build"
    echo ""
    echo "To skip this check (emergency only): git push --no-verify"
    exit 1
fi

echo "✅ All builds passed!"
