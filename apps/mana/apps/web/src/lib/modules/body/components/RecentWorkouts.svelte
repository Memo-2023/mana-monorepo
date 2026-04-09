<!--
  RecentWorkouts — list of recent finished sessions with set count,
  total volume and duration. Pure read-only summary view.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { BodySet, BodyWorkout } from '../types';
	import { getWorkoutVolume } from '../queries';

	interface Props {
		workouts: BodyWorkout[];
		sets: BodySet[];
		limit?: number;
	}
	const { workouts, sets, limit = 5 }: Props = $props();

	let recent = $derived(workouts.filter((w) => w.endedAt !== null).slice(0, limit));

	function setsForWorkout(id: string): BodySet[] {
		return sets.filter((s) => s.workoutId === id);
	}

	function durationMin(w: BodyWorkout): number | null {
		if (!w.endedAt) return null;
		return Math.round((new Date(w.endedAt).getTime() - new Date(w.startedAt).getTime()) / 60000);
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString();
	}
</script>

{#if recent.length === 0}
	<p class="empty">{$_('body.noWorkouts', { default: 'Noch keine Sessions' })}</p>
{:else}
	<ul class="list">
		{#each recent as w (w.id)}
			{@const ws = setsForWorkout(w.id)}
			{@const vol = getWorkoutVolume(ws)}
			{@const dur = durationMin(w)}
			<li>
				<div class="title">{w.title ?? 'Workout'}</div>
				<div class="meta">
					<span>{fmtDate(w.startedAt)}</span>
					<span>· {ws.length} sets</span>
					{#if vol > 0}
						<span>· {vol} kg vol</span>
					{/if}
					{#if dur !== null}
						<span>· {dur}min</span>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.title {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}
	.meta {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
		font-variant-numeric: tabular-nums;
	}
	.empty {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
