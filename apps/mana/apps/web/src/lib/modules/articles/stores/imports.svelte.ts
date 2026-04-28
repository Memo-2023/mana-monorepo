/**
 * Articles Bulk-Import — store (mutations only).
 *
 * Creates and steers `articleImportJobs` + `articleImportItems`. The
 * server-side worker (apps/api/src/modules/articles/import-worker.ts)
 * picks up `state='pending'` items, extracts them, drops Pickup rows
 * the client-side `consume-pickup.ts` consumer translates into encrypted
 * `articles` rows.
 *
 * Read-side queries live in `queries.ts` (a `useImportJob(id)` /
 * `useImportItems(jobId)` pair will land alongside the UI in Phase 5).
 *
 * Plan: docs/plans/articles-bulk-import.md.
 */

import { emitDomainEvent } from '$lib/data/events';
import { articleImportJobTable, articleImportItemTable } from '../collections';
import type {
	ArticleImportItemState,
	LocalArticleImportItem,
	LocalArticleImportJob,
} from '../types';

/**
 * Pure URL parser — used by both the store (`createJob` accepts a raw
 * textarea blob) and the UI's `$derived` live-validation. Splits on
 * any whitespace + comma, drops empties, validates with `new URL`,
 * deduplicates while preserving first-occurrence order.
 *
 * Exported as a standalone pure function so the unit-test file can
 * import it without booting Dexie.
 */
export interface ParsedUrls {
	valid: string[];
	invalid: string[];
	duplicates: string[];
}

export function parseUrls(raw: string): ParsedUrls {
	const tokens = raw
		.split(/[\s,]+/)
		.map((t) => t.trim())
		.filter(Boolean);
	const valid: string[] = [];
	const invalid: string[] = [];
	const duplicates: string[] = [];
	const seen = new Set<string>();
	for (const token of tokens) {
		// Reject anything without an http(s) scheme — `new URL('foo.com')`
		// would happily accept it as an opaque URI and the server-side
		// fetch would then 400 on us.
		let parsed: URL;
		try {
			parsed = new URL(token);
		} catch {
			invalid.push(token);
			continue;
		}
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			invalid.push(token);
			continue;
		}
		const canonical = parsed.toString();
		if (seen.has(canonical)) {
			duplicates.push(canonical);
			continue;
		}
		seen.add(canonical);
		valid.push(canonical);
	}
	return { valid, invalid, duplicates };
}

export const articleImportsStore = {
	/**
	 * Create a job with N items, all in state='pending'. Returns the
	 * job id so the caller can navigate to `/articles/import/[jobId]`.
	 *
	 * No URL validation here — `parseUrls` is the canonical entry, and
	 * the UI calls it for live feedback before submit. We accept a
	 * pre-cleaned string array so this method stays trivially testable.
	 */
	async createJob(urls: readonly string[]): Promise<string> {
		if (urls.length === 0) {
			throw new Error('createJob: empty url list');
		}
		const jobId = crypto.randomUUID();

		const job: LocalArticleImportJob = {
			id: jobId,
			totalUrls: urls.length,
			status: 'queued',
			leasedBy: null,
			leasedUntil: null,
			startedAt: null,
			finishedAt: null,
			savedCount: 0,
			duplicateCount: 0,
			errorCount: 0,
			warningCount: 0,
		};

		const items: LocalArticleImportItem[] = urls.map((url, idx) => ({
			id: crypto.randomUUID(),
			jobId,
			idx,
			url,
			state: 'pending' as ArticleImportItemState,
			articleId: null,
			warning: null,
			error: null,
			attempts: 0,
			lastAttemptAt: null,
		}));

		// Items first so a server-worker tick that races the job-write
		// won't see a job with totalUrls=N but only N-1 items reachable.
		// (Conservative ordering — the worker filters jobs to running/
		// queued before scanning items, but the bulkAdd is cheap.)
		await articleImportItemTable.bulkAdd(items);
		await articleImportJobTable.add(job);

		emitDomainEvent('ArticleImportStarted', 'articles', 'articleImportJobs', jobId, {
			jobId,
			totalUrls: urls.length,
		});

		return jobId;
	},

	/** Pause a running job. Server-worker observes `status='paused'` and
	 *  stops claiming new items. Already-extracting items finish their
	 *  roundtrip; pickup/encrypt cycle for them runs normally. */
	async pauseJob(jobId: string): Promise<void> {
		await articleImportJobTable.update(jobId, { status: 'paused' });
	},

	/** Resume a paused job. */
	async resumeJob(jobId: string): Promise<void> {
		await articleImportJobTable.update(jobId, { status: 'running' });
	},

	/** Cancel a job. Server-worker flips every still-pending item to
	 *  state='cancelled' on the next tick. */
	async cancelJob(jobId: string): Promise<void> {
		await articleImportJobTable.update(jobId, { status: 'cancelled' });
	},

	/**
	 * Retry the failed items of a job — flip them back to 'pending' so
	 * the worker picks them up again. Resets attempts so the per-item
	 * 3-attempt budget restarts cleanly. Counter delta is left to the
	 * worker (it derives counters from current item states each tick).
	 */
	async retryFailed(jobId: string): Promise<number> {
		const failed = await articleImportItemTable
			.where('[jobId+state]')
			.equals([jobId, 'error'])
			.toArray();
		for (const it of failed) {
			await articleImportItemTable.update(it.id, {
				state: 'pending' as ArticleImportItemState,
				error: null,
				attempts: 0,
			});
		}
		// If the job was 'done' because everything was terminal, re-arm it.
		if (failed.length > 0) {
			const job = await articleImportJobTable.get(jobId);
			if (job?.status === 'done') {
				await articleImportJobTable.update(jobId, {
					status: 'running',
					finishedAt: null,
				});
			}
		}
		return failed.length;
	},

	/** Soft-delete the job + all its items. Article rows that already
	 *  landed are NOT touched — the user's reading list is independent
	 *  from the import job's history. */
	async deleteJob(jobId: string): Promise<void> {
		const now = new Date().toISOString();
		const items = await articleImportItemTable.where('jobId').equals(jobId).toArray();
		for (const it of items) {
			await articleImportItemTable.update(it.id, { deletedAt: now });
		}
		await articleImportJobTable.update(jobId, { deletedAt: now });
	},
};
