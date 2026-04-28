/**
 * Articles Bulk-Import — client-side Pickup Consumer.
 *
 * The server-side import-worker drops `articleExtractPickup` rows for
 * each successful URL extraction. This consumer:
 *
 *   1. Watches the pickup table via `liveQuery`.
 *   2. For each new row: calls `articlesStore.saveFromExtracted()` so
 *      the existing Single-URL save-path runs unchanged (encrypt →
 *      `articleTable.add()` → emit ArticleSaved domain event).
 *   3. Updates the matching `articleImportItems` row to state='saved'
 *      (or 'duplicate' / 'consent-wall') with the resulting articleId.
 *   4. Deletes the pickup row so the inbox stays empty in steady state.
 *
 * Multi-tab coordination via `navigator.locks.request('mana:articles:pickup')`:
 * any number of tabs can subscribe, but only the lock-holder consumes.
 * Falls back to per-row in-memory dedupe when locks aren't available
 * (older Safari) — the field-LWW merge on the server forgives the rare
 * double-process.
 *
 * Plan: docs/plans/articles-bulk-import.md.
 */

import { liveQuery, type Subscription } from 'dexie';
import { emitDomainEvent } from '$lib/data/events';
import {
	articleExtractPickupTable,
	articleImportItemTable,
	articleImportJobTable,
} from './collections';
import { articlesStore } from './stores/articles.svelte';
import type {
	ArticleImportItemState,
	LocalArticleExtractPickup,
	LocalArticleImportJob,
} from './types';

const LOCK_NAME = 'mana:articles:pickup';

/** In-memory guard so a quick liveQuery double-tick doesn't race the
 *  same pickup row through `consumeOne` twice. Reset on tab close. */
const inFlight = new Set<string>();

let subscription: Subscription | null = null;
let jobWatchSubscription: Subscription | null = null;

/** Track which jobs we've already emitted ArticleImportFinished for so a
 *  liveQuery re-tick doesn't double-fire when other rows change. */
const finishedEmitted = new Set<string>();

/**
 * Start watching the pickup inbox. Idempotent — second call returns
 * the existing dispose function.
 *
 * Disable via `localStorage('mana:articles:pickup:disabled')` (string
 * 'true') — escape hatch for users who want to debug without the
 * consumer running.
 */
export function startArticlePickupConsumer(): () => void {
	if (typeof window === 'undefined') return () => {};
	if (subscription) return stopArticlePickupConsumer;
	if (window.localStorage?.getItem('mana:articles:pickup:disabled') === 'true') {
		console.log('[articles-import] pickup consumer disabled via localStorage');
		return () => {};
	}

	const query = liveQuery(async () =>
		articleExtractPickupTable.filter((r) => !r.deletedAt).toArray()
	);
	subscription = query.subscribe({
		next: (rows: LocalArticleExtractPickup[]) => {
			void runConsume(rows);
		},
		error: (err) => {
			console.error('[articles-import] pickup liveQuery error:', err);
		},
	});

	// Independently watch the jobs table for status='done' flips so we
	// can emit `ArticleImportFinished` once per job. Server-worker
	// flips the status; this is the only client-side observer for the
	// terminal transition.
	const jobsQuery = liveQuery(async () =>
		articleImportJobTable.filter((j) => j.status === 'done' && !j.deletedAt).toArray()
	);
	jobWatchSubscription = jobsQuery.subscribe({
		next: (jobs: LocalArticleImportJob[]) => {
			for (const j of jobs) {
				if (finishedEmitted.has(j.id)) continue;
				finishedEmitted.add(j.id);
				emitDomainEvent('ArticleImportFinished', 'articles', 'articleImportJobs', j.id, {
					jobId: j.id,
					totalUrls: j.totalUrls,
					savedCount: j.savedCount ?? 0,
					duplicateCount: j.duplicateCount ?? 0,
					errorCount: j.errorCount ?? 0,
					warningCount: j.warningCount ?? 0,
				});
			}
		},
		error: (err) => {
			console.error('[articles-import] job-watch liveQuery error:', err);
		},
	});
	return stopArticlePickupConsumer;
}

export function stopArticlePickupConsumer(): void {
	subscription?.unsubscribe();
	subscription = null;
	jobWatchSubscription?.unsubscribe();
	jobWatchSubscription = null;
	inFlight.clear();
	finishedEmitted.clear();
}

/**
 * Drain the current set of pickup rows under the multi-tab Web-Lock.
 * If the lock is held by another tab, this returns immediately and the
 * other tab's run handles the rows.
 */
async function runConsume(rows: readonly LocalArticleExtractPickup[]): Promise<void> {
	if (rows.length === 0) return;

	const locks = (navigator as Navigator & { locks?: LockManager }).locks;
	if (!locks) {
		await drain(rows);
		return;
	}

	await locks.request(LOCK_NAME, { ifAvailable: true }, async (lock) => {
		if (!lock) {
			// Another tab is the consumer — leave the rows alone.
			return;
		}
		await drain(rows);
	});
}

async function drain(rows: readonly LocalArticleExtractPickup[]): Promise<void> {
	for (const row of rows) {
		if (inFlight.has(row.id)) continue;
		inFlight.add(row.id);
		try {
			await consumeOne(row);
		} catch (err) {
			console.error('[articles-import] consumeOne failed:', row.id, err);
		} finally {
			inFlight.delete(row.id);
		}
	}
}

async function consumeOne(row: LocalArticleExtractPickup): Promise<void> {
	const item = await articleImportItemTable.get(row.itemId);

	// Stale pickup row — item was deleted, cancelled, or already
	// consumed by a previous tab. Just clean up the inbox.
	if (!item || item.state !== 'extracted' || item.deletedAt) {
		await articleExtractPickupTable.delete(row.id);
		return;
	}

	// Dedupe race: user may have single-saved this URL via QuickAddInput
	// while the bulk job was running. Don't write a duplicate Article
	// row; just point the import item at the existing one.
	const existing = await articlesStore.findByUrl(row.payload.originalUrl);
	if (existing) {
		await articleImportItemTable.update(item.id, {
			state: 'duplicate',
			articleId: existing.id,
		});
		await articleExtractPickupTable.delete(row.id);
		return;
	}

	// Happy path: persist via the existing single-URL pipeline. This
	// runs encryptRecord + articleTable.add and emits the ArticleSaved
	// domain event, exactly like a manual `Save URL` would.
	const article = await articlesStore.saveFromExtracted({
		originalUrl: row.payload.originalUrl,
		title: row.payload.title,
		excerpt: row.payload.excerpt,
		content: row.payload.content,
		htmlContent: row.payload.htmlContent,
		author: row.payload.author,
		siteName: row.payload.siteName,
		wordCount: row.payload.wordCount,
		readingTimeMinutes: row.payload.readingTimeMinutes,
		warning: row.payload.warning,
	});

	const nextState: ArticleImportItemState =
		row.payload.warning === 'probable_consent_wall' ? 'consent-wall' : 'saved';

	await articleImportItemTable.update(item.id, {
		state: nextState,
		articleId: article.id,
		warning: row.payload.warning ?? null,
	});
	await articleExtractPickupTable.delete(row.id);
}
