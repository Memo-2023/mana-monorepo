/**
 * MissionGrantService — issues Key-Grants that let the `mana-ai`
 * background runner decrypt scoped encrypted records without the
 * user's browser being open.
 *
 * Flow:
 *   1. Fetch the user's master key via the existing vault service.
 *      Zero-knowledge users return null → grant is refused.
 *   2. Derive a Mission Data Key (MDK) with the canonical HKDF from
 *      `@mana/shared-ai`. Scope (tables + recordIds) is cryptographically
 *      bound, so any scope change invalidates the grant automatically.
 *   3. RSA-OAEP-2048-wrap the raw MDK bytes with the mana-ai public
 *      key. Only the paired private key (held in mana-ai's process
 *      memory) can unwrap.
 *   4. Return the grant blob `{ wrappedKey, derivation, issuedAt,
 *      expiresAt }`. The route attaches it to `Mission.grant` via the
 *      webapp's normal sync write path.
 *
 * Why here and not in mana-ai?
 *   Only mana-auth has the KEK, the vault rows, and therefore the
 *   unwrapped master key. Everyone else either doesn't get the key
 *   at all (services) or gets it transiently on first login (webapp).
 *   Centralising the grant mint means one audit-logged path, not two.
 */

import {
	deriveMissionDataKeyRaw,
	GRANT_DERIVATION_VERSION,
	type GrantDerivation,
	type MissionGrant,
} from '@mana/shared-ai';
import { EncryptionVaultService, VaultNotFoundError, type AuditContext } from './index';

/** Default lifetime of a freshly-minted grant. User keeps a mission
 *  editing / ticking within this window → grant stays fresh; long
 *  idle → grant expires and the runner falls back to foreground. */
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface CreateGrantInput {
	missionId: string;
	tables: string[];
	recordIds: string[];
	/** Override the default 7-day TTL. Upper-bounded by the service to
	 *  stay below the rotation horizon. */
	ttlMs?: number;
}

/** Thrown when the user is in zero-knowledge mode. The server has no
 *  usable master key → cannot derive an MDK → grant is impossible.
 *  Routes convert to 409 ZK_ACTIVE so the UI can fall back to the
 *  foreground runner without treating this as an error. */
export class ZeroKnowledgeGrantForbidden extends Error {
	constructor(public userId: string) {
		super(`cannot issue mission grant: user ${userId} is in zero-knowledge mode`);
		this.name = 'ZeroKnowledgeGrantForbidden';
	}
}

/** Thrown when the service boots without a configured mission-grant
 *  public key. Routes convert to 503 so the UI degrades cleanly to
 *  foreground-only execution. */
export class MissionGrantNotConfigured extends Error {
	constructor() {
		super('mana-auth: MANA_AI_PUBLIC_KEY_PEM is not set — grants are disabled');
		this.name = 'MissionGrantNotConfigured';
	}
}

export class MissionGrantService {
	private pubKeyPromise: Promise<CryptoKey> | null = null;

	constructor(
		private vaultService: EncryptionVaultService,
		private publicKeyPem: string | undefined
	) {}

	/** Mints a fresh grant for the given mission + scope. Idempotent in
	 *  the sense that callers can invoke repeatedly to refresh the TTL —
	 *  each call produces a new `wrappedKey` with the same MDK (HKDF is
	 *  deterministic) but fresh `issuedAt`/`expiresAt`. */
	async createGrant(
		userId: string,
		input: CreateGrantInput,
		ctx: AuditContext = {}
	): Promise<MissionGrant> {
		if (!this.publicKeyPem) {
			throw new MissionGrantNotConfigured();
		}

		validateInput(input);

		// VaultFetchResult with null masterKey means the user is in
		// zero-knowledge mode. The server simply has no way to help — the
		// user has to disable ZK first or stick to the foreground runner.
		const vault = await this.vaultService.getMasterKey(userId, ctx);
		if (!vault.masterKey) {
			throw new ZeroKnowledgeGrantForbidden(userId);
		}

		const derivation: GrantDerivation = {
			version: GRANT_DERIVATION_VERSION,
			missionId: input.missionId,
			tables: [...input.tables].sort(),
			recordIds: [...input.recordIds].sort(),
		};

		let mdkBytes: Uint8Array | null = null;
		try {
			mdkBytes = await deriveMissionDataKeyRaw(vault.masterKey, derivation);

			const pubKey = await this.loadPublicKey();
			const ct = await crypto.subtle.encrypt(
				{ name: 'RSA-OAEP' },
				pubKey,
				toBufferSource(mdkBytes)
			);

			const now = Date.now();
			const ttl = clampTtl(input.ttlMs ?? DEFAULT_TTL_MS);

			return {
				wrappedKey: bytesToBase64(new Uint8Array(ct)),
				derivation,
				issuedAt: new Date(now).toISOString(),
				expiresAt: new Date(now + ttl).toISOString(),
			};
		} finally {
			if (mdkBytes) mdkBytes.fill(0);
			vault.masterKey.fill(0);
		}
	}

	/** Lazily parse the PEM once per process. Web Crypto doesn't speak PEM
	 *  directly — we strip the header/footer and decode the base64 DER. */
	private loadPublicKey(): Promise<CryptoKey> {
		if (!this.pubKeyPromise) {
			this.pubKeyPromise = importRsaPublicKey(this.publicKeyPem!);
		}
		return this.pubKeyPromise;
	}
}

// ─── Helpers ─────────────────────────────────────────────────

function validateInput(input: CreateGrantInput): void {
	if (!input.missionId) throw new Error('missionId is required');
	if (!Array.isArray(input.tables) || input.tables.length === 0) {
		throw new Error('tables must be a non-empty array');
	}
	if (!Array.isArray(input.recordIds) || input.recordIds.length === 0) {
		throw new Error('recordIds must be a non-empty array');
	}
	if (input.recordIds.length > 1000) {
		// Hard cap so a pathological client can't blow up the HKDF info
		// string. 1000 is ~50KB of info bytes which Web Crypto handles
		// fine but we don't need more than that for any real mission.
		throw new Error('recordIds must not exceed 1000 entries');
	}
}

/** Clamp the requested TTL to [1h, 30d]. Below 1h is probably a bug;
 *  above 30d forces a re-consent eventually even for long-running
 *  missions. */
function clampTtl(ms: number): number {
	const MIN = 60 * 60 * 1000;
	const MAX = 30 * 24 * 60 * 60 * 1000;
	if (ms < MIN) return MIN;
	if (ms > MAX) return MAX;
	return ms;
}

async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
	const body = pem
		.replace(/-----BEGIN [^-]+-----/g, '')
		.replace(/-----END [^-]+-----/g, '')
		.replace(/\s+/g, '');
	const der = base64ToBytes(body);
	return crypto.subtle.importKey(
		'spki',
		toBufferSource(der),
		{ name: 'RSA-OAEP', hash: 'SHA-256' },
		false,
		['encrypt']
	);
}

function bytesToBase64(bytes: Uint8Array): string {
	let bin = '';
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

function toBufferSource(bytes: Uint8Array): ArrayBuffer {
	const buf = new ArrayBuffer(bytes.length);
	new Uint8Array(buf).set(bytes);
	return buf;
}

// Re-export VaultNotFoundError so the route can catch it from one import.
export { VaultNotFoundError };
