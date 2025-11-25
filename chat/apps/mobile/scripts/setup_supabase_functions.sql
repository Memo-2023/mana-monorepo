-- Erstelle eine Funktion zum Ausführen von SQL-Abfragen
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL-Fehler: %', SQLERRM;
END;
$$;

-- Erstelle eine Funktion zum Erstellen der models-Tabelle, falls sie nicht existiert
CREATE OR REPLACE FUNCTION create_models_table()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Prüfe, ob die Tabelle bereits existiert
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'models'
  ) THEN
    -- Erstelle die Tabelle
    CREATE TABLE models (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      parameters JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Erstelle einen Trigger für updated_at
    CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON models
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
    
    RAISE NOTICE 'Tabelle models wurde erstellt.';
  ELSE
    RAISE NOTICE 'Tabelle models existiert bereits.';
  END IF;
END;
$$;
