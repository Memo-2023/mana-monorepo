# Chat App Team

## Module: chat
**Path:** `apps/chat`
**Description:** AI-powered chat application enabling users to interact with multiple LLM providers (Claude, GPT-4, Llama, etc.) through OpenRouter. Features conversation history, model switching, and credit-based usage.
**Tech Stack:** NestJS (backend), SvelteKit (web), Expo/React Native (mobile), Astro (landing)
**Platforms:** Backend, Web, Mobile, Landing

## Team Overview

This team manages the Chat application, a multi-platform AI chat product that serves as a core revenue driver for ManaCore.

### Team Members

| Role | File | Focus Area |
|------|------|------------|
| Product Owner | `product-owner.md` | User stories, feature prioritization, product vision |
| Architect | `architect.md` | System design, API structure, scaling decisions |
| Senior Developer | `senior-dev.md` | Complex features, code review, patterns |
| Developer | `developer.md` | Feature implementation, bug fixes |
| Security Engineer | `security.md` | Auth flows, API key protection, data privacy |
| QA Lead | `qa-lead.md` | Testing strategy, quality gates, E2E tests |

## Key Features
- Multi-model AI chat (100+ models via OpenRouter)
- Conversation persistence and history
- Real-time streaming responses
- Credit-based usage tracking
- Cross-platform sync (web/mobile)
- B2B organization support

## Architecture
```
apps/chat/
├── apps/
│   ├── backend/    # NestJS API (port 3002)
│   ├── web/        # SvelteKit frontend
│   ├── mobile/     # Expo React Native
│   └── landing/    # Astro marketing site
└── packages/
    └── chat-types/ # Shared TypeScript types
```

## API Structure
- `POST /api/v1/chat/completions` - Send message, get AI response
- `GET /api/v1/chat/models` - List available AI models
- `GET/POST /api/v1/conversations` - Conversation CRUD
- `GET/POST /api/v1/conversations/:id/messages` - Message operations

## How to Use
```
"As the [Role] for chat, help me with..."
"Read apps/chat/.agent/team/ and help me understand..."
```
