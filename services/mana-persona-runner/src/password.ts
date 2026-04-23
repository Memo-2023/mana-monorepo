/**
 * Deterministic per-persona password derivation.
 *
 * MUST stay bit-identical to `scripts/personas/password.ts` — both
 * sides (seed script that creates the persona, runner that logs back
 * in as them) derive the same secret from the same inputs. Changing
 * the algorithm here without changing it there locks the runner out
 * of every existing persona.
 *
 * Algorithm:
 *   HMAC-SHA256(PERSONA_SEED_SECRET, email) → base64 → strip
 *   non-alphanumeric → first 32 chars.
 */

import { createHmac } from 'node:crypto';

export function personaPassword(email: string, seedSecret: string): string {
	if (!seedSecret) {
		throw new Error('personaPassword: seedSecret is required');
	}
	const hmac = createHmac('sha256', seedSecret).update(email).digest('base64');
	return hmac.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}
