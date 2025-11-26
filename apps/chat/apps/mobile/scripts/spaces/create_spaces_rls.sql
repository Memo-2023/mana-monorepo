-- Enable Row Level Security for spaces tables
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for spaces

-- Space owners can do everything with their spaces
CREATE POLICY spaces_owner_policy
ON public.spaces
TO authenticated
USING (owner_id = auth.uid());

-- Members can view spaces they belong to
CREATE POLICY spaces_member_select_policy
ON public.spaces
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT space_id 
    FROM public.space_members 
    WHERE user_id = auth.uid() AND invitation_status = 'accepted'
  )
);

-- RLS policies for space_members

-- Space owners can manage all members
CREATE POLICY space_members_owner_policy
ON public.space_members
TO authenticated
USING (
  space_id IN (
    SELECT id FROM public.spaces WHERE owner_id = auth.uid()
  )
);

-- Space admins can manage members (except owners)
CREATE POLICY space_members_admin_policy
ON public.space_members
TO authenticated
USING (
  space_id IN (
    SELECT space_id FROM public.space_members 
    WHERE user_id = auth.uid() AND role = 'admin' AND invitation_status = 'accepted'
  )
  AND role != 'owner'
);

-- Users can see which spaces they are members of
CREATE POLICY space_members_self_select_policy
ON public.space_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can accept/decline their own invitations
CREATE POLICY space_members_invitation_update_policy
ON public.space_members
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  AND (OLD.invitation_status = 'pending')
  AND (NEW.invitation_status IN ('accepted', 'declined'))
  AND (OLD.role = NEW.role)
  AND (OLD.space_id = NEW.space_id)
  AND (OLD.user_id = NEW.user_id)
);

-- Update RLS policies for conversations

-- Modify existing policies to include space-based access
DROP POLICY IF EXISTS conversations_select_policy ON conversations;
CREATE POLICY conversations_select_policy
ON conversations
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR 
  (
    space_id IN (
      SELECT space_id FROM public.space_members 
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  )
);

-- Allow space members to create conversations in spaces they belong to
CREATE POLICY conversations_space_insert_policy
ON conversations
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND 
  (
    space_id IS NULL 
    OR 
    space_id IN (
      SELECT space_id FROM public.space_members 
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  )
);

-- Allow updates to conversations in spaces based on role
DROP POLICY IF EXISTS conversations_update_policy ON conversations;
CREATE POLICY conversations_update_policy
ON conversations
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  OR 
  (
    space_id IN (
      SELECT sm.space_id FROM public.space_members sm
      WHERE sm.user_id = auth.uid() 
      AND sm.invitation_status = 'accepted'
      AND sm.role IN ('owner', 'admin')
    )
  )
);

-- Allow deletion of conversations in spaces based on role
DROP POLICY IF EXISTS conversations_delete_policy ON conversations;
CREATE POLICY conversations_delete_policy
ON conversations
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  OR 
  (
    space_id IN (
      SELECT sm.space_id FROM public.space_members sm
      WHERE sm.user_id = auth.uid() 
      AND sm.invitation_status = 'accepted'
      AND sm.role IN ('owner', 'admin')
    )
  )
);

-- Helper function to check if a user has access to a space
CREATE OR REPLACE FUNCTION public.user_has_space_access(space_uuid UUID, role_level TEXT DEFAULT 'viewer')
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
  role_hierarchy TEXT[];
BEGIN
  -- Define role hierarchy from highest to lowest
  role_hierarchy := ARRAY['owner', 'admin', 'member', 'viewer'];
  
  -- Find position of requested role in hierarchy
  WITH role_positions AS (
    SELECT 
      unnest(role_hierarchy) AS role,
      row_number() OVER () AS position
  )
  
  SELECT EXISTS (
    SELECT 1 FROM public.space_members sm
    JOIN role_positions rp1 ON sm.role = rp1.role
    JOIN role_positions rp2 ON rp2.role = role_level
    WHERE sm.space_id = space_uuid
    AND sm.user_id = auth.uid()
    AND sm.invitation_status = 'accepted'
    AND rp1.position <= rp2.position  -- Check if user's role is at least the required level
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;