-- Skript zur Überprüfung und Konfiguration der Azure OpenAI-Einstellungen in der Datenbank

-- 1. Erstelle eine Tabelle für die Anwendungseinstellungen, falls sie noch nicht existiert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'app_settings'
  ) THEN
    CREATE TABLE public.app_settings (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Erstelle einen Trigger für updated_at
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    CREATE TRIGGER set_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
    
    RAISE NOTICE 'Tabelle app_settings wurde erstellt.';
  ELSE
    RAISE NOTICE 'Tabelle app_settings existiert bereits.';
  END IF;
END
$$;

-- 2. Füge Azure OpenAI-Einstellungen hinzu oder aktualisiere sie
INSERT INTO public.app_settings (key, value, description)
VALUES
  ('AZURE_OPENAI_ENDPOINT', 'https://memoroseopenai.openai.azure.com', 'Azure OpenAI API Endpoint'),
  ('AZURE_OPENAI_DEPLOYMENT', 'gpt-o3-mini-se', 'Azure OpenAI Deployment Name'),
  ('AZURE_OPENAI_API_VERSION', '2024-12-01-preview', 'Azure OpenAI API Version'),
  ('AZURE_OPENAI_API_KEY', '3082103c9b0d4270a795686ccaa89921', 'Azure OpenAI API Key')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 3. Aktiviere RLS für die app_settings-Tabelle
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 4. Erstelle eine Richtlinie für das Lesen von Einstellungen
-- Alle authentifizierten Benutzer dürfen Einstellungen sehen
DROP POLICY IF EXISTS app_settings_select_policy ON app_settings;
CREATE POLICY app_settings_select_policy
ON app_settings
FOR SELECT
TO authenticated
USING (true);

-- 5. Überprüfe, ob die Einstellungen existieren
SELECT key, value, description FROM public.app_settings;
