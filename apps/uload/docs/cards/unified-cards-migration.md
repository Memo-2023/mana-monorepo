# Unified Cards - Datenbank Migration Guide

## PocketBase Collection Schema

### Neue Collection: `unified_cards`

```javascript
// Collection Konfiguration
{
  name: 'unified_cards',
  type: 'base',
  schema: [
    {
      name: 'user_id',
      type: 'relation',
      required: true,
      options: {
        collectionId: 'users',
        cascadeDelete: true
      }
    },
    {
      name: 'render_mode',
      type: 'select',
      required: true,
      options: {
        values: ['beginner', 'advanced', 'expert']
      }
    },
    // Modular Mode Fields
    {
      name: 'modules',
      type: 'json',
      required: false
    },
    {
      name: 'theme_id',
      type: 'relation',
      required: false,
      options: {
        collectionId: 'themes'
      }
    },
    // Template Mode Fields
    {
      name: 'template',
      type: 'text',
      required: false
    },
    {
      name: 'template_css',
      type: 'text',
      required: false
    },
    {
      name: 'template_variables',
      type: 'json',
      required: false
    },
    {
      name: 'template_values',
      type: 'json',
      required: false
    },
    // Custom HTML Mode Fields
    {
      name: 'custom_html',
      type: 'text',
      required: false
    },
    {
      name: 'custom_css',
      type: 'text',
      required: false
    },
    {
      name: 'custom_js',
      type: 'text',
      required: false
    },
    // Common Fields
    {
      name: 'variant',
      type: 'select',
      required: false,
      options: {
        values: ['default', 'compact', 'hero', 'minimal', 'glass', 'gradient']
      }
    },
    {
      name: 'constraints',
      type: 'json',
      required: false
    },
    {
      name: 'metadata',
      type: 'json',
      required: false
    },
    {
      name: 'page',
      type: 'text',
      required: false
    },
    {
      name: 'position',
      type: 'number',
      required: false
    },
    {
      name: 'is_active',
      type: 'bool',
      required: false,
      options: {
        default: true
      }
    },
    {
      name: 'is_public',
      type: 'bool',
      required: false,
      options: {
        default: false
      }
    }
  ]
}
```

## Migration Script

### 1. Erstelle die Collection in PocketBase Admin

1. Gehe zu PocketBase Admin UI
2. Klicke auf "New Collection"
3. Füge die Felder wie oben beschrieben hinzu
4. Setze die API Rules:
   - List/View: `@request.auth.id = user_id || is_public = true`
   - Create: `@request.auth.id != ""`
   - Update: `@request.auth.id = user_id`
   - Delete: `@request.auth.id = user_id`

### 2. Migriere bestehende Cards

```javascript
// Migration Script (in PocketBase Admin Console ausführen)
// ODER als separates Node.js Script

async function migrateExistingCards() {
	// Hole alle existierenden user_cards
	const oldCards = await pb.collection('user_cards').getFullList();

	for (const oldCard of oldCards) {
		const unifiedCard = {
			user_id: oldCard.user_id,
			render_mode: 'beginner', // Alle alten Cards sind modular
			modules: oldCard.custom_config?.modules || [],
			theme_id: oldCard.theme_id,
			variant: oldCard.custom_config?.variant || 'default',
			constraints: {
				aspectRatio: '16/9'
			},
			metadata: {
				name: oldCard.template_id || 'Migrated Card',
				created: oldCard.created,
				updated: oldCard.updated,
				migrated_from: oldCard.id
			},
			page: oldCard.page,
			position: oldCard.position,
			is_active: oldCard.is_active
		};

		try {
			await pb.collection('unified_cards').create(unifiedCard);
			console.log(`Migrated card ${oldCard.id}`);
		} catch (error) {
			console.error(`Failed to migrate card ${oldCard.id}:`, error);
		}
	}
}
```

## Verwendung im Code

### Card erstellen/laden

```svelte
<script>
	import { unifiedCardService } from '$lib/services/unifiedCardService';
	import UnifiedCard from '$lib/components/cards/UnifiedCard.svelte';

	// Neue Card erstellen
	const newCard = {
		renderMode: 'beginner',
		modularConfig: {
			modules: [{ type: 'header', props: { title: 'My Card' } }]
		}
	};

	const cardId = await unifiedCardService.saveCard(newCard);

	// Card laden
	const loadedCard = await unifiedCardService.loadCard(cardId);
</script>

<!-- Card anzeigen -->
<UnifiedCard card={loadedCard} />
```

### Builder verwenden

```svelte
<script>
	import UnifiedCardBuilder from '$lib/components/builder/UnifiedCardBuilder.svelte';

	async function handleSave(card) {
		const id = await unifiedCardService.saveCard(card);
		if (id) {
			console.log('Card saved:', id);
		}
	}
</script>

<UnifiedCardBuilder onSave={handleSave} onCancel={() => history.back()} />
```

## Backward Compatibility

Die alten `user_cards` und Module funktionieren weiterhin:

```svelte
<!-- Alt (funktioniert weiter) -->
<BaseCard {modules} />

<!-- Neu (unified) -->
<UnifiedCard card={unifiedCard} />
```

## Rollout Plan

### Phase 1: Parallel-Betrieb (Woche 1-2)

- Neue unified_cards Collection erstellen
- UnifiedCard Komponenten deployen
- Keine Breaking Changes

### Phase 2: Soft Migration (Woche 3-4)

- Neuer Builder als "Beta Feature"
- User können zwischen altem und neuem Builder wählen
- Automatische Migration bei erstem Speichern

### Phase 3: Full Migration (Woche 5-6)

- Alle Cards auf unified_cards migrieren
- Alter Builder deprecated
- user_cards Collection als Read-Only

### Phase 4: Cleanup (Woche 7-8)

- Alte Collections entfernen
- Code Cleanup
- Dokumentation finalisieren

## Testing Checklist

- [ ] Modular Cards (Beginner Mode) funktionieren
- [ ] Template Cards (Advanced Mode) funktionieren
- [ ] Custom HTML Cards (Expert Mode) funktionieren
- [ ] Migration von alten Cards
- [ ] Sicherheit: XSS Prevention
- [ ] Sicherheit: CSS Injection Prevention
- [ ] Performance: Große Cards
- [ ] Responsive Design
- [ ] Browser Kompatibilität
- [ ] Import/Export
- [ ] Converter zwischen Modi
