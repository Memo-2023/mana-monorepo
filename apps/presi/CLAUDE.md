# Presi Project Guide

## Project Structure

```
apps/presi/
├── apps/
│   ├── backend/      # NestJS API server (@presi/backend)
│   ├── web/          # SvelteKit web application (@presi/web)
│   └── landing/      # Astro marketing landing page (@presi/landing)
├── packages/
│   └── shared/       # Shared types and utils (@presi/shared)
└── package.json
```

## Commands

### Root Level (from monorepo root)

```bash
pnpm presi:dev                   # Run all presi apps
pnpm dev:presi:web               # Start web app (port 5178)
pnpm dev:presi:backend           # Start backend server
pnpm dev:presi:app               # Start web + backend together
pnpm presi:db:push               # Push schema to database
pnpm presi:db:studio             # Open Drizzle Studio
pnpm presi:db:seed               # Seed database with sample data
```

### Web App (apps/presi/apps/web)

```bash
pnpm dev                         # Start dev server (port 5178)
pnpm build                       # Build for production
pnpm preview                     # Preview production build
pnpm check                       # Run svelte-check
```

### Backend (apps/presi/apps/backend)

```bash
pnpm dev                         # Start with hot reload
pnpm build                       # Build for production
pnpm start:prod                  # Start production server
pnpm db:push                     # Push schema to database
pnpm db:studio                   # Open Drizzle Studio
pnpm db:seed                     # Seed database
```

## Technology Stack

- **Web**: SvelteKit 2.x, Svelte 5 (runes mode), Tailwind CSS
- **Backend**: NestJS 10, Drizzle ORM, PostgreSQL
- **Types**: TypeScript 5.x

## Architecture

### Core Features

- Create and manage presentation decks
- Add and edit slides with various content types
- Apply themes to presentations
- Share decks via share codes
- Present slides in full-screen mode

### Backend API Endpoints

| Endpoint                    | Method | Auth | Description              |
| --------------------------- | ------ | ---- | ------------------------ |
| `/api/health`               | GET    | No   | Health check             |
| `/api/decks`                | GET    | Yes  | Get user's decks         |
| `/api/decks`                | POST   | Yes  | Create new deck          |
| `/api/decks/:id`            | GET    | Yes  | Get deck details         |
| `/api/decks/:id`            | PUT    | Yes  | Update deck              |
| `/api/decks/:id`            | DELETE | Yes  | Delete deck              |
| `/api/decks/:id/slides`     | GET    | Yes  | Get slides for deck      |
| `/api/decks/:id/slides`     | POST   | Yes  | Add slide to deck        |
| `/api/slides/:id`           | PUT    | Yes  | Update slide             |
| `/api/slides/:id`           | DELETE | Yes  | Delete slide             |
| `/api/slides/reorder`       | PUT    | Yes  | Reorder slides           |
| `/api/share/:code`          | GET    | No   | Get shared deck (public) |
| `/api/share/deck/:id`       | POST   | Yes  | Create share link        |
| `/api/share/deck/:id/links` | GET    | Yes  | Get share links for deck |
| `/api/share/:shareId`       | DELETE | Yes  | Delete share link        |

### Data Models

**Deck** - Presentation deck

- `id` (string) - Unique identifier
- `userId` (string) - Owner user ID
- `title` (string) - Deck title
- `description` (string?) - Optional description
- `themeId` (string?) - Theme reference
- `isPublic` (boolean) - Visibility flag
- `createdAt` / `updatedAt` (timestamps)

**Slide** - Individual slide in a deck

- `id` (string) - Unique identifier
- `deckId` (string) - Parent deck reference
- `order` (number) - Position in deck
- `content` (SlideContent) - Slide content
- `createdAt` (timestamp)

**SlideContent** - Content structure

- `type`: 'title' | 'content' | 'image' | 'split'
- `title`, `subtitle`, `body`, `imageUrl`, `bulletPoints`

**Theme** - Visual theme

- `id`, `name`, `colors`, `fonts`, `isDefault`

**SharedDeck** - Share link for deck

- `id` (string) - Unique identifier
- `deckId` (string) - Reference to deck
- `shareCode` (string) - Unique share code (12 chars)
- `expiresAt` (timestamp?) - Optional expiration
- `createdAt` (timestamp)

### Environment Variables

#### Backend (.env)

```
NODE_ENV=development
PORT=3008
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/presi
MANA_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173,http://localhost:8081
```

#### Web (.env)

```
PUBLIC_BACKEND_URL=http://localhost:3008
PUBLIC_MANA_AUTH_URL=http://localhost:3001
```

## Shared Package

### @presi/shared

Located at `packages/shared/`

**Types:**

- `Deck`, `Slide`, `SlideContent`
- `Theme`, `ThemeColors`, `ThemeFonts`
- `SharedDeck` (for sharing feature)

**DTOs:**

- `CreateDeckDto`, `UpdateDeckDto`
- `CreateSlideDto`, `UpdateSlideDto`
- `ReorderSlidesDto`

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces
- **Web**: Svelte 5 runes mode (`$state`, `$derived`, `$effect`)
- **Backend**: NestJS modules with controllers and services
- **Styling**: Tailwind CSS
- **Formatting**: Prettier with project config

## Web App Features

The SvelteKit web app provides the main user interface:

- **Authentication**: Login/Register/Forgot Password with Mana Core Auth
- **Deck Management**: Create, edit, delete presentation decks
- **Slide Editor**: Create slides with title, body, bullet points, images
- **Presentation Mode**: Fullscreen presentation with keyboard navigation
  - Arrow keys / A/D for navigation
  - F for fullscreen toggle
  - ESC to exit
  - Timer with start/pause
  - Speaker notes toggle
- **Sharing**: Create share links for decks, public view without auth
- **Profile**: View user info and deck statistics
- **Settings**: Theme switching (light/dark/system), account info

### Web App Structure

```
src/
├── lib/
│   ├── api/client.ts        # API client with auth
│   └── stores/
│       ├── auth.svelte.ts   # Auth state (Svelte 5 runes)
│       └── decks.svelte.ts  # Decks/slides state
├── routes/
│   ├── +layout.svelte       # App layout with header
│   ├── +page.svelte         # Deck list (home)
│   ├── login/               # Login page
│   ├── register/            # Register page
│   ├── forgot-password/     # Password reset page
│   ├── deck/[id]/           # Deck editor with slides
│   ├── present/[id]/        # Presentation mode
│   ├── shared/[code]/       # Public shared deck view
│   ├── profile/             # User profile page
│   └── settings/            # Settings page
└── app.css                  # Global styles
```

## Important Notes

1. **Authentication**: Uses Mana Core Auth (JWT in Authorization header)
2. **Database**: PostgreSQL with Drizzle ORM
3. **Ports**: Backend=3008, Web=5178
4. **Landing**: Deployed on Cloudflare Pages
