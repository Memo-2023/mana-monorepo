# Database Refactoring Plan - Card System

## Aktuelle Problematik

Derzeit existieren 3 separate Collections für Cards:

- `cards` - Allgemeine Cards
- `user_cards` - User-spezifische Cards
- `card_templates` - Vordefinierte Templates

Dies führt zu:

- **Redundanz** in der Datenhaltung
- **Komplexität** bei Queries
- **Inkonsistenzen** zwischen Collections
- **Wartungsprobleme** bei Schema-Änderungen

## Vorschlag 1: Unified Cards Collection (Empfohlen) ✅

### Schema Design

```javascript
{
  collection: "cards",
  type: "base",
  schema: {
    // Core Fields
    id: "auto",
    user_id: "relation:users",      // null für System-Templates

    // Card Type & Origin
    type: "select",                  // "user" | "template" | "system"
    source: "select",                // "created" | "duplicated" | "imported"
    template_id: "relation:cards",   // Verweis auf Original-Template

    // Card Configuration (Vereinheitlicht!)
    config: "json",                  // Discriminated Union: {mode, ...config}
    metadata: "json",                // Name, description, tags, etc.
    constraints: "json",             // aspectRatio, limits, etc.

    // Organization
    page: "text",                    // Für User-Cards: welche Seite
    position: "number",              // Sortierung
    folder_id: "relation:folders",  // Optional: Ordner-Zuordnung

    // Visibility & Sharing
    visibility: "select",            // "private" | "public" | "unlisted"
    is_featured: "bool",            // Für Template-Store
    allow_duplication: "bool",      // Kann als Template verwendet werden

    // Statistics
    usage_count: "number",          // Wie oft als Template verwendet
    likes_count: "number",          // Für Template-Store

    // Timestamps
    created: "autodate",
    updated: "autodate"
  },

  indexes: [
    "user_id",
    "type",
    "page",
    "visibility",
    "template_id"
  ],

  rules: {
    list: "@request.auth.id = user_id || visibility = 'public'",
    view: "@request.auth.id = user_id || visibility != 'private'",
    create: "@request.auth.id != ''",
    update: "@request.auth.id = user_id",
    delete: "@request.auth.id = user_id && type != 'system'"
  }
}
```

### Vorteile

1. **Eine Quelle der Wahrheit** - Alle Cards in einer Collection
2. **Flexibilität** - User-Cards können zu Templates werden
3. **Einfache Queries** - Keine JOINs zwischen Collections
4. **Konsistenz** - Gleiches Schema für alle Card-Typen
5. **Performance** - Bessere Indizierung möglich

### Migration Strategy

```typescript
// 1. Neue Collection erstellen
await createUnifiedCardsCollection();

// 2. Daten migrieren
await migrateUserCards(); // user_cards → cards (type: "user")
await migrateTemplates(); // card_templates → cards (type: "template")
await migrateSystemCards(); // cards → cards (vereinheitlichen)

// 3. Alte Collections archivieren
await archiveOldCollections();
```

## Vorschlag 2: Optimierte Separate Collections

Falls eine Trennung gewünscht ist, dann mit klarer Hierarchie:

```javascript
// 1. card_definitions - Alle Card-Definitionen
{
  collection: "card_definitions",
  fields: [
    { name: "config", type: "json" },       // Card-Konfiguration
    { name: "metadata", type: "json" },     // Meta-Informationen
    { name: "constraints", type: "json" },  // Beschränkungen
    { name: "checksum", type: "text" }      // Für Deduplizierung
  ]
}

// 2. card_instances - Konkrete Verwendungen
{
  collection: "card_instances",
  fields: [
    { name: "definition_id", type: "relation:card_definitions" },
    { name: "user_id", type: "relation:users" },
    { name: "type", type: "select" },       // "personal" | "template"
    { name: "overrides", type: "json" },    // Lokale Anpassungen
    { name: "page", type: "text" },
    { name: "position", type: "number" }
  ]
}
```

## Vorschlag 3: Hybrid-Ansatz mit Smart References

```javascript
// Haupttabelle für aktive Cards
{
  collection: "cards",
  fields: [
    { name: "user_id", type: "relation" },
    { name: "data", type: "json" },         // Komplette Card-Daten
    { name: "template_ref", type: "text" }, // Optional: Template-ID
    { name: "is_template", type: "bool" },  // Kann als Template genutzt werden
    { name: "cache_key", type: "text" }     // Für Caching
  ]
}

// Separate Template-Registry
{
  collection: "template_registry",
  fields: [
    { name: "card_id", type: "relation:cards" },
    { name: "category", type: "select" },
    { name: "tags", type: "json" },
    { name: "featured", type: "bool" },
    { name: "stats", type: "json" }
  ]
}
```

## Empfohlene Implementierung

### Phase 1: Schema-Vereinfachung (1-2 Tage)

```typescript
// Neue unified cards collection
const unifiedCardSchema = {
	// User & System Fields kombiniert
	user_id: { type: 'relation', required: false }, // null = System-Template
	type: { type: 'select', options: ['user', 'template', 'system'] },

	// Vereinheitlichte Datenstruktur
	data: {
		type: 'json',
		schema: {
			config: CardConfig, // Discriminated Union
			metadata: CardMetadata,
			constraints: CardConstraints
		}
	},

	// Gemeinsame Features
	visibility: { type: 'select', default: 'private' },
	tags: { type: 'json', default: [] },
	stats: { type: 'json', default: {} }
};
```

### Phase 2: Service-Layer Anpassung (1 Tag)

```typescript
class UnifiedCardService {
	// Vereinfachte API
	async getCard(id: string): Promise<Card> {
		const record = await pb.collection('cards').getOne(id);
		return this.parseCard(record);
	}

	async getUserCards(userId: string): Promise<Card[]> {
		return pb.collection('cards').getList({
			filter: `user_id = "${userId}" && type = "user"`
		});
	}

	async getTemplates(category?: string): Promise<Card[]> {
		return pb.collection('cards').getList({
			filter: `type = "template" && visibility = "public"`
		});
	}

	async createFromTemplate(templateId: string): Promise<Card> {
		const template = await this.getCard(templateId);
		return this.createCard({
			...template,
			type: 'user',
			template_id: templateId,
			user_id: pb.authStore.model?.id
		});
	}
}
```

### Phase 3: Migration (1-2 Tage)

```typescript
// Migrations-Script
async function migrateToUnifiedCards() {
	// 1. Backup erstellen
	await backupDatabase();

	// 2. User Cards migrieren
	const userCards = await pb.collection('user_cards').getFullList();
	for (const card of userCards) {
		await pb.collection('cards').create({
			user_id: card.user_id,
			type: 'user',
			data: {
				config: card.config || card.modules,
				metadata: card.metadata,
				constraints: card.constraints
			},
			page: card.page,
			position: card.position
		});
	}

	// 3. Templates migrieren
	const templates = await pb.collection('card_templates').getFullList();
	for (const template of templates) {
		await pb.collection('cards').create({
			user_id: null,
			type: 'template',
			data: {
				config: template.config,
				metadata: {
					name: template.name,
					description: template.description,
					category: template.category
				}
			},
			visibility: 'public',
			is_featured: template.featured
		});
	}

	// 4. Alte Collections deaktivieren
	await archiveCollection('user_cards');
	await archiveCollection('card_templates');
}
```

## Vorteile der Vereinheitlichung

### 1. **Weniger Komplexität**

- Eine Collection statt drei
- Einheitliches Schema
- Einfachere Queries

### 2. **Bessere Performance**

- Weniger JOINs
- Effizientere Indizes
- Besseres Caching

### 3. **Flexibilität**

- User-Cards können Templates werden
- Templates können personalisiert werden
- Einfaches Sharing

### 4. **Wartbarkeit**

- Ein Schema zu pflegen
- Konsistente Validierung
- Einfachere Backups

## Risiken & Mitigation

| Risiko                             | Mitigation                           |
| ---------------------------------- | ------------------------------------ |
| Datenverlust bei Migration         | Vollständiges Backup, Staging-Test   |
| Performance bei großen Datenmengen | Indizes optimieren, Pagination       |
| Breaking Changes in API            | Compatibility Layer während Übergang |
| Komplexere Permissions             | Rule-based Access Control            |

## Zeitplan

- **Woche 1**: Schema-Design finalisieren, Tests schreiben
- **Woche 2**: Migration implementieren, Staging-Test
- **Woche 3**: Production-Migration, Monitoring
- **Woche 4**: Alte Collections entfernen, Cleanup

## Metriken für Erfolg

- ✅ Reduzierung der Datenbankgröße um ~20%
- ✅ Query-Performance Verbesserung um ~30%
- ✅ Weniger Code (-40% in Services)
- ✅ Einfachere API für Frontend
- ✅ Bessere Testbarkeit

## Fazit

**Empfehlung: Vorschlag 1 - Unified Cards Collection**

Dies bietet die beste Balance aus:

- Einfachheit
- Performance
- Flexibilität
- Zukunftssicherheit

Die Migration ist überschaubar und die Vorteile überwiegen deutlich die einmaligen Migrationskosten.
