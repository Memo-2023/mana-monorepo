# Plan zur Vereinheitlichung der Namenskonventionen

**Datum:** 15. Januar 2025  
**Status:** In Bearbeitung

## 1. Analyse der aktuellen Situation ✅

### Identifizierte Collections

Nach Analyse des Codes wurden folgende Collections gefunden:

#### Plural Collections (korrekt):

- `users` ✓
- `links` ✓
- `folders` ✓
- `clicks` ✓
- `tags` ✓
- `cards` ✓
- `themes` ✓
- `feature_requests` ✓
- `feature_votes` ✓
- `template_ratings` ✓

#### Inkonsistente Collections:

- `link_tags` (sollte `links_tags` sein für Konsistenz)
- `card_templates` (korrekt)
- `user_cards` (inkonsistent mit `cards`)

### Feldnamen-Inkonsistenzen

#### Problem 1: Foreign Key Benennungen

**Aktuell inkonsistent:**

- In `links`: `user` (sollte `user_id` sein)
- In `analytics`: `link` (sollte `link_id` sein)
- In `folders`: manchmal `user_id`, manchmal `user`
- In `link_tags`: `link_id` und `tag_id` (korrekt)

#### Problem 2: Timestamp-Felder

**Aktuell:**

- Automatisch: `created`, `updated`
- Manuell: `clicked_at`, `expires_at`
- Inkonsistent: manchmal `_at` suffix, manchmal nicht

#### Problem 3: Boolean-Felder

**Aktuell:**

- `active` vs `is_active`
- `public` vs `is_public`
- `verified` vs `is_verified`

## 2. Mapping-Tabelle für Umbenennungen

### Collection-Umbenennungen

| Alt          | Neu                                  | Priorität | Breaking |
| ------------ | ------------------------------------ | --------- | -------- |
| `link_tags`  | `links_tags`                         | Niedrig   | Ja       |
| `user_cards` | Behalten oder in `cards` integrieren | Mittel    | Ja       |

### Feld-Umbenennungen

#### Links Collection

| Alt      | Neu         | Typ      | Breaking |
| -------- | ----------- | -------- | -------- |
| `user`   | `user_id`   | relation | Ja       |
| `active` | `is_active` | bool     | Ja       |
| `folder` | `folder_id` | relation | Ja       |

#### Analytics Collection

| Alt    | Neu          | Typ      | Breaking |
| ------ | ------------ | -------- | -------- |
| `link` | `link_id`    | relation | Ja       |
| `ip`   | `ip_address` | text     | Ja       |

#### Folders Collection

| Alt      | Neu         | Typ      | Breaking |
| -------- | ----------- | -------- | -------- |
| `user`   | `user_id`   | relation | Ja       |
| `public` | `is_public` | bool     | Ja       |

#### Tags Collection

| Alt      | Neu         | Typ      | Breaking |
| -------- | ----------- | -------- | -------- |
| `user`   | `user_id`   | relation | Ja       |
| `public` | `is_public` | bool     | Ja       |

## 3. Implementierungsstrategie

### Phase 1: Vorbereitung (Woche 1)

1. **Backup erstellen**
2. **Feature Flag einführen**: `USE_NEW_NAMING_CONVENTION`
3. **Compatibility Layer** entwickeln

### Phase 2: Duale Unterstützung (Woche 2-3)

1. **Neue Felder parallel zu alten anlegen**
2. **Daten synchron halten**
3. **Code für beide Varianten vorbereiten**

### Phase 3: Migration (Woche 4)

1. **Schrittweise Migration der Daten**
2. **Testing auf Staging**
3. **Monitoring einrichten**

### Phase 4: Cleanup (Woche 5)

1. **Alte Felder entfernen**
2. **Compatibility Layer entfernen**
3. **Documentation aktualisieren**

## 4. Migration Scripts

### 4.1 Database Migration Script

```javascript
// pb_migrations/002_naming_conventions.js
migrate(
	(db) => {
		// Phase 1: Add new fields parallel to old ones
		const collections = [
			{ name: 'links', oldField: 'user', newField: 'user_id' },
			{ name: 'links', oldField: 'active', newField: 'is_active' },
			{ name: 'links', oldField: 'folder', newField: 'folder_id' },
			{ name: 'analytics', oldField: 'link', newField: 'link_id' },
			{ name: 'analytics', oldField: 'ip', newField: 'ip_address' },
			{ name: 'folders', oldField: 'user', newField: 'user_id' },
			{ name: 'folders', oldField: 'public', newField: 'is_public' },
			{ name: 'tags', oldField: 'user', newField: 'user_id' },
			{ name: 'tags', oldField: 'public', newField: 'is_public' },
		];

		collections.forEach(({ name, oldField, newField }) => {
			const collection = $app.dao().findCollectionByNameOrId(name);
			if (collection) {
				const existingOld = collection.schema.find((f) => f.name === oldField);
				const existingNew = collection.schema.find((f) => f.name === newField);

				if (existingOld && !existingNew) {
					// Clone field with new name
					const newFieldSchema = JSON.parse(JSON.stringify(existingOld));
					newFieldSchema.name = newField;
					collection.schema.addField(new SchemaField(newFieldSchema));

					// Copy data
					$app.dao().db().newQuery(`UPDATE ${name} SET ${newField} = ${oldField}`).execute();
				}
			}
		});

		// Update collection rules with new field names
		updateCollectionRules();
	},
	(db) => {
		// Rollback: Remove new fields
		const collections = [
			{ name: 'links', fields: ['user_id', 'is_active', 'folder_id'] },
			{ name: 'analytics', fields: ['link_id', 'ip_address'] },
			{ name: 'folders', fields: ['user_id', 'is_public'] },
			{ name: 'tags', fields: ['user_id', 'is_public'] },
		];

		collections.forEach(({ name, fields }) => {
			const collection = $app.dao().findCollectionByNameOrId(name);
			if (collection) {
				fields.forEach((field) => {
					collection.schema.removeField(field);
				});
				$app.dao().saveCollection(collection);
			}
		});
	}
);
```

### 4.2 Compatibility Layer (TypeScript)

```typescript
// src/lib/db/compatibility.ts
export class DBCompatibility {
	private useNewNaming: boolean;

	constructor() {
		this.useNewNaming = import.meta.env.PUBLIC_USE_NEW_NAMING === 'true';
	}

	// Field name mapper
	field(oldName: string): string {
		if (!this.useNewNaming) return oldName;

		const mapping: Record<string, string> = {
			user: 'user_id',
			link: 'link_id',
			folder: 'folder_id',
			active: 'is_active',
			public: 'is_public',
			ip: 'ip_address',
		};

		return mapping[oldName] || oldName;
	}

	// Query builder helper
	buildFilter(filters: Record<string, any>): string {
		const mapped: Record<string, any> = {};

		Object.entries(filters).forEach(([key, value]) => {
			mapped[this.field(key)] = value;
		});

		return Object.entries(mapped)
			.map(([k, v]) => `${k}="${v}"`)
			.join(' && ');
	}

	// Data transformer for responses
	transformResponse(data: any): any {
		if (!this.useNewNaming) return data;

		// Map new field names back to old for backward compatibility
		const reverseMapping: Record<string, string> = {
			user_id: 'user',
			link_id: 'link',
			folder_id: 'folder',
			is_active: 'active',
			is_public: 'public',
			ip_address: 'ip',
		};

		const transformed = { ...data };

		Object.entries(reverseMapping).forEach(([newName, oldName]) => {
			if (newName in transformed) {
				transformed[oldName] = transformed[newName];
				if (this.useNewNaming) {
					delete transformed[newName];
				}
			}
		});

		return transformed;
	}
}

export const dbCompat = new DBCompatibility();
```

## 5. Code Refactoring Plan

### 5.1 Utility Function für Migration

```typescript
// src/lib/db/migrate-helpers.ts
import { pb } from '$lib/pocketbase';
import { dbCompat } from './compatibility';

export async function getLinks(userId: string) {
	const filter = dbCompat.buildFilter({ user: userId });
	const results = await pb.collection('links').getList(1, 100, { filter });

	return results.items.map((item) => dbCompat.transformResponse(item));
}
```

### 5.2 Schrittweise Migration der Codebasis

1. **Alle direkten PocketBase-Aufrufe wrappen**
2. **Tests für beide Naming-Conventions schreiben**
3. **Graduelle Aktivierung per Feature Flag**

## 6. Test-Strategie

### 6.1 Unit Tests

```typescript
// src/tests/naming-migration.spec.ts
describe('Naming Convention Migration', () => {
	describe('Compatibility Layer', () => {
		it('should map old field names to new', () => {
			expect(dbCompat.field('user')).toBe('user_id');
			expect(dbCompat.field('active')).toBe('is_active');
		});

		it('should build correct filters', () => {
			const filter = dbCompat.buildFilter({ user: '123', active: true });
			expect(filter).toBe('user_id="123" && is_active="true"');
		});
	});

	describe('Data Migration', () => {
		it('should handle both field versions', async () => {
			// Test with old fields
			// Test with new fields
			// Test with both present
		});
	});
});
```

### 6.2 Integration Tests

- Test alle API Endpoints mit beiden Namenskonventionen
- Test Datenintegrität während Migration
- Performance-Tests vor und nach Migration

### 6.3 E2E Tests

- Vollständiger User-Flow Test
- Link-Erstellung und -Abruf
- Analytics-Tracking
- Admin-Funktionen

## 7. Rollback-Plan

### 7.1 Sofortiger Rollback (< 1 Stunde)

```bash
# 1. Feature Flag deaktivieren
export PUBLIC_USE_NEW_NAMING=false

# 2. Cache clearen
redis-cli FLUSHALL

# 3. Server neustarten
pm2 restart uload
```

### 7.2 Daten-Rollback (< 24 Stunden)

```javascript
// pb_migrations/002_naming_conventions_rollback.js
migrate((db) => {
	// Daten von neuen Feldern zurück zu alten kopieren
	const updates = [
		'UPDATE links SET user = user_id WHERE user_id IS NOT NULL',
		'UPDATE links SET active = is_active WHERE is_active IS NOT NULL',
		'UPDATE analytics SET link = link_id WHERE link_id IS NOT NULL',
		// ... weitere Updates
	];

	updates.forEach((sql) => {
		$app.dao().db().newQuery(sql).execute();
	});

	// Neue Felder entfernen
	// ... (siehe oben)
});
```

### 7.3 Vollständiger Rollback

```bash
# 1. Backup wiederherstellen
./backend/pocketbase restore backup_before_migration.zip

# 2. Code auf vorherige Version zurücksetzen
git revert [migration-commit]

# 3. Deploy
npm run build && npm run deploy
```

## 8. Monitoring & Validierung

### 8.1 Metriken zu überwachen

- Response Times vor/nach Migration
- Error Rates
- Database Query Performance
- User Activity Patterns

### 8.2 Validierungs-Checks

```typescript
// src/lib/db/validation.ts
export async function validateMigration() {
	const checks = {
		linksIntegrity: await checkLinksIntegrity(),
		analyticsConsistency: await checkAnalyticsConsistency(),
		relationsValid: await checkRelationsValid(),
		performanceMetrics: await checkPerformance(),
	};

	return checks;
}
```

## 9. Zeitplan

| Woche | Phase           | Aktivitäten                                | Verantwortlich   |
| ----- | --------------- | ------------------------------------------ | ---------------- |
| 1     | Vorbereitung    | Backup, Feature Flags, Compatibility Layer | DevOps + Backend |
| 2-3   | Implementierung | Duale Felder, Code-Anpassungen             | Backend          |
| 4     | Testing         | Unit, Integration, E2E Tests               | QA + Backend     |
| 5     | Migration       | Staging-Deploy, Monitoring                 | DevOps           |
| 6     | Production      | Schrittweiser Rollout                      | Team             |
| 7     | Cleanup         | Alte Felder entfernen                      | Backend          |

## 10. Risiken & Mitigationen

| Risiko                       | Wahrscheinlichkeit | Impact | Mitigation                         |
| ---------------------------- | ------------------ | ------ | ---------------------------------- |
| Datenverlust                 | Niedrig            | Hoch   | Mehrfache Backups, Test-Migrations |
| Performance-Degradation      | Mittel             | Mittel | Monitoring, Rollback-Plan          |
| Breaking Changes für Clients | Hoch               | Mittel | Compatibility Layer, Versioning    |
| Inkonsistente Daten          | Mittel             | Hoch   | Validierungs-Checks, Transactions  |

## 11. Erfolgs-Kriterien

- ✅ Alle Tests grün
- ✅ Keine Performance-Verschlechterung (< 5% Unterschied)
- ✅ Keine Datenverluste
- ✅ Erfolgreiche Migration auf Staging
- ✅ < 0.1% Error Rate nach Production Deploy
- ✅ Positive Developer Feedback

## 12. Nächste Schritte

1. **Review** dieses Plans mit dem Team
2. **Approval** von Tech Lead / CTO
3. **Setup** der Test-Umgebung
4. **Implementierung** des Compatibility Layers
5. **Start** der Phase 1

---

_Dieser Plan wird kontinuierlich aktualisiert. Letzte Änderung: 15. Januar 2025_
