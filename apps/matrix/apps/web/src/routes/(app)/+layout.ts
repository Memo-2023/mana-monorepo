// Disable SSR for all (app) routes
// matrix-js-sdk requires browser APIs and shared-ui uses Svelte 5 runes
// that need client-side compilation
export const ssr = false;
