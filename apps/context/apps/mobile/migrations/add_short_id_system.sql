-- Migration für das neue kurze ID-System

-- 1. Füge short_id-Spalte zu documents hinzu
ALTER TABLE documents ADD COLUMN IF NOT EXISTS short_id TEXT UNIQUE;

-- 2. Füge prefix und Typzähler zu spaces hinzu
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS prefix TEXT UNIQUE;
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS text_doc_counter INTEGER DEFAULT 0;
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS context_doc_counter INTEGER DEFAULT 0;
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS prompt_doc_counter INTEGER DEFAULT 0;

-- 3. Erstelle eine Funktion zum Inkrementieren des typspezifischen Zählers
CREATE OR REPLACE FUNCTION increment_document_type_counter(
  space_id UUID,
  doc_type TEXT
)
RETURNS TABLE (prefix TEXT, counter INTEGER) 
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  RETURN QUERY SELECT prefix_value, counter_value;
END;
$$;

-- 4. Initialisiere Präfixe für bestehende Spaces mit eindeutigen Werten
-- Zuerst erstellen wir eine temporäre Tabelle mit fortlaufenden Nummern für Spaces mit gleichen Anfangsbuchstaben
CREATE TEMP TABLE space_prefix_counts AS
SELECT 
  id,
  UPPER(SUBSTRING(name, 1, 1)) AS first_letter,
  ROW_NUMBER() OVER (PARTITION BY UPPER(SUBSTRING(name, 1, 1)) ORDER BY created_at) AS count
FROM spaces
WHERE prefix IS NULL;

-- Dann aktualisieren wir die Spaces mit eindeutigen Präfixen
-- Wenn es nur einen Space mit einem bestimmten Anfangsbuchstaben gibt, verwenden wir nur den Buchstaben
-- Wenn es mehrere gibt, fügen wir eine Nummer hinzu
UPDATE spaces s
SET prefix = 
  CASE 
    WHEN spc.count = 1 THEN spc.first_letter
    ELSE spc.first_letter || spc.count::TEXT
  END
FROM space_prefix_counts spc
WHERE s.id = spc.id AND s.prefix IS NULL;

-- Aufräumen
DROP TABLE space_prefix_counts;

-- 5. Zähle bestehende Dokumente nach Typ und Space
WITH type_counts AS (
  SELECT 
    space_id,
    type,
    COUNT(*) AS type_count
  FROM documents
  WHERE space_id IS NOT NULL
  GROUP BY space_id, type
)
UPDATE spaces s
SET 
  text_doc_counter = COALESCE((SELECT type_count FROM type_counts WHERE space_id = s.id AND type = 'text'), 0),
  context_doc_counter = COALESCE((SELECT type_count FROM type_counts WHERE space_id = s.id AND type = 'context'), 0),
  prompt_doc_counter = COALESCE((SELECT type_count FROM type_counts WHERE space_id = s.id AND type = 'prompt'), 0);

-- 6. Generiere short_ids für bestehende Dokumente
WITH numbered_docs AS (
  SELECT 
    id,
    space_id,
    type,
    ROW_NUMBER() OVER (PARTITION BY space_id, type ORDER BY created_at) AS doc_number
  FROM documents
  WHERE space_id IS NOT NULL
)
UPDATE documents d
SET short_id = CONCAT(
  (SELECT prefix FROM spaces WHERE id = nd.space_id),
  CASE 
    WHEN d.type = 'text' THEN 'D' 
    WHEN d.type = 'context' THEN 'C' 
    WHEN d.type = 'prompt' THEN 'P' 
  END,
  nd.doc_number
)
FROM numbered_docs nd
WHERE d.id = nd.id;

-- 7. Für Dokumente ohne Space, generiere eine generische ID
UPDATE documents
SET short_id = CONCAT('DOC-', SUBSTRING(MD5(id::text), 1, 6))
WHERE short_id IS NULL;
