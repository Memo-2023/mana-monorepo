<!--
  HabitBoard — the main tally grid view.
  Shows all active habits as tappable tiles + inline create.
-->
<script lang="ts">
	import type { Habit, HabitLog } from '../types';
	import { getActiveHabits, getTodayCounts } from '../queries';
	import HabitTile from './HabitTile.svelte';
	import HabitForm from './HabitForm.svelte';

	let {
		habits,
		logs,
		onDetail,
	}: {
		habits: Habit[];
		logs: HabitLog[];
		onDetail: (habit: Habit) => void;
	} = $props();

	let showCreate = $state(false);

	let activeHabits = $derived(getActiveHabits(habits));
	let todayCounts = $derived(getTodayCounts(habits, logs));
</script>

<div class="habit-board">
	<div class="habit-grid">
		{#each activeHabits as habit (habit.id)}
			<HabitTile {habit} todayCount={todayCounts.get(habit.id) ?? 0} {onDetail} />
		{/each}

		<!-- Add button -->
		{#if !showCreate}
			<button class="add-tile" onclick={() => (showCreate = true)}>
				<span class="add-icon">+</span>
				<span class="add-label">Neu</span>
			</button>
		{/if}
	</div>

	{#if showCreate}
		<div class="create-form-wrapper">
			<HabitForm onDone={() => (showCreate = false)} onCancel={() => (showCreate = false)} />
		</div>
	{/if}
</div>

<style>
	.habit-board {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.habit-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 0.75rem;
	}

	@media (min-width: 640px) {
		.habit-grid {
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		}
	}

	.add-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		aspect-ratio: 1;
		border-radius: 1rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 2px dashed var(--color-border, rgba(255, 255, 255, 0.15));
		color: var(--color-muted-foreground);
		cursor: pointer;
		transition: all 0.15s;
	}

	.add-tile:hover {
		border-color: var(--color-primary, #6366f1);
		color: var(--color-primary, #6366f1);
		background: rgba(99, 102, 241, 0.06);
	}

	.add-icon {
		font-size: 1.5rem;
		font-weight: 300;
		line-height: 1;
	}

	.add-label {
		font-size: 0.75rem;
		font-weight: 500;
	}

	.create-form-wrapper {
		max-width: 400px;
	}
</style>
