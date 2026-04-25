/**
 * Scope-aware reactive live query.
 *
 * Drop-in replacement for `useLiveQueryWithDefault` from
 * `@mana/local-store/svelte` for any querier that filters by the
 * active space + current user (i.e. uses `scopedForModule` /
 * `scopedTable` / `scopedAnd` / `scopedGet`).
 *
 * Why this exists:
 *   Dexie's `liveQuery` only re-runs when a Dexie table it read during
 *   evaluation is written to. The scope state — `active` in
 *   `active-space.svelte.ts` and `currentUserId` in
 *   `current-user.svelte.ts` — lives in Svelte 5 `$state` runes,
 *   which Dexie cannot observe. Without a bridge, a module mounted
 *   before the active-space bootstrap finished would render an empty
 *   first result and stay empty until some unrelated Dexie write
 *   accidentally re-triggered the querier.
 *
 *   The clean fix: wrap the Dexie liveQuery subscription in an
 *   `$effect` that reads `getActiveSpaceId()` + `getEffectiveUserId()`
 *   at the top. Svelte 5 auto-tracks those reads as effect
 *   dependencies, and re-runs the effect — tearing down the previous
 *   subscription and creating a fresh one — whenever scope changes.
 *   Every call to the querier inside the new subscription evaluates
 *   `getInScopeSpaceIds()` fresh, so the visible result matches the
 *   active scope. No infra-tables, no hidden side-effects.
 *
 * Same return shape as `useLiveQueryWithDefault` for drop-in
 * migration.
 */

import { liveQuery } from 'dexie';
import { getActiveSpaceId } from './active-space.svelte';
import { getEffectiveUserId } from '../current-user';

export function useScopedLiveQuery<T>(
	querier: () => T | Promise<T>,
	defaultValue: T
): { readonly value: T; readonly loading: boolean; readonly error: unknown } {
	let value = $state<T>(defaultValue);
	let loading = $state(true);
	let error = $state<unknown>(undefined);

	$effect(() => {
		// Tracking reads — these are the dependencies that trigger
		// re-subscription. Reading the values (even discarding them)
		// is enough; Svelte 5's $effect auto-registers the dep.
		void getActiveSpaceId();
		void getEffectiveUserId();

		// Reset the loading flag on every re-subscribe so consumers
		// can show a transient skeleton while the new querier runs.
		loading = true;

		const subscription = liveQuery(querier).subscribe({
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

		// Tear-down: Svelte runs this when the effect re-fires (scope
		// changed) or the component unmounts. Replaces the old onDestroy
		// pattern from `useLiveQueryWithDefault`.
		return () => subscription.unsubscribe();
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
