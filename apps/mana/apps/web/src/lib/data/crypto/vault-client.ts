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
import {
	deriveRecoveryWrapKey,
	wrapMasterKeyWithRecovery,
	parseRecoveryCode,
	generateRecoverySecret,
	formatRecoveryCode,
} from './recovery';

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
	/** Server is in zero-knowledge mode and the in-memory key is not
	 *  loaded yet. The client must call `unlockWithRecoveryCode(code)`
	 *  with the user's freshly-typed recovery code to finish unlocking. */
	| { status: 'awaiting-recovery-code' }
	| { status: 'error'; reason: 'auth' | 'network' | 'server' | 'unknown' };

export interface VaultClientOptions {
	/** Base URL of mana-auth, e.g. 'https://auth.mana.how'. */
	authUrl: string;
	/** Function returning the current JWT, or null if signed out. */
	getToken: () => Promise<string | null> | string | null;
}

/** Result of a successful recovery-code setup — the formatted code that
 *  the UI must display to the user (and force them to back up). */
export interface RecoveryCodeSetupResult {
	/** Formatted recovery code, e.g. "1A2B-3C4D-..." (79 chars). */
	formattedCode: string;
}

export interface VaultClient {
	/** Unlocks the in-memory key provider by fetching from the server.
	 *  On first call per device, automatically initialises the vault.
	 *  Returns 'awaiting-recovery-code' when the server is in zero-
	 *  knowledge mode — the UI must then collect the code and call
	 *  `unlockWithRecoveryCode`. */
	unlock(): Promise<VaultUnlockState>;
	/** Clears the in-memory key — call on logout. */
	lock(): void;
	/** Forces a fresh fetch even if the provider is already unlocked.
	 *  Used by the rotate flow + tests. */
	refetch(): Promise<VaultUnlockState>;
	/** Triggers POST /rotate. Caller is responsible for re-encryption.
	 *  Forbidden in zero-knowledge mode (returns auth error). */
	rotate(): Promise<VaultUnlockState>;
	/** Current snapshot of the unlock state. */
	getState(): VaultUnlockState;

	// ─── Phase 9: Recovery code + zero-knowledge ─────────────

	/** Generates a fresh recovery secret, derives a wrap key, seals the
	 *  currently-unlocked master key with it, and POSTs the wrapped blob
	 *  to /recovery-wrap. Returns the formatted recovery code that the
	 *  UI must show to the user once and only once.
	 *
	 *  Precondition: the vault must already be unlocked (the master key
	 *  needs to be in memory and extractable). Throws if locked.
	 *
	 *  This step alone does NOT enable zero-knowledge mode — it only
	 *  stores the recovery wrap. The user has to follow up with
	 *  `enableZeroKnowledge()` after confirming they have backed up the
	 *  code. */
	setupRecoveryCode(): Promise<RecoveryCodeSetupResult>;

	/** Removes the stored recovery wrap. Forbidden if zero-knowledge is
	 *  active (would lock the user out). */
	clearRecoveryCode(): Promise<void>;

	/** Flips the server into zero-knowledge mode. After this call:
	 *   - The server NULLs out wrapped_mk + wrap_iv
	 *   - The server can no longer decrypt the user's data
	 *   - On the next unlock (or refetch), GET /key returns the
	 *     recovery-wrapped blob and the client must call
	 *     `unlockWithRecoveryCode` to proceed
	 *
	 *  Precondition: a recovery wrap must already be stored. Throws
	 *  with reason='unknown' if the server returns RECOVERY_WRAP_MISSING. */
	enableZeroKnowledge(): Promise<void>;

	/** Disables zero-knowledge mode. The vault MUST currently be
	 *  unlocked (we need the plaintext MK to hand back to the server
	 *  for KEK re-wrapping). Throws if locked. */
	disableZeroKnowledge(): Promise<void>;

	/** Completes an unlock that was paused at `awaiting-recovery-code`.
	 *  Parses the user's recovery code, derives the wrap key, and
	 *  unwraps the recovery blob the server returned earlier. Throws
	 *  RecoveryCodeFormatError if the code shape is wrong; throws a
	 *  generic error if the code shape is fine but the unwrap fails
	 *  (wrong code or tampered blob — the caller maps both to "wrong
	 *  recovery code, try again"). */
	unlockWithRecoveryCode(code: string): Promise<VaultUnlockState>;
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

	/** When the server returns a zero-knowledge response from GET /key,
	 *  we stash the recovery blob here so the subsequent
	 *  `unlockWithRecoveryCode(code)` call can finish the unwrap without
	 *  a second round trip. Cleared after a successful unlock or any
	 *  state transition. */
	let pendingRecoveryBlob: { recoveryWrappedMk: string; recoveryIv: string } | null = null;

	/** Cached raw bytes of the master key. Held only when the vault was
	 *  unlocked via the recovery code path AND we anticipate a future
	 *  `disableZeroKnowledge()` call which needs to hand the MK back to
	 *  the server for KEK re-wrapping. The standard unlock path leaves
	 *  this null because the server already has the KEK wrap.
	 *
	 *  Wiped on lock(), on disableZeroKnowledge() success, and on any
	 *  state transition that destroys the master key. */
	let cachedUnwrappedMkBytes: Uint8Array | null = null;

	/** Wider response shape: GET /key + POST /init can return either
	 *  the unwrapped MK (standard mode) or the recovery-wrapped blob
	 *  (zero-knowledge mode). Mutation endpoints (recovery-wrap, zero-
	 *  knowledge, recovery-clear) just return `{ ok: true }`, which
	 *  the cast accepts as a no-op shape. */
	type VaultResponse =
		| { masterKey: string; formatVersion: number; kekId: string }
		| {
				requiresRecoveryCode: true;
				recoveryWrappedMk: string;
				recoveryIv: string;
				formatVersion: number;
		  }
		| { ok: true; zeroKnowledge?: boolean };

	// ─── Internal: HTTP with retry ───────────────────────────
	async function fetchVault(
		path: string,
		init: RequestInit
	): Promise<
		| { ok: true; data: VaultResponse }
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
				const data = (await res.json()) as VaultResponse;
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

	/** True iff the response carries the recovery-blob shape. */
	function isRecoveryBlob(data: VaultResponse): data is {
		requiresRecoveryCode: true;
		recoveryWrappedMk: string;
		recoveryIv: string;
		formatVersion: number;
	} {
		return 'requiresRecoveryCode' in data && data.requiresRecoveryCode === true;
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

	/** Stashes the recovery blob and flips state to await the user's
	 *  recovery code input. The actual unwrap happens later in
	 *  `unlockWithRecoveryCode`. */
	function awaitRecoveryCode(blob: { recoveryWrappedMk: string; recoveryIv: string }): void {
		pendingRecoveryBlob = blob;
		state = { status: 'awaiting-recovery-code' };
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
			pendingRecoveryBlob = null;
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
			// Zero-knowledge fork: server returned a recovery blob instead
			// of an unwrapped MK. Stash it and wait for the UI to collect
			// the user's recovery code.
			if (isRecoveryBlob(fetchRes.data)) {
				awaitRecoveryCode({
					recoveryWrappedMk: fetchRes.data.recoveryWrappedMk,
					recoveryIv: fetchRes.data.recoveryIv,
				});
				return state;
			}
			await applyMasterKey((fetchRes.data as { masterKey: string }).masterKey);
			pendingRecoveryBlob = null;
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
				if (isRecoveryBlob(initRes.data)) {
					awaitRecoveryCode({
						recoveryWrappedMk: initRes.data.recoveryWrappedMk,
						recoveryIv: initRes.data.recoveryIv,
					});
					return state;
				}
				await applyMasterKey((initRes.data as { masterKey: string }).masterKey);
				pendingRecoveryBlob = null;
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
		if (cachedUnwrappedMkBytes) {
			cachedUnwrappedMkBytes.fill(0);
			cachedUnwrappedMkBytes = null;
		}
		pendingRecoveryBlob = null;
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
			// Rotate is forbidden in ZK mode server-side, but the response
			// shape would be a recovery blob if it ever weren't. Treat the
			// success path as standard mode only.
			if (isRecoveryBlob(res.data)) {
				// Server bug — rotate should never return ZK shape. Bail.
				state = { status: 'error', reason: 'server' };
				return state;
			}
			await applyMasterKey((res.data as { masterKey: string }).masterKey);
			pendingRecoveryBlob = null;
			state = { status: 'unlocked' };
			return state;
		}
		state = await categorise(res.status);
		return state;
	}

	// ─── Phase 9: Recovery + Zero-Knowledge ─────────────────

	async function setupRecoveryCode(): Promise<RecoveryCodeSetupResult> {
		// Precondition: vault must be unlocked. We need to read the
		// active master key, which means it has to be in memory AND
		// extractable. The standard unlock flow uses non-extractable
		// keys (so they can't be exfiltrated), so we can't seal them
		// for recovery directly. Workaround: re-fetch the raw bytes
		// from the server, derive the wrap, then discard the bytes.
		if (state.status !== 'unlocked') {
			throw new Error('vault must be unlocked before setupRecoveryCode()');
		}

		const token = await getToken();
		if (!token) {
			throw new Error('no auth token available for setupRecoveryCode()');
		}

		// Re-fetch the master key in extractable form so we can wrap it.
		// The server returns the raw bytes which we immediately re-wrap
		// with the recovery key and discard.
		const fetchRes = await fetchVault('/api/v1/me/encryption-vault/key', {
			method: 'GET',
			...authHeaders(token),
		});
		if (!fetchRes.ok) {
			throw new Error(`failed to re-fetch master key for recovery wrap: ${fetchRes.status}`);
		}
		if (isRecoveryBlob(fetchRes.data)) {
			// Already in ZK mode — caller is confused. We'd need to
			// unwrap with the recovery code first.
			throw new Error('cannot set up recovery code: vault is already in zero-knowledge mode');
		}

		const rawMk = base64ToBytes((fetchRes.data as { masterKey: string }).masterKey);

		// Generate a fresh recovery secret + derive wrap key + seal MK.
		const recoverySecret = generateRecoverySecret();
		const recoveryWrapKey = await deriveRecoveryWrapKey(recoverySecret);

		// Import the MK as an EXTRACTABLE key just for the seal operation.
		// We can't reuse `importMasterKey` because that one is non-
		// extractable.
		const extractableMk = await crypto.subtle.importKey(
			'raw',
			toBufferSource(rawMk),
			{ name: 'AES-GCM', length: 256 },
			true,
			['encrypt', 'decrypt']
		);
		const sealed = await wrapMasterKeyWithRecovery(extractableMk, recoveryWrapKey);

		// Wipe both raw byte references now that they're sealed.
		rawMk.fill(0);

		// POST the wrapped blob to the server.
		const setRes = await fetchVault('/api/v1/me/encryption-vault/recovery-wrap', {
			method: 'POST',
			...authHeaders(token),
			body: JSON.stringify(sealed),
		});
		if (!setRes.ok) {
			throw new Error(`failed to store recovery wrap: ${setRes.status}`);
		}

		const formatted = formatRecoveryCode(recoverySecret);
		// Wipe the recovery secret reference. The formatted string still
		// has the bytes embedded as hex — that's what we hand to the UI
		// for the user to write down. The caller is responsible for
		// clearing the formatted string from memory once the user
		// confirms they backed it up.
		recoverySecret.fill(0);

		return { formattedCode: formatted };
	}

	async function clearRecoveryCode(): Promise<void> {
		const token = await getToken();
		if (!token) throw new Error('no auth token available');
		const res = await fetchVault('/api/v1/me/encryption-vault/recovery-wrap', {
			method: 'DELETE',
			...authHeaders(token),
		});
		if (!res.ok) {
			throw new Error(`failed to clear recovery wrap: ${res.status}`);
		}
	}

	async function enableZeroKnowledge(): Promise<void> {
		const token = await getToken();
		if (!token) throw new Error('no auth token available');
		const res = await fetchVault('/api/v1/me/encryption-vault/zero-knowledge', {
			method: 'POST',
			...authHeaders(token),
			body: JSON.stringify({ enable: true }),
		});
		if (!res.ok) {
			if (res.body?.code === 'RECOVERY_WRAP_MISSING') {
				throw new Error('set up a recovery code before enabling zero-knowledge mode');
			}
			throw new Error(`failed to enable zero-knowledge: ${res.status}`);
		}
	}

	async function disableZeroKnowledge(): Promise<void> {
		// Precondition: must be unlocked so we can hand the MK to the
		// server for KEK re-wrapping. The server can't decrypt anything
		// in ZK mode by definition.
		if (state.status !== 'unlocked') {
			throw new Error('vault must be unlocked before disableZeroKnowledge()');
		}

		const token = await getToken();
		if (!token) throw new Error('no auth token available');

		// Re-fetch the master key from the server. In ZK mode this
		// returns a recovery blob — but we can't be in ZK mode here
		// because the unlock flow would have stayed in awaiting-recovery-
		// code instead of unlocked. So we'd get a real MK back. EXCEPT:
		// the server is currently in ZK mode (that's why we're disabling
		// it), so the response IS a recovery blob. To get the plaintext
		// MK back, we use the extractable export of the in-memory key.
		//
		// Wait — the in-memory key is non-extractable. We can't export
		// it. We have to keep a reference to the raw bytes when we
		// originally unwrapped via `unlockWithRecoveryCode`. Add a
		// closure cache for that.
		if (!cachedUnwrappedMkBytes) {
			throw new Error(
				'cannot disable zero-knowledge: master key bytes not cached. ' +
					'Re-unlock with the recovery code first.'
			);
		}

		const mkB64 = bytesToBase64(cachedUnwrappedMkBytes);
		const res = await fetchVault('/api/v1/me/encryption-vault/zero-knowledge', {
			method: 'POST',
			...authHeaders(token),
			body: JSON.stringify({ enable: false, masterKey: mkB64 }),
		});
		if (!res.ok) {
			throw new Error(`failed to disable zero-knowledge: ${res.status}`);
		}
		// Wipe the cache once the server has accepted the re-wrap.
		cachedUnwrappedMkBytes.fill(0);
		cachedUnwrappedMkBytes = null;
	}

	async function unlockWithRecoveryCode(code: string): Promise<VaultUnlockState> {
		if (!pendingRecoveryBlob) {
			throw new Error(
				'no pending recovery blob — call unlock() first to fetch the zero-knowledge envelope'
			);
		}

		// Parse the user-typed code → 32 bytes. Throws RecoveryCodeFormatError
		// on shape errors; the caller maps to "format wrong" UI hint.
		const recoverySecret = parseRecoveryCode(code);
		const wrapKey = await deriveRecoveryWrapKey(recoverySecret);
		recoverySecret.fill(0);

		// Single inline unwrap that yields both the raw bytes (for the
		// disableZeroKnowledge cache) and a non-extractable runtime key
		// (for the active provider). We don't use the recovery module's
		// `unwrapMasterKeyWithRecovery` here because that one returns
		// only the non-extractable key — and we need both halves.
		let rawMk: Uint8Array;
		try {
			const iv = base64ToBytes(pendingRecoveryBlob.recoveryIv);
			const ct = base64ToBytes(pendingRecoveryBlob.recoveryWrappedMk);
			const plain = await crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv: toBufferSource(iv) },
				wrapKey,
				toBufferSource(ct)
			);
			rawMk = new Uint8Array(plain);
			if (rawMk.length !== 32) {
				throw new Error('unwrapped MK has wrong length');
			}
		} catch {
			// Stay in awaiting-recovery-code so the user can retry. Don't
			// clear pendingRecoveryBlob — we still need it for the next
			// attempt. Generic error so the UI can't leak which check failed.
			throw new Error('wrong recovery code or corrupted vault');
		}

		// Cache the raw bytes so a subsequent disableZeroKnowledge() can
		// hand them back to the server for KEK re-wrapping. The cache is
		// wiped on lock() and on disableZeroKnowledge() success.
		cachedUnwrappedMkBytes = new Uint8Array(rawMk);

		// Import a separate non-extractable copy for runtime use. This
		// is the key the rest of the app uses via getActiveKey().
		const cryptoKey = await importMasterKey(rawMk);
		rawMk.fill(0);

		provider.setKey(cryptoKey);
		pendingRecoveryBlob = null;
		state = { status: 'unlocked' };
		return state;
	}

	function getState(): VaultUnlockState {
		// Reconcile in case the provider was locked from somewhere else.
		// Don't override 'awaiting-recovery-code' just because the
		// provider is locked — that's the expected mid-flow state.
		if (!provider.isUnlocked() && state.status === 'unlocked') {
			state = { status: 'locked' };
		}
		return state;
	}

	return {
		unlock,
		lock,
		refetch,
		rotate,
		getState,
		setupRecoveryCode,
		clearRecoveryCode,
		enableZeroKnowledge,
		disableZeroKnowledge,
		unlockWithRecoveryCode,
	};
}

// ─── Helpers ─────────────────────────────────────────────────

function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

function bytesToBase64(bytes: Uint8Array): string {
	let bin = '';
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin);
}

/** TS 5.7 BufferSource compat — see comment in aes.ts. */
function toBufferSource(bytes: Uint8Array): ArrayBuffer {
	const buf = new ArrayBuffer(bytes.length);
	new Uint8Array(buf).set(bytes);
	return buf;
}
