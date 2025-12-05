-- Monetization System Migration Script

-- 1. Erweiterung der users-Tabelle
ALTER TABLE users
ADD COLUMN IF NOT EXISTS token_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_free_tokens INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS last_token_reset TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS revenue_cat_id TEXT,
ADD COLUMN IF NOT EXISTS current_entitlement TEXT;

-- 2. Neue Tabelle token_transactions
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  model_used TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10, 6),
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS token_transactions_user_id_idx ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS token_transactions_created_at_idx ON token_transactions(created_at);

-- 3. Neue Tabelle model_prices
CREATE TABLE IF NOT EXISTS model_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT UNIQUE NOT NULL,
  input_price_per_1k_tokens DECIMAL(10, 6) NOT NULL,
  output_price_per_1k_tokens DECIMAL(10, 6) NOT NULL,
  tokens_per_dollar INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger für automatische Aktualisierung des updated_at-Feldes für model_prices
CREATE OR REPLACE FUNCTION update_model_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_model_prices_updated_at
BEFORE UPDATE ON model_prices
FOR EACH ROW
EXECUTE FUNCTION update_model_prices_updated_at();

-- Beispieleinträge für model_prices
INSERT INTO model_prices (model_name, input_price_per_1k_tokens, output_price_per_1k_tokens, tokens_per_dollar)
VALUES 
('gpt-4.1', 0.01, 0.03, 50000),
('gpt-3.5-turbo', 0.0015, 0.002, 300000),
('gemini-pro', 0.00125, 0.00375, 400000),
('gemini-flash', 0.00025, 0.0005, 800000)
ON CONFLICT (model_name) DO NOTHING;

-- 4. Optionale Tabelle token_packages (falls RevenueCat nicht verwendet wird)
CREATE TABLE IF NOT EXISTS token_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token_amount INTEGER NOT NULL,
  price_usd DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Beispieleinträge für token_packages
INSERT INTO token_packages (name, token_amount, price_usd)
VALUES 
('Kleines Paket', 5000, 4.99),
('Mittleres Paket', 15000, 9.99),
('Großes Paket', 50000, 24.99)
ON CONFLICT DO NOTHING;

-- RLS-Policies für die neuen Tabellen
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_packages ENABLE ROW LEVEL SECURITY;

-- Benutzer können nur ihre eigenen Token-Transaktionen sehen
CREATE POLICY "Benutzer können nur ihre eigenen Token-Transaktionen sehen" ON token_transactions
  FOR SELECT USING (user_id = auth.uid());

-- Benutzer können nur ihre eigenen Token-Transaktionen einfügen
CREATE POLICY "Benutzer können nur ihre eigenen Token-Transaktionen einfügen" ON token_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Alle Benutzer können die Modellpreise sehen
CREATE POLICY "Alle Benutzer können die Modellpreise sehen" ON model_prices
  FOR SELECT USING (true);

-- Alle Benutzer können die Token-Pakete sehen
CREATE POLICY "Alle Benutzer können die Token-Pakete sehen" ON token_packages
  FOR SELECT USING (true);
