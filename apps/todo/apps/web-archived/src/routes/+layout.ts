// Disable SSR for the entire app — all data is local-first (IndexedDB)
// This eliminates the SSR roundtrip and improves FCP by ~3-4 seconds
export const ssr = false;
