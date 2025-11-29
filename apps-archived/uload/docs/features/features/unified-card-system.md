# Unified Card System - Konzept & Implementierungsplan

## 🎯 Vision

Ein universelles, modulares Card-System, das über Datenbank konfigurierbar ist, Themes unterstützt und einfach in andere Projekte portiert werden kann.

---

## 📦 1. Card-Komponenten-Architektur

### Basis-Card-Komponente

```svelte
<!-- $lib/components/cards/BaseCard.svelte -->
<script lang="ts">
	interface CardConfig {
		id: string;
		variant: 'default' | 'compact' | 'hero' | 'minimal';
		theme?: ThemeConfig;
		modules: ModuleConfig[];
		layout: LayoutConfig;
		animations?: AnimationConfig;
		responsive?: ResponsiveConfig;
	}
</script>
```

### Module-System

Jede Card besteht aus konfigurierbaren Modulen:

```typescript
interface ModuleConfig {
	type: 'header' | 'content' | 'footer' | 'media' | 'stats' | 'actions' | 'custom';
	component: string; // Dynamisch geladene Komponente
	props: Record<string, any>;
	order: number;
	visibility: 'always' | 'desktop' | 'mobile' | 'conditional';
	grid?: { col: number; row: number; span: number };
}
```

### Beispiel-Module

- **HeaderModule**: Titel, Avatar, Badges
- **ContentModule**: Text, Listen, Tabellen
- **MediaModule**: Bilder, Videos, QR-Codes
- **StatsModule**: Zahlen, Charts, Progress
- **ActionsModule**: Buttons, Links, Dropdowns
- **CustomModule**: Benutzerdefinierte Inhalte

---

## 🗄️ 2. Datenbank-Schema (PocketBase)

### Collections

#### `themes`

```javascript
{
  id: string,
  name: string,
  slug: string,
  description: string,
  author: string,
  version: string,
  is_public: boolean,
  is_premium: boolean,
  price: number,
  colors: {
    primary: string,
    secondary: string,
    accent: string,
    background: string,
    surface: string,
    text: string,
    border: string,
    // Weitere Farben...
  },
  typography: {
    fontFamily: string,
    fontSize: object,
    fontWeight: object,
    lineHeight: object
  },
  spacing: {
    xs: string,
    sm: string,
    md: string,
    lg: string,
    xl: string
  },
  borderRadius: object,
  shadows: object,
  animations: object,
  created: datetime,
  updated: datetime
}
```

#### `card_templates`

```javascript
{
  id: string,
  name: string,
  slug: string,
  description: string,
  category: string, // 'profile', 'links', 'stats', 'media', etc.
  theme_id: string, // Relation zu themes
  is_public: boolean,
  modules: [
    {
      type: string,
      component: string,
      props: object,
      order: number,
      visibility: string,
      grid: object
    }
  ],
  layout: {
    columns: number,
    gap: string,
    padding: string,
    maxWidth: string
  },
  responsive: {
    breakpoints: object,
    mobileLayout: string
  },
  preview_image: string,
  downloads: number,
  rating: number,
  created: datetime,
  updated: datetime
}
```

#### `user_cards`

```javascript
{
  id: string,
  user_id: string, // Relation zu users
  template_id: string, // Relation zu card_templates
  page: string, // 'profile', 'dashboard', etc.
  position: number,
  custom_config: object, // Überschreibt Template-Config
  is_active: boolean,
  created: datetime,
  updated: datetime
}
```

#### `theme_store`

```javascript
{
  id: string,
  theme_id: string, // Relation zu themes
  featured: boolean,
  category: string[], // ['minimal', 'dark', 'colorful', 'professional']
  tags: string[],
  screenshots: string[],
  demo_url: string,
  installations: number,
  reviews: relation[], // zu theme_reviews
  created: datetime,
  updated: datetime
}
```

---

## 🎨 3. Theme-System

### Theme-Provider

```svelte
<!-- $lib/providers/ThemeProvider.svelte -->
<script lang="ts">
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	export let theme: ThemeConfig;

	const themeStore = writable(theme);
	setContext('theme', themeStore);

	// CSS-Variablen dynamisch setzen
	$: {
		if (typeof document !== 'undefined') {
			const root = document.documentElement;
			Object.entries(theme.colors).forEach(([key, value]) => {
				root.style.setProperty(`--theme-${key}`, value);
			});
		}
	}
</script>
```

### Theme-Editor

```svelte
<!-- $lib/components/ThemeEditor.svelte -->
- Live-Preview - Color-Picker - Typography-Editor - Spacing-Controls - Animation-Settings - Export/Import
- Save to Database
```

---

## 🛍️ 4. Theme Store

### Features

1. **Browse & Filter**
   - Kategorien (Minimal, Dark, Colorful, Professional)
   - Tags (E-Commerce, Portfolio, Blog, Corporate)
   - Sortierung (Beliebt, Neu, Bewertung, Preis)

2. **Preview & Demo**
   - Live-Preview mit eigenen Daten
   - Demo-Seiten
   - Screenshots/Videos
   - Code-Beispiele

3. **Monetarisierung**
   - Free Themes
   - Premium Themes (Einmalzahlung)
   - Subscription Model
   - Revenue Sharing für Theme-Autoren

4. **Community Features**
   - Bewertungen & Reviews
   - Kommentare
   - Fork & Customize
   - Share eigene Themes

---

## 🔧 5. Implementierung

### Phase 1: Basis-System (Woche 1-2)

```typescript
// 1. BaseCard Komponente
// 2. Module-Loader
// 3. Theme-Provider
// 4. Basis-Module (Header, Content, Actions)
```

### Phase 2: Datenbank-Integration (Woche 3-4)

```typescript
// 1. PocketBase Collections erstellen
// 2. API-Endpoints
// 3. CRUD-Operationen
// 4. Caching-Strategy
```

### Phase 3: Theme-Editor (Woche 5-6)

```typescript
// 1. Visual Editor
// 2. Code Editor
// 3. Preview-System
// 4. Export/Import
```

### Phase 4: Theme Store (Woche 7-8)

```typescript
// 1. Store-Frontend
// 2. Payment-Integration
// 3. Review-System
// 4. Author-Dashboard
```

---

## 🚀 6. Portabilität & Wiederverwendbarkeit

### NPM Package

```json
{
	"name": "@uload/card-system",
	"version": "1.0.0",
	"exports": {
		".": "./dist/index.js",
		"./themes": "./dist/themes/index.js",
		"./modules": "./dist/modules/index.js"
	}
}
```

### Standalone-Version

```javascript
// Eigenständige JS/CSS Bundles
// Web Components Version
// Framework-agnostisch (React, Vue, Angular Adapter)
```

### Integration in andere Projekte

```svelte
<script>
	import { CardSystem } from '@uload/card-system';
	import { PocketBaseProvider } from '@uload/card-system/providers';
</script>

<CardSystem config={myConfig} theme={myTheme} modules={myModules} />
```

---

## 🎯 7. Use Cases

### 1. Profile Pages

- User-Profile mit Stats, Links, Bio
- Company-Profile mit Services, Team
- Product-Profile mit Features, Pricing

### 2. Dashboards

- Analytics-Cards
- Activity-Feeds
- Quick-Actions
- Status-Widgets

### 3. Content-Management

- Blog-Posts
- Media-Galleries
- Document-Cards
- Event-Cards

### 4. E-Commerce

- Product-Cards
- Category-Cards
- Cart-Items
- Order-Summary

---

## 📊 8. Technische Spezifikationen

### Performance

- Lazy Loading von Modulen
- Virtual Scrolling für Listen
- Image Optimization
- CSS-in-JS oder Tailwind
- Bundle-Splitting

### Accessibility

- ARIA-Labels
- Keyboard-Navigation
- Screen-Reader Support
- High-Contrast Themes

### Security

- XSS-Protection
- CSP-Headers
- Input-Sanitization
- Rate-Limiting

---

## 🔄 9. Migration Strategy

### Von aktuellem System

1. Identifiziere alle Card-Varianten
2. Extrahiere gemeinsame Patterns
3. Erstelle Module für jeden Use-Case
4. Schrittweise Migration
5. Backward-Compatibility

### Beispiel-Migration

```svelte
<!-- Alt -->
<div class="profile-card">
	<h2>{user.name}</h2>
	<p>{user.bio}</p>
</div>

<!-- Neu -->
<BaseCard template="profile-basic">
	<HeaderModule {user} />
	<ContentModule text={user.bio} />
</BaseCard>
```

---

## 💡 10. Erweiterte Features

### KI-Integration

- Auto-Theme-Generation basierend auf Logo/Brand
- Content-Suggestions
- Layout-Optimierung
- A/B-Testing

### Analytics

- Card-Performance-Tracking
- User-Interaction-Heatmaps
- Conversion-Tracking
- Theme-Usage-Statistics

### Collaboration

- Team-Themes
- Shared-Templates
- Version-Control
- Comments & Annotations

---

## 📈 11. Business Model

### Freemium

- **Free**: 5 Themes, Basic-Module
- **Pro**: Unlimited Themes, All Module, Priority Support
- **Enterprise**: Custom Themes, White-Label, API-Access

### Marketplace

- 70/30 Revenue Split mit Theme-Autoren
- Featured Themes
- Sponsored Placements
- Bundle-Deals

---

## 🎯 12. Vorteile des Systems

1. **Flexibilität**: Jede Card individuell konfigurierbar
2. **Konsistenz**: Einheitliches Design-System
3. **Performance**: Optimierte, wiederverwendbare Komponenten
4. **Skalierbarkeit**: Einfach neue Module/Themes hinzufügen
5. **Portabilität**: In andere Projekte übertragbar
6. **Monetarisierung**: Theme-Store als Revenue-Stream
7. **Community**: User können eigene Themes teilen
8. **Wartbarkeit**: Zentrale Theme/Module-Verwaltung

---

## 🚦 13. Nächste Schritte

### Sofort (Diese Woche)

1. [ ] Proof of Concept BaseCard
2. [ ] 3-4 Basis-Module
3. [ ] Theme-Provider implementieren

### Kurzfristig (2-4 Wochen)

1. [ ] Datenbank-Schema erstellen
2. [ ] CRUD-API implementieren
3. [ ] Migration bestehender Cards

### Mittelfristig (1-2 Monate)

1. [ ] Theme-Editor
2. [ ] Theme-Store MVP
3. [ ] NPM-Package vorbereiten

### Langfristig (3-6 Monate)

1. [ ] Marketplace launchen
2. [ ] Enterprise-Features
3. [ ] KI-Integration

---

## 📝 Notizen

- Theme-System könnte auch für andere UI-Elemente verwendet werden
- Card-System als Basis für Page-Builder
- Integration mit bestehenden Design-Tools (Figma, Sketch)
- Mögliche Partnerschaft mit Theme-Autoren
- White-Label-Lösung für Agenturen

---

_Dieses Dokument wird kontinuierlich erweitert und aktualisiert._
