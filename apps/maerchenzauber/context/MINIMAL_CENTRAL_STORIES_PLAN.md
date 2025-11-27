# Minimale Umsetzung: Zentrale Stories für Alle

## Übersicht

Schnellste Lösung um zentral erstellte Stories allen Nutzern zur Verfügung zu stellen.

---

## Option A: Super Minimal (1-2 Tage)

### Datenbank-Änderung (NUR 2 Spalten!)

```sql
-- Stories Tabelle erweitern
ALTER TABLE stories ADD COLUMN is_central BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN central_order INTEGER DEFAULT 0;
```

### RLS Policy Update

```sql
-- Bestehende Policy ersetzen
DROP POLICY IF EXISTS "Users can view their own stories" ON stories;

-- Neue Policy: Eigene Stories + Zentrale Stories
CREATE POLICY "Users can view own and central stories" ON stories
    FOR SELECT USING (
        user_id = auth.uid()::text
        OR is_central = true
    );
```

### Backend: Character Controller anpassen

```typescript
// apps/backend/src/story/story.service.ts
async getStories(userId: string) {
  return this.supabase
    .from('stories')
    .select('*')
    .or(`user_id.eq.${userId},is_central.eq.true`)
    .order('is_central', { ascending: false })
    .order('created_at', { ascending: false });
}
```

### Mobile App: Story List

```typescript
// apps/mobile/app/stories.tsx
// Zentrale Stories mit Badge markieren
{story.is_central && (
  <Badge text="Märchenzauber Story" color="gold" />
)}
```

### Admin-Tool (Quick & Dirty)

```sql
-- Stories zentral machen (manuell via Supabase Dashboard)
UPDATE stories
SET is_central = true,
    central_order = 1,
    user_id = 'SYSTEM'
WHERE id = 'story-uuid-hier';
```

---

## Option B: Etwas sauberer (3-4 Tage)

### Datenbank

```sql
-- Neue Tabelle NUR für zentrale Stories
CREATE TABLE central_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    story_prompt TEXT,
    story_text TEXT NOT NULL,
    character_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    age_group VARCHAR(20),
    pages_data JSONB DEFAULT '[]'::jsonb,
    characters_data JSONB DEFAULT '[]'::jsonb
);

-- RLS: Alle können lesen, niemand schreiben
ALTER TABLE central_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read central stories" ON central_stories
    FOR SELECT USING (published = true);
```

### Backend Service

```typescript
// Neuer Endpoint
@Get('central')
async getCentralStories() {
  return this.supabase
    .from('central_stories')
    .select('*')
    .eq('published', true)
    .order('sort_order');
}
```

### Mobile: Separate Sektion

```typescript
// Zwei Tabs: "Meine Stories" | "Märchenzauber Stories"
<Tab.Navigator>
  <Tab.Screen name="Meine" component={MyStories} />
  <Tab.Screen name="Entdecken" component={CentralStories} />
</Tab.Navigator>
```

---

## Option C: Hybrid - Empfohlen! (2 Tage)

### Minimale Änderung mit besserem Design

```sql
-- Stories Tabelle
ALTER TABLE stories
ADD COLUMN story_type VARCHAR(20) DEFAULT 'user'
    CHECK (story_type IN ('user', 'central', 'seasonal'));
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- Index für Performance
CREATE INDEX idx_public_stories ON stories(is_public, story_type);

-- RLS anpassen
CREATE POLICY "View public and own stories" ON stories
    FOR SELECT USING (
        user_id = auth.uid()::text
        OR is_public = true
    );
```

### Stories erstellen (Admin Script)

```javascript
// Admin-Script zum Story erstellen
const createCentralStory = async () => {
  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: 'CENTRAL_SYSTEM',
      title: 'Der kleine Drache lernt fliegen',
      story_text: '...',
      story_type: 'central',
      is_public: true,
      pages_data: [...],
      // Kein character_id nötig
    });
};
```

### Mobile App

```typescript
// stories.tsx - Gruppiert anzeigen
const groupedStories = {
  central: stories.filter(s => s.story_type === 'central'),
  mine: stories.filter(s => s.story_type === 'user')
};

// UI
<ScrollView>
  {groupedStories.central.length > 0 && (
    <Section title="Märchenzauber Stories">
      {groupedStories.central.map(story => (
        <StoryCard key={story.id} story={story} badge="✨" />
      ))}
    </Section>
  )}

  <Section title="Meine Stories">
    {groupedStories.mine.map(story => (
      <StoryCard key={story.id} story={story} />
    ))}
  </Section>
</ScrollView>
```

---

## Deployment Steps (für alle Optionen)

### 1. Datenbank Migration

```bash
# SQL ausführen in Supabase Dashboard
# Oder via Migration File
```

### 2. Backend Update

```bash
# Nur bei Option B/C
npm run build
npm run deploy
```

### 3. Mobile App

```bash
# Nur UI Updates
npm run build:ios
npm run build:android
# App Store Updates
```

### 4. Erste zentrale Stories erstellen

- Supabase Dashboard öffnen
- Stories Tabelle
- Insert Row
- Felder ausfüllen mit `is_central=true` oder `story_type='central'`

---

## Vorteile der minimalen Lösung

✅ **Keine neuen Tabellen**
✅ **Minimale Code-Änderungen**  
✅ **Nutzt bestehende Infrastruktur**
✅ **Schnell umsetzbar (1-2 Tage)**
✅ **Einfach erweiterbar später**

## Was fehlt (für später)

- ❌ Voting System
- ❌ Collections
- ❌ Character Sharing
- ❌ Admin Dashboard
- ❌ Automatische Kuratierung

---

## Konkrete nächste Schritte

1. **Entscheidung**: Option A, B oder C?
2. **Datenbank**: SQL Migration ausführen
3. **Backend**: Falls nötig, Service anpassen (30 Min)
4. **Mobile**: UI für zentrale Stories (2-3 Std)
5. **Content**: 5-10 erste zentrale Stories erstellen
6. **Test**: Mit 2-3 Test-Usern prüfen
7. **Release**: App Update veröffentlichen

**Geschätzter Aufwand**:

- Option A: 4-8 Stunden
- Option B: 2-3 Tage
- Option C: 1-2 Tage (Empfehlung!)

## Admin-Workaround für Story-Erstellung

Bis ein Admin-Panel existiert:

1. **Supabase Dashboard** → SQL Editor
2. Story-Daten vorbereiten (JSON)
3. INSERT Statement ausführen
4. Oder: Kleines Node.js Script schreiben für Bulk-Import
