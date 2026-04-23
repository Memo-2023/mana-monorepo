/**
 * Fetches and caches each caller's master key for the lifetime of a tool-
 * context.
 *
 * Reuses the existing `GET /api/v1/me/encryption-vault/key` endpoint
 * rather than building a service-key-gated bypass:
 *   - The endpoint is already JWT-auth'd, so the caller's own token is
 *     exactly the right credential.
 *   - Zero-knowledge users receive a recovery blob (never plaintext MK) —
 *     a server-side agent cannot open their data, and we return null from
 *     `getKey()` so callers fail loud.
 *   - The endpoint already writes an audit trail row per fetch, which is
 *     the observability we want.
 *
 * Caching: per-userId, in-process, short TTL. A long-running MCP session
 * invokes many tools in a row; re-fetching the MK for each tool would
 * spam the audit log and add ~20 ms latency per call. The TTL is short
 * enough that key-rotation picks up within a tick, not a day.
 */

import { importMasterKey } from '@mana/shared-crypto';

export interface MasterKeyClientConfig {
	authUrl: string;
	/** How long a cached CryptoKey stays valid. Default 5 minutes. */
	ttlMs?: number;
}

interface CacheEntry {
	key: CryptoKey;
	expiresAt: number;
}

export class ZeroKnowledgeUserError extends Error {
	constructor(userId: string) {
		super(
			`User ${userId.slice(0, 8)}… is in zero-knowledge mode — the server has no way to unwrap their master key. Agent-side encryption is not possible for this user.`
		);
		this.name = 'ZeroKnowledgeUserError';
	}
}

export class MasterKeyFetchError extends Error {
	constructor(status: number, body: string) {
		super(`mana-auth /encryption-vault/key failed: HTTP ${status} — ${body.slice(0, 200)}`);
		this.name = 'MasterKeyFetchError';
	}
}

/**
 * Response shape of `GET /api/v1/me/encryption-vault/key` (standard mode).
 * ZK-mode returns a different shape (recovery blob, no `masterKey`) — we
 * detect that and throw `ZeroKnowledgeUserError`.
 */
interface VaultKeyResponse {
	masterKey?: string; // base64, 32 bytes when present
	formatVersion?: number;
	kekId?: string;
	zeroKnowledge?: boolean;
}

function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

export class MasterKeyClient {
	private readonly cache = new Map<string, CacheEntry>();
	private readonly ttlMs: number;

	constructor(private readonly config: MasterKeyClientConfig) {
		this.ttlMs = config.ttlMs ?? 5 * 60 * 1000;
	}

	/**
	 * Returns the caller's master key as a non-extractable CryptoKey.
	 * Throws `ZeroKnowledgeUserError` for ZK users, `MasterKeyFetchError`
	 * on any other network/auth failure.
	 */
	async getKey(userId: string, jwt: string): Promise<CryptoKey> {
		const cached = this.cache.get(userId);
		const now = Date.now();
		if (cached && cached.expiresAt > now) return cached.key;

		const url = `${this.config.authUrl}/api/v1/me/encryption-vault/key`;
		const res = await fetch(url, {
			headers: { authorization: `Bearer ${jwt}` },
		});

		if (!res.ok) {
			const body = await res.text().catch(() => '<unreadable>');
			throw new MasterKeyFetchError(res.status, body);
		}

		const body = (await res.json()) as VaultKeyResponse;
		if (body.zeroKnowledge || !body.masterKey) {
			throw new ZeroKnowledgeUserError(userId);
		}

		const raw = base64ToBytes(body.masterKey);
		const key = await importMasterKey(raw);

		this.cache.set(userId, { key, expiresAt: now + this.ttlMs });
		return key;
	}

	/** Test-only — clears cache. */
	__clearForTests(): void {
		this.cache.clear();
	}
}
