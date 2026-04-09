/**
 * Sync telemetry — fire-and-forget CustomEvent bus.
 *
 * The sync engine emits one event per lifecycle transition (push start/ok/
 * error, pull start/ok/error, malformed-drop). UI components, an error
 * tracker, or a debug overlay can subscribe via window.addEventListener.
 *
 * Why CustomEvent and not a state store?
 *   - Zero coupling: the sync engine has no idea who is listening.
 *   - Multiple subscribers: a debug HUD and Sentry can co-exist without
 *     either of them needing to know about the other.
 *   - Compatible with `addEventListener` in tests.
 *
 * No PII / record contents are emitted — only counts, durations, table
 * names, and error categories. Safe to forward to a third-party tracker.
 */

export const SYNC_TELEMETRY_EVENT = 'mana:sync-telemetry';

export type SyncTelemetryKind =
	| 'push:start'
	| 'push:ok'
	| 'push:error'
	| 'pull:start'
	| 'pull:ok'
	| 'pull:error'
	| 'apply:malformed-drop'
	| 'apply:done';

export interface SyncTelemetryDetail {
	kind: SyncTelemetryKind;
	appId: string;
	/** ms since the operation started — present on `*:ok` / `*:error`. */
	durationMs?: number;
	/** number of changes touched (pushed / pulled / applied / dropped). */
	count?: number;
	/** Error category for `*:error`. Free-form short string, never raw stacks. */
	errorCategory?:
		| 'network'
		| 'auth'
		| 'http-5xx'
		| 'http-4xx'
		| 'parse'
		| 'no-token'
		| 'unknown-appid'
		| 'unknown';
	/** HTTP status code if applicable. */
	status?: number;
	/** Table name for apply-level events. */
	table?: string;
}

/**
 * Emit a telemetry event. Safe to call from any context — no-ops in SSR
 * or environments without `window`.
 */
export function emitSyncTelemetry(detail: SyncTelemetryDetail): void {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(new CustomEvent(SYNC_TELEMETRY_EVENT, { detail }));
}

/**
 * Map an HTTP status / native error to a coarse error category. Used by
 * the sync engine to attach a stable category before re-throwing.
 */
export function categorizeSyncError(err: unknown): SyncTelemetryDetail['errorCategory'] {
	if (!err) return 'unknown';
	if (err instanceof Error) {
		const msg = err.message;
		// fetchWithRetry annotates HTTP failures as `... HTTP <status>`
		const match = msg.match(/HTTP (\d{3})/);
		if (match) {
			const status = parseInt(match[1], 10);
			if (status === 401 || status === 403) return 'auth';
			if (status >= 500) return 'http-5xx';
			if (status >= 400) return 'http-4xx';
		}
		if (err.name === 'SyntaxError') return 'parse';
		if (err.name === 'TypeError' && /fetch/i.test(msg)) return 'network';
	}
	return 'unknown';
}
