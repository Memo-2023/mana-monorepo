-- Create the space_members table for synchronized space membership
CREATE TABLE IF NOT EXISTS space_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  added_by UUID,
  UNIQUE(space_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_space_members_user_id ON space_members(user_id);
CREATE INDEX IF NOT EXISTS idx_space_members_space_id ON space_members(space_id);

-- Enable RLS on the table
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;

-- Create policies for space_members table
CREATE POLICY "Users can see space membership they are part of"
ON space_members FOR SELECT
USING (
  user_id = auth.uid() OR
  space_id IN (
    SELECT space_id FROM space_members
    WHERE user_id = auth.uid()
  )
);

-- Update memo policies to allow access to memos in spaces user is member of
CREATE POLICY "Users can view memos in spaces they are members of" 
ON memos FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM memo_spaces ms
    JOIN space_members sm ON ms.space_id = sm.space_id
    WHERE ms.memo_id = memos.id 
    AND sm.user_id = auth.uid()
  )
);

-- Policy for memo_spaces table to allow viewing of memo-space relationships
CREATE POLICY "Users can see memo-space links for spaces they are members of"
ON memo_spaces FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM space_members
    WHERE space_members.space_id = memo_spaces.space_id
    AND space_members.user_id = auth.uid()
  )
);
