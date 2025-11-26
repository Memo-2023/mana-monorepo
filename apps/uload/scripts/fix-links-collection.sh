#!/bin/bash

# Script to update the links collection in PocketBase
# This adds missing fields to improve the structure

echo "Updating links collection structure..."

# PocketBase URL
PB_URL="https://pb.ulo.ad"

# Note: This script outlines the manual steps needed
# Since we can't modify the collection directly through the API due to references,
# these changes need to be made in the PocketBase Admin UI

cat << EOF

===========================================
MANUAL STEPS FOR POCKETBASE ADMIN UI
===========================================

Please log into PocketBase Admin at: ${PB_URL}/_/

1. Navigate to Collections > links

2. Add the following NEW fields:

   a) use_username (Bool)
      - Required: No
      - Default: false
      
   b) click_count (Number)
      - Required: No
      - Default: 0
      - Note: Will be calculated from clicks collection
      
   c) last_clicked_at (Date)
      - Required: No
      
   d) utm_source (Text)
      - Required: No
      - Max length: 255
      
   e) utm_medium (Text)
      - Required: No
      - Max length: 255
      
   f) utm_campaign (Text)
      - Required: No
      - Max length: 255

3. Rename field (if possible):
   - "password" → "password_hash"
   - Note: If renaming breaks references, keep as "password"

4. Update field settings:
   - max_clicks: Set "Only integers" to true, Min value: 0
   - click_count: Set "Only integers" to true, Min value: 0

5. Add Indexes (under "Indexes" tab):
   - short_code (unique)
   - user_id
   - is_active
   - created_by

6. Save the collection

===========================================
CODE CHANGES NEEDED AFTER DB UPDATE:
===========================================

After updating the database, update these files:

1. /src/lib/pocketbase/types.ts
   - Add new fields to Link interface

2. /src/routes/(app)/my/links/+page.server.ts
   - Handle use_username field in create action
   - Remove references to folder_id

3. /src/routes/[code]/+page.server.ts
   - Update click tracking to increment click_count
   - Set last_clicked_at on each click

EOF

echo "Instructions printed. Please follow the manual steps above."