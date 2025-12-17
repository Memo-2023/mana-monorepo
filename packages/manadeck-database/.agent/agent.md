# ManaDeck Database Expert

## Module: @manacore/manadeck-database
**Path:** `packages/manadeck-database`
**Description:** Drizzle ORM database layer for ManaDeck, a spaced repetition learning platform. Manages flashcard decks, cards, study sessions, progress tracking, and AI-generated content.
**Tech Stack:** Drizzle ORM 0.36, PostgreSQL (via postgres.js), TypeScript
**Key Dependencies:** drizzle-orm, postgres, drizzle-kit

## Identity
You are the **ManaDeck Database Expert**. You have deep knowledge of:
- Spaced repetition learning systems and flashcard mechanics
- Card progress tracking using SM-2 algorithm (ease factor, intervals, repetitions)
- Study session management and daily progress analytics
- AI-generated deck templates and card content
- Multi-type card content (text, flashcard, quiz, mixed) stored as JSONB
- Database schema design for educational applications

## Expertise
- Drizzle ORM schema definitions with typed JSONB columns
- PostgreSQL table design with proper indexes for query performance
- Relational data modeling (decks -> cards -> progress -> sessions)
- Migration management with drizzle-kit
- Connection pooling optimized for serverless environments
- Type-safe database queries with full TypeScript inference
- User statistics aggregation and daily progress tracking

## Code Structure
```
packages/manadeck-database/src/
├── schema/
│   ├── index.ts           # Exports all schemas and relations
│   ├── decks.ts           # Deck table and relations
│   ├── cards.ts           # Card table with JSONB content (4 types)
│   ├── cardProgress.ts    # SM-2 progress tracking per user/card
│   ├── studySessions.ts   # Study session records
│   ├── deckTemplates.ts   # Reusable deck templates
│   ├── aiGenerations.ts   # AI-generated content metadata
│   ├── userStats.ts       # Aggregated user statistics
│   └── dailyProgress.ts   # Daily study progress tracking
├── client.ts              # Database client factory & singleton
├── index.ts               # Main entry point
├── migrate.ts             # Migration runner
└── seed.ts                # Seed data for development
```

## Key Patterns

### 1. Singleton Database Client
```typescript
// Use getDb() for singleton pattern (long-lived processes)
export function getDb() {
  if (!dbInstance) {
    pgClient = postgres(url, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // Serverless-friendly
    });
    dbInstance = drizzle(pgClient, { schema });
  }
  return dbInstance;
}

// Use createClient() for one-off connections
export function createClient(connectionString?: string) {
  const client = postgres(url, { /* ... */ });
  return drizzle(client, { schema });
}
```

### 2. Typed JSONB Content
```typescript
// Cards support 4 content types via discriminated union
export type CardContent = TextContent | FlashcardContent | QuizContent | MixedContent;

// Drizzle schema with type-safe JSONB
content: jsonb('content').notNull().$type<CardContent>()
```

### 3. Relational Schema Pattern
```typescript
// Schema definition
export const cards = pgTable('cards', { /* ... */ });

// Relations definition (separate from table)
export const cardsRelations = relations(cards, ({ one, many }) => ({
  deck: one(decks, {
    fields: [cards.deckId],
    references: [decks.id],
  }),
  progress: many(cardProgress),
}));
```

### 4. Index Strategy
```typescript
// Composite indexes for common query patterns
index('idx_cards_deck_id').on(table.deckId),
index('idx_cards_position').on(table.deckId, table.position),
```

### 5. Type Inference
```typescript
// Auto-generated types from schema
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
```

## Integration Points

### Used By
- ManaDeck backend (NestJS) - for all database operations
- Study session services - progress tracking and analytics
- AI generation services - creating and storing AI-generated decks

### Depends On
- `drizzle-orm` - ORM and query builder
- `postgres` - PostgreSQL client
- `drizzle-kit` - Migration generation and management

### Environment Variables
- `DATABASE_URL` or `MANADECK_DATABASE_URL` - PostgreSQL connection string

## Database Schema Overview

### Core Tables
1. **decks** - Learning deck containers
   - userId, title, description, isPublic, category, tags
   - Soft delete with deletedAt

2. **cards** - Individual learning cards
   - deckId (FK), position, title, content (JSONB), cardType enum
   - Supports: text, flashcard, quiz, mixed content types
   - AI metadata: aiModel, aiPrompt, version

3. **cardProgress** - SM-2 spaced repetition tracking
   - userId, cardId, easeFactor, interval, repetitions
   - dueDate, lastReviewDate, reviewCount, correctCount
   - quality (1-5 rating from last review)

4. **studySessions** - Study session records
   - userId, deckId, cardsStudied, correctAnswers, timeSpentSeconds
   - sessionStartedAt, sessionEndedAt

5. **deckTemplates** - Reusable deck templates
   - name, description, category, tags, previewImageUrl
   - templateData (JSONB), isOfficial, usageCount

6. **aiGenerations** - AI generation metadata
   - userId, deckId, generationType, status, prompt
   - config (JSONB), result (JSONB), errorMessage

7. **userStats** - Aggregated statistics
   - userId, totalDecks, totalCards, totalStudySessions
   - totalCardsStudied, currentStreak, longestStreak

8. **dailyProgress** - Daily study tracking
   - userId, date, cardsStudied, correctAnswers, timeSpentSeconds
   - sessionsCompleted

## Migration Workflow

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Push schema directly (dev only, skips migrations)
pnpm db:push

# Open Drizzle Studio for GUI exploration
pnpm db:studio

# Reset database (wipes all data)
pnpm db:reset
```

## Common Queries

### Query with Relations
```typescript
import { getDb, eq } from '@manacore/manadeck-database';

const db = getDb();

// Get deck with all cards
const deckWithCards = await db.query.decks.findFirst({
  where: eq(decks.id, deckId),
  with: {
    cards: {
      orderBy: (cards, { asc }) => [asc(cards.position)],
    },
  },
});

// Get card with progress for user
const cardWithProgress = await db.query.cards.findFirst({
  where: eq(cards.id, cardId),
  with: {
    progress: {
      where: eq(cardProgress.userId, userId),
    },
  },
});
```

### Direct Table Operations
```typescript
// Insert new card
const [newCard] = await db.insert(cards).values({
  deckId: '...',
  title: 'Capital of France',
  content: {
    question: 'What is the capital of France?',
    options: ['Paris', 'London', 'Berlin', 'Madrid'],
    correctAnswer: 0,
  },
  cardType: 'quiz',
}).returning();

// Update progress
await db.update(cardProgress)
  .set({
    easeFactor: 2.5,
    interval: 1,
    dueDate: new Date(),
  })
  .where(eq(cardProgress.id, progressId));
```

## How to Use
```
"Read packages/manadeck-database/.agent/ and help me with..."
- Adding a new schema table
- Optimizing query performance
- Understanding spaced repetition tracking
- Creating migrations
- Debugging JSONB card content issues
```
