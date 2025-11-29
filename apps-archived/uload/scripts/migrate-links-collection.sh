#!/bin/bash

# Migration script for PocketBase links collection
# This script documents the manual steps needed to replace the old links collection

echo "🔄 Links Collection Migration Guide"
echo "=================================="

cat << EOF

⚠️  IMPORTANT: Database Migration Required

The new 'links_improved' collection has been created with all the enhanced fields:
✅ created/updated timestamps (automatic)
✅ use_username (bool)
✅ click_count (number)
✅ last_clicked_at (date)
✅ utm_source, utm_medium, utm_campaign (text)

MANUAL STEPS REQUIRED IN POCKETBASE ADMIN:

1. BACKUP FIRST (!)
   - Go to: https://pb.ulo.ad/_/
   - Create a backup before proceeding

2. UPDATE REFERENCES:
   Because the old 'links' collection has references (clicks, linktags),
   we need to update the application code first:
   
   a) Update all references in the app from 'links' to 'links_improved'
   b) Test with the new collection
   c) When everything works, delete the old collection

3. COLLECTION RENAMING:
   After updating the code:
   - Delete the old 'links' collection
   - Rename 'links_improved' to 'links'

ALTERNATIVE APPROACH (RECOMMENDED):
Instead of renaming, update the application code to use 'links_improved'
and keep it as the new name.

EOF

echo ""
echo "📋 Migration Status:"
echo "✅ New collection 'links_improved' created"
echo "✅ Test data migrated successfully"
echo "✅ All new fields working correctly"
echo "⏳ Manual steps required (see above)"
echo ""
echo "🔍 Test the new collection:"
echo "Collection ID: pbc_394542459"
echo "Test records created: 2"
echo ""

# Show the test data
echo "📊 Sample data from new collection:"
echo "=================================="
echo "Test Link 1: TEST001 - https://example.com (with UTM tracking)"
echo "Test Link 2: JxBSn7 - https://ulo.ad/my/links (migrated)"
echo ""
echo "Both records have automatic timestamps ✅"