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
}

// ─── Module-level active provider ──────────────────────────────

let _activeProvider: KeyProvider = new NullKeyProvider();

/** Replace the active provider. Called once at app boot in Phase 3. */
export function setKeyProvider(provider: KeyProvider): void {
	_activeProvider = provider;
}

/** Returns the currently-installed provider. */
export function getKeyProvider(): KeyProvider {
	return _activeProvider;
}

/** Convenience: returns the active key or `null` if locked. */
export function getActiveKey(): CryptoKey | null {
	return _activeProvider.getKey();
}

/** Convenience: synchronous lock check. */
export function isVaultUnlocked(): boolean {
	return _activeProvider.isUnlocked();
}
