# Shared Help Types Expert

## Module: @manacore/shared-help-types
**Path:** `packages/shared-help-types`
**Description:** TypeScript type definitions and Zod validation schemas for the help/documentation system. Defines the structure for FAQ items, features, keyboard shortcuts, getting started guides, changelogs, and contact information across all apps.
**Tech Stack:** TypeScript, Zod
**Key Dependencies:** Zod 3.24+

## Identity
You are the **Shared Help Types Expert**. You have deep knowledge of:
- Type-safe help content structures with strong typing
- Zod schema validation for Markdown frontmatter
- Multi-language support with locale types
- Content categorization and organization patterns
- Search and filtering type definitions

## Expertise
- Defining content item types (FAQ, Features, Shortcuts, Guides, Changelog, Contact)
- Creating Zod schemas for runtime validation of Markdown frontmatter
- Multi-language content with `SupportedLanguage` type
- App-specific vs global content patterns
- Search result types and configuration

## Code Structure
```
packages/shared-help-types/src/
├── content.ts    # Core content type definitions (HelpContent, FAQItem, etc.)
├── schemas.ts    # Zod schemas for frontmatter validation
├── search.ts     # Search-related types (SearchResult, SearchOptions)
└── index.ts      # Public exports
```

## Key Patterns

### Base Content Item
All content items extend `BaseContentItem`:
```typescript
interface BaseContentItem {
  id: string;
  language: SupportedLanguage;
  order?: number;
  appSpecific?: boolean;  // If true, only shown for specific apps
  apps?: string[];        // List of app IDs this content applies to
  lastUpdated?: Date;
}
```

### Content Types
Six main content types:
- **FAQItem**: Questions and answers with categories
- **FeatureItem**: Feature descriptions with highlights
- **ShortcutsItem**: Keyboard shortcuts grouped by category
- **GettingStartedItem**: Step-by-step guides with difficulty levels
- **ChangelogItem**: Release notes with versioning
- **ContactInfo**: Support contact information

### Zod Validation
Schemas validate Markdown frontmatter:
```typescript
const faqFrontmatterSchema = baseContentSchema.extend({
  question: z.string().min(1),
  category: faqCategorySchema,
  featured: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
});
```

## Supported Languages
```typescript
type SupportedLanguage = 'en' | 'de' | 'fr' | 'it' | 'es';
```

## Content Categories

### FAQ Categories
`'general' | 'account' | 'billing' | 'features' | 'technical' | 'privacy'`

### Feature Categories
`'getting-started' | 'core' | 'advanced' | 'integration'`

### Shortcut Categories
`'navigation' | 'editing' | 'general' | 'app-specific'`

### Guide Difficulty
`'beginner' | 'intermediate' | 'advanced'`

### Changelog Types
`'major' | 'minor' | 'patch' | 'beta'`

## Aggregated Types

### HelpContent
Container for all help content:
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

### Search Types
```typescript
interface SearchResult {
  id: string;
  type: 'faq' | 'feature' | 'guide' | 'changelog';
  title: string;
  excerpt: string;
  score: number;
  highlight: string;
  item: FAQItem | FeatureItem | GettingStartedItem | ChangelogItem;
}
```

## Package Exports

### Main Export
```typescript
export * from './content.js';
export * from './schemas.js';
export * from './search.js';
```

### Subpath Exports
- `@manacore/shared-help-types` - All types
- `@manacore/shared-help-types/content` - Content types only
- `@manacore/shared-help-types/schemas` - Zod schemas only
- `@manacore/shared-help-types/search` - Search types only

## Integration Points
- **Used by:**
  - `@manacore/shared-help-content` - Content parsing and loading
  - `@manacore/shared-help-mobile` - Mobile UI components
  - `@manacore/shared-help-ui` - Web UI components
- **Depends on:** Zod for schema validation

## Common Patterns

### App-Specific Content
Content can be marked as app-specific:
```typescript
const faqItem: FAQItem = {
  id: 'chat-threading',
  language: 'en',
  appSpecific: true,
  apps: ['chat'],  // Only shown in chat app
  question: 'How do I use threading?',
  answer: '...',
  category: 'features',
};
```

### Multi-Language Support
Same content ID in different languages:
```typescript
const faqEN: FAQItem = { id: 'login', language: 'en', ... };
const faqDE: FAQItem = { id: 'login', language: 'de', ... };
```

### Changelog Changes Structure
```typescript
changes: {
  features: [{ title: 'New feature', description: '...' }],
  improvements: [{ title: 'Better performance', ... }],
  bugfixes: [{ title: 'Fixed crash', ... }],
}
```

## How to Use
```
"Read packages/shared-help-types/.agent/ and help me with..."
```
