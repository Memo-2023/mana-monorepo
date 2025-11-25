-- Diese SQL-Funktion zum Löschen eines Dokuments erstellt eine sichere Methode
-- zum Löschen über RPC, was besser gegen Datenbank-Caching und Race-Conditions ist

-- Führen Sie dieses SQL im Supabase SQL-Editor aus

CREATE OR REPLACE FUNCTION delete_document_by_id(document_id uuid)
RETURNS boolean AS $$
DECLARE
  success boolean;
  affected_rows int;
BEGIN
  -- Führe die eigentliche Löschung durch
  DELETE FROM documents
  WHERE id = document_id
  AND conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  );
  
  -- Speichere die Anzahl der betroffenen Zeilen
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Setze den Erfolgsstatus basierend auf der Anzahl der gelöschten Zeilen
  success := affected_rows > 0;
  
  -- Gib das Ergebnis zurück (true wenn erfolgreich, false wenn nicht)
  RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Diese Funktion kann dann mit dem folgenden JavaScript aufgerufen werden:
-- const { data, error } = await supabase.rpc('delete_document_by_id', { document_id: 'uuid-here' });