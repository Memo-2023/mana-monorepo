# Picture App Team

## Module: picture
**Path:** `apps/picture`
**Description:** AI-powered image generation application using Replicate API with freemium credit system. Users can create images from text prompts, organize them in boards, and explore community creations.
**Tech Stack:** NestJS (backend), SvelteKit (web), Expo/React Native (mobile), Astro (landing)
**Platforms:** Backend, Web, Mobile, Landing

## Team Overview

This team manages the Picture application, a multi-platform AI image generation product with a credit-based freemium model.

### Team Members

| Role | File | Focus Area |
|------|------|------------|
| Product Owner | `product-owner.md` | User stories, feature prioritization, freemium model |
| Architect | `architect.md` | System design, API structure, generation pipeline |
| Senior Developer | `senior-dev.md` | Complex features, code review, patterns |
| Developer | `developer.md` | Feature implementation, bug fixes, tests |
| Security Engineer | `security.md` | Auth flows, API key protection, storage security |
| QA Lead | `qa-lead.md` | Testing strategy, quality gates, E2E tests |

## Key Features
- AI image generation via Replicate API (SDXL, Stable Diffusion, etc.)
- Freemium model: 3 free generations, then 10 credits per generation
- Board-based organization (like Pinterest)
- Image storage on MinIO/S3
- Community explore page
- Batch generation support
- Tag and search system

## Architecture
```
apps/picture/
├── apps/
│   ├── backend/    # NestJS API (port 3006)
│   ├── web/        # SvelteKit frontend
│   ├── mobile/     # Expo React Native
│   └── landing/    # Astro marketing site
└── packages/
    ├── design-tokens/  # Shared design system
    ├── mobile-ui/      # Mobile components
    └── shared/         # Shared utilities
```

## API Structure
- `POST /api/v1/generate` - Generate image from prompt
- `GET /api/v1/generate/:id/status` - Check generation status
- `GET /api/v1/models` - List available AI models
- `GET /api/v1/images` - List user's images
- `GET/POST /api/v1/boards` - Board management
- `GET /api/v1/explore` - Public gallery feed

## How to Use
```
"As the [Role] for picture, help me with..."
"Read apps/picture/.agent/team/ and help me understand..."
```
