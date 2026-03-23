# Backend-Architektur im Manacore Monorepo

Diese Dokumentation beschreibt die Backend-Implementierungen aller Projekte im Manacore Monorepo.

## Übersicht

Das Monorepo enthält 6 Hauptprojekte mit unterschiedlichen Backend-Architekturen:

| Projekt | Backend-Typ | Datenbank | Status |
|---------|-------------|-----------|--------|
| **Maerchenzauber** | NestJS v10 | Supabase (PostgreSQL) | Aktiv |
| **Manadeck** | NestJS v11 | PostgreSQL + Drizzle ORM | Aktiv |
| **Uload** | NestJS v11 | PostgreSQL + Drizzle ORM | Aktiv |
| **Picture** | Kein Backend | - | Frontend-only |
| **Memoro** | Kein Backend | - | Frontend-only |
| **Manacore** | Kein Backend (extern) | - | Externes Backend |

---

## 1. Maerchenzauber

**Pfad:** `/maerchenzauber/apps/backend`

**Zweck:** KI-gestützte Kindergeschichten-Generierung mit benutzerdefinierten Charakteren.

### Technologie-Stack

- **Framework:** NestJS 10.0.0
- **Datenbank:** Supabase (PostgreSQL)
- **ORM:** `@supabase/supabase-js` v2.81.1
- **AI-Services:** Azure OpenAI, Google Gemini, Replicate

### Architektur

```
apps/backend/
├── src/
│   ├── character/          # Charakter-Modul
│   │   ├── character.controller.ts
│   │   ├── character.service.ts
│   │   └── character.repository.ts
│   ├── story/              # Story-Modul
│   │   ├── story.controller.ts
│   │   ├── story.service.ts
│   │   └── pipelines/      # Story-Generierung-Pipelines
│   ├── core/               # Kern-Services
│   │   └── services/
│   │       └── prompting.service.ts
│   ├── settings/           # Benutzereinstellungen
│   ├── health/             # Health-Checks
│   └── feedback/           # Feedback-Modul
```

### Datenbank-Schema

**Tabellen:**
- `characters` - Benutzercharaktere
- `stories` - Generierte Geschichten
- `story_collections` - Sammlungen von Geschichten
- `user_settings` - Benutzereinstellungen

**Sicherheit:** Row-Level Security (RLS) für Datenzugriffskontrolle

### Authentifizierung

Mana Core Integration via `@mana-core/nestjs-integration`:

```typescript
// Beispiel: Geschützter Endpoint
@UseGuards(AuthGuard)
@Get('characters')
async getCharacters(@CurrentUser() user: User) {
  return this.characterService.findByUser(user.id);
}
```

**Auth-Endpoint:** `https://mana-core-middleware-111768794939.europe-west3.run.app`

### AI-Services

| Service | Verwendung | API |
|---------|------------|-----|
| Azure OpenAI (GPT-4) | Story-Generierung | `MAERCHENZAUBER_AZURE_OPENAI_ENDPOINT` |
| Google Gemini | Charakter-Generierung | `GOOGLE_GEMINI_API_KEY` |
| Replicate (Flux) | Bildgenerierung | `REPLICATE_API_TOKEN` |

### File Storage

- **Provider:** Supabase Storage
- **Bucket:** `maerchenzauber`
- **Verwendung:** Charakter- und Story-Bilder

### Deployment

- **Plattform:** Google Cloud Run
- **Region:** europe-west3
- **URL:** `https://storyteller-backend-111768794939.europe-west3.run.app`
- **Port:** 3002 (Development)

---

## 2. Manadeck

**Pfad:** `/manadeck/apps/backend`

**Zweck:** KI-gestützte Lernkarten-Generierung (Flashcards, Quizzes, Mixed).

### Technologie-Stack

- **Framework:** NestJS 11.0.1
- **Datenbank:** PostgreSQL 16
- **ORM:** Drizzle ORM
- **AI-Service:** Google Gemini API

### Architektur

```
apps/backend/
├── src/
│   ├── api.controller.ts       # Haupt-API-Endpoints
│   ├── public.controller.ts    # Öffentliche Endpoints
│   ├── health.controller.ts    # Health-Checks
│   ├── ai.service.ts           # AI-Generierung
│   └── repositories/
│       ├── deck.repository.ts
│       ├── card.repository.ts
│       ├── user-stats.repository.ts
│       └── deck-template.repository.ts
```

### Datenbank-Package

Das Datenbank-Schema ist in einem separaten Package ausgelagert:

**Pfad:** `/packages/manadeck-database`

```typescript
// Verwendung im Backend
import { db, schema } from '@manacore/manadeck-database';

const decks = await db.query.decks.findMany({
  where: eq(schema.decks.userId, userId)
});
```

**Drizzle-Konfiguration:**
```typescript
// drizzle.config.ts
export default {
  schema: './src/schema/*',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL
  }
};
```

### Authentifizierung

```typescript
import { AuthGuard, CurrentUser } from '@mana-core/nestjs-integration';

@Controller('api')
@UseGuards(AuthGuard)
export class ApiController {
  @Post('decks')
  async createDeck(@CurrentUser() user: User, @Body() dto: CreateDeckDto) {
    // Credit-Prüfung und Deck-Erstellung
  }
}
```

### Credit-System

Integration mit Mana Core Credit Service:

```typescript
import { CreditClientService } from '@mana-core/nestjs-integration';

@Injectable()
export class AiService {
  constructor(private creditClient: CreditClientService) {}

  async generateDeck(userId: string, input: GenerateInput) {
    // 1. Credit-Balance prüfen
    const hasCredits = await this.creditClient.checkBalance(userId, 'DECK_CREATION');

    // 2. Deck generieren
    const deck = await this.generateWithGemini(input);

    // 3. Credits abziehen
    await this.creditClient.deduct(userId, 'DECK_CREATION');

    return deck;
  }
}
```

### AI-Generierung

**Unterstützte Kartentypen:**
- `text` - Textbasierte Karten
- `flashcard` - Klassische Lernkarten
- `quiz` - Multiple-Choice Quiz
- `mixed` - Gemischte Inhalte

**Schwierigkeitsgrade:**
- `beginner`
- `intermediate`
- `advanced`

### Docker-Setup

```yaml
# docker-compose.yml (Lokale Entwicklung)
services:
  postgres:
    image: postgres:16
    ports:
      - "5433:5432"
    environment:
      POSTGRES_DB: manadeck
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres

  pgadmin:
    image: dpage/pgadmin4
    ports:
      - "5050:80"
```

### Deployment

- **Docker Image:** Multi-stage Build (Node 18-alpine)
- **Port:** 8080
- **Health-Check:** `/health`

---

## 3. Uload

**Pfad:** `/uload/apps/backend`

**Zweck:** URL-Shortener mit Link-Analytics.

### Technologie-Stack

- **Framework:** NestJS 11.0.1
- **Datenbank:** PostgreSQL 16
- **ORM:** Drizzle ORM
- **Cache:** Redis (optional)

### Architektur

```
uload/apps/backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   └── validation.schema.ts
│   ├── controllers/
│   │   ├── redirect.controller.ts    # GET /:code (public redirect)
│   │   ├── links.controller.ts       # CRUD /api/links
│   │   ├── analytics.controller.ts   # GET /api/analytics
│   │   └── health.controller.ts
│   ├── services/
│   │   ├── links.service.ts
│   │   ├── redirect.service.ts
│   │   └── analytics.service.ts
│   └── database/
│       ├── database.module.ts
│       └── repositories/
│           ├── link.repository.ts
│           └── click.repository.ts
├── Dockerfile
└── package.json
```

### Datenbank-Package

**Pfad:** `/packages/uload-database`

```typescript
// Verwendung im Backend
import { db, links, clicks, eq, desc } from '@manacore/uload-database';

const userLinks = await db.query.links.findMany({
  where: eq(links.userId, userId),
  orderBy: desc(links.createdAt)
});
```

### API Endpoints

| Endpoint | Method | Auth | Beschreibung |
|----------|--------|------|--------------|
| `/:code` | GET | Public | Redirect zu Original-URL |
| `/api/links` | GET | Protected | Liste aller Links |
| `/api/links` | POST | Protected | Link erstellen |
| `/api/links/:id` | GET | Protected | Link Details |
| `/api/links/:id` | PATCH | Protected | Link aktualisieren |
| `/api/links/:id` | DELETE | Protected | Link löschen |
| `/api/analytics/:linkId` | GET | Protected | Link-Statistiken |
| `/health` | GET | Public | Health Check |

### Authentifizierung

Mana Core Integration via `@mana-core/nestjs-integration`:

```typescript
import { AuthGuard, CurrentUser } from '@mana-core/nestjs-integration';

@Controller('api/links')
@UseGuards(AuthGuard)
export class LinksController {
  @Get()
  async getLinks(@CurrentUser() user: any) {
    return this.linksService.getLinks(user.sub);
  }
}
```

### Deployment

- **Docker Image:** Multi-stage Build (Node 20-alpine)
- **Port:** 3003
- **Health-Check:** `/health`

---

## 4. Picture

**Pfad:** `/picture`

**Zweck:** Bild- und Medienverwaltung.

### Architektur

**Kein dediziertes Backend.** Picture verwendet:

- SvelteKit Server-Routes für Backend-Logik
- Mana Core für Authentifizierung
- Shared Packages aus `/packages`

```
picture/
├── apps/
│   ├── mobile/           # React Native Expo
│   ├── web/              # SvelteKit
│   └── landing/          # Astro
└── packages/
    ├── design-tokens/    # Design System
    ├── mobile-ui/        # Mobile UI Components
    └── shared/           # Utilities
```

---

## 5. Memoro

**Pfad:** `/memoro`

**Zweck:** Legacy-Content und Memory-Preservation.

### Architektur

**Kein dediziertes Backend.** Memoro verwendet:

- SvelteKit Server-Routes
- Mana Core für Authentifizierung
- Supabase (Legacy-Konfiguration vorhanden)

```
memoro/
├── apps/
│   ├── mobile/
│   ├── web/
│   └── landing/
└── supabase/             # Legacy Supabase Config
```

---

## 6. Manacore

**Pfad:** `/manacore`

**Zweck:** Core-Authentifizierung und Credit-System.

### Architektur

Das Manacore-Backend ist **extern gehostet** und nicht Teil des Monorepos:

- **URL:** `https://mana-core-middleware-111768794939.europe-west3.run.app`
- **Integration:** Via `@mana-core/nestjs-integration` Package

```
manacore/
├── apps/
│   ├── mobile/           # Auth-Flow UI
│   ├── web/              # Dashboard
│   └── landing/          # Marketing
```

---

## Shared Packages für Backend

### @manacore/manadeck-database

PostgreSQL-Datenbankschema für Manadeck.

```
packages/manadeck-database/
├── src/
│   ├── schema/           # Drizzle Schema
│   ├── client.ts         # DB Client
│   └── index.ts          # Exports
├── drizzle.config.ts
└── docker-compose.yml
```

### @manacore/uload-database

PostgreSQL-Datenbankschema für Uload URL-Shortener.

```
packages/uload-database/
├── src/
│   ├── schema/
│   │   ├── users.ts
│   │   ├── links.ts
│   │   ├── clicks.ts
│   │   ├── tags.ts
│   │   ├── workspaces.ts
│   │   ├── accounts.ts
│   │   └── relations.ts
│   ├── client.ts         # DB Client
│   └── index.ts          # Exports
├── drizzle.config.ts
└── docker-compose.yml
```

### @mana-core/nestjs-integration

Externe Dependency für Backend-Integration:

```typescript
// Installation via git
"@mana-core/nestjs-integration": "git+https://github.com/mana-core/nestjs-integration.git"
```

**Bereitgestellte Features:**
- `AuthGuard` - JWT-Authentifizierung
- `@CurrentUser()` - User-Context Decorator
- `CreditClientService` - Credit-Operationen
- Konfigurationsmodule

---

## Authentifizierungs-Pattern

Alle Projekte nutzen zentrale **Mana Core Authentifizierung**:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│  Project Backend │────▶│   Mana Core     │
│  (Web/Mobile)   │     │  (NestJS/etc.)   │     │   Middleware    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                       │
        │                        │                       │
        ▼                        ▼                       ▼
   shared-auth              AuthGuard              JWT Validation
   shared-auth-ui          @CurrentUser            Credit Service
   shared-auth-stores      CreditClient            User Management
```

### Frontend-Integration

```typescript
// Shared Auth Store (Svelte)
import { authStore } from '@manacore/shared-auth-stores';

// Login
await authStore.login(email, password);

// Token für API-Requests
const token = authStore.getAccessToken();
```

### Backend-Integration

```typescript
// NestJS Module Setup
@Module({
  imports: [
    ManaCoreModule.forRoot({
      serviceKey: process.env.MANA_CORE_SERVICE_KEY,
      baseUrl: process.env.MANA_CORE_URL,
    }),
  ],
})
export class AppModule {}
```

---

## Datenbank-Migrationen

### Manadeck (Drizzle)

```bash
# Migration generieren
pnpm --filter @manacore/manadeck-database drizzle-kit generate

# Migration ausführen
pnpm --filter @manacore/manadeck-database drizzle-kit push
```

### Maerchenzauber (Supabase)

```bash
# Supabase CLI
supabase migration new <name>
supabase db push
```

---

## Umgebungsvariablen

### Maerchenzauber Backend

```env
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Mana Core
MANA_CORE_URL=https://mana-core-middleware-111768794939.europe-west3.run.app
MANA_CORE_SERVICE_KEY=

# AI Services
MAERCHENZAUBER_AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
GOOGLE_GEMINI_API_KEY=
REPLICATE_API_TOKEN=
```

### Manadeck Backend

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/manadeck

# Mana Core
MANA_CORE_URL=
MANA_CORE_SERVICE_KEY=

# AI
GOOGLE_GEMINI_API_KEY=

# Server
PORT=8080
```

### Uload

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://localhost:6379

# PocketBase
POCKETBASE_URL=
```

---

## Lokale Entwicklung

### Maerchenzauber Backend

```bash
cd maerchenzauber/apps/backend
pnpm install
pnpm run start:dev
# Läuft auf Port 3002
```

### Manadeck Backend

```bash
# 1. Datenbank starten
cd packages/manadeck-database
docker-compose up -d

# 2. Backend starten
cd manadeck/apps/backend
pnpm install
pnpm run start:dev
# Läuft auf Port 8080
```

### Uload

```bash
cd uload
docker-compose up -d  # PostgreSQL + Redis
pnpm install
pnpm run dev
```

---

## Zusammenfassung

Das Manacore Monorepo verwendet verschiedene Backend-Strategien:

1. **Full Backend (NestJS):** Maerchenzauber, Manadeck - Für komplexe Geschäftslogik und AI-Integration
2. **Embedded Database (PocketBase):** Uload - Für einfache CRUD-Operationen
3. **Frontend-only:** Picture, Memoro - Server-Routes in SvelteKit
4. **External Backend:** Manacore - Zentrale Auth/Credit-Services

Alle Projekte teilen sich:
- Gemeinsame Authentifizierung via Mana Core
- Shared Packages für UI, Auth, Types
- Einheitliches Deployment-Pattern (Docker + Cloud Run)

---

## Vereinheitlichungs-Roadmap

### Aktuelle Fragmentierung

| Aspekt | Maerchenzauber | Manadeck | Uload |
|--------|----------------|----------|-------|
| Framework | NestJS v10 | NestJS v11 | PocketBase |
| Datenbank | Supabase | PostgreSQL | PocketBase + PG |
| ORM | @supabase/js | Drizzle | Drizzle |
| Auth | Mana Core | Mana Core | PocketBase + Mana Core |

---

### Strategie 1: Shared NestJS Backend Package

**Ziel:** Ein gemeinsames `@manacore/shared-backend` Package mit wiederverwendbaren Modulen.

```
packages/shared-backend/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.guard.ts
│   │   └── current-user.decorator.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── drizzle.provider.ts
│   │   └── base.repository.ts
│   ├── health/
│   │   └── health.module.ts
│   ├── credits/
│   │   └── credits.module.ts
│   └── common/
│       ├── filters/
│       ├── interceptors/
│       └── pipes/
```

**Vorteile:**
- Einheitliche Auth-Integration
- Wiederverwendbare Module
- Konsistente Error-Handling

**Aufwand:** Mittel

---

### Strategie 2: Einheitliche Datenbank-Strategie

#### Option A: Alles auf Drizzle + PostgreSQL (Empfohlen)

```typescript
// packages/shared-database/src/base-schema.ts
export const baseColumns = {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: text('user_id').notNull(),
};

// Projekt-spezifische Erweiterung
// maerchenzauber/database/schema/characters.ts
import { baseColumns } from '@manacore/shared-database';

export const characters = pgTable('characters', {
  ...baseColumns,
  name: text('name').notNull(),
  traits: jsonb('traits'),
});
```

**Migration von Supabase:**
- Supabase ist PostgreSQL → Schema kann übernommen werden
- RLS-Policies in Application-Layer verschieben
- Storage → S3/Cloudflare R2

#### Option B: Alles auf Supabase

```typescript
export const createProjectClient = (project: 'maerchenzauber' | 'manadeck' | 'uload') => {
  return createClient(
    process.env[`${project.toUpperCase()}_SUPABASE_URL`],
    process.env[`${project.toUpperCase()}_SUPABASE_KEY`]
  );
};
```

**Vorteile Supabase:**
- Eingebaute Auth (optional nutzbar)
- Storage inklusive
- Realtime-Subscriptions
- Edge Functions möglich

**Nachteile Supabase:**
- Vendor Lock-in
- Weniger Kontrolle über Schema

**Empfehlung:** Drizzle + PostgreSQL wegen Type-Safety, moderner API und keinem Vendor Lock-in.

---

### Strategie 3: Einheitliche Monorepo Backend Struktur

**Ziel-Architektur:**

```
packages/
├── shared-backend/           # Gemeinsame NestJS Module
│   ├── auth/
│   ├── database/
│   ├── health/
│   └── credits/
├── shared-database/          # Drizzle Basis-Schema
│   ├── base-schema.ts
│   ├── migrations/
│   └── client.ts
├── maerchenzauber-database/  # Projekt-Schema
├── manadeck-database/        # ✓ Existiert bereits
└── uload-database/           # Neu

apps/
├── maerchenzauber-backend/   # Nutzt shared-backend
├── manadeck-backend/         # Nutzt shared-backend
└── uload-backend/            # Neues NestJS Backend (ersetzt PocketBase)
```

---

### Strategie 4: Shared Backend als Service-Layer

**Ziel:** Gemeinsamer Service-Layer, projekt-spezifische Controller.

```typescript
// packages/shared-backend/src/services/ai.service.ts
@Injectable()
export class BaseAiService {
  constructor(
    private gemini: GeminiClient,
    private credits: CreditService,
  ) {}

  protected async generateWithCredits<T>(
    userId: string,
    operation: string,
    generator: () => Promise<T>
  ): Promise<T> {
    await this.credits.check(userId, operation);
    const result = await generator();
    await this.credits.deduct(userId, operation);
    return result;
  }
}

// maerchenzauber/backend/src/story/story.service.ts
@Injectable()
export class StoryService extends BaseAiService {
  async generateStory(userId: string, input: StoryInput) {
    return this.generateWithCredits(userId, 'STORY_GENERATION', async () => {
      // Projekt-spezifische Logik
    });
  }
}
```

---

### Strategie 5: API-Gateway Pattern (Optional)

**Ziel:** Ein zentrales Gateway vor allen Backends.

```
                    ┌─────────────────┐
                    │   API Gateway   │
                    │  (Kong/Traefik) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Maerchenzauber│   │   Manadeck    │   │    Uload      │
│    Backend    │   │    Backend    │   │   Backend     │
└───────────────┘   └───────────────┘   └───────────────┘
```

**Vorteile:**
- Zentrale Auth-Validierung
- Rate Limiting
- Request Logging
- Einheitliche API-Struktur

**Aufwand:** Hoch - Empfohlen erst bei Skalierungsbedarf

---

### Empfohlene Implementierungsreihenfolge

#### Phase 1: Shared Backend Package

**Priorität:** Hoch
**Aufwand:** 2-3 Wochen

Neues Package `packages/shared-backend/` mit:
- Auth Module (wraps @mana-core/nestjs-integration)
- Health Module
- Credits Module
- Base Repository Pattern
- Common Decorators, Guards, Filters

#### Phase 2: Datenbank-Vereinheitlichung

**Priorität:** Hoch
**Aufwand:** 3-4 Wochen

1. `packages/shared-database/` mit Drizzle Basis-Schema erstellen
2. Maerchenzauber von Supabase auf Drizzle migrieren
3. Uload PocketBase durch PostgreSQL + Drizzle ersetzen

#### Phase 3: Uload Backend Neubau (Optional)

**Priorität:** Mittel
**Aufwand:** 2-3 Wochen

PocketBase → NestJS Migration:
- Konsistenz mit anderen Projekten
- Bessere Integration mit Mana Core
- Einheitliches Deployment

---

### Optionen-Vergleich

| Option | Aufwand | Benefit | Empfehlung |
|--------|---------|---------|------------|
| Shared Backend Package | Mittel | Hoch | ✅ Priorität 1 |
| Drizzle überall | Mittel-Hoch | Hoch | ✅ Priorität 2 |
| Uload auf NestJS | Hoch | Mittel | ⚡ Optional |
| API Gateway | Sehr Hoch | Mittel | ⏳ Später |

---

### Quick Wins (sofort umsetzbar)

1. **NestJS Version angleichen** → Alle auf v11
2. **Einheitliche Health-Endpoints** → `/health`, `/health/ready`
3. **Gemeinsame ESLint/Prettier Config** → `@manacore/eslint-config-backend`
4. **Einheitliche Error-Response-Struktur:**

```typescript
// Einheitliches Error-Format für alle Backends
interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}
```

5. **Einheitliche Logging-Struktur:**

```typescript
// packages/shared-backend/src/logging/logger.service.ts
@Injectable()
export class AppLogger {
  log(context: string, message: string, meta?: Record<string, any>) {
    console.log(JSON.stringify({
      level: 'info',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    }));
  }
}
```

---

### Ziel-Architektur nach Vereinheitlichung

```
┌─────────────────────────────────────────────────────────────┐
│                     Shared Packages                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│ shared-backend  │ shared-database │ shared-types            │
│ - AuthModule    │ - baseColumns   │ - ApiError              │
│ - HealthModule  │ - drizzleClient │ - User                  │
│ - CreditsModule │ - migrations    │ - CreditOperation       │
│ - BaseRepo      │                 │                         │
└────────┬────────┴────────┬────────┴────────┬────────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Maerchenzauber │ │    Manadeck     │ │     Uload       │
│     Backend     │ │    Backend      │ │    Backend      │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ NestJS v11      │ │ NestJS v11      │ │ NestJS v11      │
│ PostgreSQL      │ │ PostgreSQL      │ │ PostgreSQL      │
│ Drizzle ORM     │ │ Drizzle ORM     │ │ Drizzle ORM     │
│ Port: 3002      │ │ Port: 8080      │ │ Port: 3003      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ▼
                ┌─────────────────────┐
                │     Mana Core       │
                │   (Auth + Credits)  │
                └─────────────────────┘
```
