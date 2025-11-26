#!/bin/bash

# Fix field names to match PocketBase schema

echo "Fixing field names in source files..."

# Fix user -> user_id in filters and create statements
find src -type f \( -name "*.ts" -o -name "*.svelte" \) -exec sed -i '' \
  -e 's/filter: `user="/filter: `user_id="/g' \
  -e 's/filter: `link="/filter: `link_id="/g' \
  -e 's/filter: `folder="/filter: `folder_id="/g' \
  -e 's/\&\& user="/\&\& user_id="/g' \
  -e 's/\&\& link="/\&\& link_id="/g' \
  -e 's/\&\& folder="/\&\& folder_id="/g' {} \;

# Fix field names in create/update operations
find src -type f \( -name "*.ts" -o -name "*.svelte" \) -exec sed -i '' \
  -e 's/^\([[:space:]]*\)user: /\1user_id: /g' \
  -e 's/^\([[:space:]]*\)link: /\1link_id: /g' \
  -e 's/^\([[:space:]]*\)folder: /\1folder_id: /g' {} \;

echo "Done! Field names have been updated."
echo "Please restart your dev server to apply changes."