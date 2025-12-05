-- Vereinfachte Datenbank-Struktur für BaseText
-- Dieses Skript löscht die bestehenden Tabellen und erstellt eine vereinfachte Struktur

-- Bestehende Policies löschen
DROP POLICY IF EXISTS "Users can view documents in spaces they are members of" ON documents;
DROP POLICY IF EXISTS "Owners and editors can update documents in their spaces" ON documents;
DROP POLICY IF EXISTS "Owners and editors can delete documents in their spaces" ON documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert documents in spaces they are members of" ON documents;

DROP POLICY IF EXISTS "Users can view spaces they are members of" ON spaces;
DROP POLICY IF EXISTS "Space owners can update spaces" ON spaces;
DROP POLICY IF EXISTS "Space owners can delete spaces" ON spaces;
DROP POLICY IF EXISTS "Users can insert spaces" ON spaces;

DROP POLICY IF EXISTS "Users can view their own memberships" ON space_members;
DROP POLICY IF EXISTS "Space owners can view all memberships" ON space_members;
DROP POLICY IF EXISTS "Space owners can update memberships" ON space_members;
DROP POLICY IF EXISTS "Space owners can delete memberships" ON space_members;
DROP POLICY IF EXISTS "Space owners can insert memberships" ON space_members;

DROP POLICY IF EXISTS "Users can view document-space relationships they have access to" ON document_space;
DROP POLICY IF EXISTS "Users can insert document-space relationships they have access to" ON document_space;
DROP POLICY IF EXISTS "Users can delete document-space relationships they have access to" ON document_space;

DROP POLICY IF EXISTS "Users can view their own user data" ON users;
DROP POLICY IF EXISTS "Users can update their own user data" ON users;

-- Bestehende Tabellen löschen (in umgekehrter Reihenfolge der Abhängigkeiten)
DROP TABLE IF EXISTS document_space CASCADE;
DROP TABLE IF EXISTS space_members CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS spaces CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Benutzer-Tabelle
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spaces-Tabelle (vereinfacht, ohne Sharing-Funktionalität)
CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB
);

-- Dokumente-Tabelle
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  type TEXT CHECK (type IN ('original', 'analysis', 'generated')),
  space_id UUID REFERENCES spaces(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Trigger für automatische Aktualisierung des updated_at-Feldes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- RLS-Policies für die Tabellen

-- Aktiviere RLS für alle Tabellen
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Benutzer können nur ihre eigenen Daten sehen und bearbeiten
CREATE POLICY "Benutzer können nur ihre eigenen Daten sehen" ON users
  FOR ALL USING (id = auth.uid());

-- Spaces: Benutzer können nur ihre eigenen Spaces sehen und bearbeiten
CREATE POLICY "Benutzer können nur ihre eigenen Spaces sehen" ON spaces
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Benutzer können nur ihre eigenen Spaces bearbeiten" ON spaces
  FOR ALL USING (user_id = auth.uid());

-- Dokumente: Benutzer können nur Dokumente in ihren eigenen Spaces sehen und bearbeiten
CREATE POLICY "Benutzer können nur ihre eigenen Dokumente sehen" ON documents
  FOR SELECT USING (
    user_id = auth.uid() OR
    space_id IN (SELECT id FROM spaces WHERE user_id = auth.uid())
  );

CREATE POLICY "Benutzer können nur ihre eigenen Dokumente bearbeiten" ON documents
  FOR ALL USING (user_id = auth.uid());

-- Hilfsfunktionen für die Arbeit mit der Datenbank

-- Funktion zum Abrufen aller Spaces eines Benutzers
CREATE OR REPLACE FUNCTION get_user_spaces()
RETURNS SETOF spaces
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM spaces WHERE user_id = auth.uid();
$$;

-- Funktion zum Abrufen eines Space anhand seiner ID
CREATE OR REPLACE FUNCTION get_space_by_id(p_space_id UUID)
RETURNS spaces
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM spaces 
  WHERE id = p_space_id AND user_id = auth.uid();
$$;

-- Funktion zum Abrufen aller Dokumente in einem Space
CREATE OR REPLACE FUNCTION get_documents_by_space_id(p_space_id UUID)
RETURNS SETOF documents
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM documents 
  WHERE space_id = p_space_id AND 
        (user_id = auth.uid() OR 
         space_id IN (SELECT id FROM spaces WHERE user_id = auth.uid()));
$$;
