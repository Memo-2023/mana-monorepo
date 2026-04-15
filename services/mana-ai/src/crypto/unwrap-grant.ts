/**
 * Unwrap side of the Mission Key-Grant.
 *
 * The `mana-auth` service wrapped the per-mission Data Key (MDK) with
 * our RSA-OAEP-2048 public key before writing it into `Mission.grant`.
 * At tick time, this module unwraps the MDK back into a CryptoKey that
 * the encrypted resolver (Phase 2) can use to decrypt `sync_changes`
 * rows for the mission's allowlisted records.
 *
 * Security notes:
 *   - The private key is loaded once per process from the PEM in
 *     `config.missionGrantPrivateKeyPem`. If missing, unwrap returns
 *     null so the tick loop can skip the mission without crashing.
 *   - Callers MUST discard the returned CryptoKey as soon as the tick
 *     finishes. The key itself is non-extractable, but the reference
 *     staying alive keeps the underlying bytes pinned in WebCrypto's
 *     internal tables. A per-tick scope map + finally-clear is the
 *     agreed pattern; see `docs/plans/ai-mission-key-grant.md`.
 *   - Grant expiry is checked here, not in the caller. A stale grant
 *     returns null + a structured `reason` the caller logs but never
 *     surfaces as an error (foreground runner picks up the slack).
 */

import type { MissionGrant } from '@mana/shared-ai';

export type UnwrapResult =
	| { ok: true; mdk: CryptoKey }
	| { ok: false; reason: UnwrapFailureReason };

export type UnwrapFailureReason = 'not-configured' | 'expired' | 'malformed' | 'wrap-rejected';

let _privateKeyPromise: Promise<CryptoKey | null> | null = null;

/** Install (or re-install) the PEM-encoded RSA private key. Call at
 *  service boot after `loadConfig`. Passing undefined disables grant
 *  unwrapping for the lifetime of the process — tick loop skips any
 *  mission with a grant, same as for legacy deployments. */
export function configureMissionGrantKey(pem: string | undefined): void {
	if (!pem) {
		_privateKeyPromise = Promise.resolve(null);
		return;
	}
	_privateKeyPromise = importRsaPrivateKey(pem);
}

/** Test-only reset so bun test can swap in different keys across
 *  describe blocks without holding stale state. Not exported through
 *  any barrel. */
export function _resetForTesting(): void {
	_privateKeyPromise = null;
}

/**
 * Unwraps a grant into the Mission Data Key. Never throws on the
 * expected failure modes — returns a structured reason instead so
 * the caller can bump the right metric and skip cleanly.
 */
export async function unwrapMissionGrant(grant: MissionGrant): Promise<UnwrapResult> {
	if (!_privateKeyPromise) {
		// configureMissionGrantKey was never called. Treat as not
		// configured rather than crashing — lets tests/local dev boot
		// without setting the env var.
		return { ok: false, reason: 'not-configured' };
	}
	const pk = await _privateKeyPromise;
	if (!pk) return { ok: false, reason: 'not-configured' };

	if (isExpired(grant.expiresAt)) {
		return { ok: false, reason: 'expired' };
	}

	let wrappedBytes: Uint8Array;
	try {
		wrappedBytes = base64ToBytes(grant.wrappedKey);
	} catch {
		return { ok: false, reason: 'malformed' };
	}

	let mdkBytes: Uint8Array;
	try {
		const plain = await crypto.subtle.decrypt(
			{ name: 'RSA-OAEP' },
			pk,
			toBufferSource(wrappedBytes)
		);
		mdkBytes = new Uint8Array(plain);
	} catch {
		// Auth-tag mismatch, wrong key, corrupted ciphertext — the
		// caller can't meaningfully distinguish, and we don't want to
		// leak timing details by branching here.
		return { ok: false, reason: 'wrap-rejected' };
	}

	if (mdkBytes.length !== 32) {
		mdkBytes.fill(0);
		return { ok: false, reason: 'malformed' };
	}

	try {
		const mdk = await crypto.subtle.importKey(
			'raw',
			toBufferSource(mdkBytes),
			{ name: 'AES-GCM', length: 256 },
			/* extractable */ false,
			['decrypt']
		);
		return { ok: true, mdk };
	} finally {
		mdkBytes.fill(0);
	}
}

// ─── Helpers ─────────────────────────────────────────────────

function isExpired(expiresAt: string): boolean {
	const ts = Date.parse(expiresAt);
	if (Number.isNaN(ts)) return true; // treat unparseable as expired
	return ts < Date.now();
}

async function importRsaPrivateKey(pem: string): Promise<CryptoKey | null> {
	try {
		const body = pem
			.replace(/-----BEGIN [^-]+-----/g, '')
			.replace(/-----END [^-]+-----/g, '')
			.replace(/\s+/g, '');
		const der = base64ToBytes(body);
		return await crypto.subtle.importKey(
			'pkcs8',
			toBufferSource(der),
			{ name: 'RSA-OAEP', hash: 'SHA-256' },
			false,
			['decrypt']
		);
	} catch (err) {
		console.error(
			'[mana-ai:grant] failed to import MANA_AI_PRIVATE_KEY_PEM — grants disabled:',
			(err as Error).message
		);
		return null;
	}
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
