/**
 * Actor attribution — who triggered a write.
 *
 * Every DomainEvent, pending-change row, and synced record carries an Actor so
 * the UI can distinguish user-initiated work from AI-initiated work, render
 * ghost state for proposals, attribute field-level edits, and let the user
 * revert a whole mission.
 *
 * Three actor kinds:
 *  - `user`   — the human at the keyboard
 *  - `ai`     — autonomous AI work, carrying mission/iteration metadata so the
 *               Workbench can group, review, and revert per-mission
 *  - `system` — derived writes (projections, rule engines, data migrations)
 *               that are neither user nor AI
 *
 * Threading model: a module-level "current actor" acts like an AsyncLocalStorage
 * fiber. The browser is single-threaded and the Dexie write path is synchronous,
 * so a mutable slot wrapped by `runAs(actor, fn)` is enough at the boundaries
 * (UI handlers, executor, runners). At the primitive sites (Dexie hooks,
 * `emitDomainEvent`) the actor is **captured synchronously** and frozen onto
 * the data — ambient context is never the source of truth past that point.
 */

export type Actor =
	| { readonly kind: 'user' }
	| {
			readonly kind: 'ai';
			/** Mission this write belongs to. */
			readonly missionId: string;
			/** Iteration within the mission (nth autonomous run). */
			readonly iterationId: string;
			/** Human-readable reason the AI took this action. */
			readonly rationale: string;
	  }
	| {
			readonly kind: 'system';
			/** Subsystem responsible for this derived write. */
			readonly source: 'projection' | 'rule' | 'migration' | 'mission-runner';
	  };

export const USER_ACTOR: Actor = Object.freeze({ kind: 'user' });

let currentActor: Actor = USER_ACTOR;

/** Returns the actor attributed to the currently executing write. */
export function getCurrentActor(): Actor {
	return currentActor;
}

/**
 * Run `fn` with the given actor pinned to the current context. Restores the
 * previous actor on exit, even if `fn` throws. Supports nesting.
 *
 * Use this at the three defined boundaries only:
 *   1. Tool executor (AI-initiated tool calls)
 *   2. Mission runner (background AI loop)
 *   3. Projection / rule dispatcher (system-initiated cascades)
 * Past those boundaries every write primitive freezes the actor onto data —
 * do not rely on ambient context across `setTimeout` / `queueMicrotask` hops.
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
 * Async variant of {@link runAs}. The actor stays pinned across awaits within
 * the same Promise chain, but NOT across `setTimeout` or un-awaited work.
 * That is fine only because every primitive (emitDomainEvent, Dexie hooks)
 * captures the actor synchronously at the write moment.
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

/** True when an AI agent wrote this record/event/field. */
export function isAiActor(actor: Actor | undefined): boolean {
	return actor?.kind === 'ai';
}

/** True when a derived subsystem (projection / rule / migration) wrote it. */
export function isSystemActor(actor: Actor | undefined): boolean {
	return actor?.kind === 'system';
}
