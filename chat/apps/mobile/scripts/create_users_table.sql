-- Erstelle oder aktualisiere die users-Tabelle im public-Schema

-- Prüfe, ob die users-Tabelle bereits existiert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) THEN
    -- Erstelle die users-Tabelle
    CREATE TABLE public.users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Erstelle einen Trigger für updated_at
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
    
    RAISE NOTICE 'Tabelle users wurde erstellt.';
  ELSE
    RAISE NOTICE 'Tabelle users existiert bereits.';
  END IF;
END
$$;

-- Erstelle eine Funktion, um Benutzer aus auth.users in public.users zu synchronisieren
CREATE OR REPLACE FUNCTION sync_user_after_auth_event()
RETURNS TRIGGER AS $sync_func$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.confirmed_at IS NOT NULL THEN
    -- Füge den Benutzer in die public.users-Tabelle ein oder aktualisiere ihn
    INSERT INTO public.users (id, email, name, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$sync_func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Erstelle einen Trigger für die auth.users-Tabelle
DROP TRIGGER IF EXISTS sync_user_after_auth_event_trigger ON auth.users;
CREATE TRIGGER sync_user_after_auth_event_trigger
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_after_auth_event();

-- Synchronisiere bestehende Benutzer
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

-- Aktiviere RLS für die users-Tabelle
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Erstelle eine Richtlinie für das Lesen von Benutzern
-- Benutzer dürfen nur ihre eigenen Daten sehen
CREATE POLICY users_select_policy
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Erstelle eine Richtlinie für das Aktualisieren von Benutzern
-- Benutzer dürfen nur ihre eigenen Daten aktualisieren
CREATE POLICY users_update_policy
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid());
