# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

uLoad is a URL shortener and link management platform built with SvelteKit and PocketBase.

**Live:** https://ulo.ad

## Project Structure

```
uload/
├── apps/
│   └── web/              # SvelteKit web application
│       ├── src/          # Source code
│       │   ├── routes/   # SvelteKit pages
│       │   └── lib/      # Components, services, utilities
│       ├── static/       # Static assets
│       └── e2e/          # End-to-end tests
├── backend/              # PocketBase configuration
│   ├── pb_migrations/    # Database migrations
│   └── pb_schema.json    # Schema definition
├── docs/                 # Documentation
├── scripts/              # Utility scripts
└── CLAUDE.md
```

## Commands

All commands should be run from `uload/apps/web/`:

### Development

```bash
pnpm run dev              # Start development server (http://localhost:5173)
pnpm run preview          # Preview production build locally
```

### Build & Deploy

```bash
pnpm run build            # Create production build
```

### Code Quality

```bash
pnpm run format           # Auto-format code with Prettier
pnpm run lint             # Run ESLint and Prettier checks
pnpm run check            # Run Svelte type checking
```

### Testing

```bash
pnpm run test             # Run all tests (unit + e2e)
pnpm run test:unit        # Run unit tests with Vitest
pnpm run test:e2e         # Run end-to-end tests with Playwright
```

### Database

```bash
pnpm run db:generate      # Generate Drizzle migrations
pnpm run db:migrate       # Run migrations
pnpm run db:push          # Push schema changes
pnpm run db:studio        # Open Drizzle Studio
```

## Technology Stack

- **Framework**: SvelteKit v2.22 with Svelte 5.0
- **Backend**: PocketBase (embedded SQLite)
- **Database**: PostgreSQL via Drizzle ORM + Redis for caching
- **Styling**: Tailwind CSS v4.0
- **Testing**: Vitest + Playwright
- **Payments**: Stripe
- **Email**: Resend
- **Storage**: Cloudflare R2

## Key Patterns

### Svelte 5 Runes Mode

- **NEVER use `$:` reactive statements** - use `$derived` instead
- **NEVER use `let` for reactive values** - use `$state` for reactive state
- **For side effects** - use `$effect` instead of `$:` statements

```typescript
// ✅ CORRECT - Svelte 5 runes
let headerModule = $derived(card.config.modules?.find((m) => m.type === 'header'));
let count = $state(0);

$effect(() => {
	console.log('Count changed:', count);
});
```

### PocketBase Usage

In server-side code (`+page.server.ts`, `+server.ts`):

- **ALWAYS use `locals.pb`** from the request context
- The imported `pb` is for client-side only

```typescript
// Server-side
export const load: PageServerLoad = async ({ locals }) => {
	const items = await locals.pb.collection('items').getList();
};

// Client-side
import { pb } from '$lib/pocketbase';
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `R2_*` - Cloudflare R2 storage credentials
- `RESEND_API_KEY` - Email service
- `STRIPE_*` - Payment processing (see `.env.stripe.example`)

## Code Style

- Tabs for indentation
- Single quotes for strings
- 100 character line width
- Prettier auto-sorts Tailwind classes
