# Hono Server Guidelines

## Overview

All app compute servers use Hono + Bun with a lightweight architecture. Servers handle only what can't run client-side: file uploads (S3), AI calls, RRULE expansion, external API integration, etc. All CRUD is handled client-side via local-first (Dexie.js + mana-sync).

## Project Structure

```
apps/{project}/apps/server/
├── src/
│   ├── index.ts               # Entry point + route mounting
│   ├── routes/                # Route handlers
│   │   ├── {feature}.ts
│   │   └── admin.ts
│   ├── lib/                   # Shared utilities
│   └── db/                    # Drizzle schema (if needed)
│       ├── schema/
│       ├── connection.ts
│       └── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## Entry Point (index.ts)

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, healthRoute, errorHandler, notFoundHandler } from '@manacore/shared-hono';

const PORT = parseInt(process.env.PORT || '3031', 10);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const app = new Hono();

// Standard middleware stack
app.onError(errorHandler);
app.notFound(notFoundHandler);
app.use('*', cors({ origin: CORS_ORIGINS, credentials: true }));
app.route('/health', healthRoute('my-server'));
app.use('/api/*', authMiddleware());

// Routes
app.route('/api/v1/compute', computeRoutes);

export default { port: PORT, fetch: app.fetch };
```

## Shared Hono Package

Use `@manacore/shared-hono` for consistent middleware across all servers:

```typescript
import {
	authMiddleware, // JWT validation via mana-auth JWKS
	healthRoute, // Standard /health endpoint
	errorHandler, // Global error handler with logging
	notFoundHandler, // 404 handler
} from '@manacore/shared-hono';
```

## Route Handlers

```typescript
// src/routes/upload.ts
import { Hono } from 'hono';

export const uploadRoutes = new Hono();

uploadRoutes.post('/avatar', async (c) => {
	const userId = c.get('userId'); // Set by authMiddleware
	const formData = await c.req.formData();
	const file = formData.get('file') as File | null;

	if (!file) return c.json({ error: 'No file' }, 400);
	if (file.size > 5 * 1024 * 1024) return c.json({ error: 'Max 5MB' }, 400);

	// ... handle upload
	return c.json({ url: result.url }, 201);
});
```

## Database (Optional)

Only servers that need their own database use Drizzle. Most apps rely on mana-sync for data persistence.

**Servers with Drizzle:** chat, todo, moodlit, context, planta, presi, traces, uload, wisekeep, news

**Servers without Drizzle (mana-sync only):** calendar, contacts, manadeck, mukke, nutriphi, picture, questions, storage

## Running Servers

```bash
# Development (with watch)
cd apps/{project}/apps/server && bun run --watch src/index.ts

# Via root scripts
pnpm dev:{project}:server    # Just the server
pnpm dev:{project}:local     # sync + server + web (no auth needed)
pnpm dev:{project}:full      # auth + sync + server + web
```

## When to Add a Server

Add a Hono server when the app needs:

- **File operations**: S3 uploads, image processing
- **AI/LLM calls**: Gemini, OpenAI, etc. (API keys can't be client-side)
- **External APIs**: Google Calendar sync, vCard parsing, etc.
- **Heavy compute**: RRULE expansion, PDF generation, etc.
- **Admin endpoints**: GDPR compliance, data export

Do NOT add a server for pure CRUD — use local-first + mana-sync instead.

## Environment Variables

Servers read `.env` from their directory (Bun auto-loads it):

```env
PORT=3031
CORS_ORIGINS=http://localhost:5173,http://localhost:5188
MANA_CORE_AUTH_URL=http://localhost:3001
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/myapp  # if Drizzle
```

## Key Differences from Old NestJS Pattern

| Aspect      | Old (NestJS)            | New (Hono + Bun)                      |
| ----------- | ----------------------- | ------------------------------------- |
| Runtime     | Node.js                 | Bun                                   |
| Framework   | NestJS (decorators, DI) | Hono (functional, minimal)            |
| CRUD        | Server handles all CRUD | Client-side (local-first + mana-sync) |
| Server role | Full backend            | Compute-only endpoints                |
| Auth        | NestJS guards           | `@manacore/shared-hono` middleware    |
| Startup     | `nest start --watch`    | `bun run --watch src/index.ts`        |
| Config      | `ConfigModule` + DI     | `process.env` directly                |
