-- =====================================================
-- RLS POLICIES FOR BETTER AUTH ORGANIZATION TABLES
-- =====================================================

-- Enable RLS on organization tables
ALTER TABLE auth.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits.organization_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits.credit_allocations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR ORGANIZATION RLS
-- =====================================================

-- Get user's role in an organization
CREATE OR REPLACE FUNCTION auth.user_organization_role(org_id TEXT) RETURNS TEXT AS $$
  SELECT role FROM auth.members
  WHERE organization_id = org_id
    AND user_id = auth.uid()::text
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is member of organization
CREATE OR REPLACE FUNCTION auth.is_organization_member(org_id TEXT) RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM auth.members
    WHERE organization_id = org_id
      AND user_id = auth.uid()::text
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is owner or admin of organization
CREATE OR REPLACE FUNCTION auth.is_organization_owner_or_admin(org_id TEXT) RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM auth.members
    WHERE organization_id = org_id
      AND user_id = auth.uid()::text
      AND role IN ('owner', 'admin')
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is owner of organization
CREATE OR REPLACE FUNCTION auth.is_organization_owner(org_id TEXT) RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM auth.members
    WHERE organization_id = org_id
      AND user_id = auth.uid()::text
      AND role = 'owner'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =====================================================
-- ORGANIZATIONS TABLE POLICIES
-- =====================================================

-- Users can view organizations they are members of
CREATE POLICY "Users can view their organizations"
  ON auth.organizations
  FOR SELECT
  USING (
    auth.is_organization_member(id)
    OR auth.role() = 'admin'
  );

-- Users can create organizations (Better Auth will handle adding them as owner)
CREATE POLICY "Users can create organizations"
  ON auth.organizations
  FOR INSERT
  WITH CHECK (true);

-- Only owners can update organization
CREATE POLICY "Owners can update their organizations"
  ON auth.organizations
  FOR UPDATE
  USING (auth.is_organization_owner(id))
  WITH CHECK (auth.is_organization_owner(id));

-- Only owners can delete organization
CREATE POLICY "Owners can delete their organizations"
  ON auth.organizations
  FOR DELETE
  USING (auth.is_organization_owner(id));

-- =====================================================
-- MEMBERS TABLE POLICIES
-- =====================================================

-- Members can view other members in their organizations
CREATE POLICY "Members can view organization members"
  ON auth.members
  FOR SELECT
  USING (
    auth.is_organization_member(organization_id)
    OR auth.role() = 'admin'
  );

-- Owners and admins can add members (Better Auth handles invitation flow)
CREATE POLICY "Owners and admins can add members"
  ON auth.members
  FOR INSERT
  WITH CHECK (
    auth.is_organization_owner_or_admin(organization_id)
    OR auth.role() = 'admin'
  );

-- Owners and admins can update member roles
CREATE POLICY "Owners and admins can update members"
  ON auth.members
  FOR UPDATE
  USING (auth.is_organization_owner_or_admin(organization_id))
  WITH CHECK (auth.is_organization_owner_or_admin(organization_id));

-- Owners and admins can remove members
-- Members can remove themselves
CREATE POLICY "Owners/admins can remove members, members can leave"
  ON auth.members
  FOR DELETE
  USING (
    auth.is_organization_owner_or_admin(organization_id)
    OR user_id = auth.uid()::text
    OR auth.role() = 'admin'
  );

-- =====================================================
-- INVITATIONS TABLE POLICIES
-- =====================================================

-- Members can view invitations in their organizations
CREATE POLICY "Members can view organization invitations"
  ON auth.invitations
  FOR SELECT
  USING (
    auth.is_organization_member(organization_id)
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR auth.role() = 'admin'
  );

-- Owners and admins can create invitations
CREATE POLICY "Owners and admins can create invitations"
  ON auth.invitations
  FOR INSERT
  WITH CHECK (
    auth.is_organization_owner_or_admin(organization_id)
    OR auth.role() = 'admin'
  );

-- Owners and admins can update invitations (cancel, etc)
CREATE POLICY "Owners and admins can update invitations"
  ON auth.invitations
  FOR UPDATE
  USING (
    auth.is_organization_owner_or_admin(organization_id)
    OR auth.role() = 'admin'
  )
  WITH CHECK (
    auth.is_organization_owner_or_admin(organization_id)
    OR auth.role() = 'admin'
  );

-- Inviter can delete their invitations
-- Invitee can delete (reject) invitations sent to them
CREATE POLICY "Inviters and invitees can delete invitations"
  ON auth.invitations
  FOR DELETE
  USING (
    inviter_id = auth.uid()::text
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR auth.is_organization_owner_or_admin(organization_id)
    OR auth.role() = 'admin'
  );

-- =====================================================
-- ORGANIZATION BALANCES TABLE POLICIES
-- =====================================================

-- Members can view their organization's balance
CREATE POLICY "Members can view organization balance"
  ON credits.organization_balances
  FOR SELECT
  USING (
    auth.is_organization_member(organization_id)
    OR auth.role() = 'admin'
  );

-- Only owners can create organization balances (during org creation)
CREATE POLICY "Owners can create organization balance"
  ON credits.organization_balances
  FOR INSERT
  WITH CHECK (
    auth.is_organization_owner(organization_id)
    OR auth.role() = 'admin'
  );

-- Only owners can update organization balances (allocations, purchases)
CREATE POLICY "Owners can update organization balance"
  ON credits.organization_balances
  FOR UPDATE
  USING (auth.is_organization_owner(organization_id))
  WITH CHECK (auth.is_organization_owner(organization_id));

-- Only owners can delete (cascade handled by org deletion)
CREATE POLICY "Owners can delete organization balance"
  ON credits.organization_balances
  FOR DELETE
  USING (auth.is_organization_owner(organization_id));

-- =====================================================
-- CREDIT ALLOCATIONS TABLE POLICIES
-- =====================================================

-- Employees can view allocations to them
-- Owners/admins can view all allocations in their org
CREATE POLICY "Users can view relevant credit allocations"
  ON credits.credit_allocations
  FOR SELECT
  USING (
    employee_id = auth.uid()
    OR auth.is_organization_owner_or_admin(organization_id)
    OR auth.role() = 'admin'
  );

-- Only owners can create credit allocations
CREATE POLICY "Owners can create credit allocations"
  ON credits.credit_allocations
  FOR INSERT
  WITH CHECK (
    auth.is_organization_owner(organization_id)
    OR auth.role() = 'admin'
  );

-- No updates to allocations (immutable audit trail)
-- No deletes to allocations (immutable audit trail)

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can view their organizations" ON auth.organizations IS 'Members can view organizations they belong to';
COMMENT ON POLICY "Users can create organizations" ON auth.organizations IS 'Any authenticated user can create an organization';
COMMENT ON POLICY "Owners can update their organizations" ON auth.organizations IS 'Only owners can modify organization details';
COMMENT ON POLICY "Owners can delete their organizations" ON auth.organizations IS 'Only owners can delete organizations';

COMMENT ON FUNCTION auth.user_organization_role IS 'Returns the role of the current user in the specified organization';
COMMENT ON FUNCTION auth.is_organization_member IS 'Checks if current user is a member of the organization';
COMMENT ON FUNCTION auth.is_organization_owner_or_admin IS 'Checks if current user is owner or admin of the organization';
COMMENT ON FUNCTION auth.is_organization_owner IS 'Checks if current user is owner of the organization';
