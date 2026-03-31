# Memoro Web - SvelteKit Companion App

Web companion application for Memoro, built with SvelteKit. This is a hybrid architecture where the web app shares the same Supabase backend with the React Native mobile apps.

## Architecture

- **Frontend**: SvelteKit 2.x + TypeScript
- **Styling**: TailwindCSS 3.x
- **Backend**: Supabase (shared with mobile apps)
- **State Management**: Svelte stores
- **Internationalization**: svelte-i18n

## Features

### Core Features
- Authentication (Email/Password + OAuth)
- Audio recording (Web Audio API)
- Memo management (CRUD operations)
- Real-time updates (Supabase Realtime)
- Spaces & collaboration
- Multi-language support (32 languages)
- Dark mode + 4 theme variants
- Responsive design

### Web-Specific Features
- Progressive Web App (PWA) support
- Server-Side Rendering (SSR)
- SEO optimization
- Fast page loads

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase project (use the same one as mobile apps)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and add your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
memoro-web/
├── src/
│   ├── lib/
│   │   ├── components/      # Reusable Svelte components
│   │   ├── stores/          # Svelte stores for state management
│   │   ├── services/        # API services (Supabase, etc.)
│   │   └── utils/           # Utility functions
│   ├── routes/
│   │   ├── (public)/        # Public routes (login, register)
│   │   ├── (protected)/     # Protected routes (dashboard, memos)
│   │   ├── +layout.svelte   # Root layout
│   │   └── +page.svelte     # Home page
│   ├── app.css              # Global styles (TailwindCSS)
│   └── app.html             # HTML shell
├── static/                  # Static assets
└── package.json
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Netlify

1. Push to GitHub
2. Connect to Netlify
3. Build command: `npm run build`
4. Publish directory: `build`
5. Add environment variables
6. Deploy

## License

Proprietary - All rights reserved
