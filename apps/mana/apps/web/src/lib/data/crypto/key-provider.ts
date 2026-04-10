/**
 * Pluggable master-key provider.
 *
 * The encryption pipeline (Dexie hooks, liveQuery wrapper) reads the active
 * master key through `getActiveKey()` rather than holding a reference itself.
 * That indirection lets us swap implementations without touching call sites:
 *
 *   - NullKeyProvider     — default. No key available → encryption is a
 *                           no-op. Used during the gradual rollout while
 *                           individual tables are still `enabled: false`,
 *                           and in tests that don't care about crypto.
 *   - MemoryKeyProvider   — holds an unwrapped CryptoKey in memory only.
 *                           Wired up in Phase 3 with the bytes returned by
 *                           the mana-auth `/me/encryption-key` endpoint.
 *
 * Why an interface and not a global variable?
 *   - Tests can swap in fixed keys without monkey-patching imports
 *   - Future PasskeyKeyProvider can replace the in-memory one without
 *     touching the rest of the data layer
 *   - Lock/unlock state changes are observable via `onChange`, so the
 *     UI can react (show "vault locked" overlay, refetch encrypted lists)
 */

export interface KeyProvider {
	/** Returns the active master key, or `null` if the vault is locked
	 *  or no key has been provided yet. Synchronous on purpose so the
	 *  Dexie hooks can call it inline without async overhead. */
	getKey(): CryptoKey | null;

	/** True iff a key is currently available. Cheaper to check than
	 *  `getKey() !== null` if the caller doesn't need the key itself. */
	isUnlocked(): boolean;

	/** Subscribe to lock/unlock transitions. Returns a dispose function.
	 *  Listeners fire only on STATE CHANGES, not on every getKey call. */
	onChange(listener: (unlocked: boolean) => void): () => void;

	/** Resolves with the active key as soon as the vault is unlocked, or
	 *  with `null` if the timeout expires first. Used by encryptRecord to
	 *  ride out the boot-time race where the user clicks a mutation button
	 *  while the layout's `vaultClient.unlock()` round-trip is still in
	 *  flight. Implementations that can never unlock (NullKeyProvider)
	 *  resolve immediately with `null`. */
	waitForKey(timeoutMs: number): Promise<CryptoKey | null>;
}

// ─── NullKeyProvider — default ─────────────────────────────────

/**
 * Always-locked provider. Encryption call sites silently skip when this
 * is active, so the app keeps running with plaintext data even though
 * the encryption code paths are technically wired up. This is the safe
 * default during Phase 1 (no tables flipped to `enabled: true` yet).
 */
class NullKeyProvider implements KeyProvider {
	getKey(): null {
		return null;
	}
	isUnlocked(): boolean {
		return false;
	}
	onChange(): () => void {
		return () => {};
	}
	async waitForKey(): Promise<null> {
		// Null provider can never unlock — don't make callers wait the
		// full timeout for a guaranteed-null answer.
		return null;
	}
}

// ─── MemoryKeyProvider — Phase 3 production path ───────────────

/**
 * Holds a CryptoKey in process memory. The key never touches localStorage,
 * IndexedDB, or any other persistent surface — only sessionStorage gets a
 * one-bit "is unlocked" sentinel for the UI to read on hard reload (so it
 * knows whether to immediately show the locked overlay or wait for the
 * vault fetch).
 */
export class MemoryKeyProvider implements KeyProvider {
	private key: CryptoKey | null = null;
	private listeners = new Set<(unlocked: boolean) => void>();

	/** Set or clear the active key. `null` locks the vault. */
	setKey(key: CryptoKey | null): void {
		const wasUnlocked = this.key !== null;
		this.key = key;
		const nowUnlocked = key !== null;

		if (wasUnlocked !== nowUnlocked) {
			console.info(
				`[mana-crypto:key] MemoryKeyProvider: vault ${nowUnlocked ? 'UNLOCKED' : 'LOCKED'}`
			);
		}

		if (typeof window !== 'undefined') {
			if (nowUnlocked) sessionStorage.setItem('mana-vault-unlocked', '1');
			else sessionStorage.removeItem('mana-vault-unlocked');
		}

		if (wasUnlocked !== nowUnlocked) {
			for (const fn of this.listeners) {
				try {
					fn(nowUnlocked);
				} catch (err) {
					// Listeners are UI subscribers — never let one bad listener
					// break the lock/unlock cycle.
					console.error('[mana-crypto] vault listener threw:', err);
				}
			}
		}
	}

	getKey(): CryptoKey | null {
		return this.key;
	}

	isUnlocked(): boolean {
		return this.key !== null;
	}

	onChange(listener: (unlocked: boolean) => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	waitForKey(timeoutMs: number): Promise<CryptoKey | null> {
		if (this.key) return Promise.resolve(this.key);
		console.debug(
			`[mana-crypto:key] waitForKey — waiting up to ${timeoutMs}ms for vault unlock...`
		);
		return new Promise((resolve) => {
			let settled = false;
			const dispose = this.onChange((unlocked) => {
				if (settled || !unlocked) return;
				settled = true;
				clearTimeout(timer);
				dispose();
				console.debug('[mana-crypto:key] waitForKey — vault unlocked during wait');
				resolve(this.key);
			});
			const timer = setTimeout(() => {
				if (settled) return;
				settled = true;
				dispose();
				console.warn(
					`[mana-crypto:key] waitForKey — timed out after ${timeoutMs}ms, vault still locked`
				);
				resolve(this.key); // null on miss
			}, timeoutMs);
		});
	}
}

// ─── Module-level active provider ──────────────────────────────

let _activeProvider: KeyProvider = new NullKeyProvider();

/** Replace the active provider. Called once at app boot in Phase 3. */
export function setKeyProvider(provider: KeyProvider): void {
	const prev = _activeProvider.constructor.name;
	_activeProvider = provider;
	console.info(`[mana-crypto:key] setKeyProvider: ${prev} → ${provider.constructor.name}`);
}

/** Returns the currently-installed provider. */
export function getKeyProvider(): KeyProvider {
	return _activeProvider;
}

/** Convenience: returns the active key or `null` if locked. */
export function getActiveKey(): CryptoKey | null {
	return _activeProvider.getKey();
}

/** Convenience: waits up to `timeoutMs` (default 2s) for the vault to
 *  unlock. Used by encryptRecord to ride out the boot-time race between
 *  a user click and the layout's async vault unlock round-trip. */
export function waitForActiveKey(timeoutMs: number = 2000): Promise<CryptoKey | null> {
	return _activeProvider.waitForKey(timeoutMs);
}

/** Convenience: synchronous lock check. */
export function isVaultUnlocked(): boolean {
	return _activeProvider.isUnlocked();
}
