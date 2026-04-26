/**
 * Per-field write metadata — the unified replacement for the older
 * triple of `__fieldTimestamps` + `__fieldActors` + `__lastActor`.
 *
 * Every synced record carries one `__fieldMeta` map, keyed by user-data
 * field name. Each entry records:
 *
 *   - `at`     — ISO timestamp of the write (drives field-LWW ordering)
 *   - `actor`  — who wrote it (drives Workbench attribution + revert)
 *   - `origin` — from what kind of pipeline the value came (drives
 *                 conflict-detection: only `'user'`-origin writes can
 *                 lose to a server overwrite)
 *
 * The "who" and the "from where" are separate concerns deliberately:
 * an AI agent (`actor.kind === 'ai'`) writes with `origin === 'agent'`
 * during normal operation, but the SAME agent's writes arrive at OTHER
 * clients as `origin === 'server-replay'`. The actor identity travels
 * unchanged; the origin describes the pipeline this particular client
 * saw the value through.
 *
 * Lives in shared-ai because both runtimes (browser + mana-ai service)
 * read and write the same shape.
 */

import type { Actor } from './actor';

/**
 * Pipeline that produced a given field value, from the perspective of
 * the local client that holds the record.
 *
 * - `'user'`         — direct user edit through a module store
 * - `'agent'`        — write performed by an AI agent (mission runner
 *                       or tool executor); the value originated locally
 * - `'system'`       — system bootstrap (singleton creation, projection,
 *                       rule cascade)
 * - `'migration'`    — one-shot data-migration write (Dexie upgrade,
 *                       repair routine)
 * - `'server-replay'` — value applied from a mana-sync pull; never
 *                       represents a local edit and therefore never
 *                       triggers conflict-detection
 */
export type FieldOrigin = 'user' | 'agent' | 'system' | 'migration' | 'server-replay';

/**
 * One entry in a record's `__fieldMeta` map. Frozen by the factory so
 * downstream consumers can pass the same object to multiple fields
 * without worrying about accidental mutation.
 */
export interface FieldMeta {
	readonly at: string;
	readonly actor: Actor;
	readonly origin: FieldOrigin;
}

/** Build a frozen FieldMeta entry. Prefer this over inline object
 *  literals so the read-side never sees a half-populated entry. */
export function makeFieldMeta(at: string, actor: Actor, origin: FieldOrigin): FieldMeta {
	return Object.freeze({ at, actor, origin });
}

/** True iff a field write may be overwritten silently by a server pull
 *  without surfacing a conflict toast. Server-replay, system, and
 *  migration writes are pipeline-internal — the user never typed them
 *  and therefore can't "lose" them. Agent writes lose silently too:
 *  they are visible separately via the proposal/mission UI, not via
 *  the conflict toast. */
export function isUserOriginatedField(meta: FieldMeta | undefined): boolean {
	return meta?.origin === 'user';
}
