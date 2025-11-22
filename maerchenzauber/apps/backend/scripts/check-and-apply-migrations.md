# Datenbank Schema Prüfung und Migration

## Schritt 1: Aktuellen Status prüfen

Führe diese SQL-Abfragen in der **Supabase SQL Editor** aus:

### 1.1 Prüfe `stories` Tabelle Spalten

```sql
-- Zeigt alle Spalten der stories Tabelle
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stories'
ORDER BY ordinal_position;
```

**Wichtig:** Prüfe ob diese Spalten existieren:
- ✓ `is_favorite` (boolean) - für private Favoriten
- ✓ `is_published` (boolean) - für veröffentlichte Stories
- ✓ `visibility` (varchar) - für Sichtbarkeit
- ✓ `archived` (boolean) - für archivierte Stories

### 1.2 Prüfe `story_votes` Tabelle

```sql
-- Prüft ob story_votes Tabelle existiert
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'story_votes'
) as table_exists;

-- Zeigt Struktur wenn vorhanden
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'story_votes'
ORDER BY ordinal_position;
```

---

## Schritt 2: Fehlende Spalten/Tabellen hinzufügen

### 2.1 Falls `is_favorite` fehlt:

```sql
-- Add is_favorite column to stories table for private favorites
-- This is separate from story_votes which is used for public stories

ALTER TABLE stories
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Create index for filtering favorite stories
CREATE INDEX IF NOT EXISTS idx_stories_favorite
ON stories(user_id, is_favorite)
WHERE is_favorite = true;

-- Add comment for documentation
COMMENT ON COLUMN stories.is_favorite IS 'Personal favorite flag for user''s own stories (different from public voting)';
```

### 2.2 Falls `story_votes` Tabelle fehlt:

```sql
-- Create story_votes table
CREATE TABLE IF NOT EXISTS story_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL,
  user_id UUID NOT NULL,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'love', 'star')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Ensure one vote per user per story
  UNIQUE(story_id, user_id),

  -- Foreign key to stories table
  CONSTRAINT fk_story
    FOREIGN KEY(story_id)
    REFERENCES stories(id)
    ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_story_votes_story_id ON story_votes(story_id);
CREATE INDEX idx_story_votes_user_id ON story_votes(user_id);
CREATE INDEX idx_story_votes_vote_type ON story_votes(vote_type);

-- Enable Row Level Security
ALTER TABLE story_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can view all votes (for counting)
CREATE POLICY "Allow viewing all votes" ON story_votes
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own votes
CREATE POLICY "Users can create their own votes" ON story_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own votes
CREATE POLICY "Users can update their own votes" ON story_votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own votes
CREATE POLICY "Users can delete their own votes" ON story_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Reuse existing update_updated_at_column function if it exists
-- Otherwise create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = TIMEZONE('utc'::text, NOW());
      RETURN NEW;
    END;
    $func$ language 'plpgsql';
  END IF;
END $$;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_story_votes_updated_at BEFORE UPDATE
  ON story_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Schritt 3: Verifizierung

### 3.1 Prüfe ob alles funktioniert:

```sql
-- Test: Prüfe ob is_favorite existiert
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'stories' AND column_name = 'is_favorite';

-- Test: Prüfe ob story_votes Tabelle existiert
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'story_votes';

-- Test: Zeige RLS Policies für story_votes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'story_votes';
```

---

## Wie verwende ich das?

1. **Öffne Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigiere zu deinem Projekt**: `dyywxrmonxoiojsjmymc`
3. **Gehe zu SQL Editor**: Linkes Menü → "SQL Editor" → "New Query"
4. **Führe Schritt 1 aus**: Kopiere und führe die Abfragen aus Schritt 1 aus
5. **Basierend auf den Ergebnissen**: Führe die notwendigen Migrationen aus Schritt 2 aus
6. **Verifiziere**: Führe Schritt 3 aus um zu prüfen ob alles korrekt ist

---

## Status nach Migration

Nach erfolgreicher Migration solltest du haben:

✅ **stories Tabelle**
- `is_favorite` Spalte (boolean, default: false)
- Index auf `(user_id, is_favorite)` für Performance

✅ **story_votes Tabelle**
- Vollständige Struktur für öffentliche Story-Votes
- RLS Policies aktiviert
- Indexes für Performance
- Unique Constraint (ein Vote pro User pro Story)

✅ **Voting System**
- Eigene Stories: `is_favorite` Flag im `stories` Eintrag
- Öffentliche Stories: Separater Eintrag in `story_votes` Tabelle
