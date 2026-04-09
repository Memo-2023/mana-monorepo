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
import type { QueuedTask } from '@mana/shared-llm';
import { llmQueueDb } from '$lib/llm-queue';
import { encryptRecord } from '$lib/data/crypto';
import { memoTable } from './collections';
import type { LocalMemo } from './types';

let subscription: Subscription | null = null;

export function startMemoroLlmWatcher(): void {
	if (subscription) return; // already running
	if (typeof window === 'undefined') return; // SSR-safe no-op

	console.info('[memoro-llm-watcher] starting subscription');

	const observable = liveQuery(async () =>
		llmQueueDb.tasks
			.where('state')
			.equals('done')
			.and((t: QueuedTask) => t.taskName === 'common.generateTitle' && t.refType === 'memo')
			.toArray()
	);

	subscription = observable.subscribe({
		next: async (rows) => {
			if (rows.length === 0) return;
			console.info(`[memoro-llm-watcher] saw ${rows.length} done title task(s)`);

			for (const row of rows) {
				try {
					await applyRow(row);
				} catch (err) {
					console.warn('[memoro-llm-watcher] failed to apply row', row.id, err);
					// Best-effort: mark the row consumed so we don't keep
					// retrying a row that crashes the watcher every cycle.
					try {
						await llmQueueDb.tasks.delete(row.id);
					} catch {
						/* ignore */
					}
				}
			}
		},
		error: (err) => {
			console.warn('[memoro-llm-watcher] subscription error:', err);
		},
	});

	// Belt-and-suspenders: Dexie liveQuery sometimes misses the FIRST
	// emission if the subscription is set up in the same microtask as
	// the table update. Trigger an immediate manual sweep on startup
	// so any rows already done from a previous tab session get picked up.
	void runOneSweep();
}

async function runOneSweep(): Promise<void> {
	try {
		const rows = await llmQueueDb.tasks
			.where('state')
			.equals('done')
			.and((t: QueuedTask) => t.taskName === 'common.generateTitle' && t.refType === 'memo')
			.toArray();
		if (rows.length === 0) {
			console.info('[memoro-llm-watcher] startup sweep: no pending done rows');
			return;
		}
		console.info(`[memoro-llm-watcher] startup sweep: applying ${rows.length} row(s)`);
		for (const row of rows) {
			try {
				await applyRow(row);
			} catch (err) {
				console.warn('[memoro-llm-watcher] startup sweep failed for row', row.id, err);
			}
		}
	} catch (err) {
		console.warn('[memoro-llm-watcher] startup sweep error:', err);
	}
}

async function applyRow(row: QueuedTask): Promise<void> {
	if (!row.refId || typeof row.result !== 'string') {
		console.info(
			`[memoro-llm-watcher] dropping row ${row.id} — missing refId or result not a string`
		);
		await llmQueueDb.tasks.delete(row.id);
		return;
	}

	const memo = await memoTable.get(row.refId);
	if (!memo) {
		console.info(`[memoro-llm-watcher] dropping row ${row.id} — memo ${row.refId} not found`);
		await llmQueueDb.tasks.delete(row.id);
		return;
	}

	// Don't overwrite a manual title that the user typed
	// between enqueue time and result time. The memo we just read
	// from Dexie is still ENCRYPTED — title is either null/undefined
	// (no manual title) or an `enc:1:...` blob (manual title set).
	// Either way, presence-check is enough — we don't need to decrypt
	// to know if the user filled it in.
	if (typeof memo.title === 'string' && memo.title.trim()) {
		console.info(
			`[memoro-llm-watcher] memo ${row.refId} already has a title — skipping auto-title`
		);
		await llmQueueDb.tasks.delete(row.id);
		return;
	}

	// Backstop: if the task result somehow came back empty/whitespace
	// (LLM emitted only special tokens, runRules got an empty input,
	// any other edge case), synthesize a date-based fallback so the
	// user always gets *some* title rather than a stuck empty input.
	let titleToWrite = row.result.trim();
	if (!titleToWrite) {
		const created = (memo as { createdAt?: string }).createdAt;
		const dateLabel = created
			? new Date(created).toLocaleDateString('de', {
					day: 'numeric',
					month: 'long',
					year: 'numeric',
				})
			: new Date().toLocaleDateString('de');
		titleToWrite = `Memo vom ${dateLabel}`;
		console.warn(
			`[memoro-llm-watcher] row ${row.id} returned empty title — using date fallback "${titleToWrite}"`,
			{ source: row.source, attempts: row.attempts, rawResult: JSON.stringify(row.result) }
		);
	} else {
		console.info(`[memoro-llm-watcher] writing title to memo ${row.refId}: "${titleToWrite}"`, {
			source: row.source,
			attempts: row.attempts,
		});
	}

	const diff: Partial<LocalMemo> = {
		title: titleToWrite,
		updatedAt: new Date().toISOString(),
	};
	await encryptRecord('memos', diff);
	await memoTable.update(row.refId, diff);

	// Mark consumed
	await llmQueueDb.tasks.delete(row.id);
	console.info(`[memoro-llm-watcher] applied + cleared row ${row.id}`);
}

export function stopMemoroLlmWatcher(): void {
	subscription?.unsubscribe();
	subscription = null;
}
