-- Korrigierte Version der increment_document_type_counter-Funktion

-- Löschen der alten Funktion
DROP FUNCTION IF EXISTS increment_document_type_counter;

-- Neu erstellen mit korrekter Rückgabe
CREATE OR REPLACE FUNCTION increment_document_type_counter(
  space_id UUID,
  doc_type TEXT
)
RETURNS TABLE (prefix TEXT, counter INTEGER) 
LANGUAGE plpgsql
AS $$
DECLARE
  counter_value INTEGER;
  prefix_value TEXT;
  first_letter TEXT;
  prefix_count INTEGER;
BEGIN
  -- Hole das aktuelle Präfix
  SELECT prefix INTO prefix_value FROM spaces WHERE id = space_id;
  
  -- Wenn kein Präfix existiert, generiere ein eindeutiges Präfix
  IF prefix_value IS NULL THEN
    -- Hole den ersten Buchstaben des Space-Namens
    SELECT UPPER(SUBSTRING(name, 1, 1)) INTO first_letter FROM spaces WHERE id = space_id;
    
    -- Zähle, wie viele Spaces bereits mit diesem Buchstaben beginnen
    SELECT COUNT(*) INTO prefix_count FROM spaces WHERE prefix LIKE first_letter || '%';
    
    -- Wenn es keine anderen Spaces mit diesem Präfix gibt, verwende nur den Buchstaben
    -- Ansonsten füge eine Nummer hinzu
    IF prefix_count = 0 THEN
      prefix_value := first_letter;
    ELSE
      prefix_value := first_letter || (prefix_count + 1)::TEXT;
    END IF;
    
    -- Aktualisiere das Space-Präfix
    UPDATE spaces SET prefix = prefix_value WHERE id = space_id;
  END IF;
  
  -- Inkrementiere den entsprechenden Zähler basierend auf dem Dokumenttyp
  IF doc_type = 'text' THEN
    UPDATE spaces 
    SET text_doc_counter = text_doc_counter + 1
    WHERE id = space_id
    RETURNING text_doc_counter INTO counter_value;
  ELSIF doc_type = 'context' THEN
    UPDATE spaces 
    SET context_doc_counter = context_doc_counter + 1
    WHERE id = space_id
    RETURNING context_doc_counter INTO counter_value;
  ELSIF doc_type = 'prompt' THEN
    UPDATE spaces 
    SET prompt_doc_counter = prompt_doc_counter + 1
    WHERE id = space_id
    RETURNING prompt_doc_counter INTO counter_value;
  END IF;
  
  -- Wichtig: Direkt die Werte zurückgeben, nicht als Abfrage
  prefix := prefix_value;
  counter := counter_value;
  RETURN NEXT;
END;
$$;

-- Testabfrage, um zu prüfen, ob die Funktion korrekt funktioniert
-- SELECT * FROM increment_document_type_counter('SPACE_ID_HIER_EINSETZEN', 'text');
