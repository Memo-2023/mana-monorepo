# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Memoro is a monorepo containing an AI-powered voice recording and memo management application with two apps:

- **Mobile App** (`apps/mobile/`): React Native + Expo cross-platform app (iOS, Android, Web)
- **Web App** (`apps/web/`): SvelteKit companion web application

Both apps share the same Supabase backend.

## Development Commands

### Mobile App (`apps/mobile/`)

```bash
# Development
npm start                    # Start Expo dev server
npm run start:dev            # Start with dev environment
npm run start:prod           # Start with prod environment
npm run ios                  # Run on iOS simulator
npm run android              # Run on Android emulator
npm run web                  # Run web version
npm run web:dev              # Run web with dev environment

# Code Quality
npm run lint                 # Run ESLint and Prettier check
npm run lint:fix             # Auto-fix linting issues
npm run lint:unused          # Find unused imports/vars
npm run format               # Format code with ESLint + Prettier

# Build & Deploy
npm run prebuild             # Generate native projects
npm run rebuild              # Clean rebuild (removes node_modules, ios/, android/)
npm run web:build            # Build for web deployment
eas build --profile development   # Development build
eas build --profile preview       # Preview build
eas build --profile production    # Production build
```

### Web App (`apps/web/`)

```bash
npm run dev                  # Start development server
npm run build                # Build for production
npm run preview              # Preview production build
npm run check                # Run svelte-check
npm run check:watch          # Watch mode for svelte-check
```

## Architecture

### Mobile App Architecture

**Framework Stack:**

- React Native 0.81.4 + Expo SDK 54
- Expo Router (file-based routing)
- TypeScript
- NativeWind (Tailwind CSS for React Native)
- Zustand (state management)

**Key Design Patterns:**

1. **Feature-Based Architecture** (`features/`):
   - Each feature is self-contained with its own services, hooks, components, and stores
   - Features: auth, audioRecordingV2, memos, spaces, credits, subscription, i18n, theme, etc.
   - 33 feature modules in total

2. **Atomic Design System** (`components/`):
   - `atoms/`: Basic UI components (Button, Input, Text, Icon, etc.)
   - `molecules/`: Composite components (MemoPreview, RecordingBar, TagSelector, etc.)
   - `organisms/`: Complex components (AudioRecorder, Memory, TranscriptDisplay, etc.)
   - `statistics/`: Specialized analytics components

3. **Route Structure** (`app/`):
   - `(public)/`: Unauthenticated routes (login, register)
   - `(protected)/`: Authenticated routes with auth guard
     - `(tabs)/`: Main tab navigation (home, memos, spaces)
     - `(memo)/[id]`: Dynamic memo detail pages
     - `(space)/[id]`: Dynamic space detail pages
   - Uses Expo Router's file-based routing with typed routes enabled

### Authentication System

Uses a **middleware-based authentication bridge** between the app and Supabase:

```
Mobile App → Middleware Auth Service → Supabase
```

**Key Points:**

- Middleware issues three tokens: `manaToken`, `appToken` (Supabase-compatible JWT), `refreshToken`
- Tokens stored securely via platform-specific `safeStorage` utility
- Auth state managed via `AuthContext` provider
- Supabase client configured to use JWT from middleware
- Row Level Security (RLS) policies use JWT claims (`sub`, `role`, `app_id`)
- Supports email/password, Google Sign-In, and Apple Sign-In
- Automatic token refresh mechanism

See `apps/mobile/features/auth/README.md` for detailed authentication flow.

### Audio Recording System

**AudioRecordingV2** is the current audio recording implementation:

- Uses `expo-audio` (migrated from deprecated `expo-av`)
- Platform-specific services: `IOSRecordingService`, `AndroidRecordingService`
- Zustand store for state management (`recordingStore`)
- Comprehensive error handling with retry strategies
- Android: Foreground service with wake locks
- iOS: Background audio capability with `mixWithOthers` mode
- Real-time status updates via polling
- Prevents zero-byte recordings with validation
- **Background recording works correctly** - continues when app is backgrounded or locked

**iOS Background Recording:**

- Uses `interruptionMode: 'mixWithOthers'` for background recording support
- Recording continues when pressing home button, switching apps, or locking device
- Audio session automatically restored when returning to foreground
- JavaScript timers suspended in background, but native recording continues
- Handles real interruptions (phone calls, Siri) automatically

**Recording Options:**

- High quality: M4A format with AAC encoding (MONO for compatibility)
- Presets: HIGH_QUALITY, MEDIUM_QUALITY, LOW_QUALITY, VOICE_MEMO
- Max duration and size limits
- Pause/resume support
- Audio level metering for waveform visualization
- Optimized for voice (MONO, 96 quality) to prevent FFmpeg 'chnl' box errors

**Key Technical Details:**

- MONO recording prevents iOS spatial audio metadata issues
- Audio session verification on cold start prevents first-recording failures
- Status polling restarts when app returns from background
- Full duration captured (foreground + background time)

See `apps/mobile/features/audioRecordingV2/README.md` for full details.
See `apps/mobile/features/audioRecordingV2/TROUBLESHOOTING.md` for bug fixes and solutions.

### AI Processing System

**Blueprints:**

- Reusable AI analysis patterns for different use cases
- Examples: Text Analysis, Creative Writing, Meeting Notes
- Each blueprint has localized advice tips (32 languages)
- Stored in Supabase with public/private visibility

**Prompts:**

- Specific AI tasks for content transformation
- Examples: Summary, To-Do extraction, Translation, Q&A
- Associated with blueprints via `blueprint_prompts` join table
- Multi-language support (German/English minimum)

**Content Organization:**

- 8 categories: Coaching, Crafts, Healthcare, Journal, Journalism, Office, Sales, University
- Categories provide contextual grouping for blueprints/prompts

See `apps/mobile/docs/blueprints_and_prompts.md` for full documentation.

### Theme System

**Multi-Theme Support:**

- 4 theme variants: Lume (gold), Nature (green), Stone (slate), Ocean (blue)
- Each theme has light and dark mode variants
- 13 semantic color tokens per theme (primary, secondary, borders, backgrounds, text)
- Theme state managed via `ThemeProvider` context
- Dark mode detection + manual override
- All colors defined in `tailwind.config.js`

**Markdown Rendering:**

- Full Markdown support in memo display
- Theme-aware styles adapt to light/dark mode
- Centralized styles in `features/theme/markdownStyles.ts`
- Hybrid rendering with auto-detection

### Spaces (Collaboration)

**Team Workspaces:**

- Create unlimited collaborative spaces
- Role-based permissions (owner, member)
- Memo sharing within spaces
- Email-based invitation system
- Credit pools shared among team members
- Real-time sync via Supabase Realtime

**Backend Integration:**

- RESTful API for space management
- RLS policies for access control
- Space-specific memo filtering

See `apps/mobile/docs/SPACES.md` for implementation details.

### Subscription & Credits

**Mana Credit System:**

- Backend-driven transparent pricing
- Real-time credit validation before operations
- Usage tracking and analytics
- Credit sharing in team spaces
- Free tier: 150 Mana + 5 daily Mana

**RevenueCat Integration:**

- Cross-platform (iOS, Android, Web)
- Subscription lifecycle management
- User identification tied to auth
- Purchase restoration across devices
- 4 individual plans: Stream (€5.99), River (€14.99), Lake (€29.99), Ocean (€49.99)
- Team and Enterprise plans available

### Internationalization

**32 Languages Supported:**

- Arabic, Bengali, Bulgarian, Chinese, Czech, Danish, Dutch, English, Estonian, Finnish, French, Gaelic, German, Greek, Hindi, Croatian, Hungarian, Indonesian, Italian, Japanese, Korean, Lithuanian, Latvian, Maltese, Norwegian, Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swedish, Turkish, Ukrainian, Urdu, Vietnamese

**Implementation:**

- `react-i18next` for translations
- Automatic device language detection
- Persistent user preference storage
- RTL support for Arabic/Hebrew
- Translation files in `features/i18n/translations/`

### Real-Time Features

**Supabase Realtime:**

- Live memo updates (INSERT, UPDATE, DELETE)
- Real-time collaboration in spaces
- `MemoRealtimeProvider` context for subscriptions
- Automatic reconnection handling
- RLS-aware subscriptions

### Platform-Specific Notes

**Web Platform:**

- Uses `.web.ts` file extensions for web-specific implementations
- `safeStorage.web.ts` uses localStorage (vs AsyncStorage on native)
- Web Audio API for recording (vs expo-audio)
- Some features unavailable: push notifications, haptics, native gestures

**iOS:**

- Background audio capability required
- Audio session management
- Apple Sign-In integration
- RevenueCat StoreKit 2

**Android:**

- Foreground service for recording
- Wake lock to prevent sleep
- Android 16+ requires foreground to start recording
- Google Sign-In integration

## Environment Configuration

The mobile app uses environment-specific `.env` files:

- `.env.dev`: Development environment (copy from `.env.dev.example`)
- `.env.prod`: Production environment (copy from `.env.prod.example`)
- `.env.local`: Active environment (auto-generated by npm scripts)

**Key Environment Variables:**

- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `EXPO_PUBLIC_MIDDLEWARE_API_URL`: Middleware auth service URL
- `EXPO_PUBLIC_APPID`: Application ID for middleware
- RevenueCat keys for iOS/Android

## Code Quality

**Linting:**

- ESLint with TypeScript plugin
- React/React Native rules
- Unused imports auto-removal
- Configuration in `eslint.config.js`

**Formatting:**

- Prettier with Tailwind plugin
- Auto-format on save recommended

**TypeScript:**

- Strict mode enabled
- Typed routes from Expo Router
- Type definitions in `types/` and feature-specific types

## Migration Notes

**Expo SDK 54 Migration:**

- Migrated from `expo-av` to `expo-audio`
- New audio recording API (`AudioModule.AudioRecorder`)
- Status polling instead of callbacks
- See `EXPO_54_AUDIO_RECORDING_MIGRATION.md`

**SvelteKit Web App:**

- Separate web app being built as companion
- Shares Supabase backend with mobile app
- See `SVELTEKIT_MIGRATION_ANALYSIS.md` for migration plan

## Testing Strategy

**Manual Testing:**

- Test on both iOS and Android before commits
- Verify web platform compatibility
- Check dark mode and all theme variants
- Test with different languages

**Platform Matrix:**

- iOS (simulator + device)
- Android (emulator + device)
- Web (Chrome, Safari, Firefox)

## Common Patterns

### Creating a New Feature

1. Create feature directory in `features/`
2. Add subdirectories: `components/`, `hooks/`, `services/`, `store/`, `types/`
3. Export public API via `index.ts`
4. Add feature-specific README if complex
5. Update this CLAUDE.md if architectural

### Adding a New Route

1. Add file in `app/` directory following Expo Router conventions
2. Use `(protected)/` group if authentication required
3. Use `[id]` for dynamic routes
4. Enable typed routes in `app.json` (already enabled)
5. Import route types from `expo-router`

### Working with Zustand Stores

```typescript
// Create store
export const useMyStore = create<MyState>((set, get) => ({
	// state
	data: null,

	// actions
	setData: (data) => set({ data }),

	// computed/derived
	getData: () => get().data,
}));
```

Stores are located in:

- Global: `store/store.ts`
- Feature-specific: `features/[feature]/store/`

### Platform-Specific Code

Use file extensions for platform-specific implementations:

- `file.ts`: Default (mobile)
- `file.web.ts`: Web platform
- `file.ios.ts`: iOS only
- `file.android.ts`: Android only

Metro bundler automatically resolves based on platform.

### Error Handling

1. Use feature-specific error types
2. Provide user-friendly messages
3. Include retry mechanisms where appropriate
4. Log errors to console for debugging
5. Consider Sentry integration for production

## Build and Deployment

**EAS Build Profiles:**

- `development`: Dev client with debugging
- `preview`: Internal distribution (TestFlight/Google Play Internal)
- `simulator`: iOS simulator build
- `production`: Auto-increment version, store-ready

**Environment Selection:**
EAS profiles automatically load correct environment via `EXPO_PUBLIC_USE_ENV_FILE` in `eas.json`.

**Version Management:**

- iOS: `buildNumber` in `app.json`
- Android: `versionCode` in `app.json`
- Production profile auto-increments both

## Important Files

- `app.json`: Expo configuration, plugins, permissions
- `eas.json`: EAS Build configuration
- `package.json`: Dependencies and scripts
- `tailwind.config.js`: Theme colors and styling
- `eslint.config.js`: Linting rules
- `babel.config.js`: Babel configuration
- `metro.config.js`: Metro bundler configuration (if present)
- `types/supabase.ts`: Auto-generated Supabase types

## Database Schema

The app uses Supabase with the following key tables:

- `memos`: Audio recordings and transcriptions
- `memories`: AI-generated insights from memos
- `blueprints`: AI analysis templates
- `prompts`: AI task templates
- `blueprint_prompts`: Many-to-many join table
- `categories`: Organization categories
- `tags`: User-defined tags
- `memo_tags`: Many-to-many join table
- `spaces`: Collaborative workspaces
- `space_members`: User-space relationships
- `profiles`: User profiles and settings

All tables use RLS policies based on JWT claims.

## Known Issues

1. **Android 16+ Recording**: Must be in foreground to start recording
2. **Zero-byte Recordings**: Occasional issue on some Android devices (retry mechanism in place)
3. **Token Refresh**: Email may not be in refreshed token (stored separately as workaround)
4. **Web Platform**: Limited functionality vs native (no push notifications, haptics, etc.)

## Additional Documentation

- `apps/mobile/README.md`: Full mobile app documentation
- `apps/web/README.md`: Web app documentation
- `features/auth/README.md`: Authentication system details
- `features/audioRecordingV2/README.md`: Audio recording implementation
- `docs/blueprints_and_prompts.md`: AI processing system
- `docs/SPACES.md`: Collaboration features
- `SVELTEKIT_MIGRATION_ANALYSIS.md`: Web app migration plan
