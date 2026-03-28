/**
 * Svelte 5 reactive bindings for LocalCollection.
 *
 * Uses Dexie's liveQuery() to create reactive queries that automatically
 * update when the underlying IndexedDB data changes — whether from local
 * writes, sync engine updates, or other browser tabs.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useLiveQuery } from '@manacore/local-store/svelte';
 *
 *   const tasks = useLiveQuery(() => taskCollection.getAll({ isCompleted: false }));
 * </script>
 *
 * {#each tasks.value ?? [] as task}
 *   <div>{task.title}</div>
 * {/each}
 * ```
 */

import { liveQuery, type Observable } from 'dexie';
import { onDestroy } from 'svelte';

interface LiveQueryResult<T> {
	/** The current query result. Undefined while loading. */
	readonly value: T | undefined;
	/** Whether the query is still loading its first result. */
	readonly loading: boolean;
	/** Error from the last query execution, if any. */
	readonly error: unknown;
}

/**
 * Create a reactive query that subscribes to IndexedDB changes.
 *
 * The querier function is re-executed whenever the underlying Dexie tables
 * it reads from are modified. This works across tabs and from sync updates.
 *
 * Must be called during component initialization (like onMount).
 */
export function useLiveQuery<T>(querier: () => T | Promise<T>): LiveQueryResult<T> {
	let value = $state<T | undefined>(undefined);
	let loading = $state(true);
	let error = $state<unknown>(undefined);

	const observable: Observable<T> = liveQuery(querier);

	const subscription = observable.subscribe({
		next: (result) => {
			value = result;
			loading = false;
			error = undefined;
		},
		error: (err) => {
			error = err;
			loading = false;
		},
	});

	onDestroy(() => {
		subscription.unsubscribe();
	});

	return {
		get value() {
			return value;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
	};
}

/**
 * Create a reactive query with an initial value (no undefined/loading state).
 * Useful when you have sensible defaults.
 */
export function useLiveQueryWithDefault<T>(
	querier: () => T | Promise<T>,
	defaultValue: T
): { readonly value: T; readonly loading: boolean; readonly error: unknown } {
	let value = $state<T>(defaultValue);
	let loading = $state(true);
	let error = $state<unknown>(undefined);

	const observable: Observable<T> = liveQuery(querier);

	const subscription = observable.subscribe({
		next: (result) => {
			value = result;
			loading = false;
			error = undefined;
		},
		error: (err) => {
			error = err;
			loading = false;
		},
	});

	onDestroy(() => {
		subscription.unsubscribe();
	});

	return {
		get value() {
			return value;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
	};
}
