/**
 * Lazy-singleton wrapper around createVaultClient.
 *
 * Module-level vault clients are awkward to share because they need
 * the auth store + the auth URL at construction time, neither of
 * which are available at module-load (the auth store is initialised
 * inside +layout.svelte's onMount). This wrapper builds the client
 * the first time `getVaultClient()` is called and reuses it for all
 * subsequent callers — root layout, settings page, future settings
 * sub-pages, debug tools.
 *
 * The MemoryKeyProvider lives inside the vault client and is set
 * via setKeyProvider during construction. Phase 3 already wired the
 * record-helpers to read from getActiveKey(), so once any caller
 * builds the singleton the rest of the data layer can encrypt and
 * decrypt without knowing about the vault client at all.
 */

import { createVaultClient, type VaultClient } from './vault-client';
import { authStore } from '$lib/stores/auth.svelte';
import { getManaAuthUrl } from '$lib/api/config';

let _instance: VaultClient | null = null;

export function getVaultClient(): VaultClient {
	if (!_instance) {
		_instance = createVaultClient({
			authUrl: getManaAuthUrl(),
			getToken: () => authStore.getAccessToken(),
		});
	}
	return _instance;
}

/** Test-only reset hook so each integration test starts with a fresh
 *  client. Not exported from the crypto barrel — internal to this file. */
export function _resetVaultInstanceForTesting(): void {
	_instance = null;
}
