-- Aktualisieren der Check-Constraint für die documents-Tabelle,
-- um 'original' in 'text' umzubenennen und 'generated' zu entfernen

-- Alte Constraint löschen, um Änderungen an den Daten zu ermöglichen
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;

-- Aktualisiere bestehende Dokumente vom Typ 'original' zu 'text'
UPDATE documents SET type = 'text' WHERE type = 'original';

-- Aktualisiere bestehende Dokumente vom Typ 'generated' zu 'text'
UPDATE documents SET type = 'text' WHERE type = 'generated';

-- Neue Constraint mit den aktualisierten Typen erstellen
ALTER TABLE documents ADD CONSTRAINT documents_type_check 
  CHECK (type IN ('text', 'context', 'prompt'));
