# Database Guidelines

## Overview

All projects use **Drizzle ORM** with **PostgreSQL**. This document covers schema design patterns, naming conventions, and migration strategies.

## ORM: Drizzle

### Why Drizzle?

- Full TypeScript type inference
- SQL-like syntax (no magic)
- Lightweight and fast
- Excellent PostgreSQL support

### Connection Pattern

```typescript
// src/db/connection.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let connection: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getConnection(databaseUrl: string) {
	if (!connection) {
		connection = postgres(databaseUrl, {
			max: 10, // Max connections
			idle_timeout: 20, // Seconds before closing idle
			connect_timeout: 10, // Connection timeout
		});
	}
	return connection;
}

export function getDb(databaseUrl: string) {
	if (!db) {
		const conn = getConnection(databaseUrl);
		db = drizzle(conn, { schema });
	}
	return db;
}

export async function closeConnection() {
	if (connection) {
		await connection.end();
		connection = null;
		db = null;
	}
}

export type Database = ReturnType<typeof getDb>;
```

### NestJS Integration

```typescript
// src/db/database.module.ts
import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getDb, closeConnection, Database } from './connection';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
	providers: [
		{
			provide: DATABASE_CONNECTION,
			useFactory: (configService: ConfigService): Database => {
				const databaseUrl = configService.get<string>('DATABASE_URL');
				return getDb(databaseUrl);
			},
			inject: [ConfigService],
		},
	],
	exports: [DATABASE_CONNECTION],
})
export class DatabaseModule implements OnModuleDestroy {
	async onModuleDestroy() {
		await closeConnection();
	}
}
```

## Schema Isolation (`pgSchema`)

**CRITICAL**: Every service and app that shares the `mana_platform` database MUST namespace its tables under its own PostgreSQL schema using `pgSchema('<name>').table(...)`. Never use raw `pgTable()` in this monorepo.

### Why

`mana_platform` is the one shared database for all services (see root `CLAUDE.md`). Without a schema prefix, a new `users` table in one service would collide with `users` in another. The Postgres schema acts as a namespace and as an RLS boundary — it's the mechanism by which `mana-auth`'s `auth.users` and e.g. `mana-credits`' `credits.balances` coexist cleanly.

### Pattern

```typescript
// src/db/schema/auth.ts
import { pgSchema, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// One schema instance per file (or per service — export from index.ts).
export const authSchema = pgSchema('auth');

// Tables hang off the schema, NOT off `pgTable`.
export const users = authSchema.table('users', {
	id: text('id').primaryKey(),
	email: text('email').unique().notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Schema naming

| Service              | Schema                      |
| -------------------- | --------------------------- |
| `mana-auth`          | `auth`                      |
| `mana-credits`       | `credits`                   |
| `mana-user`          | `usr`                       |
| `mana-events`        | `events`, `event_discovery` |
| `mana-mail`          | `mail`                      |
| `mana-research`      | `research`                  |
| `mana-subscriptions` | `subscriptions`             |
| `mana-analytics`     | `feedback`                  |

New services: pick a short, unambiguous name (`auth`, not `mana_auth_schema`), add it here, and keep it stable — renaming a schema is a breaking migration.

### The `mana_sync` exception

`mana_sync` is its own database (not part of `mana_platform`), and its tables are append-only write-heavy. It uses raw `pgTable()` — no multi-schema tenancy. Service-owned projections on top of `mana_sync` (e.g. `mana-ai` → `mana_ai.mission_snapshots`) DO use `pgSchema()` to stay out of the core sync engine's namespace.

### Verification

Before merging a change that adds a new Drizzle schema file, confirm with:

```bash
rg "pgTable\(" services/ apps/api/ packages/ --type ts
```

Any hit that's not inside `mana-sync` is a violation. There's no automated lint rule yet — adding one is tracked in the architecture audit.

## Schema Design

### File Organization

```
src/db/
├── schema/
│   ├── index.ts           # Exports all schemas
│   ├── users.schema.ts    # User-related tables
│   ├── files.schema.ts    # File-related tables
│   └── ...
├── connection.ts          # DB connection singleton
├── database.module.ts     # NestJS module
└── migrations/            # Generated migrations
```

### User ID Column Type

**CRITICAL**: Always use `text` for `user_id` columns, NOT `uuid`.

Mana Core Auth (Better Auth) generates non-UUID user IDs:

```
Example: otUe1YrfENPdHnrF3g1vSBfpkQfambCZ
```

```typescript
// CORRECT
userId: text('user_id').notNull(),

// WRONG - causes "invalid input syntax for type uuid" errors
userId: uuid('user_id').notNull(),
```

See [Authentication Guidelines](./authentication.md#user-id-format) for details.

### Table Definition Pattern

```typescript
// src/db/schema/files.schema.ts
import {
	pgSchema,
	uuid,
	varchar,
	text,
	boolean,
	timestamp,
	bigint,
	integer,
	index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Namespace this service's tables — see "Schema Isolation" above.
export const storageSchema = pgSchema('storage');

export const files = storageSchema.table(
	'files',
	{
		// Primary key - always UUID with auto-generation
		id: uuid('id').primaryKey().defaultRandom(),

		// User ID - always TEXT (Better Auth uses non-UUID format)
		userId: text('user_id').notNull(),

		// Foreign keys to other tables (UUIDs are fine)
		parentFolderId: uuid('parent_folder_id').references(() => folders.id, { onDelete: 'set null' }),

		// Required fields
		name: varchar('name', { length: 500 }).notNull(),
		mimeType: varchar('mime_type', { length: 255 }).notNull(),
		size: bigint('size', { mode: 'number' }).notNull(),
		storagePath: varchar('storage_path', { length: 1000 }).notNull(),
		storageKey: varchar('storage_key', { length: 500 }).notNull().unique(),

		// Optional fields
		description: text('description'),

		// Boolean flags with defaults
		isFavorite: boolean('is_favorite').default(false).notNull(),
		isPublic: boolean('is_public').default(false).notNull(),

		// Soft delete
		isDeleted: boolean('is_deleted').default(false).notNull(),
		deletedAt: timestamp('deleted_at', { withTimezone: true }),

		// Timestamps - ALWAYS include these
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		// Indexes for common queries
		userIdIdx: index('idx_files_user_id').on(table.userId),
		parentFolderIdx: index('idx_files_parent_folder').on(table.parentFolderId),
		createdAtIdx: index('idx_files_created_at').on(table.createdAt),
	})
);

// Type exports - ALWAYS include these
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
```

### Relations

```typescript
// Define relations separately for clarity
export const filesRelations = relations(files, ({ one, many }) => ({
	folder: one(folders, {
		fields: [files.parentFolderId],
		references: [folders.id],
	}),
	versions: many(fileVersions),
	tags: many(fileTags),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
	parent: one(folders, {
		fields: [folders.parentFolderId],
		references: [folders.id],
		relationName: 'parentChild',
	}),
	children: many(folders, { relationName: 'parentChild' }),
	files: many(files),
}));
```

## Naming Conventions

### Tables

| Rule                                   | Example                          |
| -------------------------------------- | -------------------------------- |
| Use snake_case                         | `user_sessions`, `file_versions` |
| Use plural nouns                       | `users`, `files`, `tags`         |
| Junction tables: `{entity1}_{entity2}` | `file_tags`, `user_roles`        |

### Columns

| Type        | Convention                     | Example                      |
| ----------- | ------------------------------ | ---------------------------- |
| Primary key | `id`                           | `id`                         |
| Foreign key | `{entity}_id`                  | `user_id`, `folder_id`       |
| Boolean     | `is_` or `has_` prefix         | `is_deleted`, `has_password` |
| Timestamp   | `_at` suffix                   | `created_at`, `deleted_at`   |
| Count       | `_count` suffix                | `download_count`             |
| Version     | `version` or `current_version` | `version`                    |

### Indexes

```typescript
// Pattern: idx_{table}_{column(s)}
index('idx_files_user_id').on(table.userId);
index('idx_files_created_at').on(table.createdAt);
index('idx_messages_conversation_created').on(table.conversationId, table.createdAt);
```

## Common Patterns

### 1. Soft Deletes

```typescript
// Schema
isDeleted: boolean('is_deleted').default(false).notNull(),
deletedAt: timestamp('deleted_at', { withTimezone: true }),

// Query - always filter out deleted
const activeFiles = await db
  .select()
  .from(files)
  .where(and(
    eq(files.userId, userId),
    eq(files.isDeleted, false)  // Always include this
  ));

// Soft delete
await db
  .update(files)
  .set({ isDeleted: true, deletedAt: new Date() })
  .where(eq(files.id, fileId));

// Hard delete (permanent)
await db
  .delete(files)
  .where(eq(files.id, fileId));
```

### 2. Timestamps

```typescript
// Schema - always include both
createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),

// Update - always set updatedAt
await db
  .update(files)
  .set({ name: newName, updatedAt: new Date() })
  .where(eq(files.id, fileId));
```

### 3. Optimistic Locking (for concurrent updates)

```typescript
// Schema
version: integer('version').default(1).notNull(),

// Update with version check
const [updated] = await db
  .update(balances)
  .set({
    amount: newAmount,
    version: sql`version + 1`,
    updatedAt: new Date(),
  })
  .where(and(
    eq(balances.userId, userId),
    eq(balances.version, currentVersion)  // Only update if version matches
  ))
  .returning();

if (!updated) {
  return err(ErrorCode.CONFLICT, 'Balance was modified by another operation');
}
```

### 4. JSONB for Flexible Data

```typescript
// Schema
metadata: jsonb('metadata').$type<Record<string, unknown>>(),
settings: jsonb('settings').default({}).$type<UserSettings>(),
tags: jsonb('tags').$type<string[]>().default([]),

// Query JSONB
const usersWithTag = await db
  .select()
  .from(users)
  .where(sql`${users.tags} @> '["premium"]'::jsonb`);
```

### 5. Enums

```typescript
// Define enum
export const transactionTypeEnum = pgEnum('transaction_type', [
  'purchase',
  'usage',
  'refund',
  'bonus',
  'adjustment',
]);

// Use in table
type: transactionTypeEnum('type').notNull(),

// TypeScript type
type TransactionType = typeof transactionTypeEnum.enumValues[number];
```

### 6. Pagination

```typescript
async function getPaginated(
	userId: string,
	page: number = 1,
	limit: number = 20
): Promise<Result<{ items: File[]; total: number }>> {
	const offset = (page - 1) * limit;

	const [items, countResult] = await Promise.all([
		db
			.select()
			.from(files)
			.where(and(eq(files.userId, userId), eq(files.isDeleted, false)))
			.orderBy(desc(files.createdAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)` })
			.from(files)
			.where(and(eq(files.userId, userId), eq(files.isDeleted, false))),
	]);

	return ok({ items, total: countResult[0].count });
}
```

## Migrations

> **Comprehensive Documentation**: See **[docs/DATABASE_MIGRATIONS.md](/docs/DATABASE_MIGRATIONS.md)** for full migration internals, CI/CD integration, zero-downtime patterns, and troubleshooting.

### Quick Reference

| Environment     | Command           | Purpose                         |
| --------------- | ----------------- | ------------------------------- |
| **Development** | `pnpm db:push`    | Fast iteration, direct sync     |
| **Production**  | `pnpm db:migrate` | Tracked migrations with history |

### Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/db/schema/index.ts',
	out: './src/db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
	verbose: true,
	strict: true,
});
```

### Commands

```bash
# Development - push schema directly (fast, no history)
pnpm db:push

# Production - generate and run migrations
pnpm db:generate --name add_user_preferences
pnpm db:migrate

# Open Drizzle Studio for database inspection
pnpm db:studio
```

### Migration Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Which command should I use?                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Local development?                                              │
│  └── YES → pnpm db:push (fast, no tracking)                     │
│                                                                  │
│  Staging/Production?                                             │
│  └── YES → pnpm db:generate + pnpm db:migrate (tracked)         │
│                                                                  │
│  Schema changed by someone else?                                 │
│  └── YES → git pull + pnpm db:push (local)                      │
│            git pull + pnpm db:migrate (staging/prod)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Concepts

1. **Advisory Locks**: Migrations use PostgreSQL advisory locks to prevent concurrent execution
2. **Migration Tracking**: `__drizzle_migrations` table + `meta/_journal.json` file
3. **Migrations run BEFORE code deployment**: Ensures database is ready for new code
4. **Never modify applied migrations**: Create new migrations instead
5. **Zero-downtime**: Use expand-contract pattern for breaking schema changes

### Production Migration Script

Production backends use a migration script with advisory locks:

```typescript
// src/db/migrate.ts - Key features:
// - Advisory lock (pg_try_advisory_lock) prevents concurrent migrations
// - Retry logic with exponential backoff for transient failures
// - Timeout protection (default 5 minutes)
// - Graceful handling when no migrations exist

const MIGRATION_LOCK_ID = 987654321; // Unique per service

async function acquireLock(db) {
	const result = await db.execute(
		sql`SELECT pg_try_advisory_lock(${MIGRATION_LOCK_ID}) as acquired`
	);
	return result[0]?.acquired === true;
}
```

See `services/mana-core-auth/src/db/migrate.ts` for the full implementation.

### Best Practices

**DO:**

- Run migrations before deploying new code
- Test migrations in staging before production
- Use `CONCURRENTLY` for index creation
- Keep migrations small and focused
- Commit migration files to version control

**DON'T:**

- Run `db:push` in production
- Delete or modify applied migrations
- Add NOT NULL without default or backfill
- Drop columns immediately (wait 1-2 weeks)

## Query Patterns

### Select with Joins

```typescript
const filesWithTags = await db
	.select({
		file: files,
		tags: sql<string[]>`array_agg(${tags.name})`,
	})
	.from(files)
	.leftJoin(fileTags, eq(files.id, fileTags.fileId))
	.leftJoin(tags, eq(fileTags.tagId, tags.id))
	.where(eq(files.userId, userId))
	.groupBy(files.id);
```

### Transactions

```typescript
const result = await db.transaction(async (tx) => {
	// All operations in same transaction
	const [file] = await tx.insert(files).values(newFile).returning();

	await tx.insert(fileVersions).values({ fileId: file.id, versionNumber: 1 });

	return file;
});
```

### Upsert

```typescript
await db
	.insert(userSettings)
	.values({ userId, theme: 'dark' })
	.onConflictDoUpdate({
		target: userSettings.userId,
		set: { theme: 'dark', updatedAt: new Date() },
	});
```

## Anti-Patterns

### 1. N+1 Queries

```typescript
// BAD - N+1 queries
const files = await db.select().from(files);
for (const file of files) {
	const tags = await db.select().from(tags).where(eq(tags.fileId, file.id)); // N queries!
}

// GOOD - Single query with join
const filesWithTags = await db
	.select()
	.from(files)
	.leftJoin(fileTags, eq(files.id, fileTags.fileId))
	.leftJoin(tags, eq(fileTags.tagId, tags.id));
```

### 2. Missing Indexes

```typescript
// If you frequently query by a column, add an index
// BAD - No index on frequently queried column
const userFiles = await db.select().from(files).where(eq(files.userId, userId));

// GOOD - Index defined in schema
}, (table) => ({
  userIdIdx: index('idx_files_user_id').on(table.userId),
}));
```

### 3. Storing Derived Data

```typescript
// BAD - Storing calculated totals that can become stale
totalFiles: integer('total_files'),

// GOOD - Calculate when needed
const { count } = await db
  .select({ count: sql<number>`count(*)` })
  .from(files)
  .where(eq(files.folderId, folderId));
```
