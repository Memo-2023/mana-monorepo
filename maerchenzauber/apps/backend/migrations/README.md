# Migration: Add is_favorite to stories

## Problem
Die `is_favorite` Spalte fehlt in der `stories` Tabelle in Supabase.

## Lösung
Führe folgendes SQL in **Supabase Dashboard > SQL Editor** aus:

```sql
-- Add is_favorite column to stories table
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_stories_is_favorite
ON stories(user_id, is_favorite)
WHERE is_favorite = true;

-- Add comment
COMMENT ON COLUMN stories.is_favorite IS 'Indicates if the story owner has marked it as a favorite';
```

## Schritte

1. Öffne [Supabase Dashboard](https://app.supabase.com)
2. Wähle dein Projekt: `maerchenzauber`
3. Gehe zu **SQL Editor** (links in der Sidebar)
4. Klicke **New Query**
5. Kopiere und füge das obige SQL ein
6. Klicke **Run** (oder drücke Cmd+Enter)

## Verifizierung

Nach der Migration:

```sql
-- Check if column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'stories'
  AND column_name = 'is_favorite';
```

## Nach der Migration

Die Favoriten-Funktionalität sollte dann funktionieren! ⭐
