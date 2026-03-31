# Internal Collections Documentation

## Übersicht

Dieses Projekt unterstützt **private/interne Content Collections**, die nicht öffentlich zugänglich sind. Diese Collections werden für interne Zwecke wie Marketing-Strategien, Produktentwicklung und Team-Dokumentation verwendet.

## Konventionen

### Naming Convention
- **Prefix `_` (Underscore)**: Alle internen Collections beginnen mit einem Underscore
- Beispiele: `_personas`, `_internal-docs`, `_drafts`

### Verzeichnisstruktur
```
src/content/
├── _personas/          # Intern: Marketing Personas
│   ├── de/
│   └── en/
├── blog/              # Öffentlich: Blog-Artikel
├── features/          # Öffentlich: Features
└── ...
```

## Implementierte Interne Collections

### 1. Personas (`_personas`)

**Zweck**: Detaillierte Zielgruppen-Profile für Marketing und Produktentwicklung

**Schema-Highlights**:
- Demographics (Alter, Ort, Bildung, Einkommen)
- Professional Profile (Job, Branche, Verantwortlichkeiten)
- Psychographics (Persönlichkeit, Werte, Motivationen, Frustrationen)
- Behavior (Tech-Affinität, Arbeitsweise, Tools)
- Memoro-Context (Use Cases, Benefits, Concerns, Features)
- Marketing-Relevanz (Segment, Channels, Messaging)

**Zugriff**: `/admin/personas` (nur im Dev-Modus)

## Technische Implementierung

### 1. Collection Definition

In `src/content/config.ts`:

```typescript
// Private Collection mit _ Prefix
const _personasCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // Schema definition
    visibility: z.enum(['internal', 'team', 'stakeholders']).default('internal'),
    status: z.enum(['draft', 'active', 'archived']).default('draft'),
    // ... weitere Felder
  })
});

export const collections = {
  // Öffentliche Collections
  'blog': blogCollection,
  'features': featuresCollection,
  
  // Private Collections (mit _ Prefix)
  '_personas': _personasCollection,
};
```

### 2. Zugriffskontrolle

Admin-Seiten implementieren Zugriffskontrolle:

```astro
---
// Nur im Development-Modus oder mit speziellem Query-Parameter
const isDev = import.meta.env.DEV;
const hasAccess = isDev || Astro.url.searchParams.has('access');

if (!hasAccess) {
  return Astro.redirect('/404');
}
---
```

### 3. Keine öffentlichen Routes

**Wichtig**: Für interne Collections werden KEINE öffentlichen Routes erstellt:

```astro
// ❌ NICHT erstellen:
src/pages/[lang]/personas/[...slug].astro

// ✅ NUR Admin-Routes:
src/pages/admin/personas.astro
```

## Best Practices

### 1. Sicherheit

- **Niemals** öffentliche Routes für interne Collections erstellen
- Admin-Seiten immer mit Zugriffskontrolle schützen
- Sensitive Daten nicht in Git committen (nutze `.gitignore` für sehr vertrauliche Inhalte)

### 2. Organisation

```markdown
---
# Metadaten für interne Dokumente
status: "draft" | "active" | "archived"
visibility: "internal" | "team" | "stakeholders"
owner: "Marketing Team"
contributors: ["Product", "Sales"]
validatedAt: 2024-01-10T10:00:00Z
---
```

### 3. Verwendung in Code

```typescript
// Interne Collections laden
import { getCollection } from 'astro:content';

// Mit Error Handling
let personas = [];
try {
  personas = await getCollection('_personas');
  // Filtern nach Status
  const activePersonas = personas.filter(p => p.data.status === 'active');
} catch (error) {
  console.log('Internal collection not available');
}
```

## Neue interne Collection hinzufügen

### Schritt 1: Schema definieren

In `src/content/config.ts`:

```typescript
const _myInternalCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    visibility: z.enum(['internal', 'team', 'public']).default('internal'),
    // ... weitere Felder
  })
});
```

### Schritt 2: Zur Collections-Export hinzufügen

```typescript
export const collections = {
  // ... andere collections
  '_myInternal': _myInternalCollection,
};
```

### Schritt 3: Content-Verzeichnis erstellen

```bash
mkdir -p src/content/_myInternal/de
mkdir -p src/content/_myInternal/en
```

### Schritt 4: Admin-Interface erstellen (optional)

```astro
// src/pages/admin/my-internal.astro
---
// Zugriffskontrolle
const isDev = import.meta.env.DEV;
if (!isDev) return Astro.redirect('/404');

const items = await getCollection('_myInternal');
---
<!-- Admin UI -->
```

## Wartung und Governance

### Verantwortlichkeiten

| Collection | Owner | Review-Zyklus | Letzte Validierung |
|-----------|--------|---------------|-------------------|
| `_personas` | Marketing Team | Quartalsweise | Januar 2024 |
| `_internal-docs` | Product Team | Monatlich | - |

### Archivierung

Veraltete Inhalte sollten nicht gelöscht, sondern archiviert werden:

```yaml
status: "archived"
archivedAt: 2024-01-15T10:00:00Z
archiveReason: "Outdated after product pivot"
```

## FAQ

**Q: Können interne Collections in Produktion verwendet werden?**
A: Ja, aber nur über geschützte Admin-Interfaces oder interne Tools, niemals über öffentliche URLs.

**Q: Wie verhindere ich versehentliches Veröffentlichen?**
A: 
1. Nutze das `_` Prefix konsequent
2. Erstelle keine öffentlichen Routes
3. Implementiere Zugriffskontrolle in Admin-Seiten
4. Nutze `visibility` und `status` Felder

**Q: Können interne Collections in der Sitemap erscheinen?**
A: Nein, da keine öffentlichen Routes erstellt werden, erscheinen sie automatisch nicht in der Sitemap.

**Q: Wie sichere ich sehr sensitive Daten?**
A: 
1. Nutze `.gitignore` für hochsensitive Inhalte
2. Verwende Umgebungsvariablen für Secrets
3. Implementiere robuste Authentifizierung für Admin-Bereiche

## Beispiel: Personas Collection

Die `_personas` Collection demonstriert Best Practices:

```markdown
---
name: "Sabine Schmidt"
title: "Die gestresste Projektmanagerin"

# Strukturierte Daten
demographics:
  age: 38
  location: "München"

# Status-Management  
status: "active"
visibility: "internal"

# Tracking
createdAt: 2024-01-15T10:00:00Z
lastUpdated: 2024-01-15T10:00:00Z
validatedAt: 2024-01-10T10:00:00Z

# Verantwortlichkeiten
owner: "Marketing Team"
contributors: ["Product", "Sales"]
---
```

## Kontakt

Bei Fragen zu internen Collections:
- Marketing-Personas: marketing@memoro.ai
- Technische Umsetzung: dev@memoro.ai