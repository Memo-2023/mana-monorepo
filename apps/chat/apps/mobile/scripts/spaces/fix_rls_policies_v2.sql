-- Completely drop ALL RLS policies for the affected tables
DROP POLICY IF EXISTS spaces_owner_policy ON spaces;
DROP POLICY IF EXISTS spaces_member_select_policy ON spaces;
DROP POLICY IF EXISTS space_members_owner_policy ON space_members;
DROP POLICY IF EXISTS space_members_admin_policy ON space_members;
DROP POLICY IF EXISTS space_members_self_select_policy ON space_members;
DROP POLICY IF EXISTS space_members_invitation_update_policy ON space_members;
DROP POLICY IF EXISTS conversations_select_policy ON conversations;
DROP POLICY IF EXISTS conversations_space_insert_policy ON conversations;
DROP POLICY IF EXISTS conversations_update_policy ON conversations;
DROP POLICY IF EXISTS conversations_delete_policy ON conversations;

-- Create minimal basic policies for spaces
CREATE POLICY spaces_select_policy
ON public.spaces
FOR SELECT
TO authenticated
USING (true); -- Allow all users to see all spaces for now

CREATE POLICY spaces_insert_policy
ON public.spaces
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid()); -- Only allow users to create spaces where they are the owner

-- Create minimal basic policies for space_members
CREATE POLICY space_members_select_policy
ON public.space_members
FOR SELECT
TO authenticated
USING (true); -- Allow all users to see all space members for now

CREATE POLICY space_members_insert_policy
ON public.space_members
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow all insertions for now

CREATE POLICY space_members_update_policy
ON public.space_members
FOR UPDATE
TO authenticated
USING (true) -- Allow all updates for now
WITH CHECK (true);

-- Revert conversations back to simple user-based policies
CREATE POLICY conversations_select_policy
ON conversations
FOR SELECT
TO authenticated
USING (user_id = auth.uid()); -- Only see your own conversations

CREATE POLICY conversations_insert_policy
ON conversations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()); -- Only create your own conversations

CREATE POLICY conversations_update_policy
ON conversations
FOR UPDATE
TO authenticated
USING (user_id = auth.uid()); -- Only update your own conversations

CREATE POLICY conversations_delete_policy
ON conversations
FOR DELETE
TO authenticated
USING (user_id = auth.uid()); -- Only delete your own conversations