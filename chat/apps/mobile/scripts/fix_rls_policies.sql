-- RLS-Richtlinien für die Conversations-Tabelle

-- Aktiviere RLS für die Conversations-Tabelle
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Löschen vorhandener Richtlinien (falls vorhanden)
DROP POLICY IF EXISTS conversations_insert_policy ON conversations;
DROP POLICY IF EXISTS conversations_select_policy ON conversations;
DROP POLICY IF EXISTS conversations_update_policy ON conversations;
DROP POLICY IF EXISTS conversations_delete_policy ON conversations;

-- Erstelle eine Richtlinie für das Einfügen von Konversationen
-- Benutzer dürfen nur Konversationen für sich selbst erstellen
CREATE POLICY conversations_insert_policy
ON conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Erstelle eine Richtlinie für das Lesen von Konversationen
-- Benutzer dürfen nur ihre eigenen Konversationen sehen
CREATE POLICY conversations_select_policy
ON conversations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Erstelle eine Richtlinie für das Aktualisieren von Konversationen
-- Benutzer dürfen nur ihre eigenen Konversationen aktualisieren
CREATE POLICY conversations_update_policy
ON conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Erstelle eine Richtlinie für das Löschen von Konversationen
-- Benutzer dürfen nur ihre eigenen Konversationen löschen
CREATE POLICY conversations_delete_policy
ON conversations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS-Richtlinien für die Messages-Tabelle

-- Aktiviere RLS für die Messages-Tabelle
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Löschen vorhandener Richtlinien (falls vorhanden)
DROP POLICY IF EXISTS messages_insert_policy ON messages;
DROP POLICY IF EXISTS messages_select_policy ON messages;
DROP POLICY IF EXISTS messages_update_policy ON messages;
DROP POLICY IF EXISTS messages_delete_policy ON messages;

-- Erstelle eine Richtlinie für das Einfügen von Nachrichten
-- Benutzer dürfen nur Nachrichten zu ihren eigenen Konversationen hinzufügen
CREATE POLICY messages_insert_policy
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- Erstelle eine Richtlinie für das Lesen von Nachrichten
-- Benutzer dürfen nur Nachrichten aus ihren eigenen Konversationen sehen
CREATE POLICY messages_select_policy
ON messages
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- Erstelle eine Richtlinie für das Aktualisieren von Nachrichten
-- Benutzer dürfen nur Nachrichten aus ihren eigenen Konversationen aktualisieren
CREATE POLICY messages_update_policy
ON messages
FOR UPDATE
TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- Erstelle eine Richtlinie für das Löschen von Nachrichten
-- Benutzer dürfen nur Nachrichten aus ihren eigenen Konversationen löschen
CREATE POLICY messages_delete_policy
ON messages
FOR DELETE
TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- RLS-Richtlinien für die Models-Tabelle

-- Aktiviere RLS für die Models-Tabelle
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Löschen vorhandener Richtlinien (falls vorhanden)
DROP POLICY IF EXISTS models_select_policy ON models;

-- Erstelle eine Richtlinie für das Lesen von Modellen
-- Alle authentifizierten Benutzer dürfen Modelle sehen
CREATE POLICY models_select_policy
ON models
FOR SELECT
TO authenticated
USING (true);

-- Erstelle eine Bypass-Richtlinie für Anon-Benutzer, um Modelle zu sehen
-- Dies ist wichtig für die API-Route, die Modelle abruft
CREATE POLICY models_anon_select_policy
ON models
FOR SELECT
TO anon
USING (true);

-- RLS-Richtlinien für die Templates-Tabelle (falls vorhanden)

-- Aktiviere RLS für die Templates-Tabelle (nur wenn sie existiert)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'templates'
  ) THEN
    EXECUTE 'ALTER TABLE templates ENABLE ROW LEVEL SECURITY;';
    
    -- Löschen vorhandener Richtlinien (falls vorhanden)
    EXECUTE 'DROP POLICY IF EXISTS templates_select_policy ON templates;';
    
    -- Erstelle eine Richtlinie für das Lesen von Templates
    EXECUTE 'CREATE POLICY templates_select_policy
             ON templates
             FOR SELECT
             TO authenticated
             USING (true);';
             
    -- Erstelle eine Bypass-Richtlinie für Anon-Benutzer, um Templates zu sehen
    EXECUTE 'CREATE POLICY templates_anon_select_policy
             ON templates
             FOR SELECT
             TO anon
             USING (true);';
  END IF;
END
$$;
