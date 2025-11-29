# Card System Architektur

## Überblick

Das Card System basiert auf einer modularen, komponentenbasierten Architektur, die maximale Flexibilität und Wiederverwendbarkeit bietet.

## Architektur-Diagramm

```
┌─────────────────────────────────────────┐
│           ThemeProvider                  │
│  (Globale Theme-Konfiguration)          │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│            BaseCard                      │
│  (Container-Komponente)                  │
│                                          │
│  Props:                                  │
│  - variant                               │
│  - theme                                 │
│  - modules[]                             │
│  - layout                                │
│  - animations                            │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼───┐   ┌───▼───┐   ┌───▼───┐
│Module1│   │Module2│   │Module3│
└───────┘   └───────┘   └───────┘
```

## Komponenten-Hierarchie

### 1. BaseCard (`/src/lib/components/cards/BaseCard.svelte`)

Die Hauptkomponente, die als Container für alle Module dient.

**Eigenschaften:**

- **variant**: Visuelle Variante der Karte
- **theme**: Theme-Konfiguration
- **modules**: Array von Modul-Konfigurationen
- **layout**: Layout-Einstellungen
- **animations**: Animations-Konfiguration
- **responsive**: Responsive-Verhalten

**Verantwortlichkeiten:**

- Modul-Rendering
- Theme-Anwendung
- Layout-Management
- Animations-Steuerung

### 2. Module System

Module sind die Bausteine einer Karte. Jedes Modul ist eine eigenständige Komponente mit spezifischer Funktionalität.

**Verfügbare Module:**

#### HeaderModule

```typescript
interface HeaderModuleProps {
	title?: string;
	subtitle?: string;
	avatar?: string;
	badge?: string;
	icon?: string;
	actions?: Array<{
		label: string;
		action: () => void;
		icon?: string;
	}>;
}
```

#### ContentModule

```typescript
interface ContentModuleProps {
	text?: string;
	html?: string;
	items?: Array<{
		label: string;
		value: string | number;
		icon?: string;
	}>;
	truncate?: boolean;
	maxLines?: number;
}
```

#### LinksModule

```typescript
interface LinksModuleProps {
	links: Array<{
		label: string;
		href: string;
		icon?: string;
		description?: string;
		disabled?: boolean;
	}>;
	style?: 'button' | 'list' | 'card';
	columns?: 1 | 2;
	showDescription?: boolean;
	showIcon?: boolean;
	target?: '_blank' | '_self';
	buttonVariant?: 'primary' | 'secondary' | 'ghost' | 'outline';
	gap?: 'sm' | 'md' | 'lg';
}
```

## Datenfluss

```
Datenbank (PocketBase)
         │
         ▼
  Service Layer
  (cardTemplates.ts)
         │
         ▼
    Store/State
         │
         ▼
  UI Components
  (BaseCard + Module)
         │
         ▼
     Rendering
```

## Service Layer

### CardTemplateService (`/src/lib/services/cardTemplates.ts`)

Der Service verwaltet die Kommunikation mit der Datenbank und die Transformation von Daten.

**Hauptmethoden:**

- `getPublicTemplates()` - Lädt öffentliche Templates
- `getTemplate(id)` - Lädt ein spezifisches Template
- `createTemplate(template)` - Erstellt neues Template
- `updateTemplate(id, updates)` - Aktualisiert Template
- `getUserCards(page)` - Lädt Benutzerkarten
- `saveUserCard(card)` - Speichert Benutzerkarte
- `templateToCardConfig(template)` - Konvertiert DB-Template zu CardConfig
- `dbThemeToThemeConfig(dbTheme)` - Konvertiert DB-Theme zu ThemeConfig

## Datenbank-Schema

### Collections in PocketBase

#### `themes`

Speichert Theme-Konfigurationen

- Farben, Typografie, Abstände
- Öffentlich/Privat
- Premium/Free

#### `card_templates`

Vordefinierte Kartenkonfigurationen

- Module-Array
- Layout-Einstellungen
- Kategorie und Tags

#### `user_cards`

Benutzerspezifische Karteninstanzen

- Verknüpfung zu Templates
- Custom-Konfiguration
- Position und Sichtbarkeit

## Konfigurationsstruktur

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

## Performance-Optimierungen

1. **Lazy Loading**: Module werden nur bei Bedarf geladen
2. **Memoization**: Berechnete Werte werden gecached
3. **Virtual Scrolling**: Bei langen Listen
4. **Bundle Splitting**: Separate Bundles für Module
5. **CSS-in-JS**: Nur benötigte Styles werden geladen

## Erweiterbarkeit

### Neue Module hinzufügen

1. Komponente in `/src/lib/components/cards/modules/` erstellen
2. Props-Interface in `types.ts` definieren
3. Module in `BaseCard.svelte` registrieren
4. Dokumentation aktualisieren

### Custom Themes erstellen

1. Theme-Objekt nach ThemeConfig-Interface erstellen
2. In Datenbank speichern oder lokal verwenden
3. Mit ThemeProvider anwenden

## Best Practices

1. **Modularität**: Halte Module klein und fokussiert
2. **Typsicherheit**: Verwende TypeScript-Interfaces
3. **Responsive**: Teste auf verschiedenen Bildschirmgrößen
4. **Performance**: Minimiere Re-Renders
5. **Barrierefreiheit**: ARIA-Labels und Keyboard-Navigation
