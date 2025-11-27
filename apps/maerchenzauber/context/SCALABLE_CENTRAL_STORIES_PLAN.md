# Skalierbare Minimallösung für Zentrale Stories

## Foundation für späteres Community-System

### Kernprinzip

Start mit minimalem Setup, das bereits die richtige Struktur für spätere Features hat.

---

## Phase 1: Minimale Basis (JETZT - 2 Tage)

### 1.1 Stories Tabelle erweitern

```sql
-- Diese Felder bleiben für immer und werden später genutzt
ALTER TABLE stories
ADD COLUMN is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN published_at TIMESTAMPTZ,
ADD COLUMN published_by TEXT, -- 'system', 'user', 'curator'
ADD COLUMN visibility VARCHAR(20) DEFAULT 'private'
    CHECK (visibility IN ('private', 'public', 'central', 'featured')),
ADD COLUMN featured_score DECIMAL DEFAULT 0, -- Für späteres Ranking
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb; -- Flexibel für Zukunft

-- Index für Performance (wichtig für später!)
CREATE INDEX idx_story_visibility ON stories(visibility, published_at DESC);
CREATE INDEX idx_story_metadata ON stories USING gin (metadata);
```

### 1.2 Story Collections (Basis-Struktur)

```sql
-- Diese Tabelle JETZT anlegen, auch wenn minimal genutzt
CREATE TABLE story_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL, -- 'central-stories', 'weekly-picks'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'automatic', 'contest'
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    config JSONB DEFAULT '{}'::jsonb, -- Für spätere Features
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction Table
CREATE TABLE collection_stories (
    collection_id UUID REFERENCES story_collections(id) ON DELETE CASCADE,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by TEXT,
    PRIMARY KEY (collection_id, story_id)
);

-- Erste Collection erstellen
INSERT INTO story_collections (slug, name, description, type)
VALUES ('central-stories', 'Märchenzauber Geschichten', 'Offizielle Geschichten von Märchenzauber', 'manual');
```

### 1.3 RLS Policies (zukunftssicher)

```sql
-- Stories Policy
CREATE POLICY "story_visibility_policy" ON stories
    FOR SELECT USING (
        user_id = auth.uid()::text -- Eigene Stories
        OR visibility IN ('public', 'central', 'featured') -- Öffentliche
    );

-- Collections sind öffentlich lesbar
ALTER TABLE story_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections_public_read" ON story_collections
    FOR SELECT USING (is_active = true);

ALTER TABLE collection_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collection_stories_public_read" ON collection_stories
    FOR SELECT USING (true);
```

### 1.4 Backend Service (erweiterbar)

```typescript
// story.service.ts - Struktur für Wachstum
export class StoryService {
  // Basis-Methode die später erweitert wird
  async getStories(
    userId: string,
    options?: {
      includePublic?: boolean;
      collectionSlug?: string;
    }
  ) {
    let query = this.supabase.from('stories').select('*');

    if (options?.collectionSlug) {
      // Via Collection
      const { data: collection } = await this.supabase
        .from('story_collections')
        .select('id')
        .eq('slug', options.collectionSlug)
        .single();

      query = this.supabase
        .from('collection_stories')
        .select('stories(*)')
        .eq('collection_id', collection.id)
        .order('position');
    } else {
      // Direkt
      query = query.or(`user_id.eq.${userId},visibility.in.(public,central,featured)`);
    }

    return query;
  }

  // Vorbereitet für später
  async voteStory(storyId: string, userId: string) {
    // TODO: Implement in Phase 2
    throw new Error('Coming soon');
  }
}
```

### 1.5 Mobile App (mit Zukunfts-Hooks)

```typescript
// types/story.ts
export interface Story {
  // Bestehende Felder...
  visibility?: 'private' | 'public' | 'central' | 'featured';
  metadata?: {
    votes?: number; // Vorbereitet
    author?: string; // Vorbereitet
    collection?: string; // Vorbereitet
  };
}

// components/StoryList.tsx
export const StoryList = () => {
  const [filter, setFilter] = useState<'all' | 'mine' | 'central'>('all');

  // Struktur die später erweitert wird
  const sections = [
    {
      title: 'Märchenzauber Geschichten',
      data: stories.filter(s => s.visibility === 'central'),
      badge: '✨'
    },
    {
      title: 'Meine Geschichten',
      data: stories.filter(s => s.user_id === currentUser.id),
    }
  ];

  return (
    <SectionList
      sections={sections}
      renderItem={({ item }) => (
        <StoryCard
          story={item}
          onVote={() => {/* TODO Phase 2 */}}
          showVoteButton={false} // Wird später true
        />
      )}
    />
  );
};
```

---

## Phase 2: Voting hinzufügen (+1 Woche)

```sql
-- Neue Tabelle, bestehende Struktur bleibt
CREATE TABLE story_votes (
    story_id UUID REFERENCES stories(id),
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (story_id, user_id)
);

-- Stories Tabelle Update
ALTER TABLE stories ADD COLUMN vote_count INTEGER DEFAULT 0;

-- Automatisches Update via Trigger
CREATE TRIGGER update_vote_count
AFTER INSERT OR DELETE ON story_votes
FOR EACH ROW EXECUTE FUNCTION update_story_vote_count();
```

Backend:

```typescript
// Nur neue Methode hinzufügen
async voteStory(storyId: string, userId: string) {
  return this.supabase.from('story_votes').insert({
    story_id: storyId,
    user_id: userId
  });
}
```

---

## Phase 3: Character System (+1 Woche)

```sql
-- Characters Tabelle analog zu Stories
ALTER TABLE characters
ADD COLUMN is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN visibility VARCHAR(20) DEFAULT 'private',
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Character Collections (analog zu story_collections)
CREATE TABLE character_collections (...);
```

---

## Phase 4: User Publishing (+1 Woche)

```sql
-- Keine Schema-Änderung nötig!
-- Nur Logic: User können visibility auf 'public' setzen

-- Neue Collection
INSERT INTO story_collections (slug, name, type)
VALUES ('community', 'Community Geschichten', 'automatic');
```

---

## Phase 5: Erweiterte Features

- Weekly Collections → Nutzt bestehende `story_collections`
- Achievements → In `metadata` JSONB speichern
- Comments → Neue Tabelle, aber Stories bleiben unverändert
- Analytics → Seperate Tabelle mit Foreign Keys

---

## Migrations-Strategie

```sql
-- migrations/001_initial_central_stories.sql
-- Phase 1 Changes

-- migrations/002_add_voting.sql
-- Phase 2 Changes

-- migrations/003_character_sharing.sql
-- Phase 3 Changes
```

---

## Vorteile dieser Lösung

✅ **Keine Breaking Changes** - Jede Phase baut auf der vorherigen auf
✅ **Collections von Anfang an** - Zentrale Abstraktion für alle Gruppierungen
✅ **JSONB metadata** - Flexibilität ohne Schema-Änderungen
✅ **Richtiges Naming** - `visibility` statt `is_central`, skaliert besser
✅ **Indices von Anfang an** - Performance bleibt gut bei Wachstum

## Start-Kommandos (Phase 1)

```bash
# 1. Migration ausführen
supabase migration new central_stories_foundation
# Code von oben einfügen
supabase db push

# 2. Erste zentrale Stories erstellen
npm run seed:central-stories

# 3. App Update
npm run deploy
```

## Seed Script für erste Stories

```javascript
// scripts/seed-central-stories.js
const createCentralStory = async (title, text, pages) => {
  const { data: story } = await supabase
    .from('stories')
    .insert({
      user_id: 'SYSTEM',
      title,
      story_text: text,
      visibility: 'central',
      published_at: new Date(),
      published_by: 'system',
      pages_data: pages,
      metadata: {
        version: 1,
        language: 'de',
        age_group: '4-8',
      },
    })
    .select()
    .single();

  // In Collection einfügen
  const { data: collection } = await supabase
    .from('story_collections')
    .select('id')
    .eq('slug', 'central-stories')
    .single();

  await supabase.from('collection_stories').insert({
    collection_id: collection.id,
    story_id: story.id,
    position: 1,
  });
};
```

---

## Zeitplan

**Woche 1**: Phase 1 implementieren, 5-10 zentrale Stories
**Woche 2**: App Release, Feedback sammeln
**Woche 3**: Phase 2 (Voting) entwickeln
**Woche 4**: Phase 3 (Characters) entwickeln
**Monat 2**: Phase 4-5 je nach Priorität

Diese Struktur wächst organisch ohne Breaking Changes!
