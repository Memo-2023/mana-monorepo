# Mana Web

Modern SvelteKit web application for Mana credit/mana management system.

## Features

- 🔐 Authentication with Supabase
- 🎨 Tailwind CSS for styling
- 📱 Responsive design
- 🔄 Real-time updates
- 🏢 Organization management
- 👥 Team management
- 💰 Credit/Mana transfers
- 🧪 Comprehensive testing

## Tech Stack

- **Framework**: SvelteKit 2.x with Svelte 5 (Runes)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.x
- **Backend**: Supabase (PostgreSQL + Auth)
- **Middleware**: Mana Core Middleware API
- **Testing**: Vitest + Playwright
- **Deployment**: Vercel/Netlify ready

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm
- Supabase account and project
- Access to Mana Core Middleware

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Update .env with your credentials:
# - PUBLIC_SUPABASE_URL
# - PUBLIC_SUPABASE_ANON_KEY
# - PUBLIC_MIDDLEWARE_URL
```

### Development

```bash
# Start dev server
pnpm dev

# Run type checking
pnpm check

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

### Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── routes/              # File-based routing
│   ├── (auth)/         # Auth routes (login, register)
│   ├── (app)/          # Protected app routes
│   │   ├── dashboard/
│   │   ├── organizations/
│   │   ├── teams/
│   │   └── settings/
│   └── api/            # API endpoints
├── lib/
│   ├── components/     # Reusable components
│   │   ├── ui/        # UI primitives
│   │   └── features/  # Feature components
│   ├── stores/        # Svelte stores
│   ├── utils/         # Utilities
│   ├── types/         # TypeScript types
│   └── server/        # Server-only code
│       ├── db/        # Database utilities
│       ├── auth/      # Auth helpers
│       └── api/       # API integration
├── hooks.server.ts    # Server hooks
└── app.css            # Global styles
```

## Environment Variables

### Public Variables (exposed to client)

- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `PUBLIC_MIDDLEWARE_URL` - Mana Core Middleware URL
- `PUBLIC_APP_NAME` - Application name

### Private Variables (server-only)

Add any private API keys or secrets here.

## Deployment

### Netlify (Production Setup)

The app is currently deployed to **https://app.manacore.ai** using Netlify.

#### Prerequisites

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login
```

#### Initial Setup (One-time)

The project is already configured with `@sveltejs/adapter-netlify`. If you need to set it up from scratch:

```bash
# Install the Netlify adapter
pnpm add -D @sveltejs/adapter-netlify
```

Update `svelte.config.js`:

```javascript
import adapter from '@sveltejs/adapter-netlify';
```

#### Environment Variables

Ensure your `.env` file exists with the following variables:

```bash
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
MIDDLEWARE_URL=https://mana-core-middleware-111768794939.europe-west3.run.app
```

**Important**: Set these same environment variables in Netlify Dashboard → Site Settings → Environment Variables for production builds.

#### Deployment

```bash
# 1. Install dependencies (if needed)
pnpm install

# 2. Build for production
pnpm build

# 3. Deploy to production (site: manacore)
netlify deploy --prod --site manacore --dir build
```

The build process creates:

- `build/` - Static assets and client code
- `.netlify/` - Serverless functions for SSR

#### Build Output

After running `pnpm build`, you should see:

- ✅ Client bundle in `build/`
- ✅ Server functions in `.netlify/`
- ✅ Netlify configuration (`_headers`, `_redirects`)

#### Vercel (Alternative)

```bash
# Install Vercel adapter instead
pnpm add -D @sveltejs/adapter-vercel

# Deploy
vercel
```

### Docker

```bash
# Build image
docker build -t manacore-web .

# Run container
docker run -p 3000:3000 manacore-web
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and type checking
4. Submit a pull request

## License

Private - All rights reserved
