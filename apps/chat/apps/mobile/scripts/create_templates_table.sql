-- Erstelle die Tabelle für Vorlagen
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  model_id UUID REFERENCES models(id),
  color TEXT DEFAULT '#0A84FF',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Kommentare für Dokumentation
COMMENT ON TABLE templates IS 'Vorlagen für vordefinierte Chat-Prompts';
COMMENT ON COLUMN templates.name IS 'Name der Vorlage';
COMMENT ON COLUMN templates.description IS 'Beschreibung der Vorlage';
COMMENT ON COLUMN templates.system_prompt IS 'System-Prompt für die KI';
COMMENT ON COLUMN templates.model_id IS 'Das bevorzugte Modell für diese Vorlage (optional)';
COMMENT ON COLUMN templates.color IS 'Farbcode für die Darstellung in der UI';
COMMENT ON COLUMN templates.is_default IS 'Gibt an, ob diese Vorlage als Standard verwendet werden soll';

-- Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates" ON templates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own templates" ON templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own templates" ON templates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own templates" ON templates
  FOR DELETE USING (user_id = auth.uid());

-- Beispiel-Vorlagen
INSERT INTO templates (user_id, name, description, system_prompt, color, is_default)
VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Erste Benutzer-ID
  'Persönlicher Assistent',
  'Allgemeiner Assistent, der bei vielfältigen Aufgaben hilft',
  'Du bist ein hilfreicher Assistent. Antworte präzise und freundlich auf alle Fragen des Nutzers. Wenn du etwas nicht weißt, gib an, dass du dir unsicher bist, statt zu spekulieren.',
  '#0A84FF',
  true
);

INSERT INTO templates (user_id, name, description, system_prompt, color)
VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Erste Benutzer-ID
  'Kreativer Schreibpartner',
  'Hilft beim Brainstorming und der Entwicklung kreativer Ideen',
  'Du bist ein kreativer Schreibpartner. Hilf dem Nutzer bei der Entwicklung von Ideen für Geschichten, Charaktere, Szenarien und Dialoge. Sei fantasievoll und inspirierend. Schlage neue Richtungen vor, wenn der Nutzer feststeckt.',
  '#FF375F'
);

INSERT INTO templates (user_id, name, description, system_prompt, color)
VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Erste Benutzer-ID
  'Technischer Berater',
  'Unterstützt bei technischen Fragen und Programmierung',
  'Du bist ein technischer Berater mit Expertenwissen in Programmierung, Softwareentwicklung und IT. Erkläre technische Konzepte verständlich, gib Code-Beispiele wenn nötig und biete praktische Lösungen für technische Probleme. Wenn Code bereitgestellt wird, analysiere ihn gründlich vor der Antwort.',
  '#32D74B'
);