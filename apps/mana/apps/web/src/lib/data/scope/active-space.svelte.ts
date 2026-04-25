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

import type { SpaceType, SpaceTier } from '@mana/shared-types';
import { isSpaceType, isSpaceTier } from '@mana/shared-types';
import { authFetch } from './auth-fetch';
import { runSpaceSeeds } from './per-space-seeds';
import { getEffectiveUserId } from '../current-user';

export interface ActiveSpace {
	id: string;
	slug: string;
	name: string;
	type: SpaceType;
	tier: SpaceTier;
	role: string;
}

export type ActiveSpaceStatus = 'idle' | 'loading' | 'ready' | 'error';

let active = $state<ActiveSpace | null>(null);
let status = $state<ActiveSpaceStatus>('idle');
let lastError = $state<string | null>(null);

// ─── Change-handler subscribers ───────────────────────────────────
//
// Other stores (workbench scenes, AI agents bootstrap, future Space-
// aware caches) register here and get notified whenever the active
// Space flips. Handlers are fire-and-forget: they can be async, but
// the space-switch flow does not wait for them. This keeps the
// primary path (user clicks a Space in the switcher) responsive, and
// lets each registered module own its own error handling.
//
// Newly-registered handlers are immediately replayed with the current
// active Space (if any) so they don't miss the first activation when
// the registration happens after loadActiveSpace already resolved.

export type ActiveSpaceChangedHandler = (space: ActiveSpace | null) => void | Promise<void>;

const handlers: ActiveSpaceChangedHandler[] = [];

export function onActiveSpaceChanged(h: ActiveSpaceChangedHandler): () => void {
	handlers.push(h);
	if (active && status === 'ready') {
		try {
			void h(active);
		} catch (err) {
			console.error('[active-space] handler replay failed:', err);
		}
	}
	return () => {
		const i = handlers.indexOf(h);
		if (i >= 0) handlers.splice(i, 1);
	};
}

function notifyHandlers(space: ActiveSpace | null): void {
	for (const h of handlers) {
		try {
			void h(space);
		} catch (err) {
			console.error('[active-space] handler failed:', err);
		}
	}
}

export function getActiveSpace(): ActiveSpace | null {
	return active;
}

export function getActiveSpaceId(): string | null {
	return active?.id ?? null;
}

/**
 * The spaceId every new write to a space-scoped table should carry.
 * Used by the Dexie creating-hook to auto-stamp tenancy on records the
 * caller hasn't explicitly assigned. Returns:
 *
 *   - the active Space's id when one is loaded (e.g. `<personal-uuid>`,
 *     `<brand-uuid>`, …) — every write goes to the right tenant
 *   - the personal sentinel `_personal:<userId>` during the bootstrap
 *     window before `loadActiveSpace` resolves, so writes never block
 *     and `reconcileSentinels` rewrites the placeholder once the real
 *     id is known.
 *
 * Inlined sentinel helper instead of importing `personalSpaceSentinel`
 * from `./bootstrap` because bootstrap.ts pulls in `db` and the
 * creating-hook in `database.ts` imports this function — the indirect
 * cycle would tangle ESM resolution.
 */
export function getEffectiveSpaceId(): string {
	const id = active?.id;
	if (id) return id;
	return `_personal:${getEffectiveUserId()}`;
}

export function getActiveSpaceStatus(): ActiveSpaceStatus {
	return status;
}

export function getActiveSpaceError(): string | null {
	return lastError;
}

/**
 * Internal: mutate the active-space state and fan out side effects in
 * one place. Both `setActiveSpace` (UI / tests) and `loadActiveSpace`
 * (boot path) funnel through here so notifications and per-Space seeds
 * fire identically regardless of which entry point updated the state.
 */
function applyActiveSpace(space: ActiveSpace | null): void {
	const prevId = active?.id;
	active = space;
	status = space ? 'ready' : 'idle';
	lastError = null;
	if (space?.id === prevId) return;
	notifyHandlers(space);
	// Drive per-Space seeders (workbench Home scene + future module
	// seeds) on every Space activation. Fire-and-forget — seeders are
	// individually idempotent (deterministic ids + Dexie `put`), so a
	// missed run self-heals on the next Space switch. Centralising into
	// applyActiveSpace replaces the racy ad-hoc paths the scenes store
	// used to drive itself.
	if (space) {
		void runSpaceSeeds(space.id);
	}
}

export function setActiveSpace(space: ActiveSpace | null): void {
	applyActiveSpace(space);
}

/**
 * The tier to use for app-access gating right now. Prefers the active
 * Space's tier; falls back to the caller-supplied user tier for the
 * bootstrap window where the active space isn't loaded yet.
 *
 * Callers pass their own user-tier fallback (usually `authStore.user?.tier`)
 * rather than having this module reach into auth — keeps the scope
 * layer free of UI-auth dependencies.
 */
export function getEffectiveTier(userFallback: SpaceTier | string | undefined): SpaceTier {
	const space = active;
	if (space?.tier && isSpaceTier(space.tier)) return space.tier;
	if (typeof userFallback === 'string' && isSpaceTier(userFallback)) return userFallback;
	return 'guest';
}

/**
 * LocalStorage hint: the last organization id the user explicitly
 * switched to. Persists the choice across reloads even when Better
 * Auth's cross-origin Set-Cookie (dev: localhost:5173 → localhost:3001
 * with SameSite=Lax) doesn't reliably update the session's
 * activeOrganizationId. Without this, a brand/family switch gets
 * reverted to Personal on every refresh.
 */
const ACTIVE_SPACE_HINT_KEY = 'mana.scope.activeSpaceId';

function readActiveSpaceHint(): string | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		return localStorage.getItem(ACTIVE_SPACE_HINT_KEY);
	} catch {
		return null;
	}
}

export function writeActiveSpaceHint(id: string | null): void {
	if (typeof localStorage === 'undefined') return;
	try {
		if (id) localStorage.setItem(ACTIVE_SPACE_HINT_KEY, id);
		else localStorage.removeItem(ACTIVE_SPACE_HINT_KEY);
	} catch {
		// ignore quota / sandbox errors
	}
}

/**
 * Resolve the user's active space. Order of truth:
 *   1. Server-side active member (get-active-member) — trustworthy when
 *      Better Auth's activeOrganizationId landed in the session.
 *   2. Client-side hint from localStorage — survives cookie drops across
 *      page reloads in dev. If present, we call set-active to re-sync
 *      the server to match.
 *   3. Personal space fallback — brand-new session, no previous choice.
 *
 * Errors captured in `lastError`; status flips to 'error'. Callers can
 * retry via `loadActiveSpace({ force: true })`.
 */
export async function loadActiveSpace(opts: { force?: boolean } = {}): Promise<ActiveSpace | null> {
	if (!opts.force && status === 'ready') return active;
	if (status === 'loading') return active; // in-flight — don't double-fetch
	status = 'loading';
	lastError = null;

	try {
		const member = await fetchActiveMember();
		if (member) {
			writeActiveSpaceHint(member.id);
			applyActiveSpace(member);
			return member;
		}

		// Server says no active org. Two reasons we might still know one:
		//   (a) the user switched to a non-personal space earlier and the
		//       hint survived in localStorage even though the cookie didn't.
		//   (b) it's truly a fresh session, in which case we activate
		//       Personal.
		const orgs = await fetchOrganizations();
		const hintId = readActiveSpaceHint();
		const hinted = hintId ? orgs.find((o) => o.id === hintId) : null;

		const chosen = hinted ?? orgs.find((o) => o.type === 'personal') ?? null;
		if (!chosen) {
			throw new Error('No accessible space found — signup hook may not have run');
		}

		await setActiveOnServer(chosen.id);
		writeActiveSpaceHint(chosen.id);
		const resolved = { ...chosen, role: hinted ? hinted.role : 'owner' };
		applyActiveSpace(resolved);
		return resolved;
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
	const res = await authFetch(__endpoints.active);
	// Better Auth returns 400/404 when no organization is active yet —
	// treat both as "not active" so the bootstrap can fall through to
	// auto-activation.
	if (res.status === 404 || res.status === 400) return null;
	if (!res.ok) throw new Error(`get-active-member failed: ${res.status}`);
	const raw = (await res.json()) as {
		role?: string;
		organization?: RawOrg;
	} | null;
	if (!raw?.organization) return null;
	return rawToActiveSpace(raw.organization, raw.role ?? 'member');
}

async function fetchOrganizations(): Promise<ActiveSpace[]> {
	const res = await authFetch(__endpoints.list);
	if (!res.ok) throw new Error(`organization/list failed: ${res.status}`);
	const raws = (await res.json()) as RawOrg[];
	return raws.map((r) => rawToActiveSpace(r, 'owner'));
}

async function setActiveOnServer(organizationId: string): Promise<void> {
	const res = await authFetch(__endpoints.setActive, {
		method: 'POST',
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
	const meta = (raw.metadata ?? {}) as { type?: unknown; tier?: unknown };
	const type: SpaceType = isSpaceType(meta.type) ? meta.type : 'personal';
	const tier: SpaceTier = isSpaceTier(meta.tier) ? meta.tier : 'public';
	return {
		id: raw.id,
		slug: raw.slug ?? '',
		name: raw.name,
		type,
		tier,
		role,
	};
}
