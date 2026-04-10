/**
 * Typed Module Context — replaces manual getContext/setContext with
 * type-safe wrappers that guarantee the shape at compile time.
 *
 * Problem:
 *   Layouts do `setContext('todos', useAllTodos())` and pages read
 *   `const ctx: { readonly value: Todo[] } = getContext('todos')`.
 *   The type annotation is manual, duplicated, and drifts silently
 *   when the query return shape changes.
 *
 * Solution:
 *   `createModuleContext<T>('todos')` returns a pair of typed
 *   functions: `provide(value)` for layouts and `consume()` for
 *   pages. Both enforce the same T at compile time.
 *
 * Usage:
 *
 * ```ts
 * // In the module's queries.ts or a dedicated context.ts:
 * import { createModuleContext } from '$lib/data/module-context';
 * import type { Todo } from './types';
 *
 * export const todosContext = createModuleContext<Todo[]>('todos');
 *
 * // In +layout.svelte:
 * todosContext.provide(useAllTodos());
 *
 * // In +page.svelte:
 * const todos = todosContext.consume();
 * // todos is { readonly value: Todo[]; readonly loading: boolean; readonly error: unknown }
 * ```
 */

import { setContext, getContext } from 'svelte';

/**
 * The shape returned by `useLiveQueryWithDefault` from @mana/local-store/svelte.
 * We mirror it here so module-context.ts doesn't need a runtime import
 * of the local-store package (it's types-only).
 */
export interface LiveQueryResult<T> {
	readonly value: T;
	readonly loading: boolean;
	readonly error: unknown;
}

/**
 * Creates a typed context pair for a module's reactive data.
 *
 * @param key — unique string key for the Svelte context. Must match
 *   across the layout (provide) and page (consume) in the same route
 *   subtree.
 * @returns `{ provide, consume }` — call `provide` in the layout's
 *   `<script>` block and `consume` in any descendant page/component.
 */
export function createModuleContext<T>(key: string) {
	return {
		/**
		 * Set the reactive query result into the Svelte context.
		 * Call this in the `<script>` block of a +layout.svelte.
		 */
		provide(value: LiveQueryResult<T>): void {
			setContext(key, value);
		},

		/**
		 * Read the reactive query result from the Svelte context.
		 * Call this in the `<script>` block of a +page.svelte or component.
		 */
		consume(): LiveQueryResult<T> {
			return getContext<LiveQueryResult<T>>(key);
		},
	};
}
