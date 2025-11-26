-- Enable Row Level Security on auth tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.two_factor_auth ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on credits tables
ALTER TABLE credits.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits.usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
  ON auth.users
  FOR SELECT
  USING (auth.uid() = id OR auth.role() = 'admin');

CREATE POLICY "Users can update their own profile"
  ON auth.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for sessions table
CREATE POLICY "Users can view their own sessions"
  ON auth.sessions
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'admin');

CREATE POLICY "Users can delete their own sessions"
  ON auth.sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for balances table
CREATE POLICY "Users can view their own balance"
  ON credits.balances
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'admin');

-- RLS Policies for transactions table
CREATE POLICY "Users can view their own transactions"
  ON credits.transactions
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'admin');

-- RLS Policies for purchases table
CREATE POLICY "Users can view their own purchases"
  ON credits.purchases
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'admin');

-- RLS Policies for usage_stats table
CREATE POLICY "Users can view their own usage stats"
  ON credits.usage_stats
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'admin');

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'role', '')::TEXT;
$$ LANGUAGE SQL STABLE;
