-- =====================================================
-- RLS POLICIES FOR GUILD POOL TABLES
-- =====================================================
-- Uses helper functions from 03-organization-rls.sql:
--   auth.is_organization_member(org_id)
--   auth.is_organization_owner_or_admin(org_id)
--   auth.is_organization_owner(org_id)

-- Enable RLS
ALTER TABLE credits.guild_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits.guild_spending_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits.guild_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- GUILD POOLS TABLE POLICIES
-- =====================================================

-- Members can view their guild's pool balance
CREATE POLICY "Members can view guild pool"
  ON credits.guild_pools
  FOR SELECT
  USING (
    auth.is_organization_member(organization_id)
    OR auth.role() = 'admin'
  );

-- Pool is created during guild creation (by owner or system)
CREATE POLICY "Owners can create guild pool"
  ON credits.guild_pools
  FOR INSERT
  WITH CHECK (
    auth.is_organization_owner(organization_id)
    OR auth.role() = 'admin'
  );

-- Owners and admins can update pool (funding, spending)
CREATE POLICY "Owners and admins can update guild pool"
  ON credits.guild_pools
  FOR UPDATE
  USING (
    auth.is_organization_owner_or_admin(organization_id)
    OR auth.role() = 'admin'
  )
  WITH CHECK (
    auth.is_organization_owner_or_admin(organization_id)
    OR auth.role() = 'admin'
  );

-- Only owners can delete pool (cascade from org deletion)
CREATE POLICY "Owners can delete guild pool"
  ON credits.guild_pools
  FOR DELETE
  USING (
    auth.is_organization_owner(organization_id)
    OR auth.role() = 'admin'
  );

-- =====================================================
-- GUILD SPENDING LIMITS TABLE POLICIES
-- =====================================================

-- Members can view their own limits; owners/admins can view all
CREATE POLICY "Users can view guild spending limits"
  ON credits.guild_spending_limits
  FOR SELECT
  USING (
    user_id = auth.uid()::text
    OR auth.is_organization_owner_or_admin(organization_id)
    OR auth.role() = 'admin'
  );

-- Only owners and admins can set spending limits
CREATE POLICY "Owners and admins can create spending limits"
  ON credits.guild_spending_limits
  FOR INSERT
  WITH CHECK (
    auth.is_organization_owner_or_admin(organization_id)
    OR auth.role() = 'admin'
  );

-- Only owners and admins can update spending limits
CREATE POLICY "Owners and admins can update spending limits"
  ON credits.guild_spending_limits
  FOR UPDATE
  USING (
    auth.is_organization_owner_or_admin(organization_id)
    OR auth.role() = 'admin'
  )
  WITH CHECK (
    auth.is_organization_owner_or_admin(organization_id)
    OR auth.role() = 'admin'
  );

-- Only owners and admins can delete spending limits
CREATE POLICY "Owners and admins can delete spending limits"
  ON credits.guild_spending_limits
  FOR DELETE
  USING (
    auth.is_organization_owner_or_admin(organization_id)
    OR auth.role() = 'admin'
  );

-- =====================================================
-- GUILD TRANSACTIONS TABLE POLICIES
-- =====================================================

-- Members can view their own transactions; owners/admins see all
CREATE POLICY "Users can view guild transactions"
  ON credits.guild_transactions
  FOR SELECT
  USING (
    user_id = auth.uid()::text
    OR auth.is_organization_owner_or_admin(organization_id)
    OR auth.role() = 'admin'
  );

-- Any member can create transactions (via guild credit usage)
CREATE POLICY "Members can create guild transactions"
  ON credits.guild_transactions
  FOR INSERT
  WITH CHECK (
    auth.is_organization_member(organization_id)
    OR auth.role() = 'admin'
  );

-- No updates to transactions (immutable audit trail)
-- No deletes to transactions (immutable audit trail)

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Members can view guild pool" ON credits.guild_pools IS 'Guild members can see the shared pool balance';
COMMENT ON POLICY "Owners can create guild pool" ON credits.guild_pools IS 'Pool created during guild setup by owner';
COMMENT ON POLICY "Owners and admins can update guild pool" ON credits.guild_pools IS 'Pool balance updated during funding and spending';
COMMENT ON POLICY "Users can view guild spending limits" ON credits.guild_spending_limits IS 'Members see own limits, owners/admins see all';
COMMENT ON POLICY "Users can view guild transactions" ON credits.guild_transactions IS 'Members see own transactions, owners/admins see all';
COMMENT ON POLICY "Members can create guild transactions" ON credits.guild_transactions IS 'Any guild member can create transactions via credit usage';
