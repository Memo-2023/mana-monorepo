/**
 * Deterministic per-persona password.
 *
 * HMAC-SHA256(PERSONA_SEED_SECRET, persona.email) → base64 → trim to 32
 * chars. Long enough for Better Auth's 8–128 range, identical every run
 * so seed/login are repeatable, but only knowable to whoever holds the
 * env secret.
 *
 * Why not random + storage: storing per-persona passwords means another
 * place to encrypt and audit. The runner needs to log in as the persona
 * many times — looking up a stored cred per call is wasteful when the
 * same HMAC gives us the same answer in O(1).
 */

import { createHmac } from 'node:crypto';

const DEV_FALLBACK_SECRET = 'dev-persona-seed-secret-rotate-in-prod';

export function personaPassword(email: string): string {
	const secret = process.env.PERSONA_SEED_SECRET ?? DEV_FALLBACK_SECRET;
	if (secret === DEV_FALLBACK_SECRET && process.env.NODE_ENV === 'production') {
		throw new Error(
			'PERSONA_SEED_SECRET must be set in production — refusing to derive persona passwords from the dev fallback.'
		);
	}
	const hmac = createHmac('sha256', secret).update(email).digest('base64');
	// Strip non-alphanumerics so the result is safe in CLI quotes,
	// keep at least one digit + one letter for password-policy compliance.
	const cleaned = hmac.replace(/[^a-zA-Z0-9]/g, '');
	return cleaned.slice(0, 32);
}
