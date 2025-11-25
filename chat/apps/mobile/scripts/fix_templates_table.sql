-- Überprüfe und korrigiere die templates-Tabelle

-- 1. Prüfe, ob die templates-Tabelle existiert, erstelle sie falls nicht
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'templates'
  ) THEN
    -- Erstelle die Tabelle für Vorlagen
    CREATE TABLE public.templates (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      system_prompt TEXT NOT NULL,
      initial_question TEXT,
      model_id UUID REFERENCES models(id),
      color TEXT DEFAULT '#0A84FF',
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Tabelle templates wurde erstellt.';
  ELSE
    RAISE NOTICE 'Tabelle templates existiert bereits.';
  END IF;
END
$$;

-- 2. Prüfe, ob die color-Spalte existiert, füge sie hinzu falls nicht
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'templates' 
    AND column_name = 'color'
  ) THEN
    ALTER TABLE public.templates ADD COLUMN color TEXT DEFAULT '#0A84FF';
    RAISE NOTICE 'Spalte color zur templates-Tabelle hinzugefügt.';
  ELSE
    RAISE NOTICE 'Spalte color existiert bereits in der templates-Tabelle.';
  END IF;
END
$$;

-- 3. Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Lösche bestehende Policies, falls vorhanden
DROP POLICY IF EXISTS "Users can view their own templates" ON templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON templates;

-- Erstelle die Policies neu
CREATE POLICY "Users can view their own templates" ON templates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own templates" ON templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own templates" ON templates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own templates" ON templates
  FOR DELETE USING (user_id = auth.uid());

-- 4. Zeige einige Beispieldaten an
SELECT id, name, description, color FROM templates LIMIT 5;