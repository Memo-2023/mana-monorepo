/**
 * Actor attribution — runtime side (ambient context + configurable user
 * default). The TYPE + factories + predicates live in `@mana/shared-ai`
 * so the server-side mana-ai runner parses identical shapes.
 *
 * Threading model: a module-level "current actor" acts like an
 * AsyncLocalStorage fiber. The browser is single-threaded and the
 * Dexie write path is synchronous, so a mutable slot wrapped by
 * `runAs(actor, fn)` is enough at the boundaries (UI handlers,
 * executor, runners). At the primitive sites (Dexie hooks,
 * `emitDomainEvent`) the actor is **captured synchronously** and
 * frozen onto the data — ambient context is never the source of truth
 * past that point.
 *
 * Default user identity: `USER_ACTOR` (re-exported from shared-ai)
 * starts with a `legacy:user` placeholder. The layout's login effect
 * must call `bindDefaultUser(userId, displayName)` so the real
 * identity gets stamped onto subsequent writes.
 */

import { type Actor, makeUserActor, USER_ACTOR as LEGACY_USER_ACTOR } from '@mana/shared-ai';

export type {
	Actor,
	ActorKind,
	BaseActor,
	UserActor,
	AiActor,
	SystemActor,
	SystemSource,
	FieldMeta,
	FieldOrigin,
} from '@mana/shared-ai';
export {
	SYSTEM_PROJECTION,
	SYSTEM_RULE,
	SYSTEM_MIGRATION,
	SYSTEM_STREAM,
	SYSTEM_MISSION_RUNNER,
	LEGACY_USER_PRINCIPAL,
	LEGACY_AI_PRINCIPAL,
	LEGACY_SYSTEM_PRINCIPAL,
	LEGACY_DISPLAY_NAME,
	makeUserActor,
	makeAgentActor,
	makeSystemActor,
	normalizeActor,
	isUserActor,
	isAiActor,
	isSystemActor,
	isFromMissionRunner,
	makeFieldMeta,
	isUserOriginatedField,
	originFromActor,
} from '@mana/shared-ai';

/**
 * The "logged-in user" actor, used as the default ambient context.
 * Starts as the shared-ai legacy placeholder so early module-init
 * writes (before login has finished) still produce a valid actor.
 * Replaced by `bindDefaultUser` once the auth store has resolved.
 */
let defaultUserActor: Actor = LEGACY_USER_ACTOR;

/**
 * Bind the real user identity to the default ambient actor. Called
 * once from the app-shell `onMount` after the auth store resolves.
 * Safe to call multiple times (e.g. on user switch); the most recent
 * call wins.
 */
export function bindDefaultUser(userId: string, displayName: string): void {
	const next = makeUserActor(userId, displayName);
	if (currentActor === defaultUserActor) {
		currentActor = next;
	}
	defaultUserActor = next;
	if (typeof window !== 'undefined') {
		console.info(`[actor] bindDefaultUser: ${displayName} (${userId.slice(0, 8)}…)`);
	}
}

/** Re-export the legacy constant for call sites that haven't been
 *  migrated yet. Prefer `getCurrentActor()` or `defaultUser()` for new
 *  code; this stays around because a grep-rewrite of every test fixture
 *  would add no value. */
export const USER_ACTOR = LEGACY_USER_ACTOR;

/** The currently bound default user actor. Use when you want to attribute
 *  a write to "the logged-in user" without reading ambient context. */
export function defaultUser(): Actor {
	return defaultUserActor;
}

let currentActor: Actor = defaultUserActor;

/** Returns the actor attributed to the currently executing write. */
export function getCurrentActor(): Actor {
	return currentActor;
}

/**
 * Run `fn` with the given actor pinned to the current context. Restores
 * the previous actor on exit, even if `fn` throws. Supports nesting.
 *
 * Use this at the three defined boundaries only:
 *   1. Tool executor (AI-initiated tool calls)
 *   2. Mission runner (background AI loop)
 *   3. Projection / rule dispatcher (system-initiated cascades)
 * Past those boundaries every write primitive freezes the actor onto
 * data — do not rely on ambient context across `setTimeout` /
 * `queueMicrotask` hops.
 */
export function runAs<T>(actor: Actor, fn: () => T): T {
	const previous = currentActor;
	currentActor = actor;
	try {
		return fn();
	} finally {
		currentActor = previous;
	}
}

/**
 * Async variant of {@link runAs}. The actor stays pinned across awaits
 * within the same Promise chain, but NOT across `setTimeout` or
 * un-awaited work. That is fine only because every primitive
 * (emitDomainEvent, Dexie hooks) captures the actor synchronously at
 * the write moment.
 */
export async function runAsAsync<T>(actor: Actor, fn: () => Promise<T>): Promise<T> {
	const previous = currentActor;
	currentActor = actor;
	try {
		return await fn();
	} finally {
		currentActor = previous;
	}
}
