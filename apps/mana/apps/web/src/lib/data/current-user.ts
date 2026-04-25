/**
 * Single source of truth for the current authenticated user id.
 *
 * Why a separate module?
 *   The data layer (database.ts hooks) needs to know who is writing
 *   each record so it can stamp `userId` automatically. Importing the
 *   auth store directly would couple the data layer to UI state and
 *   create a circular dependency. Instead, the root layout pushes the
 *   current user id here on every auth state change.
 *
 * Reactive consumers:
 *   This module stays a plain `.ts` (no runes) so it remains a leaf in
 *   the dependency graph and works inside the test runner without the
 *   Svelte preprocessor. To still notify reactive consumers of changes,
 *   we expose `onCurrentUserChanged(handler)` — same pattern as
 *   `onActiveSpaceChanged` in scope/active-space.svelte.ts. The
 *   `useScopedLiveQuery` hook subscribes to both buses and re-runs
 *   liveQueries whenever either side flips.
 *
 * Guest mode: when no user is signed in, records are stamped with the
 * `GUEST_USER_ID` sentinel. The mana-sync backend treats these as
 * anonymous and rejects them at the RLS layer once auth is required.
 */

export const GUEST_USER_ID = 'guest';

let currentUserId: string | null = null;

type CurrentUserChangedHandler = (userId: string | null) => void;
const handlers: CurrentUserChangedHandler[] = [];

/**
 * Subscribe to user-id changes. Returns an unsubscribe function. The
 * handler is replayed once with the current value so consumers don't
 * need a separate "read initial" call.
 */
export function onCurrentUserChanged(handler: CurrentUserChangedHandler): () => void {
	handlers.push(handler);
	try {
		handler(currentUserId);
	} catch (err) {
		console.error('[current-user] handler replay failed:', err);
	}
	return () => {
		const i = handlers.indexOf(handler);
		if (i >= 0) handlers.splice(i, 1);
	};
}

function notifyHandlers(id: string | null): void {
	for (const h of handlers) {
		try {
			h(id);
		} catch (err) {
			console.error('[current-user] handler failed:', err);
		}
	}
}

/**
 * Updates the active user. Pass `null` for sign-out / guest. Notifies
 * every `onCurrentUserChanged` subscriber when the value flips.
 */
export function setCurrentUserId(id: string | null): void {
	const prev = currentUserId;
	currentUserId = id;
	if (id !== prev) notifyHandlers(id);
}

/** Returns the active user id, or `null` if unauthenticated. */
export function getCurrentUserId(): string | null {
	return currentUserId;
}

/**
 * Returns the user id to stamp on local records: real user when signed
 * in, `GUEST_USER_ID` otherwise. Always non-null so it can be used as
 * a key.
 */
export function getEffectiveUserId(): string {
	return currentUserId ?? GUEST_USER_ID;
}
