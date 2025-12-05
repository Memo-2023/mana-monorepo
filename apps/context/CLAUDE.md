# Context App

AI-powered document management and context system for knowledge organization.

## Structure

```
apps/context/
├── apps/
│   ├── mobile/      # Expo React Native app
│   ├── web/         # (Planned) SvelteKit Web-App
│   ├── backend/     # (Planned) NestJS Backend
│   └── landing/     # (Planned) Astro Landing Page
├── packages/        # Project-specific shared code
├── package.json     # Workspace root
└── pnpm-workspace.yaml
```

## Development Commands

```bash
# From monorepo root
pnpm dev:context:mobile    # Start mobile app

# From apps/context/apps/mobile
pnpm dev                   # Start Expo dev client
pnpm ios                   # Run on iOS simulator
pnpm android               # Run on Android emulator
pnpm build:dev             # EAS development build
pnpm build:preview         # EAS preview build
pnpm build:prod            # EAS production build
pnpm type-check            # TypeScript check
pnpm lint                  # ESLint + Prettier check
pnpm format                # Fix linting issues
```

## Tech Stack

- **Mobile**: Expo 52 + React Native 0.76
- **Styling**: NativeWind (TailwindCSS for React Native)
- **Database**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI (GPT-4), Azure OpenAI, Google Gemini
- **Monetization**: RevenueCat (subscriptions + token economy)
- **i18n**: i18next + react-i18next
- **Navigation**: Expo Router (file-based routing)

## Core Features

- **Spaces**: Organize documents into collections
- **Documents**: Text, context references, and AI prompts
- **AI Generation**: Multi-model support with streaming
- **Token Economy**: Track and manage AI usage credits

## Architecture

### Services (`apps/mobile/services/`)

| Service | Purpose |
|---------|---------|
| `supabaseService.ts` | Database CRUD operations |
| `aiService.ts` | AI model integrations |
| `revenueCatService.ts` | Subscription management |
| `tokenCountingService.ts` | Token usage calculation |
| `spaceService.ts` | Space management logic |

### State Management

- **AuthContext**: User authentication
- **ThemeContext**: Dark/light theme
- **DebugContext**: Development tools

### Database Schema

- **users**: User accounts
- **spaces**: Document containers (name, description, settings)
- **documents**: Core content (title, content, type, metadata)
- **token_transactions**: AI usage audit trail

## Environment Variables

Required in `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_OPENAI_API_KEY=
EXPO_PUBLIC_GOOGLE_API_KEY=
EXPO_PUBLIC_REVENUECAT_API_KEY=
```

## Important Patterns

1. **Absolute imports** with `~` alias (configured in tsconfig.json)
2. **NativeWind for styling** - use Tailwind classes
3. **Service layer pattern** - business logic in services
4. **Auto-save** - 3-second debounce after typing
5. **Optimistic updates** - immediate UI feedback
