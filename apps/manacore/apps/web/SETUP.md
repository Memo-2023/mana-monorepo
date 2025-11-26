# ManaCore Web - Setup Guide

## 🎉 Project Created Successfully!

A brand new SvelteKit application has been created in the `manacore-web` folder, separate from the existing React Native `manacore_app`.

## ✅ What's Been Implemented

### Core Infrastructure
- ✅ SvelteKit 2.x with Svelte 5 (Runes)
- ✅ TypeScript configuration
- ✅ Tailwind CSS styling
- ✅ Supabase authentication integration
- ✅ Server-side hooks for auth management
- ✅ Environment configuration

### Authentication System
- ✅ Login page (`/login`)
- ✅ Registration page (`/register`)
- ✅ Protected routes with automatic redirects
- ✅ Server-side session management
- ✅ SSR-safe Supabase client setup

### Dashboard
- ✅ Main dashboard with stats display
- ✅ Available mana/credits tracking
- ✅ Organization and team counts
- ✅ Quick action links
- ✅ Responsive design

### UI Components
- ✅ Button component (primary, secondary, danger, ghost variants)
- ✅ Card component
- ✅ Input component with validation
- ✅ Responsive navigation with mobile menu

## 📁 Project Structure

```
manacore-web/
├── src/
│   ├── routes/
│   │   ├── (auth)/              # Public auth routes
│   │   │   ├── login/           # Login page
│   │   │   └── register/        # Registration page
│   │   ├── (app)/               # Protected app routes
│   │   │   └── dashboard/       # Main dashboard
│   │   ├── +layout.svelte       # Root layout
│   │   ├── +layout.ts           # Client-side layout load
│   │   ├── +layout.server.ts    # Server-side layout load
│   │   └── +page.svelte         # Home page (redirects)
│   ├── lib/
│   │   ├── components/
│   │   │   └── ui/              # Reusable UI components
│   │   ├── server/              # Server-only utilities
│   │   ├── stores/              # Svelte stores
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Utility functions
│   ├── hooks.server.ts          # Server hooks (auth middleware)
│   ├── app.css                  # Global Tailwind styles
│   ├── app.d.ts                 # TypeScript declarations
│   └── app.html                 # HTML template
├── static/                      # Static assets
├── tests/                       # Test files (future)
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── svelte.config.js             # SvelteKit configuration
├── tailwind.config.js           # Tailwind configuration
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies
```

## 🚀 Getting Started

### 1. Configure Environment Variables

Update `.env` with your actual Supabase credentials:

```bash
# Get these from your Supabase project settings
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Install Dependencies (if not already done)

```bash
cd manacore-web
pnpm install
```

### 3. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:5173`

### 4. Database Setup

The app expects the same Supabase database schema as the React Native app. Ensure you have these tables:

- `profiles` - User profile data
- `organizations` - Organization entities
- `teams` - Team entities
- `team_members` - Team membership
- `user_roles` - Role assignments
- `roles` - Role definitions
- `credit_transactions` - Credit history

## 📝 Next Steps

### Immediate (Must Do)
1. **Update .env file** with real Supabase credentials
2. **Test login/registration** flow
3. **Verify database schema** matches expected structure

### Short-Term Features to Add
1. **Organizations Management**
   - List organizations page
   - Organization detail page
   - Create organization form

2. **Teams Management**
   - List teams page
   - Team detail page with members
   - Create team form
   - Add/remove team members

3. **Credit/Mana Transfer**
   - Send mana page
   - Credit transaction history
   - Balance tracking

4. **Settings Page**
   - Profile management
   - Theme toggle (light/dark)
   - Account settings

### Medium-Term Enhancements
1. **Real-time Updates**
   - Supabase realtime subscriptions
   - Live credit balance updates
   - Team activity notifications

2. **Enhanced UI/UX**
   - Loading skeletons
   - Error boundaries
   - Toast notifications
   - Optimistic UI updates

3. **Testing**
   - Vitest unit tests
   - Playwright E2E tests
   - Component testing

4. **Performance**
   - Image optimization
   - Code splitting
   - Caching strategies
   - Performance monitoring

## 🔧 Available Scripts

```bash
# Development
pnpm dev              # Start dev server

# Building
pnpm build            # Build for production
pnpm preview          # Preview production build

# Type Checking
pnpm check            # Run TypeScript checks
pnpm check:watch      # Watch mode

# Code Quality
pnpm format           # Format code with Prettier
pnpm lint             # Lint code

# Testing
pnpm test             # Run unit tests
pnpm test:ui          # Run tests with UI
pnpm test:e2e         # Run E2E tests
```

## 🎨 Design System

### Colors
- Primary: `#0055FF` (blue-600)
- Background Light: `#FFFFFF`
- Background Dark: `#121212`
- Text Light: `#1F2937`
- Text Dark: `#F9FAFB`

### Components
All components support:
- Dark mode (automatic via system preference)
- TypeScript props
- Tailwind CSS classes
- Accessibility features

### Responsive Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## 🔐 Authentication Flow

```
┌─────────────────────────────────────┐
│  User visits site                   │
│  ↓                                  │
│  hooks.server.ts checks session     │
│  ↓                                  │
│  Has session? → Go to /dashboard    │
│  ↓                                  │
│  No session? → Go to /login         │
│  ↓                                  │
│  User logs in                       │
│  ↓                                  │
│  Supabase creates session           │
│  ↓                                  │
│  Redirect to /dashboard             │
└─────────────────────────────────────┘
```

## 📚 Key Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| SvelteKit | 2.48.4 | Web framework |
| Svelte | 5.43.3 | UI components |
| TypeScript | 5.9.3 | Type safety |
| Tailwind CSS | 3.4.18 | Styling |
| Supabase | 2.79.0 | Backend/Auth |
| Vite | 6.4.1 | Build tool |
| Playwright | 1.56.1 | E2E testing |
| Vitest | 3.2.4 | Unit testing |

## 🆚 Comparison: React Native vs SvelteKit

| Feature | React Native (manacore_app) | SvelteKit (manacore-web) |
|---------|----------------------------|--------------------------|
| Platform | Mobile (iOS/Android) | Web (Browser) |
| Routing | Expo Router | File-based routing |
| State | useState/Context | Svelte Runes/$state |
| Styling | NativeWind | Tailwind CSS |
| Auth | Supabase | Supabase (same) |
| Database | Supabase | Supabase (same) |
| Build | Expo | Vite |
| Deployment | App Stores | Vercel/Netlify |

## 🚨 Common Issues & Solutions

### Issue: Type errors on first run
**Solution**: Run `pnpm run check` to sync types

### Issue: Port already in use
**Solution**: Change port in `vite.config.ts` or kill process on port 5173

### Issue: Supabase auth not working
**Solution**:
1. Check `.env` variables are correct
2. Verify Supabase project is active
3. Check browser console for errors

### Issue: Dark mode not switching
**Solution**: Check system dark mode preference, or implement manual toggle

## 📖 Documentation & Resources

### SvelteKit
- [SvelteKit Docs](https://svelte.dev/docs/kit)
- [Svelte 5 Tutorial](https://svelte.dev/tutorial/svelte/welcome)

### Supabase
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

### Tailwind CSS
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Tailwind UI](https://tailwindui.com)

## 💡 Development Tips

1. **Use Runes ($state, $derived, $effect)** - Modern Svelte 5 reactivity
2. **Server-side data loading** - Use `+page.server.ts` for secure data fetching
3. **Progressive enhancement** - Forms work without JavaScript
4. **Type safety** - Leverage generated types from SvelteKit
5. **Component composition** - Use snippets for flexible component APIs

## ✨ What Makes This Different

Unlike a migration, this is a **clean, modern implementation** that:
- ✅ Follows 2025 SvelteKit best practices
- ✅ Uses latest Svelte 5 features (Runes)
- ✅ Implements SSR-safe authentication
- ✅ Provides better developer experience
- ✅ Enables easy deployment to web platforms
- ✅ Maintains compatibility with same backend

## 🎯 Success Criteria

The project is ready for development when:
- [x] Project structure created
- [x] Dependencies installed
- [x] TypeScript configured
- [x] Tailwind CSS working
- [x] Authentication pages created
- [x] Dashboard implemented
- [ ] Environment variables configured with real credentials
- [ ] Database schema verified
- [ ] First successful login completed

## 🤝 Contributing

When adding new features:
1. Create components in `src/lib/components/`
2. Add pages in appropriate route groups
3. Use server-side data loading for security
4. Follow existing code patterns
5. Test in both light and dark modes
6. Add TypeScript types

## 📞 Support

For issues or questions:
- Check SvelteKit docs
- Review Supabase documentation
- Check browser console for errors
- Verify environment variables

---

**Status**: ✅ Core application structure complete and ready for feature development!

**Next**: Configure Supabase credentials and start building organization/team management features.
