# Mana Landing Builder Service

Static landing page builder for organizations. Takes a JSON config, generates an Astro site, and deploys it to Cloudflare Pages.

## Overview

- **Port**: 3030
- **Technology**: NestJS + Astro + Cloudflare Pages
- **Purpose**: Build and deploy static landing pages for organizations under `{slug}.mana.how`

## Architecture

```
Admin Dashboard (Manacore Web)
    │
    │ POST /api/v1/build { slug, config }
    ▼
Landing Builder Service (Port 3030)
    │
    ├── 1. Copy Astro template to temp dir
    ├── 2. Write config.json (section data)
    ├── 3. Generate theme.css (colors)
    ├── 4. pnpm install + astro build
    └── 5. wrangler pages deploy → Cloudflare Pages
                                        │
                                        ▼
                                   {slug}.mana.how
```

## Quick Start

```bash
# Start the builder service
pnpm dev:landing-builder

# Or directly
pnpm --filter @mana-landing-builder/service start:dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/build` | Build and deploy a landing page |
| GET | `/api/v1/health` | Health check |

### Build Request

```bash
curl -X POST http://localhost:3030/api/v1/build \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "organizationId": "org-id",
    "slug": "chorverein-harmonie",
    "config": {
      "enabled": true,
      "theme": "warm",
      "sections": {
        "hero": { "title": "Chorverein Harmonie", "subtitle": "Seit 1952" },
        "about": { "title": "About", "features": [] },
        "team": { "title": "Team", "members": [] },
        "contact": { "title": "Contact", "email": "info@example.com" },
        "footer": { "copyright": "2024 Chorverein Harmonie" }
      }
    }
  }'
```

### Response

```json
{
  "success": true,
  "url": "https://chorverein-harmonie.mana.how",
  "duration": 15000
}
```

## Configuration

The landing page config is stored in `organizations.metadata.landingPage` in mana-core-auth. The Admin UI in Manacore Web writes this config, then triggers the builder.

### Config Structure (LandingPageConfig)

Types are defined in `packages/shared-types/src/landing-config.ts`.

```typescript
interface LandingPageConfig {
  enabled: boolean;
  theme: 'classic' | 'warm';
  customColors?: { primary?, primaryHover?, primaryGlow? };
  sections: {
    hero: { title, subtitle, variant?, primaryCta?, image? };
    about: { title, subtitle?, features[] };
    team: { title, subtitle?, members[] };
    contact: { title, subtitle?, email?, phone?, address? };
    footer: { copyright?, links?, socialLinks? };
  };
}
```

### Available Themes

| Theme | Style | Best For |
|-------|-------|----------|
| `classic` | Professional dark (slate tones) | Businesses, institutions |
| `warm` | Inviting light (amber tones) | Schools, clubs, community orgs |

Both themes support `customColors` overrides for the primary color.

## Available Sections

All sections use shared components from `@manacore/shared-landing-ui`:

| Section | Component | Description |
|---------|-----------|-------------|
| Hero | `HeroSection.astro` | Title, subtitle, CTA button, image |
| About | `FeatureSection.astro` | Feature cards in a grid |
| Team | `TeamSection.astro` | Team member cards with avatars |
| Contact | `ContactSection.astro` | Email, phone, address display |
| Footer | `Footer.astro` | Copyright, links, social links |

## Project Structure

```
services/mana-landing-builder/
├── src/
│   ├── main.ts                    # NestJS bootstrap
│   ├── app.module.ts
│   ├── builder/
│   │   ├── builder.controller.ts  # POST /api/v1/build
│   │   ├── builder.service.ts     # Core build logic
│   │   └── dto/
│   │       └── build-landing.dto.ts
│   └── config/
│       └── configuration.ts
└── template/                      # Astro template project
    ├── astro.config.mjs
    ├── package.json
    ├── src/
    │   ├── layouts/Layout.astro   # HTML shell
    │   ├── pages/index.astro      # Reads config.json, renders sections
    │   ├── styles/theme.css       # Overwritten per build
    │   └── data/config.json       # Overwritten per build
    └── public/
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3030 | Service port |
| `MANA_CORE_AUTH_URL` | http://localhost:3001 | Auth service URL |
| `CLOUDFLARE_API_TOKEN` | - | Cloudflare API token (Pages + DNS permissions) |
| `CLOUDFLARE_ACCOUNT_ID` | - | Cloudflare account ID |
| `ORG_LANDING_DOMAIN` | mana.how | Base domain for org landing pages |

## Admin UI

The landing page editor lives in the Manacore web dashboard:

- **Route**: `/organizations/[id]/landing`
- **Components**: `apps/manacore/apps/web/src/lib/components/landing/`
- **API Client**: `apps/manacore/apps/web/src/lib/api/services/landing.ts`

The editor provides a form-based interface where org admins can:
1. Select a theme (classic/warm)
2. Optionally override the primary color
3. Fill in content for each section (Hero, About, Team, Contact, Footer)
4. Save (stores config in org metadata) or Publish (save + build + deploy)

## Build Process Details

1. Template directory is copied to a temporary working directory
2. `config.json` is written with the section data from the landing config
3. `theme.css` is generated from the selected theme + any custom color overrides
4. `pnpm install` runs to resolve `@manacore/shared-landing-ui` from the workspace
5. `astro build` generates static HTML/CSS/JS in `dist/`
6. `wrangler pages deploy` pushes to Cloudflare Pages as project `org-{slug}`
7. Custom domain `{slug}.mana.how` is configured (if Cloudflare token is set)
8. Temp directory is cleaned up

Concurrent builds for the same org are rejected (409 Conflict).

## Development Commands

```bash
# Start service
pnpm dev:landing-builder

# Build for production
pnpm --filter @mana-landing-builder/service build

# Type check
pnpm --filter @mana-landing-builder/service type-check
```

## Related Files

| Location | Purpose |
|----------|---------|
| `packages/shared-types/src/landing-config.ts` | TypeScript types for landing config |
| `packages/shared-landing-ui/src/sections/TeamSection.astro` | Team member grid component |
| `packages/shared-landing-ui/src/sections/ContactSection.astro` | Contact info component |
| `packages/shared-landing-ui/src/themes/org-classic.css` | Classic dark theme |
| `packages/shared-landing-ui/src/themes/org-warm.css` | Warm light theme |
| `apps/manacore/apps/web/src/lib/components/landing/` | Admin UI components |
