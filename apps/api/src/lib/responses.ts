/**
 * Standard response helpers for mana-api modules.
 *
 * Background: A pre-launch audit (April 2026, see
 * `docs/REFACTORING_AUDIT_2026_04.md` item #5) flagged that error and
 * list responses were inconsistent across the 15+ modules. The actual
 * inconsistency turned out to be smaller than reported — every module
 * already returns errors as `{ error: 'message' }` — but using these
 * helpers gives us:
 *
 *   1. **Type-safe status codes** — TS catches stray `c.json(..., 999)`
 *   2. **One place to enrich the envelope** — when we add `code`,
 *      `requestId`, or `details` later, we change one file instead of
 *      grepping 79 callsites.
 *   3. **Consistent list shape** — `{ items, count }` regardless of
 *      what the items are. Frontend `apps/mana/apps/web` doesn't have
 *      to special-case `events` vs `contacts` vs `occurrences`.
 *
 * The shape is wire-compatible with the existing inline `c.json(...)`
 * calls, so adoption can be incremental: new code uses these helpers,
 * old code keeps working until someone touches the file.
 *
 * @example
 * ```ts
 * import { errorResponse, listResponse, validationError } from '../../lib/responses';
 *
 * routes.get('/things', async (c) => {
 *   const things = await db.select().from(thingsTable);
 *   return listResponse(c, things);
 * });
 *
 * routes.post('/things', async (c) => {
 *   const parsed = thingSchema.safeParse(await c.req.json());
 *   if (!parsed.success) return validationError(c, parsed.error.issues);
 *   // ...
 * });
 * ```
 */

import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Standard error response envelope.
 *
 * Wire-compatible with the inline `c.json({ error: '...' }, status)`
 * pattern that already dominates the codebase. Future fields like
 * `code` (machine-readable error code) and `details` (validation issues,
 * etc.) can be added without touching callsites.
 */
export type ErrorBody = {
	error: string;
	code?: string;
	details?: unknown;
};

/**
 * Standard list response envelope.
 *
 * Always uses `items` as the field name, regardless of what's inside.
 * The frontend hits a stable shape: `{ items: T[], count: number }`.
 */
export type ListBody<T> = {
	items: T[];
	count: number;
};

/**
 * Return a structured error response.
 *
 * @param c Hono context
 * @param error Human-readable message (also used as fallback for code)
 * @param status HTTP status (default 500)
 * @param extra Optional extra fields — `code` for machine-readable
 *              identification, `details` for validation issues, etc.
 */
export function errorResponse(
	c: Context,
	error: string,
	status: ContentfulStatusCode = 500,
	extra?: { code?: string; details?: unknown }
) {
	const body: ErrorBody = { error };
	if (extra?.code) body.code = extra.code;
	if (extra?.details !== undefined) body.details = extra.details;
	return c.json(body, status);
}

/**
 * Return a validation error response (400) with structured issues.
 *
 * Convenience over `errorResponse` for the common Zod case — extracts
 * the first error message as the human string and attaches the full
 * issue list under `details`.
 */
export function validationError(c: Context, issues: unknown[], status: ContentfulStatusCode = 400) {
	const firstMessage =
		Array.isArray(issues) &&
		issues.length > 0 &&
		typeof issues[0] === 'object' &&
		issues[0] !== null &&
		'message' in issues[0]
			? String((issues[0] as { message: unknown }).message)
			: 'Invalid input';
	return errorResponse(c, firstMessage, status, { code: 'VALIDATION', details: issues });
}

/**
 * Return a standard list response. Always wraps in `{ items, count }`,
 * regardless of what `items` are. This is the *opposite* of the current
 * convention where each module names its own field
 * (`{ events, count }`, `{ contacts, count }`) — frontends benefit
 * from a single uniform unwrap step.
 */
export function listResponse<T>(c: Context, items: T[], status: ContentfulStatusCode = 200) {
	const body: ListBody<T> = { items, count: items.length };
	return c.json(body, status);
}
