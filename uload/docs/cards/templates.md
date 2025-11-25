# Card Templates

## Übersicht

Templates sind vordefinierte Kartenkonfigurationen, die als Ausgangspunkt für eigene Karten dienen. Sie kombinieren Module, Layouts und Themes zu wiederverwendbaren Vorlagen.

## Template-Struktur

### CardTemplateConfig Interface

```typescript
interface CardTemplateConfig extends CardConfig {
	name: string; // Template-Name
	slug: string; // URL-freundlicher Name
	description?: string; // Beschreibung
	category?: string; // Kategorie
	isPublic?: boolean; // Öffentlich verfügbar
	previewImage?: string; // Vorschaubild-URL
}
```

## Vordefinierte Templates

### Profile Card Template

```javascript
const profileTemplate = {
	name: 'Standard Profile',
	slug: 'standard-profile',
	description: 'Vollständige Profilkarte mit Avatar, Bio und Social Links',
	category: 'profile',
	variant: 'default',
	modules: [
		{
			type: 'header',
			order: 0,
			props: {
				title: '{{username}}',
				subtitle: '{{bio}}',
				avatar: '{{avatar}}'
			}
		},
		{
			type: 'stats',
			order: 1,
			props: {
				stats: [
					{ label: 'Links', value: '{{totalLinks}}', icon: '🔗' },
					{ label: 'Clicks', value: '{{totalClicks}}', icon: '👆' }
				]
			}
		},
		{
			type: 'links',
			order: 2,
			props: {
				links: '{{socialLinks}}',
				style: 'button',
				showIcon: true
			}
		}
	],
	layout: {
		padding: '1.5rem'
	}
};
```

### Dashboard Stats Template

```javascript
const dashboardTemplate = {
	name: 'Dashboard Stats',
	slug: 'dashboard-stats',
	description: 'Übersichtskarte mit wichtigen Metriken',
	category: 'dashboard',
	variant: 'compact',
	modules: [
		{
			type: 'header',
			props: {
				title: 'Übersicht',
				icon: '📊'
			}
		},
		{
			type: 'stats',
			props: {
				stats: [
					{ label: 'Besucher', value: '{{visitors}}', change: '{{visitorChange}}' },
					{ label: 'Umsatz', value: '{{revenue}}', change: '{{revenueChange}}' },
					{ label: 'Conversion', value: '{{conversion}}', change: '{{conversionChange}}' }
				],
				layout: 'grid'
			}
		}
	]
};
```

### Link Collection Template

```javascript
const linkCollectionTemplate = {
	name: 'Link Collection',
	slug: 'link-collection',
	description: 'Sammlung von Links mit Beschreibungen',
	category: 'links',
	variant: 'default',
	modules: [
		{
			type: 'header',
			props: {
				title: '{{collectionName}}',
				subtitle: '{{collectionDescription}}'
			}
		},
		{
			type: 'links',
			props: {
				links: '{{links}}',
				style: 'card',
				columns: 2,
				showDescription: true,
				showIcon: true
			}
		}
	]
};
```

### Media Gallery Template

```javascript
const mediaGalleryTemplate = {
	name: 'Media Gallery',
	slug: 'media-gallery',
	description: 'Bildergalerie mit Titel und Beschreibung',
	category: 'media',
	variant: 'minimal',
	modules: [
		{
			type: 'header',
			props: {
				title: '{{galleryTitle}}'
			}
		},
		{
			type: 'media',
			props: {
				type: 'image',
				src: '{{featuredImage}}',
				aspectRatio: '16/9'
			}
		},
		{
			type: 'content',
			props: {
				text: '{{description}}'
			}
		}
	]
};
```

## Template Store

Der Template Store ist ein Marktplatz für Card Templates.

### Features

- **Browse & Filter**: Nach Kategorie, Tags, Beliebtheit
- **Preview**: Live-Vorschau mit eigenen Daten
- **Download**: Templates herunterladen und anpassen
- **Rating**: Bewertung durch Community
- **Sharing**: Eigene Templates teilen

### Template Store verwenden

```svelte
<script>
	import { cardTemplateService } from '$lib/services/cardTemplates';

	// Öffentliche Templates laden
	const templates = await cardTemplateService.getPublicTemplates();

	// Nach Kategorie filtern
	const profileTemplates = await cardTemplateService.getPublicTemplates('profile');

	// Template verwenden
	async function useTemplate(template) {
		await cardTemplateService.incrementDownloads(template.id);
		// Template in Card Builder öffnen
		goto(`/card-builder?template=${template.id}`);
	}
</script>
```

## Templates verwalten

### Template erstellen

```javascript
const newTemplate = await cardTemplateService.createTemplate({
	name: 'Mein Template',
	slug: 'mein-template',
	description: 'Beschreibung',
	category: 'custom',
	is_public: false,
	modules: [
		/* ... */
	],
	layout: {
		/* ... */
	}
});
```

### Template aktualisieren

```javascript
await cardTemplateService.updateTemplate(templateId, {
	name: 'Neuer Name',
	modules: updatedModules
});
```

### Template löschen

```javascript
await cardTemplateService.deleteTemplate(templateId);
```

## Template-Variablen

Templates können Platzhalter verwenden, die bei der Verwendung ersetzt werden:

```javascript
{
  type: 'header',
  props: {
    title: '{{username}}',      // Wird durch tatsächlichen Username ersetzt
    subtitle: '{{bio}}'          // Wird durch Bio ersetzt
  }
}
```

### Verfügbare Variablen

- `{{username}}` - Benutzername
- `{{email}}` - E-Mail-Adresse
- `{{bio}}` - Biografie
- `{{avatar}}` - Avatar-URL
- `{{totalLinks}}` - Anzahl Links
- `{{totalClicks}}` - Anzahl Klicks
- `{{socialLinks}}` - Array von Social Links
- Custom-Variablen je nach Kontext

## Template zu Card konvertieren

```javascript
// Template laden
const template = await cardTemplateService.getTemplate(templateId);

// Zu CardConfig konvertieren
const cardConfig = cardTemplateService.templateToCardConfig(template);

// Mit eigenen Daten füllen
const filledConfig = fillTemplateVariables(cardConfig, {
	username: 'John Doe',
	bio: 'Software Developer'
	// ...
});

// Card rendern
<BaseCard {...filledConfig} />;
```

## Template-Kategorien

### Profile

- Benutzerprofile
- Team-Mitglieder
- Autoren-Karten

### Dashboard

- Statistik-Übersichten
- KPI-Karten
- Activity-Feeds

### Links

- Link-Sammlungen
- Social Media Links
- Ressourcen-Listen

### Media

- Bildergalerien
- Video-Player
- QR-Code-Karten

### Content

- Blog-Post-Karten
- Produkt-Karten
- Service-Karten

### Custom

- Benutzerdefinierte Templates
- Spezial-Layouts

## Template-Service

### Methoden

```typescript
class CardTemplateService {
	// Templates abrufen
	async getPublicTemplates(category?: string): Promise<DBCardTemplate[]>;
	async getTemplate(id: string): Promise<DBCardTemplate | null>;

	// Templates verwalten
	async createTemplate(template: Partial<DBCardTemplate>): Promise<DBCardTemplate | null>;
	async updateTemplate(
		id: string,
		updates: Partial<DBCardTemplate>
	): Promise<DBCardTemplate | null>;
	async deleteTemplate(id: string): Promise<boolean>;

	// Konvertierung
	templateToCardConfig(template: DBCardTemplate): CardConfig;

	// Statistiken
	async incrementDownloads(templateId: string): Promise<void>;
	async rateTemplate(templateId: string, rating: number): Promise<void>;
}
```

## Eigene Templates erstellen

### 1. Template definieren

```javascript
const myTemplate = {
	name: 'Mein Custom Template',
	slug: 'mein-custom-template',
	description: 'Ein spezielles Template für meinen Use Case',
	category: 'custom',
	modules: [
		// Module hier definieren
	],
	layout: {
		columns: 2,
		gap: '1rem',
		padding: '1.5rem'
	},
	theme: {
		// Optional: Custom Theme
	}
};
```

### 2. Template speichern

```javascript
// In Datenbank
const saved = await cardTemplateService.createTemplate(myTemplate);

// Oder lokal verwenden
localStorage.setItem('myTemplate', JSON.stringify(myTemplate));
```

### 3. Template teilen

```javascript
// Öffentlich machen
await cardTemplateService.updateTemplate(templateId, {
	is_public: true
});

// Export als JSON
const json = JSON.stringify(template, null, 2);
downloadAsFile('template.json', json);
```

## Template-Migration

### Von statischen Komponenten

```svelte
<!-- Alt: Statische Komponente -->
<div class="profile-card">
	<h2>{user.name}</h2>
	<p>{user.bio}</p>
</div>

<!-- Neu: Template-basiert -->
<BaseCard template="profile-basic" data={user} />
```

## Best Practices

1. **Modularität**: Erstelle kleine, wiederverwendbare Templates
2. **Flexibilität**: Verwende Variablen für dynamische Inhalte
3. **Kategorisierung**: Ordne Templates sinnvollen Kategorien zu
4. **Dokumentation**: Beschreibe Templates ausführlich
5. **Vorschau**: Stelle Vorschaubilder bereit
6. **Versionierung**: Versioniere Templates bei Änderungen
7. **Testing**: Teste Templates mit verschiedenen Datensätzen

## Template-Beispiele

### Minimal Profile

```javascript
{
  name: 'Minimal Profile',
  modules: [{
    type: 'header',
    props: { title: '{{name}}' }
  }]
}
```

### Social Media Hub

```javascript
{
  name: 'Social Media Hub',
  modules: [{
    type: 'links',
    props: {
      links: '{{socialLinks}}',
      style: 'button',
      columns: 2
    }
  }]
}
```

### Stats Dashboard

```javascript
{
  name: 'Stats Dashboard',
  modules: [{
    type: 'stats',
    props: {
      stats: '{{metrics}}',
      layout: 'grid'
    }
  }]
}
```
