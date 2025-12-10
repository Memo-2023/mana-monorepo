# Central Help System

Das zentrale Help-System bietet eine einheitliche Hilfeseite für alle Manacore-Apps. Es unterstützt mehrsprachige Inhalte, Volltextsuche, und die Kombination von zentralen und app-spezifischen Inhalten.

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                 Zentrale Help-Inhalte                       │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐     │
│  │ FAQ (allgemein)│ │ Features     │ │ Changelog     │     │
│  │ - Account     │ │ - Theming    │ │ - v1.5.0      │     │
│  │ - Billing     │ │ - Tags       │ │ - v1.4.0      │     │
│  │ - Privacy     │ │ - Sync       │ │   ...         │     │
│  └───────────────┘ └───────────────┘ └───────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                    mergeContent()
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼─────┐         ┌─────▼─────┐        ┌─────▼─────┐
   │   Todo   │         │ Calendar  │        │ Contacts  │
   │          │         │           │        │           │
   │ + App-   │         │ + App-    │        │ + App-    │
   │ spezif.  │         │ spezif.   │        │ spezif.   │
   │ FAQ      │         │ Shortcuts │        │ Features  │
   └──────────┘         └───────────┘        └───────────┘
```

## Packages

| Package | Beschreibung |
|---------|--------------|
| `@manacore/shared-help-types` | TypeScript-Typen und Zod-Schemas |
| `@manacore/shared-help-content` | Content-Loader, Parser, Merger, Suche |
| `@manacore/shared-help-ui` | Svelte 5 UI-Komponenten |
| `@manacore/shared-help-mobile` | React Native Komponenten |

## Content-Typen

### FAQ (Frequently Asked Questions)

```typescript
interface FAQItem {
  id: string;
  language: 'de' | 'en' | 'fr' | 'it' | 'es';
  question: string;
  answer: string;
  category: 'general' | 'account' | 'billing' | 'features' | 'technical' | 'privacy';
  featured?: boolean;
  tags?: string[];
  relatedFaqs?: string[];
  order?: number;
  appSpecific?: boolean;
  apps?: string[];
}
```

### Features

```typescript
interface FeatureItem {
  id: string;
  language: SupportedLanguage;
  title: string;
  description: string;
  content: string;
  icon?: string;
  category: 'getting-started' | 'core' | 'advanced' | 'integration';
  available?: boolean;
  comingSoon?: boolean;
  highlights?: string[];
  learnMoreUrl?: string;
}
```

### Keyboard Shortcuts

```typescript
interface ShortcutsItem {
  id: string;
  language: SupportedLanguage;
  category: 'navigation' | 'editing' | 'general' | 'app-specific';
  title?: string;
  shortcuts: Array<{
    shortcut: string;    // z.B. "Ctrl+S", "⌘+K"
    action: string;
    description?: string;
  }>;
}
```

### Getting Started Guides

```typescript
interface GettingStartedItem {
  id: string;
  language: SupportedLanguage;
  title: string;
  description: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: string;
  prerequisites?: string[];
  steps?: Array<{
    title: string;
    content: string;
    duration?: string;
  }>;
}
```

### Changelog

```typescript
interface ChangelogItem {
  id: string;
  language: SupportedLanguage;
  version: string;
  title: string;
  releaseDate: Date;
  type: 'major' | 'minor' | 'patch' | 'beta';
  summary?: string;
  content: string;
  highlighted?: boolean;
  changes?: {
    features?: Array<{ title: string; description?: string }>;
    improvements?: Array<{ title: string; description?: string }>;
    bugfixes?: Array<{ title: string; description?: string }>;
  };
  platforms?: string[];
}
```

### Contact Info

```typescript
interface ContactInfo {
  id: string;
  language: SupportedLanguage;
  title: string;
  content: string;
  supportEmail?: string;
  supportUrl?: string;
  discordUrl?: string;
  twitterUrl?: string;
  documentationUrl?: string;
  responseTime?: string;
}
```

## Unterstützte Sprachen

```typescript
type SupportedLanguage = 'en' | 'de' | 'fr' | 'it' | 'es';
```

## Content-Struktur

### HelpContent Objekt

```typescript
interface HelpContent {
  faq: FAQItem[];
  features: FeatureItem[];
  shortcuts: ShortcutsItem[];
  gettingStarted: GettingStartedItem[];
  changelog: ChangelogItem[];
  contact: ContactInfo | null;
}
```

## Content Laden und Mergen

### Content Merger

Der Merger kombiniert zentrale und app-spezifische Inhalte:

```typescript
import { mergeContent, createEmptyContent } from '@manacore/shared-help-content';

// Zentrale Inhalte (für alle Apps)
const centralContent: HelpContent = {
  faq: [
    { id: 'account-login', question: 'Wie melde ich mich an?', ... },
    { id: 'billing-cancel', question: 'Wie kündige ich?', ... },
  ],
  features: [...],
  // ...
};

// App-spezifische Inhalte
const appContent: Partial<HelpContent> = {
  faq: [
    { id: 'todo-recurring', question: 'Wie erstelle ich wiederkehrende Tasks?', ... },
  ],
  shortcuts: [
    { category: 'app-specific', shortcuts: [...] },
  ],
};

// Zusammenführen
const content = mergeContent(centralContent, appContent, {
  appId: 'todo',
  locale: 'de',
  overrideById: true,  // App-Content ersetzt zentralen mit gleicher ID
});
```

### Filterung

Inhalte werden automatisch gefiltert nach:
- **Sprache:** Nur Inhalte der aktuellen Locale
- **App:** `appSpecific: true` Inhalte nur wenn `apps` die aktuelle App enthält
- **Reihenfolge:** Sortiert nach `order` Property

## Suche

### Such-Index erstellen

```typescript
import { buildSearchIndex, search, createSearcher } from '@manacore/shared-help-content';

// Index erstellen
const index = buildSearchIndex(content, {
  titleWeight: 2.0,
  contentWeight: 1.0,
  tagsWeight: 1.5,
  threshold: 0.3,
  minMatchCharLength: 2,
});

// Suchen
const results = search(index, 'wiederkehrend', {
  limit: 10,
  threshold: 0.4,
  types: ['faq', 'guide'],  // Optional: Nur bestimmte Typen
});
```

### SearchResult

```typescript
interface SearchResult {
  id: string;
  type: 'faq' | 'feature' | 'guide' | 'changelog';
  title: string;
  excerpt: string;
  score: number;
  highlight?: string;
  item: FAQItem | FeatureItem | GettingStartedItem | ChangelogItem;
}
```

## UI-Komponenten

### HelpPage (Hauptkomponente)

Vollständige Hilfeseite mit allen Sektionen:

```svelte
<script>
  import { HelpPage } from '@manacore/shared-help-ui';
  import { helpContent, translations } from '$lib/help';
</script>

<HelpPage
  content={helpContent}
  appName="Todo"
  appId="todo"
  translations={translations}
  searchEnabled={true}
  showFAQ={true}
  showFeatures={true}
  showShortcuts={true}
  showGettingStarted={true}
  showChangelog={true}
  showContact={true}
  defaultSection="faq"
  showBackButton={true}
  onBack={() => goto('/')}
  onSectionChange={(section) => console.log(section)}
/>
```

### Einzelne Sektionen

```svelte
<script>
  import {
    FAQSection,
    FeaturesOverview,
    KeyboardShortcuts,
    GettingStartedGuide,
    ChangelogSection,
    ContactSection,
    HelpSearch,
  } from '@manacore/shared-help-ui';
</script>

<!-- FAQ mit Kategorien -->
<FAQSection
  items={content.faq}
  translations={translations}
  showCategories={true}
  maxItems={10}
  expandFirst={true}
/>

<!-- Features-Übersicht -->
<FeaturesOverview
  items={content.features}
  translations={translations}
/>

<!-- Keyboard Shortcuts -->
<KeyboardShortcuts
  items={content.shortcuts}
  translations={translations}
/>

<!-- Getting Started Guides -->
<GettingStartedGuide
  items={content.gettingStarted}
  translations={translations}
/>

<!-- Changelog -->
<ChangelogSection
  items={content.changelog}
  translations={translations}
  maxItems={5}
/>

<!-- Kontakt -->
<ContactSection
  contact={content.contact}
  translations={translations}
/>

<!-- Suche -->
<HelpSearch
  content={content}
  translations={translations}
  placeholder="Hilfe durchsuchen..."
  onResultSelect={(result) => navigateToResult(result)}
/>
```

## Übersetzungen

### HelpPageTranslations Interface

```typescript
interface HelpPageTranslations {
  title: string;
  subtitle?: string;
  searchPlaceholder: string;
  sections: {
    faq: string;
    features: string;
    shortcuts: string;
    gettingStarted: string;
    changelog: string;
    contact: string;
  };
  search: {
    noResults: string;
    resultsCount: string;
    searching: string;
  };
  faq: {
    noItems: string;
    categories: {
      general: string;
      account: string;
      billing: string;
      features: string;
      technical: string;
      privacy: string;
    };
  };
  features: {
    noItems: string;
    comingSoon: string;
    learnMore: string;
  };
  shortcuts: {
    noItems: string;
  };
  gettingStarted: {
    noItems: string;
    estimatedTime: string;
    difficulty: {
      beginner: string;
      intermediate: string;
      advanced: string;
    };
  };
  changelog: {
    noItems: string;
    types: {
      major: string;
      minor: string;
      patch: string;
      beta: string;
    };
  };
  contact: {
    noInfo: string;
    email: string;
    responseTime: string;
  };
  common: {
    back: string;
    showMore: string;
    showLess: string;
  };
}
```

### Beispiel (Deutsch)

```typescript
const translations: HelpPageTranslations = {
  title: 'Hilfe',
  subtitle: 'Finde Antworten und lerne die App kennen',
  searchPlaceholder: 'Suche in der Hilfe...',
  sections: {
    faq: 'Häufige Fragen',
    features: 'Funktionen',
    shortcuts: 'Tastaturkürzel',
    gettingStarted: 'Erste Schritte',
    changelog: 'Neuigkeiten',
    contact: 'Kontakt',
  },
  search: {
    noResults: 'Keine Ergebnisse gefunden',
    resultsCount: '{count} Ergebnisse',
    searching: 'Suche...',
  },
  faq: {
    noItems: 'Keine FAQ-Einträge vorhanden',
    categories: {
      general: 'Allgemein',
      account: 'Konto',
      billing: 'Abrechnung',
      features: 'Funktionen',
      technical: 'Technisch',
      privacy: 'Datenschutz',
    },
  },
  // ... weitere
};
```

## Dateien

### @manacore/shared-help-types

| Datei | Beschreibung |
|-------|--------------|
| `src/content.ts` | Content-Typ Definitionen |
| `src/schemas.ts` | Zod-Validierungsschemas |
| `src/search.ts` | Such-bezogene Typen |

### @manacore/shared-help-content

| Datei | Beschreibung |
|-------|--------------|
| `src/parser.ts` | Markdown-Parser |
| `src/loader.ts` | Content-Loader für verschiedene Formate |
| `src/merger.ts` | Content-Merger (zentral + app-spezifisch) |
| `src/search.ts` | Volltextsuche mit Fuse.js |

### @manacore/shared-help-ui

| Datei | Beschreibung |
|-------|--------------|
| `src/pages/HelpPage.svelte` | Vollständige Hilfeseite |
| `src/components/FAQSection.svelte` | FAQ-Bereich |
| `src/components/FAQItem.svelte` | Einzelner FAQ-Eintrag |
| `src/components/FeaturesOverview.svelte` | Feature-Übersicht |
| `src/components/FeatureCard.svelte` | Feature-Karte |
| `src/components/KeyboardShortcuts.svelte` | Tastaturkürzel |
| `src/components/GettingStartedGuide.svelte` | Erste-Schritte-Guide |
| `src/components/ChangelogSection.svelte` | Changelog-Bereich |
| `src/components/ChangelogEntry.svelte` | Einzelner Changelog-Eintrag |
| `src/components/ContactSection.svelte` | Kontakt-Bereich |
| `src/components/HelpSearch.svelte` | Suchkomponente |

## Integration in eine App

### 1. Dependencies

```json
{
  "dependencies": {
    "@manacore/shared-help-types": "workspace:*",
    "@manacore/shared-help-content": "workspace:*",
    "@manacore/shared-help-ui": "workspace:*"
  }
}
```

### 2. Content erstellen

```typescript
// src/lib/help/content.ts
import type { HelpContent } from '@manacore/shared-help-types';

export const appHelpContent: Partial<HelpContent> = {
  faq: [
    {
      id: 'calendar-recurring',
      language: 'de',
      question: 'Wie erstelle ich wiederkehrende Termine?',
      answer: 'Öffne einen Termin und aktiviere die Wiederholung...',
      category: 'features',
      appSpecific: true,
      apps: ['calendar'],
    },
  ],
  shortcuts: [
    {
      id: 'calendar-shortcuts',
      language: 'de',
      category: 'app-specific',
      title: 'Kalender-Shortcuts',
      shortcuts: [
        { shortcut: 'N', action: 'Neuer Termin' },
        { shortcut: 'T', action: 'Zu Heute springen' },
        { shortcut: 'W', action: 'Wochenansicht' },
      ],
    },
  ],
};
```

### 3. Hilfeseite erstellen

```svelte
<!-- src/routes/(app)/help/+page.svelte -->
<script lang="ts">
  import { HelpPage } from '@manacore/shared-help-ui';
  import { mergeContent } from '@manacore/shared-help-content';
  import { centralContent } from '$lib/help/central';
  import { appHelpContent } from '$lib/help/content';
  import { translations } from '$lib/help/translations';
  import { goto } from '$app/navigation';

  const content = mergeContent(centralContent, appHelpContent, {
    appId: 'calendar',
    locale: 'de',
  });
</script>

<HelpPage
  {content}
  appName="Calendar"
  appId="calendar"
  {translations}
  searchEnabled={true}
  onBack={() => goto('/')}
/>
```

## App-spezifische Inhalte

### Markierung

Inhalte können als app-spezifisch markiert werden:

```typescript
{
  id: 'todo-labels',
  appSpecific: true,
  apps: ['todo', 'calendar'],  // Nur in diesen Apps sichtbar
  // ...
}
```

### Override by ID

Wenn `overrideById: true` (Standard), ersetzt app-spezifischer Content zentralen Content mit gleicher ID:

```typescript
// Zentral
{ id: 'feature-tags', title: 'Tags allgemein', ... }

// App-spezifisch
{ id: 'feature-tags', title: 'Tags in Todo', ... }  // Ersetzt zentralen Content
```

## Vorteile

- **Wiederverwendbarkeit:** Zentrale FAQs (Account, Billing) nur einmal schreiben
- **Konsistenz:** Einheitliches Look & Feel der Hilfeseite
- **Mehrsprachigkeit:** 5 Sprachen unterstützt
- **Suche:** Integrierte Volltextsuche
- **Flexibilität:** App-spezifische Inhalte können hinzugefügt werden
- **Typ-Sicherheit:** Vollständige TypeScript-Typen und Zod-Validierung
