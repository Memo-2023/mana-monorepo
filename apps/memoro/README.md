# Memoro

**AI-powered voice recording and memo management platform** that transforms audio recordings into structured, searchable content using artificial intelligence.

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.81.4-61dafb)
![Expo](https://img.shields.io/badge/Expo-54.0.0-000020)
![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-ff3e00)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)

## 📱 What is Memoro?

Memoro is a cross-platform application that combines voice recording, AI processing, and collaborative features to help individuals and teams capture, organize, and analyze spoken content. Record meetings, interviews, lectures, or personal notes, and let AI transform them into structured, actionable insights.

### Key Features

✨ **High-Quality Audio Recording** - Background recording with pause/resume support
🤖 **AI-Powered Analysis** - Transform recordings using customizable Blueprints and Prompts
👥 **Collaborative Spaces** - Share and organize memos within team workspaces
🌍 **32 Languages** - Full internationalization with automatic language detection
🎨 **4 Theme Variants** - Light/dark mode with Nature, Ocean, Stone, and Lume themes
💰 **Credit System** - Transparent Mana-based pricing for AI operations
🔒 **Enterprise Security** - Row-level security with JWT authentication
📊 **Rich Analytics** - Track usage, productivity, and team insights

## 🏗 Monorepo Structure

```
memoro_app/
├── apps/
│   ├── mobile/          # React Native + Expo app (iOS & Android native)
│   └── web/             # SvelteKit web application
├── CLAUDE.md            # Development guidance for Claude Code
└── README.md            # This file
```

Both applications share the same Supabase backend for seamless data synchronization.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **pnpm**
- **Expo CLI** (for mobile development)
- **iOS Simulator** (macOS only) or **Android Emulator**
- **Supabase Account** (for backend services)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd memoro_app

# Install mobile app dependencies
cd apps/mobile
npm install

# Install web app dependencies
cd ../web
npm install
```

### Environment Setup

Both apps require environment variables. Copy the example files and fill in your credentials:

```bash
# Mobile app
cd apps/mobile
cp .env.dev.example .env.dev
cp .env.prod.example .env.prod
# Edit .env.dev and .env.prod with your Supabase and API credentials

# Web app
cd apps/web
cp .env.example .env
# Edit .env with your Supabase credentials
```

**Required Environment Variables:**

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `EXPO_PUBLIC_MIDDLEWARE_API_URL` - Middleware authentication service URL
- `EXPO_PUBLIC_APPID` - Application ID for middleware

### Running the Apps

**Mobile App (iOS & Android):**

```bash
cd apps/mobile

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run with specific environment
npm run start:dev    # Development environment
npm run start:prod   # Production environment
```

**Web App:**

```bash
cd apps/web

# Start development server
npm run dev

# Build for production
npm run build
npm run preview
```

## 📖 Documentation

### Comprehensive Guides

- **[CLAUDE.md](./CLAUDE.md)** - Complete architectural overview and development guidelines
- **[Mobile App README](./apps/mobile/README.md)** - Detailed mobile app documentation
- **[Web App README](./apps/web/README.md)** - SvelteKit web app guide

### Feature Documentation

- **[Authentication System](./apps/mobile/features/auth/README.md)** - Middleware-based auth with JWT
- **[Audio Recording](./apps/mobile/features/audioRecordingV2/README.md)** - AudioRecordingV2 implementation
- **[Blueprints & Prompts](./apps/mobile/docs/blueprints_and_prompts.md)** - AI processing system
- **[Spaces](./apps/mobile/docs/SPACES.md)** - Collaborative workspaces
- **[SvelteKit Migration](./SVELTEKIT_MIGRATION_ANALYSIS.md)** - Web app migration analysis

## 🛠 Technology Stack

### Mobile App (`apps/mobile/`)

| Category       | Technologies                             |
| -------------- | ---------------------------------------- |
| **Framework**  | React Native 0.81.4, Expo SDK 54         |
| **Language**   | TypeScript 5.x                           |
| **Navigation** | Expo Router (file-based)                 |
| **Styling**    | NativeWind (Tailwind CSS)                |
| **State**      | Zustand, React Context                   |
| **Backend**    | Supabase (PostgreSQL, Storage, Realtime) |
| **Audio**      | expo-audio, Azure Speech Services        |
| **Payments**   | RevenueCat (iOS, Android)                |
| **Analytics**  | PostHog, Sentry                          |
| **i18n**       | react-i18next (32 languages)             |

### Web App (`apps/web/`)

| Category      | Technologies                  |
| ------------- | ----------------------------- |
| **Framework** | SvelteKit 2.x                 |
| **Language**  | TypeScript 5.x                |
| **Styling**   | TailwindCSS 3.x               |
| **State**     | Svelte Stores                 |
| **Backend**   | Supabase (shared with mobile) |
| **i18n**      | svelte-i18n                   |

## 🏛 Architecture Highlights

### Feature-Based Structure

The mobile app uses a feature-based architecture with **33 self-contained modules** (auth, audioRecordingV2, memos, spaces, credits, subscription, i18n, theme, etc.), each with its own services, hooks, components, and stores.

### Atomic Design System

Components are organized using atomic design principles:

- **Atoms**: Button, Input, Text, Icon (16 components)
- **Molecules**: MemoPreview, RecordingBar, TagSelector (21 components)
- **Organisms**: AudioRecorder, Memory, TranscriptDisplay (9 components)
- **Statistics**: Analytics components (14 components)

### Middleware Authentication

Uses a custom middleware service as a bridge between the app and Supabase:

```
Mobile/Web App → Middleware Auth → Supabase (with JWT + RLS)
```

- Three token types: `manaToken`, `appToken`, `refreshToken`
- Platform-specific secure storage
- Automatic token refresh
- Supports email/password, Google, and Apple Sign-In

### AI Processing Pipeline

- **Blueprints**: Reusable analysis patterns (Text Analysis, Creative Writing, Meeting Notes)
- **Prompts**: Specific AI tasks (Summary, To-Do, Translation, Q&A)
- **Categories**: 8 organizational categories (Office, Healthcare, University, etc.)
- Multi-language support with localized advice

## 🎯 Key Features Deep Dive

### Audio Recording System (V2)

- High-quality M4A/AAC recording
- Background recording with foreground service (Android)
- Pause/resume support
- Real-time audio metering
- Platform-specific optimizations (iOS/Android)
- Crash recovery with automatic segmentation
- Zero-byte recording prevention

### Collaborative Spaces

- Create unlimited team workspaces
- Role-based permissions (owner, member)
- Email-based invitation system
- Shared credit pools
- Real-time collaboration via Supabase Realtime

### Theme System

4 complete theme variants with light/dark modes:

- **Lume**: Modern gold & dark
- **Nature**: Soothing green
- **Stone**: Elegant slate
- **Ocean**: Tranquil blue

Each theme includes 13 semantic color tokens for consistent UI.

### Internationalization

**32 supported languages** with:

- Automatic device language detection
- Persistent user preferences
- RTL support (Arabic, Hebrew)
- Complete UI translations

Languages: Arabic, Bengali, Bulgarian, Chinese, Czech, Danish, Dutch, English, Estonian, Finnish, French, Gaelic, German, Greek, Hindi, Croatian, Hungarian, Indonesian, Italian, Japanese, Korean, Lithuanian, Latvian, Maltese, Norwegian, Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swedish, Turkish, Ukrainian, Urdu, Vietnamese.

## 💻 Development

### Code Quality Tools

```bash
# Mobile app linting
cd apps/mobile
npm run lint           # Check code quality
npm run lint:fix       # Auto-fix issues
npm run lint:unused    # Find unused imports/vars
npm run format         # Format with Prettier + ESLint

# Web app checking
cd apps/web
npm run check          # Type check
npm run check:watch    # Watch mode
```

### Building for Production

**Mobile App (EAS Build):**

```bash
cd apps/mobile

# Development build (with dev client)
eas build --profile development

# Preview build (internal testing)
eas build --profile preview

# Production build (store submission)
eas build --profile production
```

**Web App:**

```bash
cd apps/web

# Build static site
npm run build

# Preview production build
npm run preview
```

## 📊 Project Statistics

- **~10,890** TypeScript/JavaScript files in mobile app
- **33** feature modules
- **60+** reusable components
- **32** language translations
- **4** theme variants (8 including dark modes)
- **2** platforms (mobile + web)
- **1** shared Supabase backend

## 🔒 Security

- **Row Level Security (RLS)** on all Supabase tables
- **JWT-based authentication** with middleware
- **Secure token storage** (platform-specific)
- **Automatic token rotation**
- **Environment variable protection**
- **Sensitive file exclusion** (.gitignore)

## 🤝 Contributing

1. Read the [CLAUDE.md](./CLAUDE.md) for architectural guidance
2. Follow the atomic design system for components
3. Use feature-based organization for new features
4. Test on both iOS and Android before committing
5. Run linting and formatting before pushing
6. Update documentation for significant changes

## 📝 Common Development Tasks

### Adding a New Feature

```bash
# 1. Create feature directory in mobile app
mkdir -p apps/mobile/features/my-feature/{components,hooks,services,store,types}

# 2. Create index.ts for public API
touch apps/mobile/features/my-feature/index.ts

# 3. Add feature-specific README if complex
touch apps/mobile/features/my-feature/README.md

# 4. Update CLAUDE.md if architecturally significant
```

### Adding a New Route (Mobile)

```bash
# File-based routing with Expo Router
# Protected route:
touch apps/mobile/app/\(protected\)/my-route.tsx

# Public route:
touch apps/mobile/app/\(public\)/my-route.tsx
```

### Platform-Specific Code (Mobile App Only)

```bash
# Create platform variants for iOS/Android differences
touch apps/mobile/features/my-feature/myService.ts        # Default/shared
touch apps/mobile/features/my-feature/myService.ios.ts    # iOS-specific
touch apps/mobile/features/my-feature/myService.android.ts # Android-specific

# Metro bundler automatically resolves the correct file based on platform
# Note: .web.ts variants are no longer used - use apps/web/ for web features
```

### Adding a New Route (Web App)

```bash
# SvelteKit file-based routing
# Protected route:
mkdir -p apps/web/src/routes/\(protected\)/my-route
touch apps/web/src/routes/\(protected\)/my-route/+page.svelte

# Public route:
mkdir -p apps/web/src/routes/my-route
touch apps/web/src/routes/my-route/+page.svelte
```

## 🐛 Known Issues

1. **Android 16+**: Must be in foreground to start recording (platform restriction)
2. **Zero-byte recordings**: Occasional issue on some Android devices (retry mechanism implemented)
3. **Token refresh**: Email may not be in refreshed JWT (stored separately as workaround)

## 📄 License

Proprietary - All rights reserved

---

## 🔗 Quick Links

- **Documentation**: [CLAUDE.md](./CLAUDE.md)
- **Mobile App**: [apps/mobile/README.md](./apps/mobile/README.md)
- **Web App**: [apps/web/README.md](./apps/web/README.md)
- **Architecture**: See CLAUDE.md for detailed architecture
- **Issue Tracking**: (Add your issue tracker link)
- **Support**: (Add your support contact)

---

**Built with ❤️ using React Native, Expo, SvelteKit, and Supabase**
