/**
 * @manacore/shared-auth-stores
 *
 * Svelte 5 auth store factories for the ManaCore monorepo.
 *
 * @example ManaCore auth store (recommended)
 * ```ts
 * import { createManaAuthStore } from '@manacore/shared-auth-stores';
 * export const authStore = createManaAuthStore();
 * ```
 *
 * @example Generic auth store with custom adapter
 * ```ts
 * import { createAuthStore } from '@manacore/shared-auth-stores';
 * import { authService } from '$lib/auth';
 * export const authStore = createAuthStore<AppUser>(authService);
 * ```
 */

// Factory functions
export { createManaAuthStore } from './createManaAuthStore.svelte';
export type { ManaAuthStoreConfig, ManaAuthStore } from './createManaAuthStore.svelte';
export { createAuthStore } from './createAuthStore.svelte';

// Types
export type {
	BaseUser,
	AuthResult,
	AuthServiceAdapter,
	AuthStoreState,
	AuthStoreActions,
	AuthStore,
} from './types';
