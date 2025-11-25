-- SQL zum Hinzufügen der Titel-Spalte zur Conversations-Tabelle
-- SCHRITT 1: Spalte zur Tabelle hinzufügen
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS title TEXT;

-- SCHRITT 2: Kommentar für Dokumentation hinzufügen
COMMENT ON COLUMN conversations.title IS 'KI-generierter Titel für die Konversation';

-- SCHRITT 3: Aktualisiere RLS-Policy (Row Level Security) für die neue Spalte
-- (Stelle sicher, dass Benutzer nur ihre eigenen Konversationen lesen/bearbeiten können)
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
CREATE POLICY "Users can update their own conversations" 
ON conversations
FOR UPDATE USING (user_id = auth.uid());

-- SCHRITT 4: (Optional) Standardwerte für bestehende Konversationen setzen
UPDATE conversations
SET title = 'Frühere Konversation'
WHERE title IS NULL;