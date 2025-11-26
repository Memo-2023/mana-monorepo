# Card System API Reference

## CardTemplateService

Der zentrale Service für die Verwaltung von Cards, Templates und Themes.

### Import

```javascript
import { cardTemplateService } from '$lib/services/cardTemplates';
```

## Methoden

### Theme-Verwaltung

#### `getPublicThemes()`

Lädt alle öffentlichen Themes.

**Returns:** `Promise<DBTheme[]>`

**Beispiel:**

```javascript
const themes = await cardTemplateService.getPublicThemes();
```

#### `getTheme(id)`

Lädt ein spezifisches Theme.

**Parameters:**

- `id: string` - Theme-ID

**Returns:** `Promise<DBTheme | null>`

**Beispiel:**

```javascript
const theme = await cardTemplateService.getTheme('theme_123');
```

#### `createTheme(theme)`

Erstellt ein neues Theme.

**Parameters:**

- `theme: Partial<DBTheme>` - Theme-Daten

**Returns:** `Promise<DBTheme | null>`

**Beispiel:**

```javascript
const newTheme = await cardTemplateService.createTheme({
	name: 'My Theme',
	colors: {
		primary: '#ff0000'
	}
});
```

#### `updateTheme(id, updates)`

Aktualisiert ein existierendes Theme.

**Parameters:**

- `id: string` - Theme-ID
- `updates: Partial<DBTheme>` - Zu aktualisierende Felder

**Returns:** `Promise<DBTheme | null>`

**Beispiel:**

```javascript
await cardTemplateService.updateTheme('theme_123', {
	colors: { primary: '#00ff00' }
});
```

### Template-Verwaltung

#### `getPublicTemplates(category?)`

Lädt öffentliche Templates, optional gefiltert nach Kategorie.

**Parameters:**

- `category?: string` - Optional: Kategorie-Filter

**Returns:** `Promise<DBCardTemplate[]>`

**Beispiel:**

```javascript
// Alle Templates
const allTemplates = await cardTemplateService.getPublicTemplates();

// Nur Profile-Templates
const profileTemplates = await cardTemplateService.getPublicTemplates('profile');
```

#### `getTemplate(id)`

Lädt ein spezifisches Template.

**Parameters:**

- `id: string` - Template-ID

**Returns:** `Promise<DBCardTemplate | null>`

**Beispiel:**

```javascript
const template = await cardTemplateService.getTemplate('template_123');
```

#### `createTemplate(template)`

Erstellt ein neues Template.

**Parameters:**

- `template: Partial<DBCardTemplate>` - Template-Daten

**Returns:** `Promise<DBCardTemplate | null>`

**Beispiel:**

```javascript
const newTemplate = await cardTemplateService.createTemplate({
	name: 'My Template',
	slug: 'my-template',
	modules: [
		/* ... */
	]
});
```

#### `updateTemplate(id, updates)`

Aktualisiert ein Template.

**Parameters:**

- `id: string` - Template-ID
- `updates: Partial<DBCardTemplate>` - Updates

**Returns:** `Promise<DBCardTemplate | null>`

**Beispiel:**

```javascript
await cardTemplateService.updateTemplate('template_123', {
	name: 'Updated Name'
});
```

### User Cards

#### `getUserCards(page)`

Lädt die Karten eines Benutzers für eine bestimmte Seite.

**Parameters:**

- `page: string` - Seitenname (z.B. 'profile', 'dashboard')

**Returns:** `Promise<DBUserCard[]>`

**Beispiel:**

```javascript
const profileCards = await cardTemplateService.getUserCards('profile');
```

#### `saveUserCard(card)`

Speichert oder aktualisiert eine Benutzerkarte.

**Parameters:**

- `card: Partial<DBUserCard>` - Kartendaten

**Returns:** `Promise<DBUserCard | null>`

**Beispiel:**

```javascript
const savedCard = await cardTemplateService.saveUserCard({
	template_id: 'template_123',
	page: 'profile',
	position: 0,
	is_active: true
});
```

#### `deleteUserCard(id)`

Löscht eine Benutzerkarte.

**Parameters:**

- `id: string` - Karten-ID

**Returns:** `Promise<boolean>`

**Beispiel:**

```javascript
const success = await cardTemplateService.deleteUserCard('card_123');
```

### Konvertierungsmethoden

#### `templateToCardConfig(template)`

Konvertiert ein Datenbank-Template zu einer CardConfig.

**Parameters:**

- `template: DBCardTemplate` - Template aus Datenbank

**Returns:** `CardConfig`

**Beispiel:**

```javascript
const config = cardTemplateService.templateToCardConfig(dbTemplate);
```

#### `dbThemeToThemeConfig(dbTheme)`

Konvertiert ein Datenbank-Theme zu einer ThemeConfig.

**Parameters:**

- `dbTheme: DBTheme` - Theme aus Datenbank

**Returns:** `ThemeConfig`

**Beispiel:**

```javascript
const themeConfig = cardTemplateService.dbThemeToThemeConfig(dbTheme);
```

#### `userCardToCardConfig(userCard)`

Konvertiert eine Benutzerkarte zu einer CardConfig.

**Parameters:**

- `userCard: DBUserCard` - Benutzerkarte

**Returns:** `CardConfig`

**Beispiel:**

```javascript
const config = cardTemplateService.userCardToCardConfig(userCard);
```

### Spezielle Methoden

#### `createStandardProfileCardTemplate(userData)`

Erstellt eine Standard-Profilkarten-Konfiguration.

**Parameters:**

```typescript
userData: {
  username?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  websiteUrl?: string;
  socialLinks?: any[];
  totalLinks?: number;
  totalClicks?: number;
  memberSince?: string;
  showEmail?: boolean;
  showStats?: boolean;
}
```

**Returns:** `CardConfig`

**Beispiel:**

```javascript
const profileConfig = cardTemplateService.createStandardProfileCardTemplate({
	username: 'johndoe',
	bio: 'Software Developer',
	totalLinks: 42
});
```

#### `createOrUpdateStandardProfileCard(userData)`

Erstellt oder aktualisiert die Standard-Profilkarte eines Benutzers.

**Parameters:**

- `userData: any` - Benutzerdaten

**Returns:** `Promise<DBUserCard | null>`

**Beispiel:**

```javascript
const card = await cardTemplateService.createOrUpdateStandardProfileCard({
	username: 'johndoe',
	bio: 'Updated bio'
});
```

#### `incrementDownloads(templateId)`

Erhöht den Download-Zähler eines Templates.

**Parameters:**

- `templateId: string` - Template-ID

**Returns:** `Promise<void>`

**Beispiel:**

```javascript
await cardTemplateService.incrementDownloads('template_123');
```

#### `rateTemplate(templateId, rating)`

Bewertet ein Template.

**Parameters:**

- `templateId: string` - Template-ID
- `rating: number` - Bewertung (1-5)

**Returns:** `Promise<void>`

**Beispiel:**

```javascript
await cardTemplateService.rateTemplate('template_123', 5);
```

## Datentypen

### DBTheme

```typescript
interface DBTheme {
	id: string;
	name: string;
	slug: string;
	description?: string;
	author?: string;
	version?: string;
	is_public?: boolean;
	is_premium?: boolean;
	price?: number;
	colors?: any;
	typography?: any;
	spacing?: any;
	borderRadius?: any;
	shadows?: any;
	animations?: any;
	created: string;
	updated: string;
}
```

### DBCardTemplate

```typescript
interface DBCardTemplate {
	id: string;
	name: string;
	slug: string;
	description?: string;
	category?: string;
	theme_id?: string;
	is_public?: boolean;
	modules?: any;
	layout?: any;
	responsive?: any;
	preview_image?: string;
	downloads?: number;
	rating?: number;
	author_id?: string;
	created: string;
	updated: string;
	expand?: {
		theme_id?: DBTheme;
		author_id?: any;
	};
}
```

### DBUserCard

```typescript
interface DBUserCard {
	id: string;
	user_id: string;
	template_id?: string;
	page?: string;
	position?: number;
	custom_config?: any;
	is_active?: boolean;
	created: string;
	updated: string;
	expand?: {
		template_id?: DBCardTemplate;
	};
}
```

### CardConfig

```typescript
interface CardConfig {
	id?: string;
	variant?: 'default' | 'compact' | 'hero' | 'minimal' | 'glass' | 'gradient';
	theme?: ThemeConfig;
	modules?: ModuleConfig[];
	layout?: LayoutConfig;
	animations?: AnimationConfig;
	responsive?: ResponsiveConfig;
	className?: string;
	style?: string;
}
```

### ModuleConfig

```typescript
interface ModuleConfig {
	type: 'header' | 'content' | 'footer' | 'media' | 'stats' | 'actions' | 'links' | 'custom';
	component?: string;
	props?: Record<string, any>;
	order?: number;
	visibility?: 'always' | 'desktop' | 'mobile' | 'conditional';
	grid?: {
		col?: number;
		row?: number;
		colSpan?: number;
		rowSpan?: number;
	};
	className?: string;
}
```

### ThemeConfig

```typescript
interface ThemeConfig {
	id?: string;
	name?: string;
	colors?: {
		primary?: string;
		secondary?: string;
		accent?: string;
		background?: string;
		surface?: string;
		text?: string;
		textMuted?: string;
		border?: string;
		hover?: string;
		[key: string]: string | undefined;
	};
	typography?: {
		fontFamily?: string;
		fontSize?: Record<string, string>;
		fontWeight?: Record<string, number>;
		lineHeight?: Record<string, string>;
	};
	spacing?: Record<string, string>;
	borderRadius?: Record<string, string>;
	shadows?: Record<string, string>;
}
```

## Error Handling

Alle Service-Methoden geben `null` zurück oder werfen Fehler, die abgefangen werden sollten:

```javascript
try {
	const template = await cardTemplateService.getTemplate('invalid_id');
	if (!template) {
		console.log('Template nicht gefunden');
	}
} catch (error) {
	console.error('Fehler beim Laden des Templates:', error);
}
```

## Authentifizierung

Einige Methoden erfordern eine aktive Authentifizierung über PocketBase:

```javascript
import { pb } from '$lib/pocketbase';

// Prüfen ob Benutzer eingeloggt ist
if (pb.authStore.model) {
	// Authentifizierte Aktionen
	const userCards = await cardTemplateService.getUserCards('profile');
} else {
	// Redirect zu Login
	goto('/login');
}
```

## Performance-Tipps

1. **Caching**: Templates und Themes können gecached werden
2. **Lazy Loading**: Lade nur benötigte Daten
3. **Batch Operations**: Nutze Promise.all für parallele Anfragen
4. **Pagination**: Nutze Pagination für große Listen

```javascript
// Parallel laden
const [themes, templates] = await Promise.all([
	cardTemplateService.getPublicThemes(),
	cardTemplateService.getPublicTemplates()
]);
```
