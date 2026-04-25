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
 *   `active-space.svelte.ts` and `currentUserId` in `current-user.ts` —
 *   lives outside Dexie, so a scope change is invisible to the
 *   subscription. Without a bridge, a module mounted before the
 *   active-space bootstrap finished would render an empty first
 *   result and stay empty until some unrelated Dexie write
 *   accidentally re-triggered the querier.
 *
 *   The clean fix: wrap the Dexie `liveQuery` subscription in a
 *   Svelte 5 `$effect` whose dependency is a `scopeTick` `$state`
 *   counter. `setActiveSpace` (via `onActiveSpaceChanged`) and
 *   `setCurrentUserId` (via `onCurrentUserChanged`) bump the counter,
 *   which re-runs the effect — tearing down the previous Dexie
 *   subscription and creating a fresh one. Each new subscription
 *   evaluates the querier with the up-to-date `getInScopeSpaceIds()`,
 *   so the visible result matches the active scope. No infra-tables,
 *   no hidden side-effects in `scopedTable`.
 *
 * Same return shape as `useLiveQueryWithDefault` for drop-in
 * migration.
 */

import { liveQuery } from 'dexie';
import { onActiveSpaceChanged } from './active-space.svelte';
import { onCurrentUserChanged } from '../current-user';

// Module-level scope-tick counter. A single counter is enough because
// every consumer just needs *some* reactive value to track — the
// liveQuery's querier itself reads the actual scope ids.
let scopeTick = $state(0);

// Wire both event buses to bump the tick once per real change. The
// handlers replay the current value on subscribe (so the tick fires
// once at module-init), then again on every flip. Subscriptions are
// permanent — there's only one of each per app session.
onActiveSpaceChanged(() => {
	scopeTick++;
});
onCurrentUserChanged(() => {
	scopeTick++;
});

export function useScopedLiveQuery<T>(
	querier: () => T | Promise<T>,
	defaultValue: T
): { readonly value: T; readonly loading: boolean; readonly error: unknown } {
	let value = $state<T>(defaultValue);
	let loading = $state(true);
	let error = $state<unknown>(undefined);

	$effect(() => {
		// Tracking read — Svelte 5 auto-registers this as a dependency.
		// Whenever the tick changes (active space or user changed), the
		// effect re-fires: the previous teardown unsubscribes the old
		// Dexie observable, and a fresh one is created below with the
		// up-to-date scope.
		void scopeTick;

		// Reset the loading flag on every re-subscribe so consumers can
		// show a transient skeleton while the new querier runs.
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
		// changed) or the component unmounts. Replaces the onDestroy
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
