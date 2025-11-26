-- Erstelle eine neue Tabelle für die Token-Nutzung und Kostenerfassung

-- 1. Überprüfe, ob die usage_logs-Tabelle existiert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_logs'
  ) THEN
    -- Erstelle die usage_logs-Tabelle
    CREATE TABLE public.usage_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id),
      model_id UUID REFERENCES models(id),
      prompt_tokens INTEGER NOT NULL,
      completion_tokens INTEGER NOT NULL,
      total_tokens INTEGER NOT NULL,
      estimated_cost DECIMAL(10, 6) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Tabelle usage_logs wurde erstellt.';
  ELSE
    RAISE NOTICE 'Tabelle usage_logs existiert bereits.';
  END IF;
END
$$;

-- 2. Aktiviere RLS für die usage_logs-Tabelle
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- 3. Erstelle RLS-Richtlinien für usage_logs
-- Benutzer können nur ihre eigenen Nutzungsdaten sehen
DROP POLICY IF EXISTS usage_logs_select_policy ON usage_logs;
CREATE POLICY usage_logs_select_policy
ON usage_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Nur über die Anwendung dürfen Einträge erstellt werden
DROP POLICY IF EXISTS usage_logs_insert_policy ON usage_logs;
CREATE POLICY usage_logs_insert_policy
ON usage_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4. Erweitere das Modell-Schema um Kosteninformationen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'models' 
    AND column_name = 'cost_settings'
  ) THEN
    ALTER TABLE public.models ADD COLUMN cost_settings JSONB DEFAULT '{"prompt_per_1k_tokens": 0.0001, "completion_per_1k_tokens": 0.0002}'::jsonb;
    RAISE NOTICE 'Spalte cost_settings zur models-Tabelle hinzugefügt.';
  ELSE
    RAISE NOTICE 'Spalte cost_settings existiert bereits in der models-Tabelle.';
  END IF;
END
$$;

-- 5. Aktualisiere die vorhandenen Modelle mit Kosteninformationen
UPDATE public.models
SET cost_settings = jsonb_build_object(
  'prompt_per_1k_tokens', CASE 
    WHEN name LIKE '%GPT-O3-Mini%' THEN 0.0001
    WHEN name LIKE '%GPT-4o-mini%' THEN 0.0001
    WHEN name LIKE '%GPT-4o%' THEN 0.003
    WHEN name LIKE '%GPT-4%' THEN 0.003
    WHEN name LIKE '%GPT-3.5%' THEN 0.0001
    WHEN name LIKE '%Claude%' THEN 0.0008
    ELSE 0.0001
  END,
  'completion_per_1k_tokens', CASE 
    WHEN name LIKE '%GPT-O3-Mini%' THEN 0.0002
    WHEN name LIKE '%GPT-4o-mini%' THEN 0.0002
    WHEN name LIKE '%GPT-4o%' THEN 0.006
    WHEN name LIKE '%GPT-4%' THEN 0.006
    WHEN name LIKE '%GPT-3.5%' THEN 0.0002
    WHEN name LIKE '%Claude%' THEN 0.0024
    ELSE 0.0002
  END
)
WHERE cost_settings IS NULL OR cost_settings = '{}'::jsonb;

-- 6. Funktion zur Berechnung der Kosten
CREATE OR REPLACE FUNCTION calculate_token_cost(
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER,
  p_model_id UUID
) RETURNS DECIMAL(10, 6) AS $$
DECLARE
  v_prompt_cost DECIMAL(10, 6);
  v_completion_cost DECIMAL(10, 6);
  v_cost_settings JSONB;
  v_cost DECIMAL(10, 6);
BEGIN
  -- Hole die Kosteneinstellungen für das angegebene Modell
  SELECT cost_settings INTO v_cost_settings
  FROM models
  WHERE id = p_model_id;
  
  -- Extrahiere die Kosten pro 1000 Token
  v_prompt_cost := (v_cost_settings->>'prompt_per_1k_tokens')::DECIMAL;
  v_completion_cost := (v_cost_settings->>'completion_per_1k_tokens')::DECIMAL;
  
  -- Berechne die Gesamtkosten
  v_cost := (p_prompt_tokens * v_prompt_cost + p_completion_tokens * v_completion_cost) / 1000;
  
  RETURN ROUND(v_cost, 6);
END;
$$ LANGUAGE plpgsql;

-- 7. Berechtigung zum Ausführen der Funktion
GRANT EXECUTE ON FUNCTION calculate_token_cost TO authenticated;