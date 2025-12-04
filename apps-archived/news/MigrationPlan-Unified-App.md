# Migrationsplan: Unified News Hub

## Übersicht

Migration von **ainews** + **kokon** zu einer vereinten App mit:
- **PostgreSQL** (Docker lokal, später Cloud)
- **Drizzle ORM** (Type-safe Database)
- **NestJS** (Backend API)
- **Better Auth** (Authentication)

---

## Ziel-Architektur

```
news/
├── apps/
│   ├── mobile/              # React Native/Expo App (vereint)
│   └── api/                 # NestJS Backend
├── packages/
│   ├── database/            # Drizzle Schema + Migrations
│   ├── shared/              # Shared Types & Utilities
│   └── browser-extension/   # Chrome Extension
├── docker/
│   └── docker-compose.yml   # PostgreSQL + Dev Services
├── package.json             # Monorepo Root (pnpm workspaces)
└── turbo.json               # Turborepo Config (optional)
```

### Datenfluss

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│   NestJS API    │────▶│   PostgreSQL    │
│  (Expo/RN)      │◀────│   + Better Auth │◀────│   (Docker)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │              ┌────────┴────────┐
         │              │                 │
┌────────▼────────┐     │    ┌───────────▼───────────┐
│ Browser Extension│─────┘    │  Content Extraction   │
│ (Chrome/Firefox) │          │  (Readability)        │
└─────────────────┘           └───────────────────────┘
```

---

## Phase 1: Monorepo Setup

### 1.1 Projekt-Struktur erstellen

```bash
# Im news/ Ordner
pnpm init

# Workspace-Struktur
mkdir -p apps/mobile apps/api packages/database packages/shared packages/browser-extension docker
```

### 1.2 Root `package.json`

```json
{
  "name": "news-hub",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "db:generate": "turbo run db:generate --filter=@news/database",
    "db:migrate": "turbo run db:migrate --filter=@news/database",
    "db:studio": "turbo run db:studio --filter=@news/database"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "packageManager": "pnpm@9.0.0",
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

### 1.3 `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:generate": {},
    "db:migrate": {},
    "db:studio": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## Phase 2: Docker Setup

### 2.1 `docker/docker-compose.yml`

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: news-hub-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: news
      POSTGRES_PASSWORD: news_dev_password
      POSTGRES_DB: news_hub
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U news -d news_hub"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Optional: pgAdmin für DB-Verwaltung
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: news-hub-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@local.dev
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### 2.2 `docker/init.sql`

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Für Textsuche

-- Grants
GRANT ALL PRIVILEGES ON DATABASE news_hub TO news;
```

### 2.3 Start-Script in Root `package.json`

```json
{
  "scripts": {
    "docker:up": "docker-compose -f docker/docker-compose.yml up -d",
    "docker:down": "docker-compose -f docker/docker-compose.yml down",
    "docker:logs": "docker-compose -f docker/docker-compose.yml logs -f"
  }
}
```

---

## Phase 3: Database Package (Drizzle)

### 3.1 `packages/database/package.json`

```json
{
  "name": "@news/database",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.0",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0"
  }
}
```

### 3.2 `packages/database/drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://news:news_dev_password@localhost:5432/news_hub',
  },
});
```

### 3.3 `packages/database/src/schema/index.ts`

```typescript
export * from './users';
export * from './articles';
export * from './categories';
export * from './interactions';
export * from './auth';
```

### 3.4 `packages/database/src/schema/users.ts`

```typescript
import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const userTierEnum = pgEnum('user_tier', ['free', 'premium', 'enterprise']);
export const readingSpeedEnum = pgEnum('reading_speed', ['slow', 'normal', 'fast']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),

  // Preferences
  tier: userTierEnum('tier').default('free').notNull(),
  readingSpeed: readingSpeedEnum('reading_speed').default('normal').notNull(),
  preferredCategories: text('preferred_categories').array(),
  blockedSources: text('blocked_sources').array(),

  // Settings
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  notificationSettings: text('notification_settings'), // JSON string

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### 3.5 `packages/database/src/schema/articles.ts`

```typescript
import { pgTable, uuid, text, timestamp, boolean, integer, real, pgEnum, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { categories } from './categories';

export const articleTypeEnum = pgEnum('article_type', ['feed', 'summary', 'in_depth', 'saved']);
export const articleSourceEnum = pgEnum('article_source', ['ai', 'user_saved']);
export const summaryPeriodEnum = pgEnum('summary_period', ['morning', 'noon', 'evening', 'night']);

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Core fields
  type: articleTypeEnum('type').notNull(),
  sourceOrigin: articleSourceEnum('source_origin').default('ai').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  summary: text('summary'),

  // For user-saved articles
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  originalUrl: text('original_url'),
  parsedContent: text('parsed_content'),
  isArchived: boolean('is_archived').default(false),

  // Metadata
  categoryId: uuid('category_id').references(() => categories.id),
  sourceUrl: text('source_url'),
  sourceName: text('source_name'),
  sourceDomain: text('source_domain'),
  author: text('author'),
  imageUrl: text('image_url'),

  // AI-generated metadata
  aiTags: text('ai_tags').array(),
  sentimentScore: real('sentiment_score'),

  // Reading metrics
  readingTimeMinutes: integer('reading_time_minutes'),
  wordCount: integer('word_count'),

  // Summary-specific fields
  summaryDate: timestamp('summary_date'),
  summaryPeriod: summaryPeriodEnum('summary_period'),
  includedArticleIds: uuid('included_article_ids').array(),

  // In-depth specific fields
  keyInsights: text('key_insights'), // JSON string
  dataVisualizations: text('data_visualizations'), // JSON string
  relatedArticleIds: uuid('related_article_ids').array(),

  // Timestamps
  publishedAt: timestamp('published_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Indexes für schnelle Abfragen
  typeIdx: index('articles_type_idx').on(table.type),
  userIdx: index('articles_user_idx').on(table.userId),
  sourceOriginIdx: index('articles_source_origin_idx').on(table.sourceOrigin),
  publishedAtIdx: index('articles_published_at_idx').on(table.publishedAt),
  categoryIdx: index('articles_category_idx').on(table.categoryId),
}));

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
```

### 3.6 `packages/database/src/schema/categories.ts`

```typescript
import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  icon: text('icon'),
  color: text('color'),
  priority: integer('priority').default(0).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
```

### 3.7 `packages/database/src/schema/interactions.ts`

```typescript
import { pgTable, uuid, timestamp, boolean, real, integer, index, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { articles } from './articles';

export const userArticleInteractions = pgTable('user_article_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),

  // Interaction states
  isRead: boolean('is_read').default(false).notNull(),
  isSaved: boolean('is_saved').default(false).notNull(),
  readProgress: real('read_progress').default(0), // 0.0 to 1.0
  rating: integer('rating'), // 1-5
  shareCount: integer('share_count').default(0).notNull(),

  // Timestamps
  openedAt: timestamp('opened_at'),
  readAt: timestamp('read_at'),
  savedAt: timestamp('saved_at'),
  ratedAt: timestamp('rated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: ein User kann nur eine Interaction pro Artikel haben
  userArticleUnique: unique('user_article_unique').on(table.userId, table.articleId),
  // Indexes
  userIdx: index('interactions_user_idx').on(table.userId),
  articleIdx: index('interactions_article_idx').on(table.articleId),
}));

export type UserArticleInteraction = typeof userArticleInteractions.$inferSelect;
export type NewUserArticleInteraction = typeof userArticleInteractions.$inferInsert;
```

### 3.8 `packages/database/src/schema/auth.ts` (Better Auth)

```typescript
import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

// Better Auth Sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Better Auth Accounts (OAuth providers)
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  providerId: text('provider_id').notNull(), // 'email', 'google', 'apple', etc.
  providerAccountId: text('provider_account_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'), // Hashed, only for email provider
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Better Auth Verification Tokens (Email verification, password reset)
export const verificationTokens = pgTable('verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  type: text('type').notNull(), // 'email_verification', 'password_reset'
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 3.9 `packages/database/src/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export * from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://news:news_dev_password@localhost:5432/news_hub';

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// For migrations (uses different client settings)
export const createMigrationClient = () => {
  const migrationClient = postgres(connectionString, { max: 1 });
  return drizzle(migrationClient, { schema });
};
```

---

## Phase 4: NestJS Backend

### 4.1 `apps/api/package.json`

```json
{
  "name": "@news/api",
  "version": "1.0.0",
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "nest start",
    "start:prod": "node dist/main"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-fastify": "^10.0.0",
    "@news/database": "workspace:*",
    "better-auth": "^1.0.0",
    "@mozilla/readability": "^0.5.0",
    "jsdom": "^24.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0"
  }
}
```

### 4.2 `apps/api/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  app.enableCors({
    origin: [
      'http://localhost:8081',  // Expo web
      'http://localhost:19006', // Expo web alt
      'exp://*',                // Expo Go
    ],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  await app.listen(3000, '0.0.0.0');
  console.log('API running on http://localhost:3000');
}

bootstrap();
```

### 4.3 `apps/api/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module';
import { ContentExtractionModule } from './content-extraction/content-extraction.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ArticlesModule,
    CategoriesModule,
    UsersModule,
    ContentExtractionModule,
  ],
})
export class AppModule {}
```

### 4.4 `apps/api/src/database/database.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { db } from '@news/database';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useValue: db,
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
```

### 4.5 `apps/api/src/auth/auth.module.ts` (Better Auth)

```typescript
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BetterAuthService } from './better-auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, BetterAuthService],
  exports: [AuthService, BetterAuthService],
})
export class AuthModule {}
```

### 4.6 `apps/api/src/auth/better-auth.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db, users, sessions, accounts, verificationTokens } from '@news/database';

@Injectable()
export class BetterAuthService {
  public auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verificationTokens,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Für MVP erstmal aus
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    // Optional: OAuth providers
    // socialProviders: {
    //   google: {
    //     clientId: process.env.GOOGLE_CLIENT_ID!,
    //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //   },
    //   apple: {
    //     clientId: process.env.APPLE_CLIENT_ID!,
    //     clientSecret: process.env.APPLE_CLIENT_SECRET!,
    //   },
    // },
  });
}
```

### 4.7 `apps/api/src/auth/auth.controller.ts`

```typescript
import { Controller, Post, Get, Body, Req, Res, UseGuards } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { BetterAuthService } from './better-auth.service';

@Controller('auth')
export class AuthController {
  constructor(private betterAuth: BetterAuthService) {}

  @Post('signup')
  async signUp(
    @Body() body: { email: string; password: string; name?: string },
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    return this.betterAuth.auth.api.signUpEmail({
      body,
      headers: req.headers as any,
    });
  }

  @Post('signin')
  async signIn(
    @Body() body: { email: string; password: string },
    @Req() req: FastifyRequest,
  ) {
    return this.betterAuth.auth.api.signInEmail({
      body,
      headers: req.headers as any,
    });
  }

  @Post('signout')
  async signOut(@Req() req: FastifyRequest) {
    return this.betterAuth.auth.api.signOut({
      headers: req.headers as any,
    });
  }

  @Get('session')
  async getSession(@Req() req: FastifyRequest) {
    return this.betterAuth.auth.api.getSession({
      headers: req.headers as any,
    });
  }
}
```

### 4.8 `apps/api/src/articles/articles.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
```

### 4.9 `apps/api/src/articles/articles.service.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { db, articles, Article, NewArticle } from '@news/database';

@Injectable()
export class ArticlesService {
  constructor(@Inject(DATABASE_CONNECTION) private db: typeof db) {}

  // AI-generierte Artikel (feed, summary, in_depth)
  async getAIArticles(options: {
    type?: 'feed' | 'summary' | 'in_depth';
    categoryId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Article[]> {
    const { type, categoryId, limit = 20, offset = 0 } = options;

    let query = this.db
      .select()
      .from(articles)
      .where(eq(articles.sourceOrigin, 'ai'))
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);

    if (type) {
      query = query.where(and(
        eq(articles.sourceOrigin, 'ai'),
        eq(articles.type, type)
      ));
    }

    if (categoryId) {
      query = query.where(and(
        eq(articles.sourceOrigin, 'ai'),
        eq(articles.categoryId, categoryId)
      ));
    }

    return query;
  }

  // User-gespeicherte Artikel
  async getSavedArticles(userId: string, includeArchived = false): Promise<Article[]> {
    const conditions = [
      eq(articles.sourceOrigin, 'user_saved'),
      eq(articles.userId, userId),
    ];

    if (!includeArchived) {
      conditions.push(eq(articles.isArchived, false));
    }

    return this.db
      .select()
      .from(articles)
      .where(and(...conditions))
      .orderBy(desc(articles.createdAt));
  }

  // Artikel speichern (für Content Extraction)
  async createSavedArticle(data: {
    userId: string;
    title: string;
    content: string;
    parsedContent: string;
    originalUrl: string;
  }): Promise<Article> {
    const [article] = await this.db
      .insert(articles)
      .values({
        type: 'saved',
        sourceOrigin: 'user_saved',
        userId: data.userId,
        title: data.title,
        content: data.content,
        parsedContent: data.parsedContent,
        originalUrl: data.originalUrl,
        isArchived: false,
      })
      .returning();

    return article;
  }

  // Artikel archivieren
  async archiveArticle(articleId: string, userId: string): Promise<void> {
    await this.db
      .update(articles)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(
        eq(articles.id, articleId),
        eq(articles.userId, userId)
      ));
  }

  // Artikel löschen
  async deleteArticle(articleId: string, userId: string): Promise<void> {
    await this.db
      .delete(articles)
      .where(and(
        eq(articles.id, articleId),
        eq(articles.userId, userId)
      ));
  }

  // Einzelnen Artikel laden
  async getArticleById(articleId: string): Promise<Article | null> {
    const [article] = await this.db
      .select()
      .from(articles)
      .where(eq(articles.id, articleId))
      .limit(1);

    return article || null;
  }
}
```

### 4.10 `apps/api/src/articles/articles.controller.ts`

```typescript
import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticlesService) {}

  // Öffentliche AI-Artikel
  @Get()
  async getArticles(
    @Query('type') type?: 'feed' | 'summary' | 'in_depth',
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.articlesService.getAIArticles({
      type,
      categoryId,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  // Einzelner Artikel
  @Get(':id')
  async getArticle(@Param('id') id: string) {
    return this.articlesService.getArticleById(id);
  }

  // Gespeicherte Artikel (Auth required)
  @Get('saved')
  @UseGuards(AuthGuard)
  async getSavedArticles(
    @Req() req: any,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.articlesService.getSavedArticles(
      req.user.id,
      includeArchived === 'true'
    );
  }

  // Artikel archivieren
  @Post(':id/archive')
  @UseGuards(AuthGuard)
  async archiveArticle(@Param('id') id: string, @Req() req: any) {
    await this.articlesService.archiveArticle(id, req.user.id);
    return { success: true };
  }

  // Artikel löschen
  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteArticle(@Param('id') id: string, @Req() req: any) {
    await this.articlesService.deleteArticle(id, req.user.id);
    return { success: true };
  }
}
```

### 4.11 `apps/api/src/content-extraction/content-extraction.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { ArticlesService } from '../articles/articles.service';

export interface ExtractedContent {
  title: string;
  content: string;      // Plain text
  htmlContent: string;  // Cleaned HTML
  excerpt?: string;
  byline?: string;
  siteName?: string;
}

@Injectable()
export class ContentExtractionService {
  constructor(private articlesService: ArticlesService) {}

  async extractFromUrl(url: string): Promise<ExtractedContent> {
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsHub/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();

    // Parse with JSDOM
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Could not extract article content');
    }

    return {
      title: article.title,
      content: article.textContent,
      htmlContent: article.content,
      excerpt: article.excerpt,
      byline: article.byline,
      siteName: article.siteName,
    };
  }

  async saveArticleFromUrl(userId: string, url: string) {
    const extracted = await this.extractFromUrl(url);

    return this.articlesService.createSavedArticle({
      userId,
      title: extracted.title,
      content: extracted.content,
      parsedContent: extracted.htmlContent,
      originalUrl: url,
    });
  }
}
```

### 4.12 `apps/api/src/content-extraction/content-extraction.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ContentExtractionService } from './content-extraction.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('extract')
export class ContentExtractionController {
  constructor(private contentExtractionService: ContentExtractionService) {}

  @Post('save')
  @UseGuards(AuthGuard)
  async saveFromUrl(@Body('url') url: string, @Req() req: any) {
    const article = await this.contentExtractionService.saveArticleFromUrl(
      req.user.id,
      url
    );

    return { success: true, article };
  }

  @Post('preview')
  async previewUrl(@Body('url') url: string) {
    const extracted = await this.contentExtractionService.extractFromUrl(url);
    return extracted;
  }
}
```

---

## Phase 5: Mobile App migrieren

### 5.1 Apps zusammenführen

```bash
# ainews nach apps/mobile verschieben
mv ainews apps/mobile

# kokon-spezifische Dateien übernehmen
cp kokon/hooks/useArticles.ts apps/mobile/hooks/
cp -r kokon/browser-extension packages/browser-extension
```

### 5.2 `apps/mobile/package.json` anpassen

```json
{
  "name": "@news/mobile",
  "dependencies": {
    "@news/shared": "workspace:*",
    // Supabase entfernen:
    // "@supabase/supabase-js": "REMOVE",
    // Stattdessen:
    "better-auth/client": "^1.0.0"
  }
}
```

### 5.3 Neuer API Client: `apps/mobile/services/api.ts`

```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // Articles
  async getArticles(params?: {
    type?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/articles?${query}`);
  }

  async getArticle(id: string) {
    return this.request(`/articles/${id}`);
  }

  async getSavedArticles(includeArchived = false) {
    return this.request(`/articles/saved?includeArchived=${includeArchived}`);
  }

  async archiveArticle(id: string) {
    return this.request(`/articles/${id}/archive`, { method: 'POST' });
  }

  async deleteArticle(id: string) {
    return this.request(`/articles/${id}`, { method: 'DELETE' });
  }

  // Content Extraction
  async saveArticleFromUrl(url: string) {
    return this.request('/extract/save', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  // Auth
  async signUp(email: string, password: string, name?: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async signIn(email: string, password: string) {
    const result = await this.request<{ token: string; user: any }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.token);
    return result;
  }

  async signOut() {
    await this.request('/auth/signout', { method: 'POST' });
    this.setToken(null);
  }

  async getSession() {
    return this.request('/auth/session');
  }
}

export const api = new ApiClient();
```

### 5.4 Auth Context aktualisieren: `apps/mobile/contexts/AuthContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '~/services/api';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        api.setToken(token);
        const session = await api.getSession();
        setUser(session.user);
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const result = await api.signIn(email, password);
    await AsyncStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
  }

  async function signUp(email: string, password: string, name?: string) {
    const result = await api.signUp(email, password, name);
    await AsyncStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
  }

  async function signOut() {
    await api.signOut();
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 5.5 Article Store aktualisieren: `apps/mobile/store/articleStore.ts`

```typescript
import { create } from 'zustand';
import { api } from '~/services/api';

interface Article {
  id: string;
  type: 'feed' | 'summary' | 'in_depth' | 'saved';
  title: string;
  content: string;
  // ... weitere Felder
}

interface ArticleState {
  articles: Article[];
  savedArticles: Article[];
  isLoading: boolean;
  isLoadingSaved: boolean;

  loadArticles: (type?: string) => Promise<void>;
  loadSavedArticles: () => Promise<void>;
  saveArticleFromUrl: (url: string) => Promise<boolean>;
  archiveArticle: (id: string) => Promise<void>;
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  articles: [],
  savedArticles: [],
  isLoading: false,
  isLoadingSaved: false,

  loadArticles: async (type) => {
    set({ isLoading: true });
    try {
      const articles = await api.getArticles({});
      set({ articles, isLoading: false });
    } catch (error) {
      console.error('Failed to load articles:', error);
      set({ isLoading: false });
    }
  },

  loadSavedArticles: async () => {
    set({ isLoadingSaved: true });
    try {
      const savedArticles = await api.getSavedArticles();
      set({ savedArticles, isLoadingSaved: false });
    } catch (error) {
      console.error('Failed to load saved articles:', error);
      set({ isLoadingSaved: false });
    }
  },

  saveArticleFromUrl: async (url: string) => {
    try {
      await api.saveArticleFromUrl(url);
      get().loadSavedArticles();
      return true;
    } catch (error) {
      console.error('Failed to save article:', error);
      return false;
    }
  },

  archiveArticle: async (id: string) => {
    // Optimistic update
    set(state => ({
      savedArticles: state.savedArticles.filter(a => a.id !== id)
    }));

    try {
      await api.archiveArticle(id);
    } catch (error) {
      // Rollback
      get().loadSavedArticles();
    }
  },
}));
```

---

## Phase 6: Browser Extension anpassen

### 6.1 `packages/browser-extension/manifest.json`

```json
{
  "manifest_version": 3,
  "name": "News Hub - Save Article",
  "version": "1.0.0",
  "description": "Speichere Artikel in deiner News Hub Bibliothek",
  "permissions": ["activeTab", "storage"],
  "host_permissions": ["http://localhost:3000/*"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "In News Hub speichern"
  },
  "background": {
    "service_worker": "background.js"
  }
}
```

### 6.2 `packages/browser-extension/popup.js`

```javascript
const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  const pageTitle = document.getElementById('pageTitle');
  const pageUrl = document.getElementById('pageUrl');
  const saveButton = document.getElementById('saveButton');
  const status = document.getElementById('status');
  const loginNotice = document.getElementById('loginNotice');

  let currentTab = null;
  let authToken = null;

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  pageTitle.textContent = tab.title || 'Untitled';
  pageUrl.textContent = tab.url;

  // Check auth from storage
  const stored = await chrome.storage.local.get(['news_hub_token']);
  authToken = stored.news_hub_token;

  if (authToken) {
    saveButton.disabled = false;
    loginNotice.style.display = 'none';
    saveArticle();
  } else {
    loginNotice.style.display = 'block';
    saveButton.disabled = true;
  }

  async function saveArticle() {
    if (!currentTab || !authToken) return;

    saveButton.disabled = true;
    status.textContent = 'Speichert...';

    try {
      const response = await fetch(`${API_URL}/extract/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ url: currentTab.url }),
      });

      if (response.ok) {
        status.textContent = 'Gespeichert!';
        setTimeout(() => window.close(), 1500);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      status.textContent = 'Fehler beim Speichern';
      saveButton.disabled = false;
    }
  }

  saveButton.addEventListener('click', saveArticle);
});
```

---

## Phase 7: Environment & Scripts

### 7.1 `.env.example` (Root)

```env
# Database
DATABASE_URL=postgresql://news:news_dev_password@localhost:5432/news_hub

# API
API_PORT=3000
API_URL=http://localhost:3000

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here

# Mobile App
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 7.2 Root `package.json` Scripts

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "dev:api": "turbo run dev --filter=@news/api",
    "dev:mobile": "turbo run dev --filter=@news/mobile",
    "build": "turbo run build",
    "docker:up": "docker-compose -f docker/docker-compose.yml up -d",
    "docker:down": "docker-compose -f docker/docker-compose.yml down",
    "db:generate": "pnpm --filter @news/database db:generate",
    "db:migrate": "pnpm --filter @news/database db:migrate",
    "db:push": "pnpm --filter @news/database db:push",
    "db:studio": "pnpm --filter @news/database db:studio"
  }
}
```

---

## Migrations-Checkliste

### Vorbereitung
- [ ] pnpm installieren (falls nicht vorhanden)
- [ ] Docker Desktop installiert
- [ ] Node.js 20+ installiert

### Phase 1: Monorepo
- [ ] Root package.json erstellt
- [ ] turbo.json erstellt
- [ ] Ordnerstruktur angelegt
- [ ] `pnpm install` erfolgreich

### Phase 2: Docker
- [ ] docker-compose.yml erstellt
- [ ] `pnpm docker:up` startet PostgreSQL
- [ ] pgAdmin erreichbar unter localhost:5050

### Phase 3: Database Package
- [ ] Drizzle Schema definiert
- [ ] `pnpm db:generate` erfolgreich
- [ ] `pnpm db:push` erstellt Tabellen
- [ ] `pnpm db:studio` zeigt Tabellen

### Phase 4: NestJS Backend
- [ ] NestJS Projekt erstellt
- [ ] Better Auth konfiguriert
- [ ] Auth Endpoints funktionieren
- [ ] Articles Endpoints funktionieren
- [ ] Content Extraction funktioniert

### Phase 5: Mobile App
- [ ] ainews nach apps/mobile verschoben
- [ ] Supabase-Abhängigkeiten entfernt
- [ ] API Client erstellt
- [ ] Auth Context aktualisiert
- [ ] Store aktualisiert
- [ ] App startet und verbindet mit API

### Phase 6: Browser Extension
- [ ] Extension nach packages/browser-extension
- [ ] API URL angepasst
- [ ] Funktioniert mit neuem Backend

### Phase 7: Testing
- [ ] User Registration
- [ ] User Login
- [ ] Artikel laden (Feed)
- [ ] Artikel speichern via URL
- [ ] Artikel speichern via Extension
- [ ] Artikel archivieren

---

## Empfohlene Reihenfolge zum Starten

```bash
# 1. Monorepo initialisieren
cd news
pnpm init
# package.json anpassen (workspaces)

# 2. Docker starten
pnpm docker:up

# 3. Database Package erstellen & migrieren
cd packages/database
pnpm install
pnpm db:push

# 4. API entwickeln & testen
cd apps/api
pnpm install
pnpm dev
# Test: curl http://localhost:3000/articles

# 5. Mobile App migrieren
mv ainews apps/mobile
cd apps/mobile
# Supabase entfernen, API Client einbauen
pnpm dev

# 6. Extension anpassen
cd packages/browser-extension
# URLs anpassen, testen
```

---

## Vorteile der neuen Architektur

| Aspekt | Vorher (Supabase) | Nachher (Eigenes Backend) |
|--------|-------------------|---------------------------|
| **Kontrolle** | Abhängig von Supabase | Volle Kontrolle |
| **Kosten** | Pay-per-use | Fixkosten (oder gratis lokal) |
| **Flexibilität** | Supabase-Limits | Unbegrenzt skalierbar |
| **Type Safety** | Manuell generiert | Drizzle: Schema = Types |
| **Migrations** | Supabase Dashboard | Drizzle-Kit: Versioniert |
| **Testing** | Schwierig lokal | Docker: Identisch zu Prod |
| **Auth** | Supabase Auth | Better Auth: Flexibel |

---

## Nächste Schritte

1. **Entscheidung**: Plan OK? Anpassungen nötig?
2. **Phase 1 starten**: Monorepo Setup
3. **Parallel**: Docker & Database Package

Soll ich mit der Implementierung beginnen?
