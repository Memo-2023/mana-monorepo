/**
 * Browser-side client for the mana-auth encryption vault.
 *
 * Talks to the three endpoints introduced in Phase 2:
 *   POST /api/v1/me/encryption-vault/init    — bootstrap a fresh master key
 *   GET  /api/v1/me/encryption-vault/key     — fetch the active master key
 *   POST /api/v1/me/encryption-vault/rotate  — destructive rotation
 *
 * Behaviour:
 *   - `unlock(token)` is the standard login path. Calls GET /key first; if
 *     the server returns 404 (`VAULT_NOT_INITIALISED`), automatically
 *     follows up with POST /init so the user is bootstrapped on first
 *     login per device. The recovered raw bytes are imported into a
 *     non-extractable CryptoKey and pushed into the active KeyProvider.
 *   - `lock()` clears the in-memory key. Called from the layout on logout.
 *   - All network calls go through a small retry loop (3 attempts,
 *     exponential backoff with jitter) so transient 5xx / network blips
 *     don't immediately leave the vault locked. 4xx is treated as
 *     permanent and surfaces immediately.
 *
 * Read-only mode on persistent failure:
 *   If the vault cannot be unlocked after retries, the active key
 *   provider stays locked. Sync-tracked tables that are flagged
 *   `enabled: true` in the registry will refuse to write (the
 *   wrapValue helper throws on a missing key) — caller code surfaces
 *   that as a "vault locked" toast. Plaintext tables continue to work.
 *
 * NOT in this module:
 *   - Token acquisition. The caller passes the JWT in. The vault client
 *     stays decoupled from the auth store so it can be tested with a
 *     mock fetch.
 *   - The MemoryKeyProvider instance — wired in by the layout/boot path
 *     via setKeyProvider(). This module just talks to the configured
 *     provider via setActiveProvider() at construction.
 */

import { importMasterKey } from './aes';
import { MemoryKeyProvider, setKeyProvider, getKeyProvider } from './key-provider';

const RETRY_MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 8000;

/** HTTP status codes that warrant a retry — transient server / network. */
function isRetriableStatus(status: number): boolean {
	return status === 0 || status === 408 || status === 429 || status >= 500;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function backoffDelay(attempt: number): number {
	const exp = Math.min(RETRY_MAX_DELAY_MS, RETRY_BASE_DELAY_MS * 2 ** attempt);
	return Math.floor(Math.random() * exp);
}

export type VaultUnlockState =
	| { status: 'unlocked' }
	| { status: 'locked' }
	| { status: 'error'; reason: 'auth' | 'network' | 'server' | 'unknown' };

export interface VaultClientOptions {
	/** Base URL of mana-auth, e.g. 'https://auth.mana.how'. */
	authUrl: string;
	/** Function returning the current JWT, or null if signed out. */
	getToken: () => Promise<string | null> | string | null;
}

export interface VaultClient {
	/** Unlocks the in-memory key provider by fetching from the server.
	 *  On first call per device, automatically initialises the vault. */
	unlock(): Promise<VaultUnlockState>;
	/** Clears the in-memory key — call on logout. */
	lock(): void;
	/** Forces a fresh fetch even if the provider is already unlocked.
	 *  Used by the rotate flow + tests. */
	refetch(): Promise<VaultUnlockState>;
	/** Triggers POST /rotate. Caller is responsible for re-encryption. */
	rotate(): Promise<VaultUnlockState>;
	/** Current snapshot of the unlock state. */
	getState(): VaultUnlockState;
}

/**
 * Builds a vault client and installs a MemoryKeyProvider as the active
 * provider. Idempotent: calling twice returns a fresh client but reuses
 * the same provider, so the new client picks up an already-unlocked key.
 */
export function createVaultClient(options: VaultClientOptions): VaultClient {
	const { authUrl, getToken } = options;

	// Reuse the existing MemoryKeyProvider if one is already installed —
	// otherwise create + register a fresh one.
	let provider: MemoryKeyProvider;
	const existing = getKeyProvider();
	if (existing instanceof MemoryKeyProvider) {
		provider = existing;
	} else {
		provider = new MemoryKeyProvider();
		setKeyProvider(provider);
	}

	let state: VaultUnlockState = provider.isUnlocked()
		? { status: 'unlocked' }
		: { status: 'locked' };

	// ─── Internal: HTTP with retry ───────────────────────────
	async function fetchVault(
		path: string,
		init: RequestInit
	): Promise<
		| { ok: true; data: { masterKey: string } }
		| { ok: false; status: number; body?: { error?: string; code?: string } }
	> {
		let lastStatus = 0;
		for (let attempt = 0; attempt < RETRY_MAX_ATTEMPTS; attempt++) {
			let res: Response;
			try {
				res = await fetch(`${authUrl}${path}`, init);
			} catch {
				lastStatus = 0; // network error
				if (attempt < RETRY_MAX_ATTEMPTS - 1) await sleep(backoffDelay(attempt));
				continue;
			}

			if (res.ok) {
				const data = (await res.json()) as { masterKey: string };
				return { ok: true, data };
			}

			lastStatus = res.status;
			if (!isRetriableStatus(res.status)) {
				const body = await res.json().catch(() => undefined);
				return { ok: false, status: res.status, body };
			}
			if (attempt < RETRY_MAX_ATTEMPTS - 1) await sleep(backoffDelay(attempt));
		}
		return { ok: false, status: lastStatus };
	}

	function authHeaders(token: string): RequestInit {
		return {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		};
	}

	async function applyMasterKey(masterKeyB64: string): Promise<void> {
		const raw = base64ToBytes(masterKeyB64);
		const cryptoKey = await importMasterKey(raw);
		provider.setKey(cryptoKey);
		// Best-effort: zero the raw bytes once they're imported. Doesn't
		// guarantee the JS heap is wiped (the underlying ArrayBuffer is
		// owned by the GC), but at least our reference goes away.
		raw.fill(0);
	}

	async function categorise(status: number): Promise<VaultUnlockState> {
		if (status === 401 || status === 403) return { status: 'error', reason: 'auth' };
		if (status === 0) return { status: 'error', reason: 'network' };
		if (status >= 500) return { status: 'error', reason: 'server' };
		return { status: 'error', reason: 'unknown' };
	}

	// ─── Public methods ──────────────────────────────────────

	async function unlock(): Promise<VaultUnlockState> {
		if (provider.isUnlocked()) {
			state = { status: 'unlocked' };
			return state;
		}

		const token = await getToken();
		if (!token) {
			state = { status: 'error', reason: 'auth' };
			return state;
		}

		// Try GET /key first.
		const fetchRes = await fetchVault('/api/v1/me/encryption-vault/key', {
			method: 'GET',
			...authHeaders(token),
		});

		if (fetchRes.ok) {
			await applyMasterKey(fetchRes.data.masterKey);
			state = { status: 'unlocked' };
			return state;
		}

		// 404 with VAULT_NOT_INITIALISED → bootstrap by calling /init.
		if (fetchRes.status === 404 && fetchRes.body?.code === 'VAULT_NOT_INITIALISED') {
			const initRes = await fetchVault('/api/v1/me/encryption-vault/init', {
				method: 'POST',
				...authHeaders(token),
			});
			if (initRes.ok) {
				await applyMasterKey(initRes.data.masterKey);
				state = { status: 'unlocked' };
				return state;
			}
			state = await categorise(initRes.status);
			return state;
		}

		state = await categorise(fetchRes.status);
		return state;
	}

	function lock(): void {
		provider.setKey(null);
		state = { status: 'locked' };
	}

	async function refetch(): Promise<VaultUnlockState> {
		provider.setKey(null);
		return unlock();
	}

	async function rotate(): Promise<VaultUnlockState> {
		const token = await getToken();
		if (!token) {
			state = { status: 'error', reason: 'auth' };
			return state;
		}
		const res = await fetchVault('/api/v1/me/encryption-vault/rotate', {
			method: 'POST',
			...authHeaders(token),
		});
		if (res.ok) {
			await applyMasterKey(res.data.masterKey);
			state = { status: 'unlocked' };
			return state;
		}
		state = await categorise(res.status);
		return state;
	}

	function getState(): VaultUnlockState {
		// Reconcile in case the provider was locked from somewhere else.
		if (!provider.isUnlocked() && state.status === 'unlocked') {
			state = { status: 'locked' };
		}
		return state;
	}

	return { unlock, lock, refetch, rotate, getState };
}

// ─── Helpers ─────────────────────────────────────────────────

function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}
