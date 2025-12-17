# @zitare/content - Static Content Data Package

## Module Information

**Package Name:** `@zitare/content`
**Type:** Content Data Package
**Location:** `/apps/zitare/packages/content`
**Version:** 1.0.0
**Purpose:** Static quote and author data repository for the Zitare daily quotes application

## Description

The `@zitare/content` package is the centralized content repository for Zitare, containing curated quotes and author biographies in multiple languages. It provides static, offline-first content that works independently of backend services, ensuring quotes are always accessible.

## Technology Stack

- **TypeScript** 5.9+ (strict mode)
- **Module System:** ES Modules
- **Build:** Direct TypeScript imports (no build step)
- **Dependencies:** `@zitare/shared` (types and utilities)

## Package Structure

```
content/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config/
│   │   └── index.ts          # App configuration re-exports
│   └── data/
│       ├── index.ts          # Data aggregation exports
│       ├── quotes/
│       │   ├── de.ts         # German quotes collection
│       │   └── en.ts         # English quotes collection
│       └── authors/
│           ├── de.ts         # German author biographies
│           └── en.ts         # English author biographies
├── package.json
└── tsconfig.json
```

## Expert Identity

I am the **Zitare Content Data Specialist**. I know:

### Core Expertise
- **Content Structure:** How quotes and authors are organized and exported
- **Multi-language Support:** German (de) and English (en) content structure
- **Data Schemas:** Quote and author data formats from `@zitare/shared`
- **Static Exports:** Named exports for quotes and authors per language

### Content Domain Knowledge
- **Quote Categories:** wisdom, humor, science, philosophy, love, motivation, success, life, politics
- **Quote Metadata:** source, year, categories, tags, featured status, language
- **Author Data:** biographies (short/long), professions, lifespans, images, verification status
- **Content Quality:** verified quotes, featured items, historical attribution

### Integration Points
- **Type System:** Uses `EnhancedQuote` (alias for `Quote`) and `Author` (alias for `ContentAuthor`) from `@zitare/shared`
- **Backend Integration:** Quote IDs referenced in backend favorites and user lists
- **Frontend Consumption:** Imported by web and mobile apps for display
- **Configuration:** Re-exports `quotesAppConfig` from `@zitare/shared`

## Package Exports

### Main Export (`./`)
```typescript
export * from './data';      // All quotes and authors
export * from './config';    // App configuration
```

### Data Export (`./data`)
```typescript
export { quotesDE } from './quotes/de';    // German quotes array
export { quotesEN } from './quotes/en';    // English quotes array
export { authorsDE } from './authors/de';  // German authors array
export { authorsEN } from './authors/en';  // English authors array
```

### Config Export (`./config`)
```typescript
export { quotesAppConfig };                // App configuration from shared
export default quotesAppConfig;            // Default export
```

## Data Structures

### Quote Structure
```typescript
// Type: Omit<EnhancedQuote, 'author'>[]
// Each quote contains:
{
  id: string;                    // Unique ID (e.g., 'q-001')
  text: string;                  // Quote content
  authorId: string;              // Reference to author (e.g., 'einstein-albert')
  categories?: string[];         // Multiple categories
  tags?: string[];              // Searchable tags
  source?: string;              // Original source/context
  year?: number;                // Year said/written (negative for BCE)
  featured: boolean;            // Highlight status
  language: 'de' | 'en';        // Language code
  isFavorite: boolean;          // Client-side favorite flag
  category?: string;            // Primary category
}
```

### Author Structure
```typescript
// Type: Author[]
// Each author contains:
{
  id: string;                   // Unique ID (e.g., 'einstein-albert')
  name: string;                 // Full name
  profession?: string[];        // List of professions
  biography?: {
    short: string;              // Brief bio
    long?: string;              // Detailed markdown biography
    sections?: Record<string, { title: string; content: string }>;
    keyAchievements?: string[];
    famousQuote?: string;
  };
  lifespan?: {
    birth: string;              // ISO date or year
    death?: string;             // ISO date or year (omit if alive)
  };
  verified?: boolean;           // Data verification status
  featured?: boolean;           // Highlight status
  imageUrl?: string;            // Image path
  image?: {                     // Alternative image format
    thumbnail?: string;
    full?: string;
    credit?: string;
    source?: string;
  };
}
```

## Key Patterns

### 1. Language Separation
- **Separate Files:** Each language has dedicated quote and author files
- **Parallel Structure:** Same structure across languages
- **ID Consistency:** Same authorId references across languages
- **Named Exports:** Language-specific exports (quotesDE, quotesEN, etc.)

### 2. Author Reference Pattern
- **Decoupled Data:** Quotes reference authors by `authorId`, not embedded
- **Frontend Joins:** Apps merge quotes with author data at runtime
- **Omit Pattern:** Quotes exported as `Omit<EnhancedQuote, 'author'>[]` to avoid duplication

### 3. Content Categories
```typescript
// Common categories across both languages:
const categories = [
  'wisdom',      // Philosophical wisdom
  'humor',       // Humorous quotes
  'science',     // Scientific statements
  'philosophy',  // Philosophical thoughts
  'love',        // Love and relationships
  'motivation',  // Motivational quotes
  'success',     // Success and achievement
  'life',        // Life wisdom
  'politics',    // Political statements
  'friendship',  // Friendship
  'creativity'   // Creative thinking
];
```

### 4. Featured Content
- **featured: true:** Highlighted quotes for homepage/daily quote
- **Featured authors:** Notable historical figures
- **Quality Indicators:** verified flag for accuracy

### 5. Historical Data
- **Negative Years:** BCE dates use negative numbers (e.g., -500 for 500 BCE)
- **Date Formats:** ISO dates for modern figures, years for historical
- **Source Attribution:** Original source cited when available

## Integration Points

### Backend Integration
```typescript
// Backend references quote IDs from this package:
// - User favorites store quote_id (VARCHAR) matching quote.id
// - User lists store quote_ids (JSONB array) matching quote.id
// - No author data stored in backend (static from content package)
```

### Frontend Integration
```typescript
// Web and Mobile import and merge data:
import { quotesEN, quotesDE, authorsEN, authorsDE } from '@zitare/content';

// Merge quotes with author data:
const enhancedQuotes = quotesEN.map(quote => ({
  ...quote,
  author: authorsEN.find(a => a.id === quote.authorId)
}));
```

### Search and Filter
```typescript
// Apps use tags and categories for filtering:
const searchByTag = (tag: string) =>
  quotesEN.filter(q => q.tags?.includes(tag));

const filterByCategory = (category: string) =>
  quotesEN.filter(q => q.categories?.includes(category));
```

## Content Guidelines

### Adding New Quotes
1. **Generate unique ID:** Sequential pattern (q-NNN)
2. **Match language:** Add to both de.ts and en.ts (translated)
3. **Require authorId:** Must reference existing author
4. **Set categories:** Minimum 1, maximum 3-4
5. **Add tags:** Descriptive, searchable keywords
6. **Cite source:** When available and verified
7. **Set featured:** For high-quality, notable quotes

### Adding New Authors
1. **Consistent ID:** Lowercase, hyphenated (lastname-firstname)
2. **Full biography:** Both short and long versions
3. **Profession array:** Multiple professions allowed
4. **Lifespan dates:** ISO format or years
5. **Image sources:** Cite credits for images
6. **Verification:** Mark verified: true for fact-checked data

### Data Quality Standards
- **Accuracy:** All quotes verified against sources
- **Attribution:** Proper author attribution required
- **Translations:** Professional translation for multi-language
- **Historical Accuracy:** Correct dates and biographical data
- **Copyright:** Only public domain or properly licensed content

## Common Use Cases

### 1. Get All Quotes (Language-Specific)
```typescript
import { quotesEN, quotesDE } from '@zitare/content/data';

const currentLanguage = 'en';
const quotes = currentLanguage === 'en' ? quotesEN : quotesDE;
```

### 2. Get Quote with Author
```typescript
import { quotesEN, authorsEN } from '@zitare/content/data';

const quote = quotesEN[0];
const author = authorsEN.find(a => a.id === quote.authorId);
const enhanced = { ...quote, author };
```

### 3. Daily Quote Selection
```typescript
import { quotesEN } from '@zitare/content/data';

// Featured quotes only
const featuredQuotes = quotesEN.filter(q => q.featured);

// Random daily quote
const todayIndex = new Date().getDate() % featuredQuotes.length;
const dailyQuote = featuredQuotes[todayIndex];
```

### 4. Category Browsing
```typescript
import { quotesEN } from '@zitare/content/data';

const wisdomQuotes = quotesEN.filter(q =>
  q.categories?.includes('wisdom')
);
```

### 5. Author Deep Dive
```typescript
import { quotesEN, authorsEN } from '@zitare/content/data';

const einstein = authorsEN.find(a => a.id === 'einstein-albert');
const einsteinQuotes = quotesEN.filter(q => q.authorId === 'einstein-albert');

console.log(einstein.biography.long); // Full markdown biography
```

## Dependencies

### Runtime Dependencies
- **@zitare/shared:** Type definitions (Author, EnhancedQuote, quotesAppConfig)

### Development Dependencies
- **typescript:** Type checking and compilation

## Build and Type Checking

```bash
# Type check the content package
pnpm type-check

# From monorepo root
pnpm type-check --filter @zitare/content
```

## Content Statistics

### Current Content Volume
- **English Quotes:** Multiple quotes across various categories
- **German Quotes:** Parallel German translations/originals
- **Authors:** Comprehensive biographies for quoted individuals
- **Categories:** 10+ thematic categories
- **Languages:** 2 (German, English)

### Content Characteristics
- **Historical Range:** Ancient philosophers to modern figures
- **Geographic Diversity:** International authors and sources
- **Thematic Breadth:** Philosophy, science, humor, wisdom, politics
- **Quality Focus:** Verified, attributed, contextualized quotes

## Future Considerations

### Potential Enhancements
1. **Additional Languages:** French, Spanish, Italian translations
2. **Media Assets:** Audio quotes, author photos, videos
3. **Related Quotes:** Cross-referencing similar quotes
4. **Topic Ontology:** Hierarchical category structure
5. **Historical Context:** Time period and cultural context metadata
6. **Quote Collections:** Curated thematic collections
7. **Author Relationships:** Connections between authors
8. **Data Versioning:** Version tracking for content updates

### Scalability
- **Large Datasets:** Consider database migration for 10k+ quotes
- **CDN Integration:** Static content delivery for images
- **Lazy Loading:** Split by language/category for performance
- **Search Index:** Pre-built search indices for large collections

## How to Use This Package

### For Developers

**Reading Content:**
1. Import language-specific data: `import { quotesEN, authorsEN } from '@zitare/content/data'`
2. Merge quotes with authors by matching `quote.authorId` to `author.id`
3. Use categories and tags for filtering and search

**Adding Content:**
1. Navigate to `src/data/quotes/[lang].ts` for new quotes
2. Add author to `src/data/authors/[lang].ts` if not exists
3. Follow ID conventions (q-NNN for quotes, lowercase-hyphenated for authors)
4. Ensure both languages have equivalent content
5. Run `pnpm type-check` to validate structure

**Configuration:**
- Import app config: `import { quotesAppConfig } from '@zitare/content/config'`
- Config re-exported from `@zitare/shared` for consistency

### For Content Managers

**Content Quality Checklist:**
- [ ] Quote text is accurate and verified
- [ ] Author attribution is correct
- [ ] Source is cited (when available)
- [ ] Year/date is accurate
- [ ] Categories are appropriate (1-4)
- [ ] Tags are descriptive and searchable
- [ ] Featured status is set for high-quality quotes
- [ ] Language code matches file (de/en)
- [ ] Author biography exists and is accurate
- [ ] Author ID matches authorId in quotes

**Translation Guidelines:**
- Preserve meaning and nuance
- Adapt idioms culturally when needed
- Maintain quote attribution in both languages
- Keep ID structure parallel across languages

### For Backend Developers

**Quote ID References:**
- Backend stores `quote_id` as VARCHAR matching `quote.id`
- IDs are immutable - never change existing IDs
- Frontend resolves full quote data from this package
- No quote text stored in database (single source of truth)

**API Integration:**
- Backend returns quote IDs only
- Frontend merges with static content
- Favorites and lists reference quote IDs
- Author data never stored in backend

## Troubleshooting

### Common Issues

**Type Errors:**
- Ensure `@zitare/shared` is up to date
- Run `pnpm install` in monorepo root
- Check TypeScript version compatibility (5.9+)

**Missing Author:**
- Verify `authorId` matches author `id` exactly
- Check language file consistency
- Ensure author exists in corresponding language file

**Content Not Appearing:**
- Verify export structure in data/index.ts
- Check import paths use correct subpath exports
- Ensure language code is correctly set

**Build Errors:**
- Run `pnpm type-check` to identify issues
- Check for duplicate IDs
- Validate all required fields are present

---

**Last Updated:** 2025-12-16
**Maintainer:** Zitare Content Team
**Related Documentation:**
- `/apps/zitare/CLAUDE.md` - Project overview
- `/apps/zitare/packages/shared/.agent/agent.md` - Shared types and utilities
