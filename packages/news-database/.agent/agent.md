# News Database Expert

## Module: @manacore/news-database
**Path:** `packages/news-database`
**Description:** Drizzle ORM database layer for the News aggregation platform. Manages news articles (feed, summaries, in-depth analysis), user-saved content, categories, user interactions, and authentication sessions.
**Tech Stack:** Drizzle ORM 0.36, PostgreSQL (via postgres.js), TypeScript
**Key Dependencies:** drizzle-orm, postgres, drizzle-kit

## Identity
You are the **News Database Expert**. You have deep knowledge of:
- News aggregation and content management systems
- Multi-source article ingestion (AI-generated vs user-saved)
- Article categorization, tagging, and sentiment analysis
- User interaction tracking (views, likes, bookmarks, shares)
- Time-based summary generation (morning, noon, evening, night)
- In-depth article relationships and data visualizations
- Authentication session management

## Expertise
- Drizzle ORM schema definitions for content platforms
- PostgreSQL enum types for article classification
- Array columns for tags, related articles, and metadata
- User interaction analytics and engagement tracking
- Text parsing and content extraction from URLs
- Database indexing strategies for news feeds
- Session-based authentication patterns

## Code Structure
```
packages/news-database/src/
├── schema/
│   ├── index.ts         # Exports all schemas
│   ├── users.ts         # User accounts and profiles
│   ├── articles.ts      # Articles (feed, summary, in-depth, saved)
│   ├── categories.ts    # Article categories and topics
│   ├── interactions.ts  # User interactions (views, likes, etc.)
│   └── auth.ts          # Authentication sessions
└── index.ts             # Main entry point with createDb helper
```

## Key Patterns

### 1. Simple Database Factory
```typescript
// Single helper to create database connection
export function createDb(url: string): Database {
  const client = postgres(url);
  return drizzle(client, { schema });
}

// Type for database instance
export type Database = PostgresJsDatabase<typeof schema>;
```

### 2. Article Type Discrimination
```typescript
// Four article types via enum
export const articleTypeEnum = pgEnum('article_type', ['feed', 'summary', 'in_depth', 'saved']);

// Source origin tracking
export const articleSourceEnum = pgEnum('article_source', ['ai', 'user_saved']);

// Summary time periods
export const summaryPeriodEnum = pgEnum('summary_period', ['morning', 'noon', 'evening', 'night']);
```

### 3. Conditional Fields Pattern
```typescript
// Articles table has type-specific fields
export const articles = pgTable('articles', {
  // Core fields (all types)
  type: articleTypeEnum('type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),

  // User-saved specific fields
  userId: text('user_id'), // Only for saved articles
  originalUrl: text('original_url'),
  parsedContent: text('parsed_content'),

  // Summary-specific fields
  summaryDate: timestamp('summary_date'),
  summaryPeriod: summaryPeriodEnum('summary_period'),
  includedArticleIds: uuid('included_article_ids').array(),

  // In-depth specific fields
  keyInsights: text('key_insights'), // JSON string
  dataVisualizations: text('data_visualizations'),
  relatedArticleIds: uuid('related_article_ids').array(),
});
```

### 4. User Interaction Types
```typescript
// Track different interaction types
export const interactionTypeEnum = pgEnum('interaction_type', [
  'view',
  'like',
  'bookmark',
  'share',
  'comment',
]);

// Interaction metadata as JSONB
metadata: jsonb('metadata'),
```

### 5. Index Strategy for News Feeds
```typescript
// Optimized for common query patterns
index('articles_type_idx').on(table.type),
index('articles_published_at_idx').on(table.publishedAt),
index('articles_user_idx').on(table.userId),
index('articles_category_idx').on(table.categoryId),
```

## Integration Points

### Used By
- News backend (NestJS) - article CRUD and feed generation
- AI summary services - creating time-based news summaries
- User content services - saving and organizing articles
- Analytics services - tracking engagement metrics

### Depends On
- `drizzle-orm` - ORM and query builder
- `postgres` - PostgreSQL client
- `drizzle-kit` - Migration tools

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string

## Database Schema Overview

### Core Tables

1. **users** - User accounts
   - id (text), email, name, avatarUrl
   - Preferences stored as JSONB (feed settings, notification preferences)
   - emailVerified, createdAt, updatedAt

2. **articles** - All article types
   - **Feed articles** (ai-generated news)
     - title, content, summary, sourceUrl, sourceName, author, imageUrl
     - categoryId, aiTags[], sentimentScore, readingTimeMinutes, wordCount

   - **Summary articles** (time-based aggregations)
     - summaryDate, summaryPeriod (morning/noon/evening/night)
     - includedArticleIds[] - references to aggregated articles

   - **In-depth articles** (detailed analysis)
     - keyInsights (JSON), dataVisualizations (JSON)
     - relatedArticleIds[] - related content

   - **Saved articles** (user bookmarks)
     - userId, originalUrl, parsedContent
     - isArchived flag

3. **categories** - Article categorization
   - name, slug, description, color, icon
   - parentId (for hierarchical categories)
   - isActive, displayOrder

4. **interactions** - User engagement tracking
   - userId, articleId, type (view/like/bookmark/share/comment)
   - metadata (JSONB) - additional interaction data
   - interactedAt timestamp

5. **auth_sessions** - Authentication sessions
   - id, userId, expiresAt
   - Session management for news platform

## Migration Workflow

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Push schema directly (dev only)
pnpm db:push

# Open Drizzle Studio
pnpm db:studio
```

## Common Queries

### Feed Generation
```typescript
import { createDb, eq, desc, and, inArray } from '@manacore/news-database';

const db = createDb(process.env.DATABASE_URL!);

// Get recent feed articles by category
const feedArticles = await db
  .select()
  .from(articles)
  .where(
    and(
      eq(articles.type, 'feed'),
      eq(articles.categoryId, categoryId)
    )
  )
  .orderBy(desc(articles.publishedAt))
  .limit(20);
```

### User Saved Articles
```typescript
// Get user's saved articles with category info
const savedArticles = await db
  .select({
    article: articles,
    category: categories,
  })
  .from(articles)
  .leftJoin(categories, eq(articles.categoryId, categories.id))
  .where(
    and(
      eq(articles.type, 'saved'),
      eq(articles.userId, userId),
      eq(articles.isArchived, false)
    )
  )
  .orderBy(desc(articles.createdAt));
```

### Summary with Included Articles
```typescript
// Get summary with all included articles
const summary = await db
  .select()
  .from(articles)
  .where(
    and(
      eq(articles.type, 'summary'),
      eq(articles.summaryPeriod, 'morning')
    )
  )
  .orderBy(desc(articles.summaryDate))
  .limit(1);

if (summary[0]?.includedArticleIds?.length) {
  const includedArticles = await db
    .select()
    .from(articles)
    .where(inArray(articles.id, summary[0].includedArticleIds));
}
```

### User Interactions
```typescript
// Track article view
await db.insert(interactions).values({
  userId,
  articleId,
  type: 'view',
  metadata: { source: 'feed', position: 3 },
});

// Get user's bookmarked articles
const bookmarks = await db
  .select()
  .from(interactions)
  .where(
    and(
      eq(interactions.userId, userId),
      eq(interactions.type, 'bookmark')
    )
  )
  .orderBy(desc(interactions.interactedAt));
```

## Article Type Patterns

### Feed Article
```typescript
{
  type: 'feed',
  sourceOrigin: 'ai',
  title: 'Breaking Tech News',
  content: 'Full article content...',
  summary: 'Brief summary...',
  categoryId: '...',
  sourceUrl: 'https://source.com/article',
  sourceName: 'TechCrunch',
  aiTags: ['technology', 'ai', 'startup'],
  sentimentScore: 0.8,
  readingTimeMinutes: 5,
  wordCount: 1200
}
```

### Summary Article
```typescript
{
  type: 'summary',
  sourceOrigin: 'ai',
  title: 'Morning Tech Briefing',
  content: 'Summary of today\'s tech news...',
  summaryDate: new Date('2024-01-15'),
  summaryPeriod: 'morning',
  includedArticleIds: ['uuid1', 'uuid2', 'uuid3']
}
```

### User-Saved Article
```typescript
{
  type: 'saved',
  sourceOrigin: 'user_saved',
  userId: 'user123',
  originalUrl: 'https://example.com/article',
  parsedContent: 'Extracted article text...',
  isArchived: false
}
```

## How to Use
```
"Read packages/news-database/.agent/ and help me with..."
- Designing article schema extensions
- Optimizing feed queries
- Understanding summary aggregation
- Adding new interaction types
- Debugging article categorization
- Setting up AI tagging
```
