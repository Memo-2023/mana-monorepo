/**
 * LlmTaskQueue — persistent fire-and-forget LLM task processor.
 *
 * Modules call `queue.enqueue(task, input, opts)` to schedule an LLM
 * task without blocking the UI. The queue persists every entry in a
 * Dexie table, so tasks survive page reloads, browser restarts, and
 * the user navigating away mid-execution. A background loop picks
 * pending tasks one at a time, runs them through the orchestrator
 * (which itself decides which tier to use based on user settings),
 * and writes the result back to the same row.
 *
 * Modules read results reactively via Dexie liveQuery on the same
 * table — no subscription API needed on the queue itself, the
 * standard `useLiveQuery(() => table.where(...))` pattern just works.
 *
 * Concurrency: ONE task at a time. Browser-tier inference is
 * single-threaded (one WebGPU device on one worker), so parallel
 * generations are sequential anyway, and the simpler scheduler beats
 * a complicated one until we have a real reason to need it.
 *
 * Failure model:
 * - Retries with flat 60s backoff up to maxAttempts (default 3).
 * - TierTooLowError and ProviderBlockedError are NOT retried — they
 *   are not transient. The task is marked failed and the module's
 *   UI can offer the user a "switch tier" or "retry manually"
 *   prompt via the standard Dexie reactive read.
 * - Network/load errors (BackendUnreachableError, EdgeLoadFailedError)
 *   ARE retried — they might recover when the user reconnects or
 *   loads the model.
 * - Tasks left in the 'running' state at startup are reclaimed and
 *   reset to 'pending' (the previous page session presumably crashed
 *   or was closed mid-execution).
 */

import type { Table } from 'dexie';
import type { LlmOrchestrator } from './orchestrator';
import type { LlmTask } from './task';
import type { LlmTier } from './tiers';
import { ProviderBlockedError, TierTooLowError } from './errors';

export type QueuedTaskState = 'pending' | 'running' | 'done' | 'failed';

/**
 * The persistent shape of a task in the queue. The `result` and
 * `error` fields are optional and populated only after execution.
 * `input` is opaque (`unknown`) — the queue doesn't know or care
 * about its shape; it just hands it back to the LlmTask's runLlm /
 * runRules implementation.
 */
export interface QueuedTask {
	id: string;
	taskName: string;
	input: unknown;
	state: QueuedTaskState;
	enqueuedAt: number;
	startedAt?: number;
	finishedAt?: number;
	result?: unknown;
	error?: string;
	source?: LlmTier;
	attempts: number;
	maxAttempts: number;
	/** Optional module metadata for filtering: 'note', 'todo', etc. */
	refType?: string;
	/** Optional module metadata: the entity this task is about. */
	refId?: string;
	/** 0 = normal, higher = more urgent. Sort key for the next-pending pick. */
	priority: number;
	/** Earliest time this task should run again. Used for retry backoff. */
	notBefore?: number;
}

export interface EnqueueOptions {
	refType?: string;
	refId?: string;
	priority?: number;
	maxAttempts?: number;
}

/**
 * The registry maps task names to task definitions. The queue uses
 * it to look up the right LlmTask object when it's time to execute
 * a row from the persistent table — the row only stores the task
 * NAME (a string), since closures can't be persisted.
 *
 * The web app builds this registry at startup by importing all of
 * its task modules and listing them by name. See
 * apps/mana/apps/web/src/lib/llm-task-registry.ts for the canonical
 * example.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaskRegistry = Record<string, LlmTask<any, any>>;

export interface LlmTaskQueueOptions {
	table: Table<QueuedTask, string>;
	orchestrator: LlmOrchestrator;
	registry: TaskRegistry;
	/** Backoff between retries in ms. Default 60_000 (1 minute). */
	retryBackoffMs?: number;
	/** Maximum sleep when no work is pending, ms. Default 30_000. */
	idleWakeupMs?: number;
}

export class LlmTaskQueue {
	private readonly table: Table<QueuedTask, string>;
	private readonly orchestrator: LlmOrchestrator;
	private readonly registry: TaskRegistry;
	private readonly retryBackoffMs: number;
	private readonly idleWakeupMs: number;
	private running = false;
	private wakeupResolvers: Array<() => void> = [];
	private loopPromise: Promise<void> | null = null;

	constructor(opts: LlmTaskQueueOptions) {
		this.table = opts.table;
		this.orchestrator = opts.orchestrator;
		this.registry = opts.registry;
		this.retryBackoffMs = opts.retryBackoffMs ?? 60_000;
		this.idleWakeupMs = opts.idleWakeupMs ?? 30_000;
	}

	// ─── Public API ──────────────────────────────────────────

	/** Schedule a task for background execution. Returns the queued task id. */
	async enqueue<TIn, TOut>(
		task: LlmTask<TIn, TOut>,
		input: TIn,
		opts: EnqueueOptions = {}
	): Promise<string> {
		const id = crypto.randomUUID();
		const queued: QueuedTask = {
			id,
			taskName: task.name,
			input,
			state: 'pending',
			enqueuedAt: Date.now(),
			attempts: 0,
			maxAttempts: opts.maxAttempts ?? 3,
			refType: opts.refType,
			refId: opts.refId,
			priority: opts.priority ?? 0,
		};
		await this.table.add(queued);
		this.notifyWakeup();
		return id;
	}

	/** Look up a task by id. */
	async get(id: string): Promise<QueuedTask | undefined> {
		return this.table.get(id);
	}

	/** Manually retry a failed task. Resets state to pending and clears the error. */
	async retry(id: string): Promise<void> {
		await this.table.update(id, {
			state: 'pending',
			error: undefined,
			attempts: 0,
			notBefore: undefined,
		});
		this.notifyWakeup();
	}

	/** Cancel a task — removes it from the queue if not yet running. */
	async cancel(id: string): Promise<void> {
		const task = await this.table.get(id);
		if (!task) return;
		if (task.state === 'running') {
			throw new Error(`Cannot cancel task ${id} — it's currently running`);
		}
		await this.table.delete(id);
	}

	/** Clear all done/failed tasks older than the given timestamp.
	 *  Use this for periodic cleanup so the queue table doesn't grow
	 *  unbounded. */
	async purge(olderThanMs: number): Promise<number> {
		const cutoff = Date.now() - olderThanMs;
		const stale = await this.table
			.filter((t) => (t.state === 'done' || t.state === 'failed') && (t.finishedAt ?? 0) < cutoff)
			.toArray();
		const ids = stale.map((t) => t.id);
		if (ids.length > 0) await this.table.bulkDelete(ids);
		return ids.length;
	}

	/** Start the background processor. Idempotent. */
	start(): void {
		if (this.running) return;
		this.running = true;
		this.loopPromise = this.loop();
	}

	/** Stop the background processor. Returns when the current task
	 *  (if any) finishes. */
	async stop(): Promise<void> {
		this.running = false;
		this.notifyWakeup();
		if (this.loopPromise) {
			await this.loopPromise;
			this.loopPromise = null;
		}
	}

	// ─── Internal: processor loop ────────────────────────────

	private async loop(): Promise<void> {
		// On startup, reclaim orphaned 'running' rows from a crashed
		// previous session.
		await this.reclaimOrphaned();

		while (this.running) {
			const next = await this.findNextRunnable();
			if (!next) {
				await this.waitForWakeup(this.idleWakeupMs);
				continue;
			}

			await this.executeTask(next);
		}
	}

	private async reclaimOrphaned(): Promise<void> {
		const orphans = await this.table.where('state').equals('running').toArray();
		for (const o of orphans) {
			await this.table.update(o.id, { state: 'pending', startedAt: undefined });
		}
	}

	/** Find the next pending task that's eligible to run.
	 *  Highest priority first, then oldest enqueuedAt first.
	 *  Skips tasks whose `notBefore` is still in the future (retry backoff). */
	private async findNextRunnable(): Promise<QueuedTask | undefined> {
		const now = Date.now();
		const pending = await this.table.where('state').equals('pending').toArray();
		const eligible = pending.filter((t) => (t.notBefore ?? 0) <= now);
		if (eligible.length === 0) return undefined;
		eligible.sort((a, b) => {
			if (b.priority !== a.priority) return b.priority - a.priority;
			return a.enqueuedAt - b.enqueuedAt;
		});
		return eligible[0];
	}

	private async executeTask(task: QueuedTask): Promise<void> {
		const definition = this.registry[task.taskName];
		if (!definition) {
			// Task name no longer registered (e.g. module was removed).
			// Mark as failed permanently.
			await this.table.update(task.id, {
				state: 'failed',
				error: `Task '${task.taskName}' is not registered`,
				finishedAt: Date.now(),
			});
			return;
		}

		// Mark as running
		await this.table.update(task.id, {
			state: 'running',
			startedAt: Date.now(),
			attempts: task.attempts + 1,
		});

		try {
			const result = await this.orchestrator.run(definition, task.input);
			await this.table.update(task.id, {
				state: 'done',
				result: result.value,
				source: result.source,
				finishedAt: Date.now(),
				error: undefined,
			});
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			const attempts = task.attempts + 1;

			// Non-retryable errors: tier-too-low (won't change without
			// settings change) and provider-blocked (content rejected).
			const nonRetryable = err instanceof TierTooLowError || err instanceof ProviderBlockedError;

			if (nonRetryable || attempts >= task.maxAttempts) {
				await this.table.update(task.id, {
					state: 'failed',
					error: errorMessage,
					finishedAt: Date.now(),
				});
			} else {
				// Retry with backoff
				await this.table.update(task.id, {
					state: 'pending',
					error: errorMessage,
					notBefore: Date.now() + this.retryBackoffMs,
				});
			}
		}
	}

	// ─── Internal: wakeup signaling ──────────────────────────

	private notifyWakeup(): void {
		const resolvers = this.wakeupResolvers;
		this.wakeupResolvers = [];
		for (const r of resolvers) r();
	}

	private waitForWakeup(timeoutMs: number): Promise<void> {
		return new Promise((resolve) => {
			let resolved = false;
			const finish = () => {
				if (resolved) return;
				resolved = true;
				resolve();
			};
			const timer = setTimeout(finish, timeoutMs);
			this.wakeupResolvers.push(() => {
				clearTimeout(timer);
				finish();
			});
		});
	}
}
