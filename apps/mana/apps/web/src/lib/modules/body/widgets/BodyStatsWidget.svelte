<script lang="ts">
	/**
	 * BodyStatsWidget — at-a-glance dashboard tile for the Body module.
	 *
	 * Surfaces the three things a user actually wants on the dashboard:
	 *   1. Latest weight + delta vs the previous reading
	 *   2. Active workout state (running session vs. idle)
	 *   3. Sets logged today + total volume
	 *
	 * Reads bodyMeasurements / bodyWorkouts / bodySets directly via liveQuery
	 * and decrypts in place — same pattern as NewsUnreadWidget.
	 */

	import { liveQuery } from 'dexie';
	import { _ } from 'svelte-i18n';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import {
		toBodyMeasurement,
		toBodyWorkout,
		toBodySet,
		getLatestWeight,
		getActiveWorkout,
		getWorkoutVolume,
	} from '$lib/modules/body/queries';
	import type {
		LocalBodyMeasurement,
		LocalBodyWorkout,
		LocalBodySet,
		BodyMeasurement,
		BodyWorkout,
		BodySet,
	} from '$lib/modules/body/types';

	let measurements = $state<BodyMeasurement[]>([]);
	let workouts = $state<BodyWorkout[]>([]);
	let sets = $state<BodySet[]>([]);
	let loading = $state(true);

	$effect(() => {
		const sub = liveQuery(async () => {
			const [mLocals, wLocals, sLocals] = await Promise.all([
				db.table<LocalBodyMeasurement>('bodyMeasurements').toArray(),
				db.table<LocalBodyWorkout>('bodyWorkouts').toArray(),
				db.table<LocalBodySet>('bodySets').toArray(),
			]);

			const mVisible = mLocals.filter((m) => !m.deletedAt);
			const wVisible = wLocals.filter((w) => !w.deletedAt);
			const sVisible = sLocals.filter((s) => !s.deletedAt);

			const [mDec, wDec, sDec] = await Promise.all([
				decryptRecords('bodyMeasurements', mVisible),
				decryptRecords('bodyWorkouts', wVisible),
				decryptRecords('bodySets', sVisible),
			]);

			return {
				measurements: mDec.map(toBodyMeasurement),
				workouts: wDec.map(toBodyWorkout),
				sets: sDec.map(toBodySet),
			};
		}).subscribe({
			next: (v) => {
				measurements = v.measurements;
				workouts = v.workouts;
				sets = v.sets;
				loading = false;
			},
			error: () => {
				loading = false;
			},
		});
		return () => sub.unsubscribe();
	});

	let weights = $derived(
		measurements.filter((m) => m.type === 'weight').sort((a, b) => b.date.localeCompare(a.date))
	);
	let latest = $derived(getLatestWeight(weights));
	let previous = $derived(weights.length > 1 ? weights[1] : null);
	let delta = $derived(latest && previous ? latest.value - previous.value : 0);

	let activeWorkout = $derived(getActiveWorkout(workouts));

	let today = new Date().toISOString().split('T')[0];
	let todaySets = $derived(sets.filter((s) => s.createdAt.startsWith(today) && !s.isWarmup));
	let todayVolume = $derived(getWorkoutVolume(todaySets));
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span aria-hidden="true">💪</span>
			{$_('body.title', { default: 'Body' })}
		</h3>
		<a href="/body" class="text-xs text-muted-foreground hover:text-foreground">Öffnen →</a>
	</div>

	{#if loading}
		<div class="space-y-2">
			<div class="h-12 animate-pulse rounded bg-surface-hover"></div>
			<div class="h-8 animate-pulse rounded bg-surface-hover"></div>
		</div>
	{:else}
		<div class="space-y-3">
			<!-- Weight row -->
			<div class="flex items-baseline justify-between">
				<div class="text-xs uppercase tracking-wide text-muted-foreground">
					{$_('body.weight', { default: 'Gewicht' })}
				</div>
				{#if latest}
					<div class="flex items-baseline gap-2 tabular-nums">
						<span class="text-2xl font-semibold">{latest.value}</span>
						<span class="text-xs text-muted-foreground">{latest.unit}</span>
						{#if previous}
							<span
								class="text-xs font-medium"
								class:text-green-600={delta < 0}
								class:text-red-600={delta > 0}
								class:text-muted-foreground={delta === 0}
							>
								{delta > 0 ? '+' : ''}{delta.toFixed(1)}
							</span>
						{/if}
					</div>
				{:else}
					<span class="text-xs text-muted-foreground">—</span>
				{/if}
			</div>

			<!-- Active workout / today summary -->
			{#if activeWorkout}
				<a
					href="/body"
					class="block rounded-lg bg-primary/10 p-3 transition-colors hover:bg-primary/15"
				>
					<div class="text-xs font-medium uppercase tracking-wide text-primary">
						{$_('body.activeWorkout', { default: 'Aktives Workout' })}
					</div>
					<div class="mt-1 text-sm">
						{todaySets.length} sets · {todayVolume} kg vol
					</div>
				</a>
			{:else if todaySets.length > 0}
				<div class="rounded-lg bg-surface-hover p-3">
					<div class="text-xs uppercase tracking-wide text-muted-foreground">Heute</div>
					<div class="mt-1 text-sm">{todaySets.length} sets · {todayVolume} kg vol</div>
				</div>
			{:else}
				<a
					href="/body"
					class="block rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground transition-colors hover:bg-surface-hover"
				>
					{$_('body.startWorkout', { default: 'Workout starten' })}
				</a>
			{/if}
		</div>
	{/if}
</div>
