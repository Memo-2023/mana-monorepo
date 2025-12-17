# Shared Utils Agent

## Module Information
**Package**: `@manacore/shared-utils`
**Version**: 0.1.0
**Type**: TypeScript utility library
**Dependencies**: `date-fns` 4.1.0

## Identity
I am the Shared Utils Agent, responsible for providing common utility functions used across all ManaCore applications. I maintain pure, reusable functions for async operations, caching, date manipulation, formatting, validation, keyboard shortcuts, and natural language parsing.

## Expertise
- **Async Utilities**: Sleep, retry with exponential backoff, debouncing
- **IndexedDB Caching**: Persistent browser storage with expiration
- **Date Operations**: Formatting with locale support (date-fns), relative times, timestamps
- **String Manipulation**: Truncate, capitalize, slugify, ID generation
- **Format Utilities**: Number, currency, file size formatting
- **Validation**: Email, URL, common input validation
- **Keyboard Shortcuts**: Key combination detection and handling
- **Natural Language Parsers**: Base parser class for building NLP features

## Code Structure

```
src/
├── index.ts                 # Main export barrel
├── async.ts                 # Async utilities (sleep, retry, debounce)
├── cache.ts                 # IndexedDB caching system
├── date.ts                  # Date formatting with date-fns
├── string.ts                # String manipulation utilities
├── format.ts                # Number/currency/size formatting
├── validation.ts            # Input validation functions
├── keyboard.ts              # Keyboard shortcut utilities
└── parsers/
    ├── index.ts            # Parser exports
    └── base-parser.ts      # Base parser class for NLP
```

## Key Patterns

### 1. Async Utilities Pattern
All async utilities follow functional programming principles:
- **sleep**: Simple promise-based delay
- **retry**: Exponential backoff with configurable options
- **debounce**: Generic function debouncing with typed parameters

```typescript
// Retry with exponential backoff
await retry(
  async () => await fetchData(),
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
);

// Debounce a function
const debouncedSearch = debounce(search, 300);
```

### 2. IndexedDB Cache Pattern
Factory-based cache creation with type safety:
- **createCache<T>**: Generic cache factory
- **urlCache**: Pre-configured for signed URLs
- Automatic expiration handling
- Periodic cleanup support

```typescript
// Create custom cache
const myCache = createCache<MyData>({
  dbName: 'app-cache',
  storeName: 'my-data',
});

// Use URL cache
await urlCache.set('image-123', signedUrl, 3600000); // 1 hour
const cached = await urlCache.get('image-123');
```

### 3. Date Formatting Pattern
Locale-aware date formatting using date-fns:
- Supports 'de' and 'en' locales
- Relative time formatting ("2 hours ago")
- Smart timestamp labels (Today, Yesterday, or full date)

```typescript
// Format with locale
formatDate(new Date(), 'PPP', 'de');
// "15. März 2024"

// Relative time
formatRelativeTime(date, 'en');
// "2 hours ago"

// Smart timestamp
formatTimestamp(date, 'de');
// "Heute, 14:30" or "Gestern, 14:30" or "15. März 2024, 14:30"
```

### 4. String Utilities Pattern
Pure functions for common string operations:

```typescript
truncate(longText, 100);           // "text..."
capitalize('hello world');          // "Hello world"
slugify('Hello World!');            // "hello-world"
generateId(12);                     // "a3b5c7d9e1f2"
```

## Integration Points

### With Frontend Applications
- **SvelteKit Web**: Use date/string formatting in components
- **Expo Mobile**: Cache utilities for offline data
- **All Apps**: Async utilities for API retries

### With Backend Services
- **NestJS Services**: Retry logic for external API calls
- **Date Operations**: Server-side date formatting
- **String Utils**: Slug generation for URLs

### With Other Packages
- **@manacore/shared-ui**: Format utilities for display components
- **@manacore/shared-auth**: Date formatting for token expiration
- **@manacore/shared-storage**: ID generation for file keys

## How to Use

### Installation
This package is internal to the monorepo. Add to dependencies in `package.json`:

```json
{
  "dependencies": {
    "@manacore/shared-utils": "workspace:*"
  }
}
```

### Import Examples

```typescript
// Import specific utilities
import { sleep, retry, debounce } from '@manacore/shared-utils';
import { urlCache, createCache } from '@manacore/shared-utils';
import { formatDate, formatRelativeTime } from '@manacore/shared-utils';
import { truncate, slugify, generateId } from '@manacore/shared-utils';

// Use in async operations
await sleep(1000);
const result = await retry(() => fetchData());

// Use cache for signed URLs
await urlCache.set('avatar-url', signedUrl, 3600000);
const cached = await urlCache.get('avatar-url');

// Format dates with locale
const formatted = formatDate(new Date(), 'PPP', 'de');
const relative = formatRelativeTime(date, 'en');

// String manipulation
const slug = slugify(title);
const id = generateId(8);
```

### Best Practices
1. **Cache Cleanup**: Call `cleanupExpired()` periodically in long-running apps
2. **Retry Configuration**: Adjust retry parameters based on API characteristics
3. **Locale Consistency**: Use consistent locale throughout the app
4. **Type Safety**: Leverage TypeScript generics for cache operations

### Common Use Cases
- **API Retry Logic**: Wrap API calls with `retry()` for resilience
- **URL Caching**: Cache Supabase storage signed URLs to reduce API calls
- **User Input**: Validate and format user input before submission
- **Date Display**: Show localized dates and relative times in UI
- **Slug Generation**: Create URL-friendly slugs from titles/names

## Notes
- All utilities are pure functions (no side effects except cache operations)
- Browser-only utilities (cache, keyboard) check for `window`/`document` availability
- Date utilities use date-fns for robust internationalization
- Cache uses IndexedDB for persistence across page reloads
