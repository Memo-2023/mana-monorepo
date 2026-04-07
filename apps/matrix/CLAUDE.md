# Manalink

Secure Matrix messaging client - a bridge to decentralized communication.

**Production URL:** https://link.mana.how

## Project Overview

Manalink is a privacy-focused Matrix client built with SvelteKit. It connects to Matrix homeservers (default: matrix.mana.how) and supports PWA installation for mobile devices.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit 2, Svelte 5 (runes), Tailwind CSS 4 |
| Matrix SDK | matrix-js-sdk + matrix-sdk-crypto-wasm |
| State Management | Svelte 5 runes ($state, $derived) |
| Icons | @mana/shared-icons (Phosphor) |
| PWA | @vite-pwa/sveltekit + Workbox |
| Date Handling | date-fns |

## Project Structure

```
apps/matrix/
├── apps/
│   └── web/                      # SvelteKit web client (PWA)
│       ├── src/
│       │   ├── routes/
│       │   │   ├── (auth)/       # Login flow
│       │   │   ├── (app)/        # Protected chat routes
│       │   │   └── health/       # Health check endpoint
│       │   └── lib/
│       │       ├── matrix/       # Matrix SDK integration
│       │       │   ├── store.svelte.ts  # Reactive Matrix store
│       │       │   ├── client.ts        # Login/auth functions
│       │       │   ├── crypto.ts        # E2EE utilities
│       │       │   ├── types.ts         # TypeScript types
│       │       │   └── polyfills.ts     # Browser polyfills
│       │       └── components/
│       │           ├── chat/     # Chat UI components
│       │           ├── call/     # VoIP call components
│       │           └── crypto/   # E2EE verification UI
│       ├── static/               # PWA icons and assets
│       ├── scripts/
│       │   └── generate-icons.mjs  # Icon generation script
│       └── package.json
└── packages/
    └── shared/                   # Shared types
```

## Development

```bash
# Start the web client
pnpm dev:matrix:web

# Or from monorepo root
pnpm matrix:dev

# Generate PWA icons (after changing favicon.svg)
cd apps/matrix/apps/web && node scripts/generate-icons.mjs
```

The client runs on **http://localhost:5180**

## PWA Features

Manalink is a Progressive Web App with:

- **Installable** on iOS/Android homescreen
- **Offline support** via Service Worker caching
- **Push notifications** (Web Push API)
- **App shortcuts** for quick actions

### Caching Strategy

| Content | Strategy | TTL |
|---------|----------|-----|
| Matrix API | NetworkFirst | 5 min |
| Images/Avatars | CacheFirst | 30 days |
| Fonts | CacheFirst | 1 year |
| App Shell | StaleWhileRevalidate | - |

### Installation

1. Open https://[your-domain] in a mobile browser
2. Tap "Add to Home Screen" (iOS) or install prompt (Android/Chrome)
3. Launch from homescreen for fullscreen app experience

## Key Files

### Matrix Store (`src/lib/matrix/store.svelte.ts`)

Central reactive store using Svelte 5 runes:

```typescript
import { matrixStore } from '$lib/matrix';

// State
matrixStore.syncState      // 'STOPPED' | 'PREPARED' | 'SYNCING' | etc.
matrixStore.isReady        // boolean - client ready for use
matrixStore.rooms          // SimpleRoom[] - all rooms
matrixStore.messages       // SimpleMessage[] - current room messages
matrixStore.currentRoom    // Room | null - selected room

// Actions
await matrixStore.initialize(credentials);
matrixStore.selectRoom(roomId);
await matrixStore.sendMessage('Hello!');
await matrixStore.sendTyping(true);
matrixStore.logout();
```

### Login Client (`src/lib/matrix/client.ts`)

```typescript
import { loginWithPassword, checkHomeserver } from '$lib/matrix';

const result = await loginWithPassword('matrix.mana.how', 'user', 'password');
if (result.success) {
  await matrixStore.initialize(result.credentials);
}
```

## Features

### Phase 1 (Current)
- [x] Password login + SSO (Mana Core)
- [x] Room list (DMs and groups)
- [x] Message timeline with pagination
- [x] Send text messages
- [x] Typing indicators
- [x] Read receipts
- [x] Unread/highlight counts
- [x] Room creation
- [x] Room settings
- [x] Message search
- [x] PWA support

### Phase 2 (In Progress)
- [ ] End-to-end encryption (E2EE)
- [ ] File/image uploads
- [ ] Message editing/deletion
- [ ] User search/invite
- [ ] Message reactions

### Phase 3 (Future)
- [ ] VoIP calls (WebRTC)
- [ ] Video calls
- [ ] Screen sharing
- [ ] Capacitor native wrapper

## Configuration

### Environment Variables

No environment variables required for basic usage. The client stores credentials in localStorage.

### Default Homeserver

The login page defaults to `matrix.mana.how` but any Matrix homeserver can be used.

### Test Account

For testing the SSO login flow:
- **Email:** t@t.de
- **Password:** test1234
- **Auth URL:** https://auth.mana.how
- **Matrix Homeserver:** matrix.mana.how
- **Web Client:** https://link.mana.how

## Matrix SDK Notes

### Browser Polyfills

matrix-js-sdk requires polyfills for browser usage. These are automatically loaded in `src/lib/matrix/polyfills.ts`:

- `Buffer` from buffer package
- `global` mapped to `globalThis`
- `process.env` stub

### Vite Configuration

Special Vite config for Matrix SDK + PWA:

```typescript
// WASM headers for crypto
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  },
},
// PWA plugin
plugins: [
  SvelteKitPWA({
    registerType: 'autoUpdate',
    manifest: { ... },
    workbox: { ... },
  }),
],
```

### Client-Side Only

matrix-js-sdk only works client-side. Always guard with:

```typescript
import { browser } from '$app/environment';

if (browser) {
  await matrixStore.initialize();
}
```

## Troubleshooting

### Can't see the login page / stuck on loading

The app auto-logs in if credentials are stored in localStorage. To reset:

1. **Browser console method:**
   ```javascript
   localStorage.removeItem('matrix_credentials');
   location.reload();
   ```

2. **Direct URL:** Navigate to `https://link.mana.how/login` directly

3. **If logged in:** Use the logout button in settings or navigation

### "super.off is not a function"

This is a known issue with typed-event-emitter. Make sure polyfills are loaded before any matrix-js-sdk imports.

### Login fails with network error

1. Check if homeserver is reachable: `curl https://matrix.mana.how/_matrix/client/versions`
2. Verify CORS is configured on Synapse
3. Try without https:// prefix in homeserver field

### Messages not loading

The initial sync can take time depending on room history. Check `matrixStore.syncState` for status.

### PWA not installing

1. Ensure HTTPS is enabled
2. Check manifest.json is served correctly
3. Verify icons exist at specified paths
4. Check DevTools > Application > Manifest for errors

## Related Documentation

- [Matrix Client-Server API](https://spec.matrix.org/latest/client-server-api/)
- [matrix-js-sdk docs](https://matrix-org.github.io/matrix-js-sdk/)
- [Synapse Admin API](https://element-hq.github.io/synapse/latest/admin_api/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/frameworks/sveltekit.html)
