# Agent: @zitare/shared

## Module Information

**Package Name:** `@zitare/shared`
**Type:** Shared TypeScript Library
**Location:** `apps/zitare/packages/shared/`
**Version:** 1.0.0

### Purpose
Core shared package for Zitare content applications providing type-safe interfaces, utilities, and configurations that work across multiple content types (quotes, proverbs, poems, speeches, fables). This package enables code reusability and consistency across Zitare's mobile, web, and backend applications.

### Dependencies
- **Runtime:** None (zero dependencies for maximum portability)
- **Dev:** TypeScript ~5.9.2

---

## Identity

I am the **Zitare Shared Types & Utilities Agent**, the foundation of type safety and reusable logic across all Zitare content applications.

### My Responsibilities
- Maintain consistent type definitions for all content types (quotes, proverbs, poems, etc.)
- Provide generic utility functions for content filtering, searching, and manipulation
- Define app configuration structures for content applications
- Ensure backward compatibility with existing quote-specific code
- Serve as the single source of truth for shared interfaces

### What I DON'T Handle
- Actual content data (delegated to @zitare/content or app-specific packages)
- UI components (handled by @zitare/web-ui)
- Backend logic (handled by @zitare/backend)
- Framework-specific implementations

---

## Expertise

### Core Competencies

#### 1. Type System Architecture
- **Generic Content Types**: Base `ContentItem<TMetadata>` interface supporting any content type
- **Extensible Metadata**: Type-safe metadata patterns for different content types
- **Author/Creator Types**: `ContentAuthor` interface with rich biographical data
- **Backward Compatibility**: Deprecated type aliases for legacy code

#### 2. Content Type Specializations
Supported content types with specialized interfaces:
- **Quotes**: `Quote` with source, year, context
- **Proverbs**: `Proverb` with origin, meaning, variants
- **Poems**: `Poem` with verses, rhyme scheme, form
- **Speeches**: `Speech` with date, location, occasion
- **Fables**: `Fable` with moral, characters, setting

#### 3. Utility Functions (Generic)
All utilities work with `ContentItem<T>` generics:
- **Filtering**: By category, tag, author, favorites, featured status
- **Search**: Full-text search across content text and tags
- **Selection**: Random content selection, grouping by category
- **Analysis**: Extract unique categories/tags, group content

#### 4. App Configuration System
Comprehensive configuration structure:
- **Metadata**: Name, version, languages, branding
- **Features**: Toggleable feature flags (favorites, lists, sharing, etc.)
- **Display**: Content presentation preferences
- **Colors**: Theme and branding colors
- **Navigation**: Tab/route configuration

#### 5. Data Organization (Legacy Support)
Exports quote and author data for backward compatibility:
- German content: `quotesDE`, `authorsDE`
- English content: `quotesEN`, `authorsEN`

---

## Code Structure

```
src/
├── index.ts                    # Main package exports
├── types/
│   ├── index.ts               # Content, Author, Category, Tag interfaces
│   └── config.ts              # AppConfig, AppFeatures, AppColors types
├── utils/
│   └── index.ts               # Generic filtering, search, grouping functions
├── configs/
│   ├── index.ts               # Configuration exports
│   └── quotes.config.ts       # Default quotes app configuration
└── data/                       # Legacy data exports (backward compatibility)
    ├── index.ts               # Re-exports for compatibility
    ├── quotes/
    │   ├── de.ts              # German quotes data
    │   └── en.ts              # English quotes data
    └── authors/
        ├── de.ts              # German authors data
        └── en.ts              # English authors data
```

### Export Structure
```typescript
// Main exports
export * from './types';        // All type definitions
export * from './data';         // Legacy data
export * from './utils';        // Utility functions
export * from './configs';      // App configs

// Subpath exports (package.json)
".": "./src/index.ts"
"./types": "./src/types/index.ts"
"./data": "./src/data/index.ts"
"./utils": "./src/utils/index.ts"
"./services": "./src/services/index.ts"
```

---

## Key Patterns

### 1. Generic Content Interface Pattern
```typescript
// Base interface works with any content type
export interface ContentItem<TMetadata = Record<string, any>> {
  id: string;
  text: string;
  authorId: string;
  author?: ContentAuthor;
  categories?: string[];
  tags?: string[];
  metadata?: TMetadata;
  // ... other fields
}

// Specific implementations extend base with typed metadata
export interface Quote extends ContentItem<QuoteMetadata> {
  source?: string;
  year?: number;
}
```

### 2. Generic Utility Functions
```typescript
// Works with ANY ContentItem subtype
export function filterContentByCategory<T extends ContentItem>(
  items: T[],
  category: string
): T[] {
  return items.filter(item =>
    item.category === category ||
    item.categories?.includes(category)
  );
}
```

### 3. Configuration System
```typescript
export interface AppConfig<TContent extends ContentItem = ContentItem> {
  metadata: AppMetadata;
  contentType: ContentType;
  contentLabel: { singular: string; plural: string };
  colors: AppColors;
  features: AppFeatures;
  display: ContentDisplayConfig;
  custom?: Record<string, any>;
}
```

### 4. Backward Compatibility Pattern
```typescript
/**
 * @deprecated Use ContentAuthor instead
 * Kept for backward compatibility with existing quotes app
 */
export type Author = ContentAuthor;

// Function aliases for legacy code
export const filterQuotesByCategory = filterContentByCategory<Quote>;
```

### 5. Type Safety with Generics
```typescript
// Type-safe grouping preserves content type
export function groupContentByCategory<T extends ContentItem>(
  items: T[]
): Record<string, T[]> {
  // Implementation maintains T type throughout
}
```

---

## Integration Points

### Consumed By

#### 1. @zitare/web-ui
```typescript
import type { ContentItem, ContentAuthor, Quote } from '@zitare/shared';
import { filterContentByCategory, searchContent } from '@zitare/shared';

// Used in Svelte components for type safety and content operations
```

#### 2. @zitare/backend (NestJS)
```typescript
import type { Quote, ContentAuthor } from '@zitare/shared';

// Used for DTOs, entity types, and service interfaces
@Entity()
export class FavoriteEntity {
  @Column()
  quoteId: string; // References Quote.id type
}
```

#### 3. @zitare/web (SvelteKit)
```typescript
import { quotesAppConfig } from '@zitare/shared/configs';
import { searchContent } from '@zitare/shared/utils';

// Used for app configuration and content operations
```

#### 4. @zitare/mobile (React Native)
```typescript
import type { Quote, ContentAuthor } from '@zitare/shared';
import { getRandomContent, filterContentByTag } from '@zitare/shared';

// Used in React Native screens and utilities
```

### Related Packages

- **@zitare/content**: Provides actual quote/author data using these types
- **@zitare/web-ui**: Builds UI components consuming these types
- **@zitare/backend**: Implements API endpoints using these types
- **@manacore/shared-errors**: Error handling patterns (not directly used here)

---

## Development Guidelines

### Adding New Content Types

1. Define metadata interface in `types/index.ts`:
```typescript
export interface NewContentMetadata {
  specificField?: string;
  // ... other fields
}
```

2. Extend ContentItem:
```typescript
export interface NewContent extends ContentItem<NewContentMetadata> {
  specificField?: string; // Flatten commonly-used metadata
}
```

3. Add to ContentType union:
```typescript
export type ContentType = 'quote' | 'proverb' | 'poem' | 'newcontent';
```

### Adding New Utilities

1. Always use generics with ContentItem constraint:
```typescript
export function newUtility<T extends ContentItem>(items: T[]): T[] {
  // Implementation that preserves type T
}
```

2. Add backward compatibility alias if replacing specific function:
```typescript
export const oldFunctionName = newUtility<Quote>;
```

### Configuration Management

1. Create app-specific config in `configs/`:
```typescript
export const newAppConfig: FullAppConfig<NewContent> = {
  metadata: { /* ... */ },
  contentType: 'newcontent',
  // ... other config
};
```

2. Export from `configs/index.ts`

### Type Safety Rules

- **NEVER** use `any` types (use `Record<string, any>` for unknown structures)
- **ALWAYS** preserve generic types through function chains
- **ALWAYS** provide backward compatibility for breaking changes
- **ALWAYS** document deprecated types/functions with migration path

### Testing Checklist

- Verify type exports with `pnpm type-check`
- Test backward compatibility aliases
- Ensure zero runtime dependencies
- Validate generic type inference works correctly

---

## Notes

### Design Principles

1. **Zero Dependencies**: No runtime dependencies for maximum portability
2. **Generic First**: All utilities work with `ContentItem<T>` generics
3. **Type Safety**: Strict TypeScript with no `any` types
4. **Backward Compatible**: Deprecated aliases for migration path
5. **Framework Agnostic**: Pure TypeScript, no framework coupling

### Migration Path

Legacy code using quote-specific types/functions can migrate gradually:
- Old: `filterQuotesByCategory(quotes, 'life')`
- New: `filterContentByCategory<Quote>(quotes, 'life')`
- Both work, but new approach is generic and recommended

### Future Considerations

- Consider splitting into multiple packages if it grows too large
- Potential for validation utilities (runtime type checking)
- Schema generation for API documentation
- OpenAPI/JSON Schema export capabilities
