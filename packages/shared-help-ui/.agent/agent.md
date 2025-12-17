# Shared Help UI Expert

## Module: @manacore/shared-help-ui
**Path:** `packages/shared-help-ui`
**Description:** Svelte 5 components for the help/documentation system in web apps. Provides a complete help page with FAQ, features, keyboard shortcuts, getting started guides, changelog, and contact sections. Built with Svelte 5 runes mode and Tailwind CSS.
**Tech Stack:** Svelte 5 (runes mode), TypeScript, Tailwind CSS
**Key Dependencies:** @manacore/shared-help-types, @manacore/shared-help-content, @manacore/shared-icons

## Identity
You are the **Shared Help UI Expert**. You have deep knowledge of:
- Svelte 5 runes mode (`$state`, `$derived`, `$props`, `$effect`)
- Building accessible help documentation UIs
- Interactive components (expandable FAQs, tabbed navigation)
- Search UX with real-time filtering
- Keyboard shortcuts display
- Dark mode with Tailwind CSS
- Type-safe component props

## Expertise
- Svelte 5 component patterns with runes
- Reactive state management with `$state` and `$derived`
- Accessible, semantic HTML for documentation
- Search implementation with live results
- Tab navigation and section switching
- Expandable/collapsible content
- Dark mode styling

## Code Structure
```
packages/shared-help-ui/src/
├── pages/
│   └── HelpPage.svelte           # Main help page component
├── components/
│   ├── FAQSection.svelte         # FAQ list with categories
│   ├── FAQItem.svelte            # Single FAQ item (expandable)
│   ├── FeaturesOverview.svelte   # Features grid
│   ├── FeatureCard.svelte        # Single feature card
│   ├── KeyboardShortcuts.svelte  # Shortcuts table
│   ├── GettingStartedGuide.svelte# Step-by-step guides
│   ├── ChangelogSection.svelte   # Release notes
│   ├── ChangelogEntry.svelte     # Single changelog entry
│   ├── ContactSection.svelte     # Support contact info
│   └── HelpSearch.svelte         # Search component
├── types.ts                      # Component prop types
└── index.ts                      # Public exports
```

## Key Patterns

### Svelte 5 Runes
All components use Svelte 5 runes syntax:
```svelte
<script lang="ts">
  let { content, translations }: HelpPageProps = $props();
  let activeSection = $state<HelpSection>('faq');
  let searchQuery = $state('');

  const filteredFAQs = $derived(() => {
    return content.faq.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  $effect(() => {
    console.log('Section changed:', activeSection);
  });
</script>
```

### Main Page Component
```svelte
import { HelpPage } from '@manacore/shared-help-ui';

<HelpPage
  content={helpContent}
  appName="Chat"
  appId="chat"
  translations={translations}
  searchEnabled={true}
  defaultSection="faq"
  showBackButton={false}
  onSectionChange={(section) => console.log(section)}
/>
```

## HelpPage Component

### Props
```typescript
interface HelpPageProps {
  content: HelpContent;
  appName: string;
  appId: string;
  translations: HelpPageTranslations;
  searchEnabled?: boolean;       // Default: true
  showFAQ?: boolean;             // Default: true
  showFeatures?: boolean;        // Default: true
  showShortcuts?: boolean;       // Default: true
  showGettingStarted?: boolean;  // Default: true
  showChangelog?: boolean;       // Default: true
  showContact?: boolean;         // Default: true
  defaultSection?: HelpSection;  // Default: 'faq'
  showBackButton?: boolean;      // Default: false
  onBack?: () => void;
  onSectionChange?: (section: HelpSection) => void;
  onSearch?: (query: string, results: SearchResult[]) => void;
}
```

### Features
- Search bar with live filtering
- Tab navigation between sections
- Expandable FAQ items
- Category filtering for FAQs
- Keyboard shortcuts table
- Changelog entries with version badges
- Contact information with links
- Empty states for each section
- Dark mode support

### Layout
```
┌─────────────────────────────────┐
│ Help & Support                  │
│ Get support for Chat            │
├─────────────────────────────────┤
│ 🔍 Search help articles...      │
├─────────────────────────────────┤
│ [FAQ] Features Shortcuts Guide  │ ← Tabs
├─────────────────────────────────┤
│ Content area                    │
│                                 │
│ (FAQ, features, shortcuts, etc.)│
└─────────────────────────────────┘
```

## Section Components

### FAQSection
Displays FAQ items with category filtering:
```svelte
<FAQSection
  items={content.faq}
  translations={translations}
  showCategories={true}
  maxItems={10}
  expandFirst={true}
/>
```

**Features:**
- Category pills for filtering
- Expandable/collapsible items
- First item auto-expanded (optional)
- Show more/less button
- Empty state

### FAQItem
Single expandable FAQ:
```svelte
<FAQItem
  item={faqItem}
  expanded={isExpanded}
  onToggle={() => expanded = !expanded}
/>
```

**Features:**
- Smooth expand/collapse animation
- Rendered HTML content
- Accessibility (ARIA attributes)

### FeaturesOverview
Grid of feature cards:
```svelte
<FeaturesOverview
  items={content.features}
  translations={translations}
  columns={3}
/>
```

**Features:**
- Responsive grid layout
- Category grouping
- Icon support
- "Coming soon" badges
- Empty state

### FeatureCard
Single feature card:
```svelte
<FeatureCard
  feature={featureItem}
  onLearnMore={(url) => window.open(url)}
/>
```

**Features:**
- Icon display
- Highlights as badges
- "Learn more" link
- Availability status

### KeyboardShortcuts
Table of keyboard shortcuts:
```svelte
<KeyboardShortcuts
  items={content.shortcuts}
  translations={translations}
  groupByCategory={true}
/>
```

**Features:**
- Category grouping
- Platform-specific shortcuts (Cmd/Ctrl)
- Styled keyboard keys
- Empty state

### GettingStartedGuide
Step-by-step guides:
```svelte
<GettingStartedGuide
  items={content.gettingStarted}
  translations={translations}
  showSteps={true}
/>
```

**Features:**
- Difficulty badges (beginner/intermediate/advanced)
- Estimated time display
- Step numbering
- Prerequisites list
- Empty state

### ChangelogSection
Release notes list:
```svelte
<ChangelogSection
  items={content.changelog}
  translations={translations}
  maxEntries={10}
/>
```

**Features:**
- Version badges (major/minor/patch/beta)
- Release date formatting
- Categorized changes (features/improvements/bugfixes)
- Platform badges
- Empty state

### ChangelogEntry
Single changelog entry:
```svelte
<ChangelogEntry
  entry={changelogItem}
  expanded={isExpanded}
  onToggle={() => expanded = !expanded}
/>
```

**Features:**
- Type badges (major, minor, patch, beta)
- Categorized changes
- Platform support indicators

### ContactSection
Support contact information:
```svelte
<ContactSection
  contact={content.contact}
  translations={translations}
/>
```

**Features:**
- Email links (mailto:)
- Support URL
- Social links (Discord, Twitter)
- Documentation link
- Response time display
- Empty state

### HelpSearch
Search component with live results:
```svelte
<HelpSearch
  content={helpContent}
  translations={translations}
  placeholder="Search help..."
  onResultSelect={(result) => handleSelect(result)}
/>
```

**Features:**
- Real-time search with Fuse.js
- Result excerpts with highlighting
- Type badges (FAQ, Feature, Guide, Changelog)
- Click to navigate to section
- Empty state for no results

## Styling with Tailwind CSS

### Dark Mode Support
All components use Tailwind dark mode classes:
```svelte
<div class="bg-white dark:bg-gray-900">
  <h1 class="text-gray-900 dark:text-gray-100">Title</h1>
  <p class="text-gray-600 dark:text-gray-400">Description</p>
</div>
```

### Common Class Patterns
```css
/* Cards */
.card {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
}

/* Buttons */
.btn-primary {
  @apply bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700;
}

/* Text */
.text-heading {
  @apply text-gray-900 dark:text-gray-100;
}

.text-body {
  @apply text-gray-600 dark:text-gray-400;
}
```

### Primary Color
Components use `primary-*` colors that should be defined in Tailwind config:
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        50: '#...',
        // ... through 950
      }
    }
  }
}
```

## Translations Interface

### Required Translations
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
  faq: {
    noItems: string;
    categories: Record<FAQCategory, string>;
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
    difficulty: Record<GuideDifficulty, string>;
    estimatedTime: string;
    prerequisites: string;
  };
  changelog: {
    noItems: string;
    releaseDate: string;
  };
  contact: {
    noContact: string;
    supportEmail: string;
    supportUrl: string;
    responseTime: string;
  };
  common: {
    back: string;
    showMore: string;
    showLess: string;
  };
  search: {
    noResults: string;
    resultsCount: string;
    searching: string;
  };
}
```

## Package Exports

### Main Exports
```typescript
export { default as HelpPage } from './pages/HelpPage.svelte';
export { default as FAQSection } from './components/FAQSection.svelte';
export { default as FAQItem } from './components/FAQItem.svelte';
// ... all components

export type { HelpPageProps, HelpPageTranslations, ... } from './types.js';
```

### Subpath Exports
Individual components can be imported via subpaths:
```typescript
import HelpPage from '@manacore/shared-help-ui/HelpPage.svelte';
import FAQSection from '@manacore/shared-help-ui/FAQSection.svelte';
```

## Integration Points
- **Used by:**
  - SvelteKit web apps for help pages
  - App-specific help implementations
- **Depends on:**
  - `@manacore/shared-help-types` - Type definitions
  - `@manacore/shared-help-content` - Content loading and search
  - `@manacore/shared-icons` - Icon components
  - Svelte 5 - UI framework

## Peer Dependencies
```json
{
  "svelte": "^5.0.0"
}
```

## Common Tasks

### Basic Help Page
```svelte
<script lang="ts">
  import { HelpPage } from '@manacore/shared-help-ui';
  import type { HelpContent } from '@manacore/shared-help-types';

  let helpContent: HelpContent = $props();

  const translations = {
    title: 'Help & Support',
    subtitle: 'Get help with',
    searchPlaceholder: 'Search help articles...',
    // ... rest of translations
  };
</script>

<HelpPage
  content={helpContent}
  appName="Chat"
  appId="chat"
  {translations}
/>
```

### Custom Section Layout
```svelte
<script lang="ts">
  import { FAQSection, FeaturesOverview } from '@manacore/shared-help-ui';

  let { content } = $props();
</script>

<div class="max-w-6xl mx-auto">
  <section>
    <h2>Frequently Asked Questions</h2>
    <FAQSection items={content.faq} translations={translations} />
  </section>

  <section>
    <h2>Features</h2>
    <FeaturesOverview items={content.features} translations={translations} />
  </section>
</div>
```

### With Search Integration
```svelte
<script lang="ts">
  import { HelpPage } from '@manacore/shared-help-ui';
  import type { SearchResult } from '@manacore/shared-help-types';

  let searchResults = $state<SearchResult[]>([]);

  function handleSearch(query: string, results: SearchResult[]) {
    console.log(`Searched for: ${query}`);
    searchResults = results;
    // Analytics tracking, etc.
  }
</script>

<HelpPage
  content={helpContent}
  appName="Chat"
  appId="chat"
  translations={translations}
  onSearch={handleSearch}
/>
```

## Accessibility
All components follow accessibility best practices:
- Semantic HTML (`<section>`, `<article>`, `<nav>`)
- ARIA attributes for expandable content
- Keyboard navigation support
- Focus management
- Screen reader friendly

## How to Use
```
"Read packages/shared-help-ui/.agent/ and help me with..."
```
