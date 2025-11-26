-- Überprüfe die aktuelle Struktur der models-Tabelle
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'models';

-- Füge die fehlenden Spalten hinzu, wenn sie nicht existieren
DO $$
BEGIN
    -- Überprüfe, ob created_at existiert
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'models' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE models ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- Überprüfe, ob updated_at existiert
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'models' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE models ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END
$$;
