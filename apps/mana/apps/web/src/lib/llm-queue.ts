/**
 * LLM task queue singleton for the Mana web app.
 *
 * Wires up @mana/shared-llm's LlmTaskQueue with:
 *
 *   - A dedicated Dexie database (`mana-llm-queue`) — separate from
 *     the main `mana` IndexedDB. The queue holds ephemeral, per-device
 *     state that does NOT need encryption (the inputs are user content
 *     they already see), does NOT need cross-device sync (running on
 *     device A doesn't help device B), and does NOT belong in the
 *     long-frozen `mana` schema with its 120+ collections. A separate
 *     small DB is the right granularity here.
 *
 *   - The shared LlmOrchestrator singleton from @mana/shared-llm.
 *
 *   - The task registry from $lib/llm-task-registry.ts — every task
 *     name that the queue might encounter has to be listed there
 *     so the processor can look up the LlmTask object at execution
 *     time. (Closures can't be persisted, so we round-trip via name.)
 *
 * The queue is started from the (app)/+layout.svelte's onMount so it
 * runs once per page session as long as the app is open.
 */

import Dexie, { type Table } from 'dexie';
import { LlmTaskQueue, llmOrchestrator, type QueuedTask } from '@mana/shared-llm';
import { taskRegistry } from './llm-task-registry';

class LlmQueueDb extends Dexie {
	tasks!: Table<QueuedTask, string>;

	constructor() {
		super('mana-llm-queue');
		this.version(1).stores({
			// Indexes:
			//   id            primary key (uuid string)
			//   state         filter on pending/running/done/failed
			//   refType+refId compound index for module reactive reads
			//                 ("show me all tasks for note X")
			//   taskName      filter by task type
			//   enqueuedAt    sort key for FIFO ordering
			tasks: 'id, state, [refType+refId], taskName, enqueuedAt',
		});
	}
}

export const llmQueueDb = new LlmQueueDb();

export const llmTaskQueue = new LlmTaskQueue({
	table: llmQueueDb.tasks,
	orchestrator: llmOrchestrator,
	registry: taskRegistry,
});

/** Start the background processor. Idempotent — safe to call from
 *  layout onMount even if multiple components mount in parallel. */
export function startLlmQueue(): void {
	if (typeof window === 'undefined') return;
	llmTaskQueue.start();
}

/** Stop the queue and wait for the current task to finish. Used by
 *  tests and by the layout's onDestroy hook. */
export async function stopLlmQueue(): Promise<void> {
	await llmTaskQueue.stop();
}
