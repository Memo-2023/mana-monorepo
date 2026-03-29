# CLAUDE.md - BaunTown

This file provides guidance to Claude Code when working with the BaunTown project.

## Project Overview

BaunTown is a community website for developers and creators with:

- Multilingual support (DE, EN, IT)
- Payment integration (Stripe, PayPal)
- Content collections for news, projects, tutorials, etc.
- Netlify deployment with serverless functions

## Architecture

```
apps/bauntown/
├── apps/
│   └── landing/       # Astro landing page
│       ├── netlify/   # Serverless functions
│       ├── public/    # Static assets
│       ├── src/       # Source code
│       ├── astro.config.mjs
│       ├── netlify.toml
│       └── package.json  # @bauntown/landing
├── packages/          # For future shared packages
├── readme/            # Documentation
├── package.json       # Root orchestrator
└── CLAUDE.md          # This file
```

## Quick Start

### Development

```bash
# From monorepo root
pnpm install

# Start BaunTown landing page
pnpm bauntown:dev

# Or directly
pnpm dev:bauntown:landing
```

### Build

```bash
# Build for production
pnpm --filter @bauntown/landing build

# Preview production build
pnpm --filter @bauntown/landing preview
```

## Environment Variables

Create `apps/bauntown/apps/landing/.env`:

```bash
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
GOOGLE_SHEETS_CREDENTIALS=...
PUBLIC_STRIPE_KEY=pk_...
```

## Technology Stack

| Component  | Technology                  |
| ---------- | --------------------------- |
| Framework  | Astro 5.x                   |
| Styling    | CSS/Tailwind                |
| i18n       | astro-i18n-aut (DE, EN, IT) |
| Payments   | Stripe, PayPal              |
| Analytics  | Plausible (via Partytown)   |
| APIs       | Google Sheets/Docs          |
| Deployment | Netlify (SSR + Functions)   |

## Content Collections

BaunTown uses Astro Content Collections:

| Collection | Purpose                                 |
| ---------- | --------------------------------------- |
| tools      | Design, Development, Productivity tools |
| news       | AI, Web, Design, Community news         |
| models     | AI models (Text, Image)                 |
| projects   | Web, Mobile, Desktop projects           |
| tutorials  | Courses (UI/UX, Business, Marketing)    |
| missions   | Community challenges                    |
| vision     | Long-term vision items                  |
| join       | Join page content                       |
| members    | Team members                            |

## Code Style Guidelines

- **TypeScript**: Strict mode (extends "astro/tsconfigs/strict")
- **Components**: Use `.astro` files, keep small and focused
- **Naming**: PascalCase for components, camelCase for variables
- **Formatting**: 2 spaces indentation
- **Imports**: Group by type (Astro, npm, local)

## URL Structure (i18n)

```
/de/        # German (default)
/en/        # English
/it/        # Italian
```

## Deployment

Deployed via Netlify with `@astrojs/netlify` adapter:

- Static pages pre-rendered
- Dynamic routes use Netlify Functions
- Configuration in `netlify.toml`

## Related Documentation

- `STRIPE-INTEGRATION-README.md` - Payment setup guide
- `readme/PlausibleCustomEventsReadMe.md` - Analytics setup
- `readme/PossibleNextSteps.md` - Future roadmap
