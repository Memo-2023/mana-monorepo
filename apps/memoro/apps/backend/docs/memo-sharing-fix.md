# Memoro Space Sharing Fix

This document describes the implementation of space-based memo sharing in the Memoro application, including the solution to the "infinite recursion" issue that was occurring with Row-Level Security (RLS) policies.

## Problem Description

Users were unable to directly access memos created by other users in shared spaces, receiving the following error:

```
Error fetching memo: infinite recursion detected in policy for relation "memos"
```

This happened because:

1. The RLS policies required complex joins between multiple tables
2. PostgreSQL couldn't efficiently resolve these joins during policy evaluation
3. The recursive nature of the policies caused infinite recursion

## Solution: Denormalized Access Control

We implemented a database design pattern called "denormalization for access control" to solve this issue.

### Step 1: Add a Direct Access Column to Memos Table

```sql
-- Add a direct helper column to the memos table to simplify RLS
ALTER TABLE memos ADD COLUMN IF NOT EXISTS shared_with_users UUID[] DEFAULT '{}'::uuid[];
```

This array column directly stores the UUIDs of all users who should have access to each memo, eliminating the need for complex joins in RLS policies.

### Step 2: Create Triggers to Maintain the Access Array

First, create a function to update the `shared_with_users` array when a memo is linked to a space:

```sql
-- Create an update function that will maintain this column
CREATE OR REPLACE FUNCTION update_memo_shared_with_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the shared_with_users array for the affected memo
  UPDATE memos
  SET shared_with_users = (
    SELECT array_agg(DISTINCT sm.user_id)
    FROM memo_spaces ms
    JOIN space_members sm ON ms.space_id = sm.space_id
    WHERE ms.memo_id = NEW.memo_id
  )
  WHERE id = NEW.memo_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for memo_spaces table changes
DROP TRIGGER IF EXISTS memo_spaces_insert_update_trigger ON memo_spaces;
CREATE TRIGGER memo_spaces_insert_update_trigger
AFTER INSERT OR UPDATE ON memo_spaces
FOR EACH ROW
EXECUTE FUNCTION update_memo_shared_with_users();

DROP TRIGGER IF EXISTS memo_spaces_delete_trigger ON memo_spaces;
CREATE TRIGGER memo_spaces_delete_trigger
AFTER DELETE ON memo_spaces
FOR EACH ROW
EXECUTE FUNCTION update_memo_shared_with_users();
```

Then, create a function and trigger to update the access arrays when space membership changes:

```sql
-- Create trigger for space_members changes
CREATE OR REPLACE FUNCTION update_all_memos_for_space()
RETURNS TRIGGER AS $$
BEGIN
  -- For each memo in the space, update its shared_with_users array
  UPDATE memos m
  SET shared_with_users = (
    SELECT array_agg(DISTINCT sm.user_id)
    FROM memo_spaces ms
    JOIN space_members sm ON ms.space_id = sm.space_id
    WHERE ms.memo_id = m.id
    AND ms.space_id = NEW.space_id OR ms.space_id = OLD.space_id
  )
  WHERE m.id IN (
    SELECT memo_id FROM memo_spaces WHERE space_id = NEW.space_id OR space_id = OLD.space_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS space_members_trigger ON space_members;
CREATE TRIGGER space_members_trigger
AFTER INSERT OR UPDATE OR DELETE ON space_members
FOR EACH ROW
EXECUTE FUNCTION update_all_memos_for_space();
```

### Step 3: Initialize the Column for Existing Data

```sql
-- Populate the shared_with_users column for all existing memos
UPDATE memos m
SET shared_with_users = (
  SELECT array_agg(DISTINCT sm.user_id)
  FROM memo_spaces ms
  JOIN space_members sm ON ms.space_id = sm.space_id
  WHERE ms.memo_id = m.id
);
```

### Step 4: Create Simplified RLS Policies

```sql
-- Drop existing policies on memos
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON memos;', ' ')
        FROM pg_policies
        WHERE tablename = 'memos'
    );
END $$;

-- Create simplified policies that use the denormalized column
CREATE POLICY "Users can access own memos" 
ON memos FOR ALL 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view shared memos" 
ON memos FOR SELECT 
USING (auth.uid()::uuid = ANY(shared_with_users));
```

## How This Solution Works

1. When a memo is linked to a space, the trigger automatically adds all space members to the memo's `shared_with_users` array
2. When space membership changes (users added/removed), the trigger updates all affected memos
3. The RLS policies are now simple and non-recursive:
   - Users can always access their own memos
   - Users can view memos where their UUID is in the `shared_with_users` array

## Benefits

1. **No More Recursion**: The simple policies avoid complex joins that caused the infinite recursion
2. **Better Performance**: Array lookups are much faster than multiple table joins
3. **Automatic Maintenance**: The triggers keep everything in sync without requiring code changes
4. **Same Functionality**: Users still get the same sharing behavior, just implemented more efficiently

## Verification

You can verify the solution is working by checking:

```sql
-- Check the data in our helper column for a specific memo
SELECT id, title, user_id, shared_with_users 
FROM memos 
WHERE id = 'your-memo-id';
```

This should show the memo with a list of user IDs in the `shared_with_users` array, including both the memo owner and all members of spaces the memo is shared with.

## Troubleshooting

If you encounter issues with the sharing functionality:

1. Check if the triggers are properly updating the `shared_with_users` array
2. Verify that the `space_members` table is correctly populated
3. Ensure the `memo_spaces` table correctly links memos to spaces

You can manually update the `shared_with_users` array for testing:

```sql
UPDATE memos
SET shared_with_users = array_append(shared_with_users, 'user-uuid-here')
WHERE id = 'memo-id-here';
```
