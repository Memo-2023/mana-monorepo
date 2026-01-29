# Matrix Client

Self-hosted Matrix chat client built with SvelteKit and matrix-js-sdk.

## Project Overview

A minimal, privacy-focused Matrix client that connects to your self-hosted Synapse server (matrix.mana.how).

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit 2, Svelte 5 (runes), Tailwind CSS 4 |
| Matrix SDK | matrix-js-sdk |
| State Management | Svelte 5 runes ($state, $derived) |
| Icons | @manacore/shared-icons (Phosphor) |
| Date Handling | date-fns |

## Project Structure

```
apps/matrix/
├── apps/
│   └── web/                      # SvelteKit web client
│       ├── src/
│       │   ├── routes/
│       │   │   ├── (auth)/       # Login flow
│       │   │   ├── (app)/        # Protected chat routes
│       │   │   └── health/       # Health check endpoint
│       │   └── lib/
│       │       ├── matrix/       # Matrix SDK integration
│       │       │   ├── store.svelte.ts  # Reactive Matrix store
│       │       │   ├── client.ts        # Login/auth functions
│       │       │   ├── types.ts         # TypeScript types
│       │       │   └── polyfills.ts     # Browser polyfills
│       │       └── components/
│       │           └── chat/     # Chat UI components
│       └── package.json
└── packages/
    └── shared/                   # Shared types
```

## Development

```bash
# Start the Matrix web client
pnpm dev:matrix:web

# Or from monorepo root
pnpm matrix:dev
```

The client runs on **http://localhost:5180**

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
- [x] Password login
- [x] Room list (DMs and groups)
- [x] Message timeline
- [x] Send text messages
- [x] Typing indicators
- [x] Read receipts
- [x] Unread counts
- [x] Message pagination (load more)

### Phase 2 (Planned)
- [ ] End-to-end encryption (E2EE)
- [ ] File/image uploads
- [ ] Message editing/deletion
- [ ] Room creation
- [ ] User search/invite

### Phase 3 (Future)
- [ ] VoIP calls (WebRTC)
- [ ] Video calls
- [ ] Screen sharing

## Configuration

### Environment Variables

No environment variables required for basic usage. The client stores credentials in localStorage.

### Default Homeserver

The login page defaults to `matrix.mana.how` but any Matrix homeserver can be used.

## Matrix SDK Notes

### Browser Polyfills

matrix-js-sdk requires polyfills for browser usage. These are automatically loaded in `src/lib/matrix/polyfills.ts`:

- `Buffer` from buffer package
- `global` mapped to `globalThis`
- `process.env` stub

### Vite Configuration

Special Vite config in `vite.config.ts`:

```typescript
define: {
  global: 'globalThis',
},
optimizeDeps: {
  include: ['buffer', 'events'],
}
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

### "super.off is not a function"

This is a known issue with typed-event-emitter. Make sure polyfills are loaded before any matrix-js-sdk imports.

### Login fails with network error

1. Check if homeserver is reachable: `curl https://matrix.mana.how/_matrix/client/versions`
2. Verify CORS is configured on Synapse
3. Try without https:// prefix in homeserver field

### Messages not loading

The initial sync can take time depending on room history. Check `matrixStore.syncState` for status.

## Related Documentation

- [Matrix Client-Server API](https://spec.matrix.org/latest/client-server-api/)
- [matrix-js-sdk docs](https://matrix-org.github.io/matrix-js-sdk/)
- [Synapse Admin API](https://element-hq.github.io/synapse/latest/admin_api/)
