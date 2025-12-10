#!/bin/bash

# Script to remove Coolify references and replace with Docker Compose equivalents
# Usage: ./scripts/remove-coolify-references.sh

set -e

echo "Starting Coolify reference removal..."

# Function to replace text in files
replace_in_file() {
    local file=$1
    local search=$2
    local replace=$3

    if [ -f "$file" ]; then
        sed -i.bak "s|$search|$replace|g" "$file" && rm "${file}.bak"
        echo "  ✓ Updated: $file"
    fi
}

# Common replacements across all files
echo "Applying common replacements..."

# Platform references
find . -type f \( -name "*.md" -o -name "*.yml" -o -name "*.yaml" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/archive/*" \
    -exec sed -i.bak 's/Coolify + Hetzner/Docker Compose + Hetzner VPS/g' {} \; \
    -exec sed -i.bak 's/Coolify (open-source PaaS)/Docker Compose orchestration/g' {} \; \
    -exec sed -i.bak 's/Coolify server/Hetzner VPS/g' {} \; \
    -exec sed -i.bak 's/Coolify Platform/Docker Compose/g' {} \; \
    -exec sed -i.bak 's/Coolify managed/Docker Compose managed/g' {} \; \
    -exec sed -i.bak 's/Install Coolify/Set up Docker Compose/g' {} \; \
    -exec sed -i.bak 's/Coolify UI/Docker Compose configuration/g' {} \; \
    -exec sed -i.bak 's/Coolify deployment/Docker Compose deployment/g' {} \; \
    -exec sed -i.bak 's/Platform: Coolify/Platform: Docker Compose/g' {} \; \
    -exec sed -i.bak 's/Platform\*\*: Coolify/Platform**: Docker Compose/g' {} \;

# Clean up backup files
find . -name "*.bak" -type f -delete

echo "✓ Common replacements complete"

# Specific file updates
echo "Updating specific files..."

# Update TODO.md to remove Coolify installation steps
if [ -f "cicd/TODO.md" ]; then
    echo "  - Updating cicd/TODO.md..."
    # Remove the "Install Coolify" section header and related tasks
    sed -i.bak '/### 1.3 Install Coolify/,/\*\*\*\*/d' cicd/TODO.md
    sed -i.bak 's/Provision production server/Set up production server/g' cicd/TODO.md
    sed -i.bak 's/Install Coolify on production server/Set up Docker Compose on production server/g' cicd/TODO.md
    rm cicd/TODO.md.bak
fi

# Update PLAN.md
if [ -f "cicd/PLAN.md" ]; then
    echo "  - Updating cicd/PLAN.md..."
    sed -i.bak 's/Coolify with auto-scaling/Docker Compose with manual scaling/g' cicd/PLAN.md
    sed -i.bak '/Coolify Documentation/d' cicd/PLAN.md
    sed -i.bak '/GitHub Repository.*coolify/d' cicd/PLAN.md
    rm cicd/PLAN.md.bak
fi

# Clean up remaining backup files
find . -name "*.bak" -type f -delete

echo "✅ Coolify reference removal complete!"
echo ""
echo "Files modified. Please review changes with: git diff"
