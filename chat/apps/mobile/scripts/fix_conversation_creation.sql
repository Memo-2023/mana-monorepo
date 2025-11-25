-- Überprüfe und behebe Probleme mit der Conversations-Tabelle

-- 1. Überprüfe die Struktur der Conversations-Tabelle
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Prüfe, ob die user_id-Spalte vom Typ UUID ist
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'conversations'
        AND column_name = 'user_id'
        AND data_type = 'uuid'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Die user_id-Spalte in der conversations-Tabelle ist nicht vom Typ UUID. Bitte überprüfe die Tabellendefinition.';
    ELSE
        RAISE NOTICE 'Die user_id-Spalte in der conversations-Tabelle ist korrekt vom Typ UUID.';
    END IF;
    
    -- Prüfe, ob es eine Unique-Constraint gibt, die Konflikte verursachen könnte
    SELECT EXISTS (
        SELECT FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = 'conversations'
        AND constraint_type = 'UNIQUE'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'Es gibt eine Unique-Constraint in der conversations-Tabelle, die Konflikte verursachen könnte.';
    ELSE
        RAISE NOTICE 'Es gibt keine Unique-Constraint in der conversations-Tabelle.';
    END IF;
END $$;

-- 2. Überprüfe den Foreign-Key-Constraint
DO $$
DECLARE
    fk_exists BOOLEAN;
BEGIN
    -- Prüfe, ob es einen Foreign-Key-Constraint auf die users-Tabelle gibt
    SELECT EXISTS (
        SELECT FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = 'conversations'
        AND kcu.column_name = 'user_id'
    ) INTO fk_exists;
    
    IF fk_exists THEN
        RAISE NOTICE 'Es gibt einen Foreign-Key-Constraint auf die user_id-Spalte in der conversations-Tabelle.';
    ELSE
        RAISE NOTICE 'Es gibt keinen Foreign-Key-Constraint auf die user_id-Spalte in der conversations-Tabelle.';
    END IF;
END $$;

-- 3. Überprüfe, ob der angemeldete Benutzer in der users-Tabelle existiert
-- Ersetze 'DEINE_BENUTZER_ID' durch die tatsächliche Benutzer-ID
DO $$
DECLARE
    user_exists BOOLEAN;
    user_id_value UUID := auth.uid(); -- Aktuelle Benutzer-ID
BEGIN
    -- Prüfe, ob der Benutzer in der users-Tabelle existiert
    EXECUTE format('
        SELECT EXISTS (
            SELECT FROM public.users
            WHERE id = %L
        )', user_id_value) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'Der Benutzer mit der ID % existiert in der users-Tabelle.', user_id_value;
    ELSE
        RAISE NOTICE 'Der Benutzer mit der ID % existiert NICHT in der users-Tabelle.', user_id_value;
        
        -- Füge den Benutzer manuell in die users-Tabelle ein
        EXECUTE format('
            INSERT INTO public.users (id, email, created_at, updated_at)
            SELECT id, email, created_at, updated_at
            FROM auth.users
            WHERE id = %L
            ON CONFLICT (id) DO NOTHING
        ', user_id_value);
        
        RAISE NOTICE 'Der Benutzer wurde in die users-Tabelle eingefügt.';
    END IF;
END $$;

-- 4. Überprüfe, ob die Synchronisierung zwischen auth.users und public.users funktioniert
DO $$
BEGIN
    -- Prüfe, ob der Trigger für die Synchronisierung existiert
    IF EXISTS (
        SELECT FROM pg_trigger
        WHERE tgname = 'sync_user_after_auth_event_trigger'
    ) THEN
        RAISE NOTICE 'Der Trigger für die Synchronisierung zwischen auth.users und public.users existiert.';
    ELSE
        RAISE NOTICE 'Der Trigger für die Synchronisierung zwischen auth.users und public.users existiert NICHT.';
    END IF;
END $$;

-- 5. Synchronisiere alle Benutzer aus auth.users in public.users
INSERT INTO public.users (id, email, name, created_at, updated_at)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'name', email) as name,
    created_at,
    updated_at
FROM auth.users
WHERE confirmed_at IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    updated_at = NOW();
