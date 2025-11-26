-- Überprüfe und erstelle Modelle in der Datenbank

-- 1. Überprüfe, ob die models-Tabelle existiert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'models'
  ) THEN
    -- Erstelle die models-Tabelle
    CREATE TABLE public.models (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      parameters JSONB,
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
    
    CREATE TRIGGER set_models_updated_at
    BEFORE UPDATE ON public.models
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
    
    RAISE NOTICE 'Tabelle models wurde erstellt.';
  ELSE
    RAISE NOTICE 'Tabelle models existiert bereits.';
  END IF;
END
$$;

-- 2. Überprüfe die Struktur der models-Tabelle und füge updated_at hinzu, falls es fehlt
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'models' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.models ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Spalte updated_at zur models-Tabelle hinzugefügt.';
  ELSE
    RAISE NOTICE 'Spalte updated_at existiert bereits in der models-Tabelle.';
  END IF;
END
$$;

-- 3. Füge Standard-Modelle ein
INSERT INTO public.models (id, name, description, parameters)
VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'GPT-O3-Mini', 'Azure OpenAI GPT-O3-Mini', '{"temperature": 0.7, "max_tokens": 800}'),
  ('550e8400-e29b-41d4-a716-446655440001', 'GPT-4', 'OpenAI GPT-4', '{"temperature": 0.7, "max_tokens": 1000}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'GPT-3.5-Turbo', 'OpenAI GPT-3.5 Turbo', '{"temperature": 0.7, "max_tokens": 800}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Claude 3', 'Anthropic Claude 3', '{"temperature": 0.7, "max_tokens": 1000}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parameters = EXCLUDED.parameters;

-- 4. Aktiviere RLS für die models-Tabelle
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- 5. Erstelle eine Richtlinie für das Lesen von Modellen
-- Alle authentifizierten Benutzer dürfen Modelle sehen
DROP POLICY IF EXISTS models_select_policy ON models;
CREATE POLICY models_select_policy
ON models
FOR SELECT
TO authenticated
USING (true);

-- 6. Überprüfe, ob die Modelle existieren
SELECT id, name, description FROM public.models;
