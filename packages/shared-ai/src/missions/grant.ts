/**
 * Mission Key-Grant — canonical derivation + wire format.
 *
 * A Grant lets the server-side `mana-ai` runner execute Missions that
 * depend on encrypted inputs (notes, tasks, events, journal, kontext).
 * The webapp derives a Mission Data Key (MDK) from the user master key,
 * wraps it with the `mana-ai` RSA public key, and attaches the blob to
 * the Mission. At tick time `mana-ai` unwraps, decrypts only the
 * allowlisted records, and forgets the key after the tick.
 *
 * This file is the SOURCE OF TRUTH for how the MDK is derived. The
 * webapp (wrap path) and mana-auth (server-side wrap for the grant
 * endpoint) both import `deriveMissionDataKey` from here; a drift-guard
 * test keeps them honest. Bumping DERIVATION_VERSION is the supported
 * path for changing the derivation policy without rotating the user
 * master key.
 *
 * Why tables + recordIds in the HKDF info?
 *   Binding the scope into the key means scope escalation is a *crypto*
 *   failure, not a policy check the server could forget. Adding a new
 *   record to a Mission produces a different MDK → existing grant
 *   stops working → UI prompts for re-consent. This is stricter than
 *   a runtime allowlist check; we keep the runtime check too as belt
 *   + braces.
 */

/** Bump this when the derivation policy changes (e.g. new info fields,
 *  new hash). Existing grants with an older version remain decryptable
 *  as long as the code path for that version is kept; once dropped,
 *  users re-consent on next edit. */
export const GRANT_DERIVATION_VERSION = 'v1' as const;

export type GrantDerivationVersion = typeof GRANT_DERIVATION_VERSION;

/** The deterministic inputs to the HKDF. These + the user master key
 *  fully determine the MDK; any change produces a different key. */
export interface GrantDerivation {
	readonly version: GrantDerivationVersion;
	readonly missionId: string;
	/** Encrypted table names this grant covers, e.g. `['notes','tasks']`. */
	readonly tables: readonly string[];
	/** Allowlisted record IDs across the referenced tables. Format:
	 *  `"<table>:<id>"` so IDs are qualified and can't collide across
	 *  tables (e.g. `"notes:abc"` vs `"tasks:abc"` are distinct). */
	readonly recordIds: readonly string[];
}

/** What gets stored on `Mission.grant`. `wrappedKey` is the RSA-OAEP
 *  output (base64) of the 32-byte MDK. Nothing sensitive here — but
 *  also nothing that the Mission owner shouldn't see. */
export interface MissionGrant {
	readonly wrappedKey: string;
	readonly derivation: GrantDerivation;
	/** ISO timestamp of when the grant was minted. */
	readonly issuedAt: string;
	/** ISO timestamp after which the grant is no longer honoured. The
	 *  server rejects missions with `expiresAt < now()` and surfaces a
	 *  `grant-missing` state so the webapp can prompt for re-consent. */
	readonly expiresAt: string;
}

/**
 * Canonical HKDF-SHA256 derivation of the Mission Data Key.
 *
 * Both the webapp (Web Crypto in the browser) and mana-auth (Web Crypto
 * in Bun) must produce byte-identical output for the same inputs, or
 * the server cannot decrypt what the grant protects. The drift-guard
 * test in `grant.test.ts` asserts this with a fixed master key.
 *
 * Returns a 32-byte AES-GCM-256 key as a non-extractable CryptoKey.
 * Callers that need to wrap the raw bytes (the webapp, before RSA-OAEP)
 * should use `deriveMissionDataKeyRaw` instead; callers that will only
 * use the key for decryption (mana-ai after unwrap) should use this one.
 */
export async function deriveMissionDataKey(
	masterKey: Uint8Array,
	derivation: GrantDerivation
): Promise<CryptoKey> {
	const bytes = await deriveMissionDataKeyRaw(masterKey, derivation);
	try {
		return await crypto.subtle.importKey(
			'raw',
			toBufferSource(bytes),
			{ name: 'AES-GCM', length: 256 },
			/* extractable */ false,
			['decrypt']
		);
	} finally {
		bytes.fill(0);
	}
}

/** Raw 32-byte form of the MDK. Caller is responsible for memzero-ing
 *  after use. Only the webapp's wrap path needs this; everyone else
 *  should prefer the CryptoKey variant. */
export async function deriveMissionDataKeyRaw(
	masterKey: Uint8Array,
	derivation: GrantDerivation
): Promise<Uint8Array> {
	if (masterKey.length !== 32) {
		throw new Error(`shared-ai/grant: expected 32-byte master key, got ${masterKey.length}`);
	}
	if (derivation.version !== GRANT_DERIVATION_VERSION) {
		throw new Error(
			`shared-ai/grant: unsupported derivation version ${derivation.version}, expected ${GRANT_DERIVATION_VERSION}`
		);
	}

	const ikm = await crypto.subtle.importKey(
		'raw',
		toBufferSource(masterKey),
		'HKDF',
		/* extractable */ false,
		['deriveBits']
	);

	// Salt: missionId UTF-8 bytes. Deliberately NOT the master key —
	// salt + IKM collapse in HKDF-Extract, but using the missionId
	// gives every mission its own PRK space at extract time and keeps
	// the info field free for the scope binding.
	const salt = new TextEncoder().encode(derivation.missionId);

	const info = new TextEncoder().encode(canonicalInfoString(derivation));

	const bits = await crypto.subtle.deriveBits(
		{
			name: 'HKDF',
			hash: 'SHA-256',
			salt: toBufferSource(salt),
			info: toBufferSource(info),
		},
		ikm,
		256 // 32 bytes
	);

	return new Uint8Array(bits);
}

/**
 * Canonical serialisation of the scope into the HKDF info string.
 * Sorted + joined to make the output order-independent: `[notes,tasks]`
 * and `[tasks,notes]` derive the same key. Exported so tests can pin
 * the exact string format.
 */
export function canonicalInfoString(derivation: GrantDerivation): string {
	const tables = [...derivation.tables].sort().join(',');
	const ids = [...derivation.recordIds].sort().join(',');
	return `mana-ai-mission-grant:${derivation.version}:tables=${tables}:ids=${ids}`;
}

// ─── Internals ────────────────────────────────────────────────

/** TS 5.7 compat — Uint8Array<ArrayBufferLike> isn't assignable to
 *  BufferSource in every context. Copying into a fresh ArrayBuffer
 *  sidesteps the issue and matches what mana-auth/kek.ts already does. */
function toBufferSource(bytes: Uint8Array): ArrayBuffer {
	const buf = new ArrayBuffer(bytes.length);
	new Uint8Array(buf).set(bytes);
	return buf;
}
