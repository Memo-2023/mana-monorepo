/**
 * @manacore/shared-auth-stores
 *
 * Svelte 5 auth store factories for the ManaCore monorepo.
 *
 * Provides two approaches:
 * 1. createAuthStore - Generic factory that works with any auth service adapter
 * 2. createSupabaseAuthStore - Direct Supabase integration for simpler setups
 *
 * @example Generic auth store with custom adapter
 * ```ts
 * import { createAuthStore } from '@manacore/shared-auth-stores';
 * import { authService } from '$lib/auth';
 * import type { AppUser } from '$lib/types';
 *
 * export const authStore = createAuthStore<AppUser>(authService);
 * ```
 *
 * @example Supabase auth store
 * ```ts
 * import { createSupabaseAuthStore } from '@manacore/shared-auth-stores';
 * import { createBrowserClient } from '@supabase/ssr';
 *
 * const getClient = () => createBrowserClient(url, key);
 * export const authStore = createSupabaseAuthStore(getClient);
 * ```
 */

// Factory functions
export { createAuthStore } from './createAuthStore.svelte';
export { createSupabaseAuthStore } from './createSupabaseAuthStore.svelte';
export type { CreateSupabaseAuthStoreOptions, SupabaseUser } from './createSupabaseAuthStore.svelte';

// Types
export type {
	BaseUser,
	AuthResult,
	AuthServiceAdapter,
	AuthStoreState,
	AuthStoreActions,
	AuthStore
} from './types';
