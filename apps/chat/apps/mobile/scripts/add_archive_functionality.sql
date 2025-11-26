-- SQL-Skript zum Hinzufügen der Archivfunktionalität
-- Fügt ein 'is_archived' Feld zur 'conversations' Tabelle hinzu

-- Prüfen, ob die Spalte existiert und füge sie hinzu, falls nicht
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations' 
    AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE public.conversations 
    ADD COLUMN is_archived BOOLEAN DEFAULT false;
    
    RAISE NOTICE 'Spalte is_archived zur conversations-Tabelle hinzugefügt.';
  ELSE
    RAISE NOTICE 'Spalte is_archived existiert bereits in der conversations-Tabelle.';
  END IF;
END
$$;

-- Kommentar für die neue Spalte hinzufügen
COMMENT ON COLUMN conversations.is_archived IS 'Gibt an, ob die Konversation archiviert wurde.';

-- Index für schnellere Abfragen, da wir oft nach archivierten/nicht-archivierten Konversationen filtern werden
CREATE INDEX IF NOT EXISTS idx_conversations_is_archived ON conversations(is_archived);

-- Indices für die Kombination aus Benutzer-ID und Archivierungsstatus für optimierte Abfragen
CREATE INDEX IF NOT EXISTS idx_conversations_user_archived ON conversations(user_id, is_archived);

-- Stelle sicher, dass die RLS-Policies aktualisiert werden, um die neue Spalte zu berücksichtigen
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;