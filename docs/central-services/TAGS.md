# Central Tags API

Das zentrale Tags-System ermöglicht einheitliche Tags/Labels über alle Manacore-Apps hinweg. Ein Tag, der in Todo erstellt wird, ist automatisch auch in Calendar und Contacts verfügbar.

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                     mana-core-auth                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  tags Tabelle (zentral)                              │   │
│  │  - id, userId, name, color, icon, createdAt         │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│         GET /api/v1/tags   │   POST/PUT/DELETE             │
└────────────────────────────┼────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌─────▼────┐        ┌─────▼────┐
   │  Todo   │         │ Calendar │        │ Contacts │
   │         │         │          │        │          │
   │ task_   │         │ event_   │        │ contact_ │
   │ to_tags │         │ to_tags  │        │ to_tags  │
   │ (tagId) │         │ (tagId)  │        │ (tagId)  │
   └─────────┘         └──────────┘        └──────────┘
```

## API Endpoints

Alle Endpoints sind unter `http://localhost:3001/api/v1/tags` verfügbar und erfordern einen Bearer Token.

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| `GET` | `/tags` | Alle Tags des Users abrufen |
| `GET` | `/tags/:id` | Einzelnes Tag abrufen |
| `GET` | `/tags/by-ids?ids=id1,id2` | Mehrere Tags per ID abrufen |
| `POST` | `/tags` | Neues Tag erstellen |
| `POST` | `/tags/defaults` | Default-Tags erstellen |
| `PUT` | `/tags/:id` | Tag aktualisieren |
| `DELETE` | `/tags/:id` | Tag löschen |

## Tag-Objekt

```typescript
interface Tag {
  id: string;           // UUID
  userId: string;       // User-ID (aus JWT)
  name: string;         // Tag-Name (max 100 Zeichen)
  color: string;        // Hex-Farbe (#3B82F6)
  icon?: string | null; // Optionales Phosphor-Icon
  createdAt: Date;
  updatedAt: Date;
}
```

## Default-Tags

Beim Aufruf von `POST /tags/defaults` werden folgende Standard-Tags erstellt:

| Name | Farbe | Hex |
|------|-------|-----|
| Arbeit | Blau | `#3B82F6` |
| Persönlich | Grün | `#10B981` |
| Familie | Pink | `#EC4899` |
| Wichtig | Rot | `#EF4444` |

## Client-Nutzung

### Shared Package

Das `@manacore/shared-tags` Package stellt einen Client bereit:

```typescript
import { createTagsClient } from '@manacore/shared-tags';

const tagsClient = createTagsClient({
  authUrl: 'http://localhost:3001',
  getToken: async () => authStore.getAccessToken(),
});

// Alle Tags laden
const tags = await tagsClient.getAll();

// Tag erstellen
const newTag = await tagsClient.create({
  name: 'Meeting',
  color: '#8B5CF6',
});

// Tags per IDs laden
const selectedTags = await tagsClient.getByIds(['id1', 'id2']);

// Tag aktualisieren
await tagsClient.update('tag-id', { color: '#22C55E' });

// Tag löschen
await tagsClient.delete('tag-id');

// Default-Tags erstellen
await tagsClient.createDefaults();
```

### In App-Stores

Die Apps nutzen den Client in ihren Stores:

**Todo (labels.svelte.ts):**
```typescript
import { createTagsClient, type Tag } from '@manacore/shared-tags';

// Label = Tag (Alias für Abwärtskompatibilität)
export type Label = Tag;

// Client lazy initialisieren
const client = createTagsClient({ ... });

export const labelsStore = {
  async fetchLabels() {
    const labels = await client.getAll();
    // ...
  }
};
```

**Calendar (event-tags.ts):**
```typescript
export type EventTag = Tag;
```

**Contacts (contacts.ts):**
```typescript
export type ContactTag = Tag;
```

## Junction Tables

Jede App behält ihre eigene Junction-Table für die Zuordnung:

### Todo: `task_to_tags`
```sql
CREATE TABLE task_to_tags (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL,  -- Soft reference zu mana-core-auth.tags
  PRIMARY KEY (task_id, tag_id)
);
```

### Calendar: `event_to_tags`
```sql
CREATE TABLE event_to_tags (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL,  -- Soft reference zu mana-core-auth.tags
  PRIMARY KEY (event_id, tag_id)
);
```

### Contacts: `contact_to_tags`
```sql
CREATE TABLE contact_to_tags (
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL,  -- Soft reference zu mana-core-auth.tags
  PRIMARY KEY (contact_id, tag_id)
);
```

**Hinweis:** Da die Tags in einer anderen Datenbank liegen, sind keine Foreign Key Constraints möglich. Die Apps validieren Tag-IDs beim Laden und ignorieren ungültige IDs.

## Entwicklung & Testing

### Alle drei Apps gleichzeitig starten

```bash
pnpm dev:tags-test
```

Dieser Befehl:
1. Richtet alle Datenbanken ein (todo, calendar, contacts, auth)
2. Startet alle Services mit farbcodierten Logs

### Manuelles API-Testing

```bash
# Token holen
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' | jq -r '.accessToken')

# Tags abrufen
curl http://localhost:3001/api/v1/tags \
  -H "Authorization: Bearer $TOKEN"

# Tag erstellen
curl -X POST http://localhost:3001/api/v1/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Projekt X", "color": "#F59E0B"}'

# Default-Tags erstellen
curl -X POST http://localhost:3001/api/v1/tags/defaults \
  -H "Authorization: Bearer $TOKEN"
```

## Dateien

### Backend (mana-core-auth)

| Datei | Beschreibung |
|-------|--------------|
| `src/db/schema/tags.schema.ts` | Drizzle-Schema für tags-Tabelle |
| `src/tags/tags.module.ts` | NestJS Module |
| `src/tags/tags.controller.ts` | REST Controller |
| `src/tags/tags.service.ts` | Business Logic |
| `src/tags/dto/create-tag.dto.ts` | DTO für Tag-Erstellung |
| `src/tags/dto/update-tag.dto.ts` | DTO für Tag-Update |

### Shared Package

| Datei | Beschreibung |
|-------|--------------|
| `packages/shared-tags/src/types.ts` | TypeScript Interfaces |
| `packages/shared-tags/src/client.ts` | TagsClient Klasse |
| `packages/shared-tags/src/index.ts` | Exports |

### Frontend-Integrationen

| App | API-Client | Store |
|-----|------------|-------|
| Todo | `src/lib/api/labels.ts` | `src/lib/stores/labels.svelte.ts` |
| Calendar | `src/lib/api/event-tags.ts` | `src/lib/stores/event-tags.svelte.ts` |
| Contacts | `src/lib/api/contacts.ts` (tagsApi) | - |

## Migration von lokalen Tags

Wenn eine App vorher eigene Tags hatte:

1. **Daten exportieren:** Bestehende Tags aus der lokalen Tabelle exportieren
2. **Tags erstellen:** Per API in mana-core-auth erstellen
3. **IDs mappen:** Alte Tag-IDs auf neue IDs mappen
4. **Junction Tables aktualisieren:** Tag-IDs in Junction-Tables ersetzen
5. **Lokale Tabelle löschen:** Alte Tags-Tabelle entfernen

## Vorteile

- **Konsistenz:** Ein Tag "Arbeit" ist überall gleich
- **Einheitliche Farben:** Tags sehen in allen Apps identisch aus
- **Weniger Duplikation:** Code und Daten werden geteilt
- **Cross-App Features:** Möglich (z.B. "Zeige alles mit Tag X")
