-- SQL-Skript, um die Nachrichtentabelle zu überprüfen und zu korrigieren

-- Überprüfe die aktuelle Struktur der messages-Tabelle
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'messages'
ORDER BY 
    ordinal_position;

-- Überprüfe Constraints für die messages-Tabelle
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM
    information_schema.table_constraints tc
JOIN
    information_schema.constraint_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN
    information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE
    tc.table_name = 'messages';

-- Behebt das Problem mit der Check-Constraint in der messages-Tabelle
-- Entfernt die bestehende Check-Constraint und erstellt eine neue, die 'assistant' akzeptiert
DO $$
BEGIN
    -- Entferne die bestehende Check-Constraint
    ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_check;
    
    -- Erstelle eine neue Check-Constraint, die 'assistant' akzeptiert
    ALTER TABLE messages 
    ADD CONSTRAINT messages_sender_check 
    CHECK (sender IN ('user', 'assistant', 'system'));
    
    RAISE NOTICE 'Check-Constraint für die sender-Spalte in der messages-Tabelle wurde aktualisiert.';
END $$;