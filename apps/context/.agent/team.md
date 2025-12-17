# Context App - Agent Team

AI-powered document management and context system for knowledge organization with multi-model AI generation and token-based economy.

## App Overview

**Context** is a mobile-first document management application built with Expo/React Native that enables users to organize their knowledge into structured Spaces containing Documents. The app features powerful AI generation capabilities using multiple providers (Azure OpenAI, Google Gemini), a token-based economy for usage tracking, and rich document editing with markdown support.

### Core Architecture

- **Mobile**: Expo 52 + React Native 0.76 + NativeWind (TailwindCSS)
- **Database**: Supabase (PostgreSQL + Auth)
- **AI Providers**: Azure OpenAI (GPT-4.1), Google Gemini (Pro, Flash)
- **Monetization**: RevenueCat (subscriptions + token economy)
- **i18n**: i18next + react-i18next (German & English)
- **Navigation**: Expo Router (file-based routing)

### Key Features

1. **Spaces**: Organize documents into collections with custom prefixes and settings
2. **Documents**: Three types - Text (D), Context (C), and Prompt (P) with auto-generated short IDs
3. **AI Generation**: Multi-model support with streaming, token counting, and cost estimation
4. **Token Economy**: Track AI usage with transactions, balance management, and RevenueCat integration
5. **Document Editor**: Auto-save, markdown preview, mention support (@doc references)
6. **Versioning**: Track document versions with AI generation history

### Tech Patterns

- **Service Layer**: Business logic in `/services/` (supabaseService, aiService, tokenCountingService, etc.)
- **Context-based State**: AuthContext, ThemeContext, DebugContext
- **Absolute Imports**: `~` alias for cleaner imports
- **Optimistic Updates**: Immediate UI feedback with background sync
- **Auto-save**: 3-second debounce after typing

## Team Structure

This team manages the Context app's development, security, and quality assurance.

### Product Owner
Strategic direction, requirements, and user experience for the AI-powered knowledge management system. Focuses on user flows for document organization, AI generation features, and token economy.

### Architect
System design for the mobile app architecture, Supabase integration, AI provider abstraction, and token counting/monetization systems. Ensures scalable patterns for document management and AI features.

### Senior Developer
Complex features including AI generation, token transactions, document versioning, and markdown processing. Mentors on React Native patterns, Supabase integration, and service layer design.

### Developer
Feature implementation for UI components, document CRUD operations, auto-save functionality, and basic AI integration. Bug fixes and testing.

### Security Engineer
Supabase Row-Level Security (RLS), API key management, token balance validation, and preventing unauthorized AI usage. Ensures user data isolation and secure payment integration.

### QA Lead
Testing strategy for mobile app (iOS/Android), AI generation accuracy, token counting correctness, auto-save reliability, and offline behavior. Quality gates for releases.

## Project Context

- **Location**: `/apps/context/` (workspace root)
- **Mobile App**: `/apps/context/apps/mobile/`
- **Future**: Web (SvelteKit), Backend (NestJS), Landing (Astro) planned
- **Documentation**: `/apps/context/CLAUDE.md`
- **Current Stage**: Mobile MVP with AI integration and monetization

## Development Commands

```bash
# From monorepo root
pnpm dev:context:mobile    # Start mobile app

# From /apps/context/apps/mobile
pnpm dev                   # Start Expo dev client
pnpm ios                   # Run on iOS simulator
pnpm android               # Run on Android emulator
pnpm type-check            # TypeScript check
pnpm lint                  # ESLint + Prettier check
pnpm format                # Fix linting issues
```

## Key Services

| Service | Purpose |
|---------|---------|
| `supabaseService.ts` | Core CRUD for users, spaces, documents |
| `aiService.ts` | Multi-model AI generation (Azure, Google) |
| `tokenCountingService.ts` | Token estimation and cost calculation |
| `tokenTransactionService.ts` | Token balance, transactions, logging |
| `revenueCatService.ts` | Subscription and token purchase management |
| `spaceService.ts` | Space management with document counters |
| `wordCountService.ts` | Word and character counting utilities |

## Database Schema

- **users**: User accounts linked to Supabase Auth
- **spaces**: Document containers with name, description, prefix, and document counters
- **documents**: Core content with title, content, type, short_id, metadata (tags, word_count, token_count)
- **token_transactions**: Audit trail for AI usage (model, input/output tokens, cost)

## Environment Variables

Required in `.env`:
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `EXPO_PUBLIC_OPENAI_API_KEY` - Azure OpenAI API key
- `EXPO_PUBLIC_GOOGLE_API_KEY` - Google Gemini API key
- `EXPO_PUBLIC_REVENUECAT_API_KEY` - RevenueCat API key

## Critical Patterns

1. **Short IDs**: Documents get auto-generated IDs like `MD1` (space prefix + type + counter)
2. **Token Counting**: Estimate tokens before generation to check balance
3. **Cost Calculation**: Convert AI provider tokens to app tokens (1000:1 ratio)
4. **Auto-save**: 3-second debounce with optimistic UI updates
5. **Document Mentions**: `@MD1` references other documents in content
6. **Metadata Handling**: Store tags, word_count, token_count in JSONB metadata field
