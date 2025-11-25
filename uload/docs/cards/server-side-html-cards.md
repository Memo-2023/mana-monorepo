# Server-Side HTML Cards - Konzept & Analyse

## Executive Summary

Die Idee, Cards als reinen HTML/CSS-Code serverseitig zu rendern, bietet maximale Flexibilität für Nutzer und könnte das bestehende modulare System ergänzen oder ersetzen. Dieser Ansatz würde es ermöglichen, dass Nutzer komplett eigene Designs erstellen können, während gleichzeitig die Aspect Ratio und Container-Constraints eingehalten werden.

## 🎯 Konzept-Übersicht

### Grundidee

```html
<!-- Nutzer definiert HTML/CSS -->
<div class="custom-card">
	<style>
		.custom-card {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			padding: 2rem;
			color: white;
		}
		.custom-card h2 {
			font-size: 2rem;
		}
	</style>
	<h2>{{username}}</h2>
	<p>{{bio}}</p>
</div>
```

### Server rendert zu:

```html
<div class="card-container" style="aspect-ratio: 16/9;">
	<iframe srcdoc="..." sandbox="allow-same-origin" style="width: 100%; height: 100%; border: none;">
		<!-- Nutzer HTML/CSS isoliert in iframe -->
	</iframe>
</div>
```

## 📊 Vergleich der Ansätze

| Aspekt                 | Modulares System (aktuell) | HTML/CSS System | Hybrid-Ansatz |
| ---------------------- | -------------------------- | --------------- | ------------- |
| **Flexibilität**       | Mittel                     | Sehr hoch       | Hoch          |
| **Sicherheit**         | Hoch                       | Niedrig-Mittel  | Mittel-Hoch   |
| **Performance**        | Sehr gut                   | Gut             | Gut           |
| **Nutzer-Komplexität** | Niedrig                    | Hoch            | Variabel      |
| **Wartbarkeit**        | Sehr gut                   | Schlecht        | Mittel        |
| **Datenbank**          | Komplex                    | Einfach         | Mittel        |

## ✅ Vorteile Server-Side HTML Cards

### 1. **Maximale Kreativität**

- Nutzer können JEDES Design umsetzen
- Keine Einschränkungen durch vordefinierte Module
- Custom Animationen und Effekte möglich
- Einzigartige Layouts

### 2. **Einfachere Datenbank**

```sql
-- Statt komplexer JSON-Strukturen
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  html_content TEXT,
  css_content TEXT,
  variables JSON,  -- Für Template-Variablen
  created_at TIMESTAMP
);
```

### 3. **Portabilität**

- HTML/CSS ist universell
- Kann in jede Plattform exportiert werden
- Keine Framework-Abhängigkeiten

### 4. **Learning Opportunity**

- Nutzer lernen HTML/CSS
- Community kann Code teilen
- Inspiration durch andere Designs

## ❌ Nachteile & Risiken

### 1. **Sicherheitsrisiken**

```javascript
// XSS-Gefahr
<script>alert('XSS')</script>

// CSS-Injection
<style>
  body { display: none !important; }
</style>

// Clickjacking
<a href="javascript:void(0)" onclick="stealData()">
```

### 2. **Performance-Probleme**

- Unkontrollierte CSS-Animationen
- Große Bilder/Assets
- Ineffiziente Selektoren
- Memory Leaks durch JavaScript

### 3. **Responsive Design**

- Nutzer müssen selbst Media Queries schreiben
- Inkonsistente Mobile-Ansichten
- Aspect Ratio schwer zu garantieren

### 4. **Wartbarkeit**

- Kein Type-Checking
- Schwer zu debuggen
- Updates kompliziert
- Keine einheitliche Code-Qualität

## 🔒 Sicherheitskonzept

### 1. **Sandboxing mit iframes**

```html
<iframe
	srcdoc="{{sanitized_html}}"
	sandbox="allow-same-origin"
	csp="default-src 'self'; script-src 'none';"
	loading="lazy"
/>
```

### 2. **HTML/CSS Sanitization**

```javascript
import DOMPurify from 'isomorphic-dompurify';
import { sanitizeCSS } from 'css-tree';

function sanitizeCardContent(html, css) {
	// HTML säubern
	const cleanHTML = DOMPurify.sanitize(html, {
		ALLOWED_TAGS: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'img', 'a'],
		ALLOWED_ATTR: ['class', 'id', 'href', 'src', 'alt', 'style'],
		FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
		FORBID_ATTR: ['onclick', 'onload', 'onerror']
	});

	// CSS säubern
	const cleanCSS = sanitizeCSS(css, {
		removeImports: true,
		removeJavaScript: true,
		limitSelectors: true,
		maxNesting: 3
	});

	return { html: cleanHTML, css: cleanCSS };
}
```

### 3. **Content Security Policy**

```javascript
// Server-Header
response.headers.set(
	'Content-Security-Policy',
	"default-src 'self'; " +
		"style-src 'self' 'unsafe-inline'; " +
		"script-src 'none'; " +
		"img-src 'self' data: https:;"
);
```

## 🎨 Hybrid-Ansatz (EMPFEHLUNG)

### Konzept: "Progressive Enhancement"

```typescript
interface CardDefinition {
	type: 'modular' | 'template' | 'custom-html';

	// Für modulare Cards (wie bisher)
	modules?: ModuleConfig[];

	// Für Template-basierte Cards
	template?: string;
	templateVars?: Record<string, any>;

	// Für Custom HTML
	customHTML?: string;
	customCSS?: string;

	// Gemeinsame Properties
	constraints?: {
		aspectRatio?: string;
		maxWidth?: string;
		minHeight?: string;
	};
}
```

### Drei Ebenen der Anpassung:

#### Level 1: Module Builder (Anfänger)

```javascript
{
  type: 'modular',
  modules: [
    { type: 'header', props: { title: 'Meine Karte' } }
  ]
}
```

#### Level 2: Template Editor (Fortgeschritten)

```handlebars
{ type: 'template', template: `
<div class='card-template'>
	<h2>{{title}}</h2>
	<p>{{description}}</p>
</div>
`, templateVars: { title: 'Titel', description: 'Text' } }
```

#### Level 3: Custom HTML/CSS (Experten)

```javascript
{
  type: 'custom-html',
  customHTML: '<div class="my-card">...</div>',
  customCSS: '.my-card { ... }'
}
```

## 💻 Implementierungsplan

### Phase 1: Basis-Infrastruktur (Woche 1-2)

#### 1.1 Sanitization Layer

```typescript
// src/lib/services/cardSanitizer.ts
export class CardSanitizer {
	sanitizeHTML(html: string): string;
	sanitizeCSS(css: string): string;
	validateConstraints(html: string, constraints: Constraints): boolean;
	extractVariables(html: string): string[];
}
```

#### 1.2 Rendering Engine

```svelte
<!-- src/lib/components/cards/CustomHTMLCard.svelte -->
<script lang="ts">
	import { sanitizeCard } from '$lib/services/cardSanitizer';

	export let html: string;
	export let css: string;
	export let variables: Record<string, any> = {};
	export let aspectRatio: string = '16/9';

	$: sanitized = sanitizeCard(html, css);
	$: rendered = replaceVariables(sanitized.html, variables);
</script>

<div class="custom-card-container" style="aspect-ratio: {aspectRatio}">
	<iframe
		srcdoc={`
      <!DOCTYPE html>
      <html>
        <head>
          <style>${sanitized.css}</style>
          <style>
            body { margin: 0; padding: 0; height: 100vh; display: flex; }
            .card-content { flex: 1; }
          </style>
        </head>
        <body>
          <div class="card-content">${rendered}</div>
        </body>
      </html>
    `}
		sandbox="allow-same-origin"
		loading="lazy"
		title="Custom Card"
	/>
</div>
```

### Phase 2: Editor & Preview (Woche 3-4)

#### 2.1 HTML/CSS Editor

```svelte
<!-- src/lib/components/builder/HTMLCardEditor.svelte -->
<script>
	import CodeMirror from 'codemirror';
	import 'codemirror/mode/htmlmixed/htmlmixed';
	import 'codemirror/mode/css/css';

	export let html = '';
	export let css = '';
	export let onUpdate;

	// Live Preview
	$: preview = generatePreview(html, css);
</script>

<div class="editor-container">
	<div class="editors">
		<div class="html-editor">
			<CodeMirror bind:value={html} mode="htmlmixed" />
		</div>
		<div class="css-editor">
			<CodeMirror bind:value={css} mode="css" />
		</div>
	</div>
	<div class="preview">
		<CustomHTMLCard {html} {css} />
	</div>
</div>
```

#### 2.2 Template Variables

```typescript
interface TemplateVariable {
	name: string;
	type: 'text' | 'number' | 'image' | 'link' | 'list';
	default?: any;
	required?: boolean;
}

// Variable extraction
function extractVariables(html: string): TemplateVariable[] {
	const regex = /\{\{(\w+)(?::(\w+))?\}\}/g;
	const variables: TemplateVariable[] = [];

	let match;
	while ((match = regex.exec(html)) !== null) {
		variables.push({
			name: match[1],
			type: match[2] || 'text',
			required: true
		});
	}

	return variables;
}
```

### Phase 3: Datenbank-Migration (Woche 5)

#### Neue Datenbank-Struktur

```sql
-- Erweiterte cards Tabelle
ALTER TABLE cards ADD COLUMN render_type TEXT DEFAULT 'modular';
ALTER TABLE cards ADD COLUMN html_content TEXT;
ALTER TABLE cards ADD COLUMN css_content TEXT;
ALTER TABLE cards ADD COLUMN template_variables JSON;
ALTER TABLE cards ADD COLUMN constraints JSON;

-- Versionierung für Custom Cards
CREATE TABLE card_versions (
  id TEXT PRIMARY KEY,
  card_id TEXT REFERENCES cards(id),
  version INTEGER,
  html_content TEXT,
  css_content TEXT,
  created_at TIMESTAMP,
  change_note TEXT
);
```

### Phase 4: Builder Integration (Woche 6)

```svelte
<!-- Erweiterter Card Builder -->
<script>
	let builderMode: 'visual' | 'template' | 'code' = 'visual';
</script>

<div class="builder-modes">
	<button class:active={builderMode === 'visual'} on:click={() => (builderMode = 'visual')}>
		Visual Builder (Module)
	</button>
	<button class:active={builderMode === 'template'} on:click={() => (builderMode = 'template')}>
		Template Editor
	</button>
	<button class:active={builderMode === 'code'} on:click={() => (builderMode = 'code')}>
		HTML/CSS Code
	</button>
</div>

{#if builderMode === 'visual'}
	<CardBuilder />
{:else if builderMode === 'template'}
	<TemplateEditor />
{:else}
	<HTMLCardEditor />
{/if}
```

## 🏗️ Technische Architektur

### Rendering Pipeline

```
User Input (HTML/CSS)
    ↓
Sanitization Layer
    ↓
Variable Replacement
    ↓
Constraint Validation
    ↓
iframe Sandboxing
    ↓
Final Render
```

### Aspect Ratio Enforcement

```css
/* Container styles */
.card-container {
	position: relative;
	width: 100%;
	aspect-ratio: var(--card-aspect-ratio, 16/9);
	overflow: hidden;
}

.card-container iframe {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border: none;
}

/* Inside iframe */
body {
	margin: 0;
	padding: 0;
	width: 100vw;
	height: 100vh;
	overflow: auto;
}
```

## 📈 Migration Strategy

### Schritt 1: Parallel-Betrieb

- Bestehendes System bleibt
- HTML-Cards als "Advanced Mode"
- Opt-in für Power-User

### Schritt 2: Feature Parity

- Card Builder unterstützt beide Modi
- Import/Export zwischen Formaten
- Template Converter

### Schritt 3: Unified System

```typescript
// Universeller Card Renderer
function renderCard(card: UnifiedCard): HTMLElement {
	switch (card.type) {
		case 'modular':
			return renderModularCard(card);
		case 'template':
			return renderTemplateCard(card);
		case 'custom-html':
			return renderCustomHTMLCard(card);
	}
}
```

## 🎯 Empfehlung

### Hybrid-Ansatz implementieren mit:

1. **Beibehaltung des modularen Systems** für 80% der Nutzer
2. **Template-System** für fortgeschrittene Anpassungen
3. **HTML/CSS-Editor** für Power-User und Entwickler
4. **Strikte Sandboxing** für Sicherheit
5. **Progressive Enhancement** - Nutzer können zwischen Modi wechseln

### Vorteile dieses Ansatzes:

- ✅ Backward Compatibility
- ✅ Verschiedene Skill-Level bedient
- ✅ Sicherheit gewährleistet
- ✅ Performance optimiert
- ✅ Wartbarkeit erhalten

### Timeline:

- **Woche 1-2**: Proof of Concept
- **Woche 3-4**: Editor & Tools
- **Woche 5**: Datenbank-Migration
- **Woche 6**: Integration
- **Woche 7-8**: Testing & Rollout

## 🚀 Nächste Schritte

1. **Proof of Concept** mit einfachem HTML-Renderer
2. **Sicherheitsaudit** der Sanitization
3. **Performance-Tests** mit komplexen Cards
4. **User Research** - Welcher Ansatz wird bevorzugt?
5. **Schrittweise Migration** beginnen

## 💡 Zusätzliche Überlegungen

### AI-Unterstützung

```typescript
// KI generiert HTML/CSS basierend auf Beschreibung
async function generateCardFromPrompt(prompt: string): Promise<CardHTML> {
	const response = await ai.generate({
		prompt: `Create a card with: ${prompt}`,
		constraints: ['responsive', 'aspect-ratio: 16/9', 'no-javascript']
	});
	return sanitizeCard(response);
}
```

### Marketplace Evolution

- Verkauf von HTML/CSS Templates
- Code-Snippets Library
- Community Challenges
- Template Converter Tools

### Monitoring & Analytics

```typescript
// Track welcher Modus am meisten genutzt wird
analytics.track('card_created', {
	type: 'modular' | 'template' | 'custom-html',
	complexity: calculateComplexity(card),
	render_time: measureRenderTime(card)
});
```
