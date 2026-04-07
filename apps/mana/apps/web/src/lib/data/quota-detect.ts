/**
 * Quota detection + event dispatcher with no Dexie dependency.
 *
 * Lives in its own file (separate from quota.ts) so the lower-level
 * `database.ts` module can import it without creating an import cycle.
 * `quota.ts` re-exports these for callers that already pull in db.
 */

/** CustomEvent name dispatched when an IndexedDB write hits the quota. */
export const QUOTA_EVENT = 'mana:storage-quota-exceeded';

export interface QuotaExceededDetail {
	table?: string;
	op?: 'insert' | 'update' | 'delete' | 'apply' | 'pending-change';
	cleaned: number;
	recovered: boolean;
}

/**
 * Cross-browser check for the IndexedDB quota error.
 * Modern browsers report `QuotaExceededError` as the DOMException name;
 * older Chromium/WebKit also set numeric `code === 22`. Dexie wraps the
 * underlying DOMException in its own error class with `inner`.
 */
export function isQuotaError(err: unknown): boolean {
	if (!err || typeof err !== 'object') return false;
	const e = err as { name?: string; code?: number; inner?: unknown };
	if (e.name === 'QuotaExceededError') return true;
	if (typeof e.code === 'number' && e.code === 22) return true;
	if (e.inner) return isQuotaError(e.inner);
	return false;
}

/**
 * Dispatches the quota CustomEvent. UI components or error trackers can
 * `window.addEventListener(QUOTA_EVENT, ...)` to react.
 */
export function notifyQuotaExceeded(detail: QuotaExceededDetail): void {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(new CustomEvent(QUOTA_EVENT, { detail }));
}
