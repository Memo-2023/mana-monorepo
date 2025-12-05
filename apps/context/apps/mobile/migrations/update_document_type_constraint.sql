-- Aktualisieren der Check-Constraint für die documents-Tabelle,
-- um den neuen Typ 'context' zu erlauben

-- Alte Constraint löschen
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;

-- Neue Constraint mit dem zusätzlichen Typ 'context' erstellen
ALTER TABLE documents ADD CONSTRAINT documents_type_check 
  CHECK (type IN ('original', 'generated', 'context', 'prompt'));
