# @manacore/shared-help-ui

Shared Svelte 5 help page components for Manacore web apps.

## Quick Start

### 1. Add dependencies to your web app

```json
{
  "dependencies": {
    "@manacore/shared-help-ui": "workspace:*",
    "@manacore/shared-help-content": "workspace:*",
    "@manacore/shared-help-types": "workspace:*"
  }
}
```

### 2. Create help content

Create `src/lib/content/help/index.ts`:

```typescript
import type { HelpContent } from '@manacore/shared-help-types';

export function getAppHelpContent(locale: string): HelpContent {
  const isDE = locale === 'de';
  return {
    faq: [
      {
        id: 'faq-example',
        question: isDE ? 'Wie funktioniert X?' : 'How does X work?',
        answer: isDE ? '<p>So funktioniert X...</p>' : '<p>X works like this...</p>',
        category: 'features',
        order: 1,
        language: isDE ? 'de' : 'en',
        tags: ['example'],
      },
    ],
    features: [],
    shortcuts: [
      {
        id: 'shortcuts-general',
        category: 'general',
        language: isDE ? 'de' : 'en',
        order: 1,
        shortcuts: [
          { shortcut: 'Cmd/Ctrl + K', action: isDE ? 'Suche' : 'Search' },
        ],
      },
    ],
    gettingStarted: [],
    changelog: [],
    contact: {
      id: 'contact',
      title: isDE ? 'Support' : 'Support',
      content: '',
      language: isDE ? 'de' : 'en',
      order: 1,
      supportEmail: 'support@mana.how',
      responseTime: isDE ? 'Innerhalb von 24 Stunden' : 'Within 24 hours',
    },
  };
}
```

### 3. Create the help page route

Create `src/routes/(app)/help/+page.svelte`:

```svelte
<script lang="ts">
  import { locale } from 'svelte-i18n';
  import { HelpPage } from '@manacore/shared-help-ui';
  import type { HelpPageTranslations } from '@manacore/shared-help-ui';
  import { getAppHelpContent } from '$lib/content/help/index.js';

  const content = $derived(getAppHelpContent($locale ?? 'en'));
  const translations: HelpPageTranslations = $derived(/* see translations template below */);
</script>

<HelpPage
  {content}
  appName="MyApp"
  appId="myapp"
  {translations}
  showBackButton
  onBack={() => goto('/')}
  showGettingStarted={false}
  showChangelog={false}
/>
```

## HelpPage Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `HelpContent` | required | Help content data |
| `appName` | `string` | required | Display name of the app |
| `appId` | `string` | required | App identifier |
| `translations` | `HelpPageTranslations` | required | UI translations |
| `searchEnabled` | `boolean` | `true` | Show search bar |
| `showFAQ` | `boolean` | `true` | Show FAQ section |
| `showFeatures` | `boolean` | `true` | Show Features section |
| `showShortcuts` | `boolean` | `true` | Show Shortcuts section |
| `showGettingStarted` | `boolean` | `true` | Show Getting Started section |
| `showChangelog` | `boolean` | `true` | Show Changelog section |
| `showContact` | `boolean` | `true` | Show Contact section |
| `defaultSection` | `HelpSection` | `'faq'` | Initially active section |
| `showBackButton` | `boolean` | `false` | Show back navigation |
| `onBack` | `() => void` | - | Back button callback |

Sections with empty content are automatically hidden.

## Translations Template

```typescript
const translations: HelpPageTranslations = {
  title: 'Help & Support',
  subtitle: 'Find answers and learn how to use the app',
  searchPlaceholder: 'Search help...',
  sections: {
    faq: 'FAQ',
    features: 'Features',
    shortcuts: 'Shortcuts',
    gettingStarted: 'Getting Started',
    changelog: 'Changelog',
    contact: 'Contact',
  },
  search: {
    noResults: 'No results for "{query}"',
    resultsCount: '{count} results',
    searching: 'Searching...',
  },
  faq: {
    noItems: 'No FAQs available.',
    allCategories: 'All',
    categories: {
      general: 'General',
      account: 'Account',
      billing: 'Billing',
      features: 'Features',
      technical: 'Technical',
      privacy: 'Privacy',
    },
  },
  features: {
    noItems: 'No features available.',
    comingSoon: 'Coming Soon',
    learnMore: 'Learn More',
  },
  shortcuts: {
    noItems: 'No shortcuts available.',
    columns: {
      shortcut: 'Shortcut',
      action: 'Action',
      description: 'Description',
    },
  },
  gettingStarted: {
    noItems: 'No guides available.',
    estimatedTime: 'Estimated time',
    difficulty: {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    },
  },
  changelog: {
    noItems: 'No changelog available.',
    showAll: 'Show all releases',
    types: { major: 'Major', minor: 'Minor', patch: 'Patch', beta: 'Beta' },
    labels: {
      features: 'New Features',
      improvements: 'Improvements',
      bugFixes: 'Bug Fixes',
    },
  },
  contact: {
    noInfo: 'No contact info available.',
    email: 'Send email',
    responseTime: 'Response time',
  },
  common: {
    back: 'Back',
    showMore: 'Show more',
    showLess: 'Show less',
  },
};
```

## Content Types

### FAQ

```typescript
{
  id: string;           // Unique ID
  question: string;     // The question
  answer: string;       // HTML answer (auto-sanitized)
  category: 'general' | 'account' | 'billing' | 'features' | 'technical' | 'privacy';
  order: number;
  language: 'en' | 'de' | 'fr' | 'it' | 'es';
  featured?: boolean;
  tags?: string[];
}
```

### Shortcuts

```typescript
{
  id: string;
  category: 'navigation' | 'editing' | 'general' | 'app-specific';
  language: string;
  order: number;
  shortcuts: Array<{
    shortcut: string;   // e.g. "Cmd/Ctrl + K"
    action: string;     // e.g. "Open search"
    description?: string;
  }>;
}
```

### Contact

```typescript
{
  id: string;
  title: string;
  content: string;          // HTML (auto-sanitized)
  language: string;
  order: number;
  supportEmail?: string;
  supportUrl?: string;
  discordUrl?: string;
  documentationUrl?: string;
  responseTime?: string;
}
```

## Security

All HTML content is automatically sanitized via `isomorphic-dompurify` in the parser layer.
Content passed through `{@html}` in components is safe against XSS.

## Reference Implementation

See `apps/contacts/apps/web/src/routes/(app)/help/+page.svelte` for a complete working example.
