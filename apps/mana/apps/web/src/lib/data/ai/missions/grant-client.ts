/**
 * Client for `POST /api/v1/me/ai-mission-grant`.
 *
 * Issues a Mission Key-Grant so `mana-ai` can decrypt the referenced
 * records without the user's browser tab being open. Flow + architecture:
 * `docs/plans/ai-mission-key-grant.md` and COMPANION_BRAIN_ARCHITECTURE
 * §21.
 *
 * The client is deliberately stateless — each call issues a fresh grant,
 * which the caller attaches to the Mission record via the existing sync
 * pipeline. Revocation is just `Mission.grant = null`; there is no
 * server-side grant store to delete from.
 *
 * Failure modes surface as typed errors so the Consent UI can render
 * different messages / fallbacks:
 *   - ZeroKnowledgeGrantError → "grants unavailable in ZK mode, using
 *     foreground runner"
 *   - GrantNotConfiguredError → "server hasn't loaded the runner key
 *     yet — try again later or run locally"
 *   - VaultNotInitialisedError → shouldn't happen after a successful
 *     login; if it does, force re-init
 *   - Generic Error → network / 5xx / validation; UI shows retry
 */

import type { MissionGrant } from '@mana/shared-ai';

export interface GrantClientOptions {
	authUrl: string;
	getToken: () => Promise<string | null> | string | null;
}

export interface RequestGrantInput {
	missionId: string;
	tables: string[];
	/** Record IDs qualified with their table: `"${table}:${id}"`. The
	 *  mana-ai resolver enforces this shape as the allowlist key. */
	recordIds: string[];
	/** Optional TTL in ms. Server clamps to [1h, 30d]; omitting uses the
	 *  server default (7d). */
	ttlMs?: number;
}

export class ZeroKnowledgeGrantError extends Error {
	constructor() {
		super('Mission grants are unavailable in zero-knowledge mode.');
		this.name = 'ZeroKnowledgeGrantError';
	}
}

export class GrantNotConfiguredError extends Error {
	constructor() {
		super('Mission grants are not configured on this server.');
		this.name = 'GrantNotConfiguredError';
	}
}

export class VaultNotInitialisedError extends Error {
	constructor() {
		super('Encryption vault has not been initialised for this user.');
		this.name = 'VaultNotInitialisedError';
	}
}

/**
 * Issues a fresh grant. Returns the `MissionGrant` blob the caller
 * writes onto the Mission record. Throws on all error paths — never
 * returns an incomplete or invalid grant.
 */
export async function requestMissionGrant(
	opts: GrantClientOptions,
	input: RequestGrantInput
): Promise<MissionGrant> {
	const token = await opts.getToken();
	if (!token) throw new Error('requestMissionGrant: no auth token');

	const res = await fetch(`${opts.authUrl}/api/v1/me/ai-mission-grant`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(input),
	});

	if (res.ok) {
		return (await res.json()) as MissionGrant;
	}

	// Drain the error body once so we can branch on `code`.
	const body = (await res.json().catch(() => null)) as { code?: string; error?: string } | null;

	switch (body?.code) {
		case 'ZK_ACTIVE':
			throw new ZeroKnowledgeGrantError();
		case 'GRANT_NOT_CONFIGURED':
			throw new GrantNotConfiguredError();
		case 'VAULT_NOT_INITIALISED':
			throw new VaultNotInitialisedError();
		default:
			throw new Error(`requestMissionGrant failed: ${res.status} ${body?.error ?? res.statusText}`);
	}
}
