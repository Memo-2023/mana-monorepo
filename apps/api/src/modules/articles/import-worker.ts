/**
 * Articles Bulk-Import — background worker.
 *
 * Boots from `apps/api/src/index.ts`. On every tick:
 *
 *   1. Try `pg_try_advisory_xact_lock` on a fixed key. If another
 *      apps/api instance already holds it, skip this tick. The lock
 *      is per-transaction so we never need a heartbeat — a crashed
 *      worker's tx auto-aborts and the next tick claims it cleanly.
 *   2. Project the live state of `articleImportJobs` and pick the
 *      ones still 'queued' or 'running'.
 *   3. For each job: project items, take up to N pending items,
 *      extract concurrently. Each extraction writes a Pickup row +
 *      flips the item state via `import-extractor.ts`.
 *   4. Fold terminal item states into job counters
 *      (savedCount / duplicateCount / errorCount / warningCount).
 *      When every item is terminal, flip the job to 'done'.
 *
 * No own state — every meaningful transition is a `sync_changes` row.
 * The worker is therefore stateless across restarts.
 *
 * Plan: docs/plans/articles-bulk-import.md.
 */

import { getSyncConnection } from '../../mcp/sync-db';
import {
	listClaimableJobs,
	listItemsForJob,
	type ImportItemRow,
	type ImportJobRow,
} from './import-projection';
import { extractOneItem, writeItemUpdate, writeJobUpdate } from './import-extractor';

const TICK_INTERVAL_MS = 2_000;
const PER_JOB_CONCURRENCY = 3;
/** Fixed int8 lock key — derived from the ASCII bytes of 'ARTI'. */
const ADVISORY_LOCK_KEY = 0x4152_5449;

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

/**
 * Start the recurring tick. Idempotent — safe to call multiple times.
 * Intended to be called once from `apps/api/src/index.ts` at boot.
 *
 * Disable via `ARTICLES_IMPORT_WORKER_DISABLED=true` (for tests, or
 * when running multiple apps/api instances and you want to designate
 * a different one as the worker).
 */
export function startArticleImportWorker(): void {
	if (timer) return;
	if (process.env.ARTICLES_IMPORT_WORKER_DISABLED === 'true') {
		console.log('[articles-import] worker disabled via env');
		return;
	}
	console.log(
		`[articles-import] worker starting — tick=${TICK_INTERVAL_MS}ms, concurrency=${PER_JOB_CONCURRENCY}`
	);
	timer = setInterval(() => {
		void runTickGuarded();
	}, TICK_INTERVAL_MS);
}

export function stopArticleImportWorker(): void {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
}

async function runTickGuarded(): Promise<void> {
	if (running) return;
	running = true;
	try {
		await runTickOnce();
	} catch (err) {
		console.error('[articles-import] tick error:', err);
	} finally {
		running = false;
	}
}

/**
 * One tick body. Exported for tests + a potential
 * `/internal/articles-import/tick`-style admin route.
 */
export async function runTickOnce(): Promise<{
	skipped: boolean;
	jobsConsidered: number;
	itemsProcessed: number;
}> {
	if (!(await tryAcquireLock())) {
		return { skipped: true, jobsConsidered: 0, itemsProcessed: 0 };
	}
	const jobs = await listClaimableJobs();
	let itemsProcessed = 0;
	for (const job of jobs) {
		itemsProcessed += await processOneJob(job);
	}
	return { skipped: false, jobsConsidered: jobs.length, itemsProcessed };
}

/**
 * Brief advisory-lock probe via a single short transaction. Returns
 * true if we won the probe — that's a soft signal for "you're the
 * worker for this tick"; the lock releases as the probe tx commits.
 * For multi-instance deploys this is a soft-only coordination — if
 * two probes happen to interleave their work, the field-LWW merge on
 * the client still produces a coherent state.
 */
async function tryAcquireLock(): Promise<boolean> {
	const sql = getSyncConnection();
	let acquired = false;
	await sql.begin(async (tx) => {
		const rows = await tx<{ acquired: boolean }[]>`
			SELECT pg_try_advisory_xact_lock(${ADVISORY_LOCK_KEY}) AS acquired
		`;
		acquired = rows[0]?.acquired === true;
	});
	return acquired;
}

async function processOneJob(job: ImportJobRow): Promise<number> {
	const items = await listItemsForJob(job.userId, job.id);

	// Flip 'queued' → 'running' so the UI shows progress.
	if (job.status === 'queued') {
		await writeJobUpdate(job.userId, job.id, {
			status: 'running',
			startedAt: new Date().toISOString(),
		});
	}

	// Counter-derivation from current item states.
	const counts = countByState(items);
	const counterPatch: Record<string, unknown> = {};
	let dirty = false;
	if (counts.saved !== job.savedCount) {
		counterPatch.savedCount = counts.saved;
		dirty = true;
	}
	if (counts.duplicate !== job.duplicateCount) {
		counterPatch.duplicateCount = counts.duplicate;
		dirty = true;
	}
	if (counts.error !== job.errorCount) {
		counterPatch.errorCount = counts.error;
		dirty = true;
	}
	if (counts.consentWall !== job.warningCount) {
		counterPatch.warningCount = counts.consentWall;
		dirty = true;
	}
	if (counts.allTerminal && job.status !== 'done') {
		counterPatch.status = 'done';
		counterPatch.finishedAt = new Date().toISOString();
		dirty = true;
	}
	if (dirty) {
		await writeJobUpdate(job.userId, job.id, counterPatch);
	}

	if (counts.allTerminal) return 0;

	// Cancelled → flip every still-pending item to 'cancelled'.
	if (job.status === 'cancelled') {
		const pending = items.filter((i) => i.state === 'pending');
		for (const it of pending) {
			await writeItemUpdate(it.userId, it.id, { state: 'cancelled' });
		}
		return pending.length;
	}

	// Paused → already-extracting items finish their roundtrip; nothing
	// new gets claimed.
	if (job.status === 'paused') return 0;

	// Running → claim up to PER_JOB_CONCURRENCY pending items in
	// parallel. We deliberately don't try to rescue 'extracting' items:
	// if a worker died mid-fetch they stay 'extracting' forever for
	// now. Future polish: time-out 'extracting' rows older than ~5min
	// and bounce them back to 'pending'.
	const claimable = items.filter((i) => i.state === 'pending').slice(0, PER_JOB_CONCURRENCY);
	if (claimable.length === 0) return 0;

	await Promise.allSettled(claimable.map((it) => extractOneItem(it)));
	return claimable.length;
}

interface StateCounts {
	saved: number;
	duplicate: number;
	error: number;
	consentWall: number;
	cancelled: number;
	allTerminal: boolean;
}

function countByState(items: readonly ImportItemRow[]): StateCounts {
	let saved = 0;
	let duplicate = 0;
	let error = 0;
	let consentWall = 0;
	let cancelled = 0;
	let nonTerminal = 0;
	for (const it of items) {
		switch (it.state) {
			case 'saved':
				saved++;
				break;
			case 'duplicate':
				duplicate++;
				break;
			case 'error':
				error++;
				break;
			case 'consent-wall':
				saved++; // consent-wall is "saved with warning" semantically
				consentWall++;
				break;
			case 'cancelled':
				cancelled++;
				break;
			default:
				nonTerminal++;
		}
	}
	return {
		saved,
		duplicate,
		error,
		consentWall,
		cancelled,
		allTerminal: items.length > 0 && nonTerminal === 0,
	};
}
