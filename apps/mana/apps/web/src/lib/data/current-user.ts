/**
 * Single source of truth for the current authenticated user id.
 *
 * Why a separate module?
 *   The data layer (database.ts hooks) needs to know who is writing each
 *   record so it can stamp `userId` automatically. Importing the auth store
 *   directly would couple the data layer to UI state and create a circular
 *   dependency. Instead, the root layout pushes the current user id here on
 *   every auth state change.
 *
 * Guest mode: when no user is signed in, records are stamped with the
 * `GUEST_USER_ID` sentinel. The mana-sync backend treats these as anonymous
 * and rejects them at the RLS layer once auth is required.
 */

export const GUEST_USER_ID = 'guest';

let currentUserId: string | null = null;

/**
 * Updates the active user. Pass `null` for sign-out / guest.
 *
 * After updating the in-memory value, bumps the Dexie `_scopeCursor`
 * (lazy import to keep this module leaf-level) so every liveQuery
 * subscribed via `touchScopeCursor` re-evaluates with the new
 * `getInScopeSpaceIds()`. Fire-and-forget — a missing bump only
 * delays re-evaluation until the next Dexie write elsewhere.
 */
export function setCurrentUserId(id: string | null): void {
	const prev = currentUserId;
	currentUserId = id;
	if (id !== prev) {
		void import('./scope/cursor').then(({ bumpScopeCursor }) => {
			bumpScopeCursor();
		});
	}
}

/** Returns the active user id, or `null` if unauthenticated. */
export function getCurrentUserId(): string | null {
	return currentUserId;
}

/**
 * Returns the user id to stamp on local records: real user when signed in,
 * `GUEST_USER_ID` otherwise. Always non-null so it can be used as a key.
 */
export function getEffectiveUserId(): string {
	return currentUserId ?? GUEST_USER_ID;
}
