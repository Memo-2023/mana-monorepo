/**
 * Tracking-token signing / verification.
 *
 * Tokens travel in publicly-fetchable URLs (the open pixel, the click
 * redirect, the unsubscribe link). If they were just raw IDs, anyone who
 * guessed a campaign+send id pair could forge events or unsubscribe
 * other people.
 *
 * The token is an HMAC-SHA256 over `{campaignId}:{sendId}:{nonce}`,
 * base64url-encoded into a single opaque blob. The nonce is stored in
 * the DB (broadcast.sends.tracking_nonce) so rotating the signing key
 * doesn't invalidate existing tokens — verification re-signs with the
 * stored nonce and the current key.
 *
 * We don't use JWT here because:
 *   - JWT is overkill for a single-field payload
 *   - base64url-HMAC is ~50 chars vs JWT's ~150; better in a mailto
 *   - JWT's `alg` field adds an attack surface (alg=none, etc.)
 *
 * The signing key lives in BROADCAST_TRACKING_SECRET. Rotating it
 * requires walking broadcast.sends and re-issuing tokens — deferred
 * until we actually need rotation (Phase 2+).
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export interface TokenPayload {
	campaignId: string;
	sendId: string;
	nonce: string;
}

/** Base64url-encode without padding (URL-safe). */
function base64url(buf: Buffer): string {
	return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(s: string): Buffer {
	const padded = s.replace(/-/g, '+').replace(/_/g, '/');
	const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
	return Buffer.from(padded + pad, 'base64');
}

/**
 * Generate a fresh per-send nonce. 16 bytes (128 bits) — enough entropy
 * that even with 1M sends the collision chance is negligible.
 */
export function generateNonce(): string {
	return base64url(randomBytes(16));
}

/**
 * Sign a token. The returned string is url-safe and ready to drop into
 * a mail template.
 *
 * Format: `base64url(JSON(payload)).base64url(hmac)`
 *
 * Inner JSON encoding means campaign / send ids can contain arbitrary
 * characters (colons, dots, whatever) without breaking the parse — the
 * alternative, a delimiter-based raw string, puts a fragile escape
 * dance on IDs that should just be opaque.
 *
 * Two sections separated by `.` — familiar from JWT but without the
 * header (we don't need algorithm agility).
 */
export function signToken(payload: TokenPayload, secret: string): string {
	const json = JSON.stringify(payload);
	const payloadPart = base64url(Buffer.from(json, 'utf8'));
	const sig = createHmac('sha256', secret).update(payloadPart).digest();
	const sigPart = base64url(sig);
	return `${payloadPart}.${sigPart}`;
}

/**
 * Verify + decode a token. Returns null on ANY failure — invalid format,
 * bad HMAC, truncated payload. Constant-time HMAC compare to avoid
 * timing-side-channel on the secret.
 */
export function verifyToken(token: string, secret: string): TokenPayload | null {
	const parts = token.split('.');
	if (parts.length !== 2) return null;
	const [payloadPart, sigPart] = parts;

	const expectedSig = createHmac('sha256', secret).update(payloadPart).digest();
	let providedSig: Buffer;
	try {
		providedSig = base64urlDecode(sigPart);
	} catch {
		return null;
	}
	if (providedSig.length !== expectedSig.length) return null;
	if (!timingSafeEqual(providedSig, expectedSig)) return null;

	let parsed: unknown;
	try {
		const json = base64urlDecode(payloadPart).toString('utf8');
		parsed = JSON.parse(json);
	} catch {
		return null;
	}
	if (
		!parsed ||
		typeof parsed !== 'object' ||
		typeof (parsed as TokenPayload).campaignId !== 'string' ||
		typeof (parsed as TokenPayload).sendId !== 'string' ||
		typeof (parsed as TokenPayload).nonce !== 'string'
	) {
		return null;
	}
	const { campaignId, sendId, nonce } = parsed as TokenPayload;
	if (!campaignId || !sendId || !nonce) return null;
	return { campaignId, sendId, nonce };
}
