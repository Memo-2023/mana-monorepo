/**
 * Memoro LLM result watcher.
 *
 * The persistent task queue stores LlmTask results in its own Dexie
 * table — but for module-side data (like a memo's title), we want
 * those results to land in the module's own collection so existing
 * queries / UI keep working without per-component subscriptions.
 *
 * This file owns the bridge for memoro: it subscribes via Dexie
 * liveQuery to completed `common.generateTitle` tasks tagged
 * with refType: 'memo', and for each one writes the generated title
 * back into the memo row, then deletes the queue entry to mark it
 * consumed. Once consumed, the queue stays empty for that memo.
 *
 * The watcher is started exactly once per page session — see
 * startMemoroLlmWatcher() below for the idempotent guard. The
 * memoro module config calls it from its initialize() hook, but
 * even if a future refactor calls it twice, the duplicate call is
 * a no-op.
 *
 * Cleanup: the subscription handle is stored module-scope; the page
 * teardown is implicit (page reload kills the dev server too). For
 * a long-lived SPA we'd want stop() — punt that to a follow-up.
 */

import { liveQuery, type Subscription } from 'dexie';
import { llmQueueDb } from '$lib/llm-queue';
import { encryptRecord } from '$lib/data/crypto';
import { memoTable } from './collections';
import type { LocalMemo } from './types';

let subscription: Subscription | null = null;

export function startMemoroLlmWatcher(): void {
	if (subscription) return; // already running
	if (typeof window === 'undefined') return; // SSR-safe no-op

	const observable = liveQuery(async () =>
		llmQueueDb.tasks
			.where('state')
			.equals('done')
			.and((t) => t.taskName === 'common.generateTitle' && t.refType === 'memo')
			.toArray()
	);

	subscription = observable.subscribe({
		next: async (rows) => {
			for (const row of rows) {
				if (!row.refId || typeof row.result !== 'string') {
					// Result shape didn't match — drop the queue row so we
					// don't keep retrying it.
					await llmQueueDb.tasks.delete(row.id);
					continue;
				}

				const memo = await memoTable.get(row.refId);
				if (!memo) {
					// Memo was deleted before the task finished — discard.
					await llmQueueDb.tasks.delete(row.id);
					continue;
				}

				// Don't overwrite a manual title that the user typed
				// between enqueue time and result time.
				if (memo.title?.trim()) {
					await llmQueueDb.tasks.delete(row.id);
					continue;
				}

				const diff: Partial<LocalMemo> = {
					title: row.result,
					updatedAt: new Date().toISOString(),
				};
				await encryptRecord('memos', diff);
				await memoTable.update(row.refId, diff);

				// Mark consumed
				await llmQueueDb.tasks.delete(row.id);
			}
		},
		error: (err) => {
			console.warn('[memoro-llm-watcher] subscription error:', err);
		},
	});
}

export function stopMemoroLlmWatcher(): void {
	subscription?.unsubscribe();
	subscription = null;
}
