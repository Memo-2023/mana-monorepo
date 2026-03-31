# Context App

AI-powered document management and context system for knowledge organization.

| App | Port | URL |
|-----|------|-----|
| Backend | 3020 | http://localhost:3020 |
| Web App | 5192 | http://localhost:5192 |
| Mobile | 8081 | Expo Go |

## Structure

```
apps/context/
├── apps/
│   ├── backend/     # Hono/Bun compute server (@context/server)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── db/           # Drizzle schemas + migrations
│   │       │   ├── schema/
│   │       │   │   ├── spaces.schema.ts
│   │       │   │   ├── documents.schema.ts
│   │       │   │   ├── token-transactions.schema.ts
│   │       │   │   ├── model-prices.schema.ts
│   │       │   │   └── user-tokens.schema.ts
│   │       │   ├── connection.ts
│   │       │   ├── database.module.ts
│   │       │   ├── migrate.ts
│   │       │   └── seed.ts
│   │       ├── space/        # Space CRUD
│   │       ├── document/     # Document CRUD + versions + tags
│   │       ├── ai/           # AI generation (Azure + Google)
│   │       ├── token/        # Token balance + stats
│   │       └── common/
│   ├── web/         # SvelteKit web application (@context/web)
│   ├── mobile/      # Expo React Native app (@context/mobile)
│   └── landing/     # (Planned) Astro Landing Page
├── packages/        # Project-specific shared code
└── package.json     # Workspace root
```

## Development Commands

```bash
# From monorepo root
pnpm dev:context:full          # Start auth + backend + web (with DB setup)
pnpm dev:context:server       # Start backend only (port 3020)
pnpm dev:context:web           # Start web only (port 5192)
pnpm dev:context:app           # Start web + backend together
pnpm dev:context:mobile        # Start mobile app

# Database
pnpm context:db:push           # Push schema to database
pnpm context:db:studio         # Open Drizzle Studio
pnpm context:db:seed           # Seed model prices
pnpm setup:db:context          # Create DB + push schema
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Hono + Bun, Drizzle ORM, PostgreSQL |
| **Web** | SvelteKit 2.x, Svelte 5 (runes mode), Tailwind CSS 4 |
| **Mobile** | React Native 0.76 + Expo SDK 52, NativeWind |
| **Auth** | Mana Core Auth (JWT) |
| **AI** | Azure OpenAI (GPT-4.1), Google Gemini (Pro, Flash) |
| **i18n** | svelte-i18n (DE, EN) |

## Core Features

- **Spaces**: Organize documents into collections with prefix-based short IDs
- **Documents**: Text, context references, and AI prompts with versioning
- **AI Generation**: Multi-model support (Azure OpenAI, Google Gemini)
- **Token Economy**: Track and manage AI usage credits per user
- **Document Versioning**: AI-generated summaries, continuations, rewrites

## Backend API Endpoints

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |

### Spaces

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/spaces` | GET | List user's spaces |
| `/api/v1/spaces` | POST | Create space |
| `/api/v1/spaces/:id` | GET | Get space details |
| `/api/v1/spaces/:id` | PUT | Update space |
| `/api/v1/spaces/:id` | DELETE | Delete space (cascades documents) |

### Documents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/documents` | GET | List documents (?spaceId=&preview=true&limit=) |
| `/api/v1/documents/recent` | GET | Recent documents (?limit=) |
| `/api/v1/documents` | POST | Create document |
| `/api/v1/documents/:id` | GET | Get document |
| `/api/v1/documents/:id` | PUT | Update document |
| `/api/v1/documents/:id` | DELETE | Delete document |
| `/api/v1/documents/:id/tags` | PUT | Update document tags |
| `/api/v1/documents/:id/pinned` | PUT | Toggle pinned |
| `/api/v1/documents/:id/versions` | GET | Get document versions |
| `/api/v1/documents/:id/versions` | POST | Create AI version |

### AI

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/ai/generate` | POST | Generate text (server-side AI) |
| `/api/v1/ai/estimate` | POST | Estimate token cost |

### Tokens

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/tokens/balance` | GET | Get user token balance |
| `/api/v1/tokens/stats` | GET | Usage stats (?timeframe=day\|week\|month\|year) |
| `/api/v1/tokens/transactions` | GET | Transaction history (?limit=&offset=) |
| `/api/v1/tokens/models` | GET | Available model prices |

## Database Schema

### spaces
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Owner |
| `name` | VARCHAR(255) | Space name |
| `description` | TEXT | Optional description |
| `settings` | JSONB | Space settings |
| `pinned` | BOOLEAN | Pinned in sidebar |
| `prefix` | VARCHAR(10) | Short ID prefix (e.g. "A") |
| `text_doc_counter` | INTEGER | Counter for text docs |
| `context_doc_counter` | INTEGER | Counter for context docs |
| `prompt_doc_counter` | INTEGER | Counter for prompt docs |

### documents
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Owner |
| `space_id` | UUID | FK to spaces (cascade delete) |
| `title` | VARCHAR(500) | Document title |
| `content` | TEXT | Document content |
| `type` | VARCHAR(20) | text / context / prompt |
| `short_id` | VARCHAR(20) | Short ID (e.g. "AD1") |
| `pinned` | BOOLEAN | Pinned flag |
| `metadata` | JSONB | Tags, word count, version info |

### token_transactions
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | User |
| `amount` | INTEGER | Tokens used (negative for usage) |
| `transaction_type` | VARCHAR(50) | usage / bonus / purchase |
| `model_used` | VARCHAR(100) | AI model name |
| `prompt_tokens` | INTEGER | Input tokens |
| `completion_tokens` | INTEGER | Output tokens |
| `cost_usd` | NUMERIC(10,6) | Actual USD cost |

### model_prices
| Column | Type | Description |
|--------|------|-------------|
| `model_name` | VARCHAR(100) | Unique model name |
| `input_price_per_1k_tokens` | NUMERIC(10,6) | Input price |
| `output_price_per_1k_tokens` | NUMERIC(10,6) | Output price |
| `tokens_per_dollar` | INTEGER | App tokens per USD |

### user_tokens
| Column | Type | Description |
|--------|------|-------------|
| `user_id` | TEXT | Primary key |
| `token_balance` | INTEGER | Current balance |
| `monthly_free_tokens` | INTEGER | Free monthly allocation |

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3020
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/context
MANA_CORE_AUTH_URL=http://localhost:3001
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
GOOGLE_API_KEY=your-key
```

### Web (.env)
```env
PUBLIC_BACKEND_URL=http://localhost:3020
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Important Patterns

1. **API Client pattern** - All web services use `@manacore/shared-api-client` (Go-style `{ data, error }`)
2. **Svelte 5 runes** - `$state`, `$derived`, `$effect` throughout
3. **Server-side AI keys** - API keys only on backend, never in frontend
4. **Auto word/token count** - Backend calculates on create/update
5. **Optimistic updates** - Immediate UI feedback in stores
6. **Document versioning** - AI generations linked via `parent_document` in metadata
