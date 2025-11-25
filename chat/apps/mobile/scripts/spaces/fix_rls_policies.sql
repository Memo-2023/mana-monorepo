-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS space_members_owner_policy ON space_members;
DROP POLICY IF EXISTS space_members_admin_policy ON space_members;
DROP POLICY IF EXISTS space_members_self_select_policy ON space_members;
DROP POLICY IF EXISTS space_members_invitation_update_policy ON space_members;
DROP POLICY IF EXISTS conversations_select_policy ON conversations;
DROP POLICY IF EXISTS conversations_space_insert_policy ON conversations;
DROP POLICY IF EXISTS conversations_update_policy ON conversations;
DROP POLICY IF EXISTS conversations_delete_policy ON conversations;

-- Recreate RLS policies for space_members (simplified to avoid recursion)
CREATE POLICY space_members_owner_policy
ON public.space_members
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.spaces 
    WHERE id = space_id AND owner_id = auth.uid()
  )
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
  AND invitation_status = 'pending'
);

-- Create simplified policies for conversations

-- Allow users to see their own conversations or shared with them
CREATE POLICY conversations_select_policy
ON conversations
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR 
  space_id IN (
    SELECT space_id FROM public.space_members 
    WHERE user_id = auth.uid() AND invitation_status = 'accepted'
  )
);

-- Allow users to create conversations in spaces they belong to
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

-- Allow users to update their own conversations
CREATE POLICY conversations_update_policy
ON conversations
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Allow users to delete their own conversations
CREATE POLICY conversations_delete_policy
ON conversations
FOR DELETE
TO authenticated
USING (user_id = auth.uid());