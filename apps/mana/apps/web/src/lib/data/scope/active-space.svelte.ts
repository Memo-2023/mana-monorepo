/**
 * Active Space — reactive source for the currently-selected Space.
 *
 * Every module that reads or writes data goes through this store (via the
 * scope wrapper). On boot, it asks Better Auth which organization the
 * session has active; if none is set, it auto-activates the user's
 * personal space (we know it exists — signup hook guaranteed it).
 *
 * See docs/plans/spaces-foundation.md §5.
 */

import type { SpaceType } from '@mana/shared-types';
import { isSpaceType } from '@mana/shared-types';

export interface ActiveSpace {
	id: string;
	slug: string;
	name: string;
	type: SpaceType;
	role: string;
}

export type ActiveSpaceStatus = 'idle' | 'loading' | 'ready' | 'error';

let active = $state<ActiveSpace | null>(null);
let status = $state<ActiveSpaceStatus>('idle');
let lastError = $state<string | null>(null);

export function getActiveSpace(): ActiveSpace | null {
	return active;
}

export function getActiveSpaceId(): string | null {
	return active?.id ?? null;
}

export function getActiveSpaceStatus(): ActiveSpaceStatus {
	return status;
}

export function getActiveSpaceError(): string | null {
	return lastError;
}

export function setActiveSpace(space: ActiveSpace | null): void {
	active = space;
	status = space ? 'ready' : 'idle';
	lastError = null;
}

/**
 * Resolve the user's active space from Better Auth. Idempotent — safe to
 * call multiple times; successive calls short-circuit when `status === 'ready'`.
 *
 * Flow:
 *   1. GET /api/auth/organization/get-active-member
 *      If it returns a member object → use it.
 *   2. Otherwise GET /api/auth/organization/list, find the personal space
 *      by metadata.type === 'personal', POST /set-active to activate it.
 *   3. Write the result into the reactive `active` state.
 *
 * Errors are captured in `lastError` and status flips to 'error'. Callers
 * can retry by calling `loadActiveSpace({ force: true })`.
 */
export async function loadActiveSpace(opts: { force?: boolean } = {}): Promise<ActiveSpace | null> {
	if (!opts.force && status === 'ready') return active;
	if (status === 'loading') return active; // in-flight — don't double-fetch
	status = 'loading';
	lastError = null;

	try {
		const member = await fetchActiveMember();
		if (member) {
			active = member;
			status = 'ready';
			return member;
		}

		// No active org on the session — activate the personal space.
		const orgs = await fetchOrganizations();
		const personal = orgs.find((o) => o.type === 'personal');
		if (!personal) {
			throw new Error('No personal space found — signup hook may not have run');
		}
		await setActiveOnServer(personal.id);
		active = { ...personal, role: 'owner' };
		status = 'ready';
		return active;
	} catch (err) {
		lastError = err instanceof Error ? err.message : String(err);
		status = 'error';
		return null;
	}
}

// ─── Better Auth REST calls ───────────────────────────────────────

interface RawOrg {
	id: string;
	slug?: string | null;
	name: string;
	metadata?: unknown;
}

/**
 * @internal — exposed for unit tests so they can swap fetchers.
 */
export const __endpoints = {
	active: '/api/auth/organization/get-active-member',
	list: '/api/auth/organization/list',
	setActive: '/api/auth/organization/set-active',
};

async function fetchActiveMember(): Promise<ActiveSpace | null> {
	const res = await fetch(__endpoints.active, { credentials: 'include' });
	if (res.status === 404) return null; // no active org
	if (!res.ok) throw new Error(`get-active-member failed: ${res.status}`);
	const raw = (await res.json()) as {
		role?: string;
		organization?: RawOrg;
	} | null;
	if (!raw?.organization) return null;
	return rawToActiveSpace(raw.organization, raw.role ?? 'member');
}

async function fetchOrganizations(): Promise<ActiveSpace[]> {
	const res = await fetch(__endpoints.list, { credentials: 'include' });
	if (!res.ok) throw new Error(`organization/list failed: ${res.status}`);
	const raws = (await res.json()) as RawOrg[];
	return raws.map((r) => rawToActiveSpace(r, 'owner'));
}

async function setActiveOnServer(organizationId: string): Promise<void> {
	const res = await fetch(__endpoints.setActive, {
		method: 'POST',
		credentials: 'include',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ organizationId }),
	});
	if (!res.ok) throw new Error(`organization/set-active failed: ${res.status}`);
}

/**
 * Narrow a Better Auth raw organization into our typed ActiveSpace. Unknown
 * metadata.type falls back to 'personal' because every Mana-created org
 * carries a type — if one is missing it's legacy seed data from before the
 * hooks landed, and 'personal' is the safest default.
 */
function rawToActiveSpace(raw: RawOrg, role: string): ActiveSpace {
	const meta = (raw.metadata ?? {}) as { type?: unknown };
	const type: SpaceType = isSpaceType(meta.type) ? meta.type : 'personal';
	return {
		id: raw.id,
		slug: raw.slug ?? '',
		name: raw.name,
		type,
		role,
	};
}
