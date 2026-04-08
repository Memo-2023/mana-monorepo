/**
 * Central registry of all LlmTasks the Mana web app knows about.
 *
 * The persistent task queue stores task NAMES (strings) rather than
 * task OBJECTS, because closures can't be serialised to IndexedDB.
 * When the queue processor pulls a row off the table, it looks up
 * the task name in this registry to recover the actual LlmTask
 * object with its runLlm() / runRules() implementations.
 *
 * Adding a new task: import it here and add it to the map. The
 * convention is `{module}.{action}` for the task name, matching
 * the `name` field on the LlmTask itself.
 *
 * If you forget to register a task, the queue will mark any enqueued
 * row with that name as failed with the error
 * "Task '<name>' is not registered" — which is at least loud and
 * obvious enough to catch the typo immediately.
 */

import type { TaskRegistry } from '@mana/shared-llm';
import { extractDateTask } from './llm-tasks/extract-date';
import { summarizeTextTask } from './llm-tasks/summarize';

export const taskRegistry: TaskRegistry = {
	[extractDateTask.name]: extractDateTask,
	[summarizeTextTask.name]: summarizeTextTask,
};
