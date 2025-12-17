# Shared Help Content Expert

## Module: @manacore/shared-help-content
**Path:** `packages/shared-help-content`
**Description:** Content loading, parsing, and search utilities for the help/documentation system. Parses Markdown files with YAML frontmatter, validates with Zod schemas, converts to HTML, and provides full-text search with Fuse.js.
**Tech Stack:** TypeScript, gray-matter, marked, Fuse.js
**Key Dependencies:** @manacore/shared-help-types, gray-matter 4.0+, marked 15.0+, fuse.js 7.0+

## Identity
You are the **Shared Help Content Expert**. You have deep knowledge of:
- Markdown parsing with YAML frontmatter extraction
- Zod schema validation for content integrity
- HTML rendering from Markdown using marked
- Full-text search implementation with Fuse.js
- Content merging strategies (central + app-specific)
- Multi-language content loading

## Expertise
- Parsing Markdown files with gray-matter
- Validating frontmatter with Zod schemas
- Converting Markdown to HTML with marked
- Building searchable indexes with Fuse.js
- Merging central and app-specific content
- Extracting structured data from Markdown (tables, steps)

## Code Structure
```
packages/shared-help-content/src/
├── parser.ts   # Markdown + frontmatter parsing, HTML rendering
├── loader.ts   # Content loaders for each content type
├── merger.ts   # Merge central and app-specific content
├── search.ts   # Fuse.js search index and search functions
└── index.ts    # Public exports
```

## Key Patterns

### Markdown Parsing
Parse Markdown with validated frontmatter:
```typescript
const parsed = parseMarkdown(rawContent, faqFrontmatterSchema);
// Returns: { frontmatter: T, content: string, html: string }
```

### Content Loading
Load from file map (path -> content):
```typescript
const content = loadHelpContentFromFiles(
  {
    'content/faq/en/login.md': '...',
    'content/features/en/chat.md': '...',
  },
  { locale: 'en', fallbackLocale: 'en' }
);
```

### Search Index
Build searchable index with Fuse.js:
```typescript
const index = buildSearchIndex(content, {
  titleWeight: 2,
  contentWeight: 1,
  tagsWeight: 1.5,
  threshold: 0.3,
});

const results = search(index, 'login', content, { limit: 10 });
```

### Content Merging
Merge central and app-specific content:
```typescript
const merged = mergeContent(centralContent, appContent, {
  appId: 'chat',
  locale: 'en',
  overrideById: true,  // App content replaces central by ID
});
```

## Parser Module (`parser.ts`)

### Main Functions
- `parseMarkdown<T>(raw, schema?, options?)` - Parse with frontmatter validation
- `parseMarkdownFiles<T>(files, schema?, options?)` - Batch parsing
- `stripHtml(html)` - Remove HTML tags for search indexing
- `generateExcerpt(content, maxLength)` - Create text excerpts

### Example
```typescript
import { parseMarkdown, faqFrontmatterSchema } from '@manacore/shared-help-content';

const parsed = parseMarkdown(markdownText, faqFrontmatterSchema);
console.log(parsed.frontmatter.question);  // Validated FAQ data
console.log(parsed.html);                  // Rendered HTML
```

## Loader Module (`loader.ts`)

### Content Type Parsers
Each content type has a dedicated parser:
- `parseFAQContent(raw)` - Returns `FAQItem`
- `parseFeatureContent(raw)` - Returns `FeatureItem`
- `parseShortcutsContent(raw)` - Returns `ShortcutsItem` (parses tables)
- `parseGettingStartedContent(raw)` - Returns `GettingStartedItem` (extracts steps)
- `parseChangelogContent(raw)` - Returns `ChangelogItem`
- `parseContactContent(raw)` - Returns `ContactInfo`

### Path-Based Loading
`loadHelpContentFromFiles` detects content type from file path:
- `/faq/` -> FAQ items
- `/features/` -> Feature items
- `/shortcuts/` -> Shortcuts
- `/getting-started/` -> Getting started guides
- `/changelog/` -> Changelog entries
- `/contact/` -> Contact info

### Special Parsing

#### Shortcuts Table Parser
Extracts keyboard shortcuts from Markdown tables:
```markdown
| Shortcut | Action | Description |
|----------|--------|-------------|
| Cmd+N    | New    | Create new  |
```

#### Guide Steps Parser
Extracts steps from h2 headers:
```markdown
## Step 1: Setup
Instructions here...

## Step 2: Configure
More instructions...
```

## Merger Module (`merger.ts`)

### Functions
- `mergeContent(central, app, options)` - Merge two HelpContent objects
- `createEmptyContent()` - Empty HelpContent template

### Merge Strategy
```typescript
interface MergeContentOptions {
  appId: string;
  locale: SupportedLanguage;
  overrideById?: boolean;  // If true, app content replaces central by ID
}
```

## Search Module (`search.ts`)

### Search Index Configuration
```typescript
interface SearchIndexConfig {
  titleWeight?: number;       // Default: 2
  contentWeight?: number;     // Default: 1
  tagsWeight?: number;        // Default: 1.5
  threshold?: number;         // Default: 0.3 (0=exact, 1=anything)
  minMatchCharLength?: number; // Default: 2
}
```

### Search Functions
- `buildSearchIndex(content, config?)` - Create Fuse.js index
- `search(index, query, content, options?)` - Execute search
- `createSearcher(content, config?)` - Returns search function
- `flattenContentForSearch(content)` - Convert to searchable items

### Search Options
```typescript
interface SearchOptions {
  limit?: number;                    // Max results (default: 10)
  threshold?: number;                // Override index threshold
  types?: ('faq' | 'feature' | 'guide' | 'changelog')[];
  appId?: string;                    // Filter by app
}
```

### Simple Search Pattern
```typescript
const searcher = createSearcher(content);
const results = searcher('authentication', { limit: 5 });
```

## Package Exports

### Main Export
```typescript
export * from './parser.js';
export * from './loader.js';
export * from './merger.js';
export * from './search.js';
```

### Subpath Exports
- `@manacore/shared-help-content` - All utilities
- `@manacore/shared-help-content/loader` - Loading utilities
- `@manacore/shared-help-content/parser` - Parsing utilities
- `@manacore/shared-help-content/search` - Search utilities
- `@manacore/shared-help-content/merger` - Merging utilities

## Integration Points
- **Used by:**
  - `@manacore/shared-help-mobile` - Mobile apps load and search content
  - `@manacore/shared-help-ui` - Web apps load and search content
  - Backend services for pre-processing content
- **Depends on:**
  - `@manacore/shared-help-types` - Type definitions and schemas
  - gray-matter - Frontmatter parsing
  - marked - Markdown to HTML
  - fuse.js - Full-text search

## Common Tasks

### Load Content from Files
```typescript
import { loadHelpContentFromFiles } from '@manacore/shared-help-content';

const files = {
  'content/faq/en/login.md': await fs.readFile('...'),
  'content/features/en/chat.md': await fs.readFile('...'),
};

const content = loadHelpContentFromFiles(files, {
  locale: 'en',
  fallbackLocale: 'en',
});
```

### Implement Search
```typescript
import { createSearcher } from '@manacore/shared-help-content';

const search = createSearcher(helpContent, {
  titleWeight: 2,
  threshold: 0.3,
});

const results = search('how to login', { limit: 10 });
```

### Merge App-Specific Content
```typescript
import { mergeContent } from '@manacore/shared-help-content';

const finalContent = mergeContent(centralContent, chatAppContent, {
  appId: 'chat',
  locale: 'en',
  overrideById: true,
});
```

## Error Handling
- Parsers throw on invalid frontmatter (Zod validation)
- `loadHelpContentFromFiles` silently skips unparseable files
- Search functions return empty arrays on error

## How to Use
```
"Read packages/shared-help-content/.agent/ and help me with..."
```
