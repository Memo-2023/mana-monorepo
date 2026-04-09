<!--
  WorkoutLogger — the active-workout console.

  Shows the currently-running session, lets the user pick an exercise,
  add new sets quickly (defaults pulled from the previous set on the
  same exercise so progressive overload becomes one tap), and finish
  the workout when done.

  No active workout? The "Start Workout" call sits in the parent's
  overview card, not here — this component just hides itself.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { BodyExercise, BodySet, BodyWorkout } from '../types';
	import { bodyStore } from '../stores/body.svelte';
	import { getLastSetByExercise, relativeDays } from '../queries';
	import SetRow from './SetRow.svelte';
	import ExercisePicker from './ExercisePicker.svelte';

	interface Props {
		workout: BodyWorkout;
		sets: BodySet[];
		exercises: BodyExercise[];
	}
	const { workout, sets, exercises }: Props = $props();

	let selectedExerciseId = $state<string>('');
	let weight = $state<number>(0);
	let reps = $state<number>(8);
	let isWarmup = $state(false);
	let pickerOpen = $state(false);

	let lastSets = $derived(getLastSetByExercise(sets));
	let selectedExercise = $derived(exercises.find((e) => e.id === selectedExerciseId) ?? null);
	let lastForSelected = $derived(selectedExerciseId ? lastSets.get(selectedExerciseId) : null);

	// Pre-fill from the most recent set of the selected exercise so the
	// "next set" form starts at last week's working weight, not zero.
	$effect(() => {
		if (!selectedExerciseId) return;
		const previous = [...sets]
			.filter((s) => s.exerciseId === selectedExerciseId && !s.isWarmup)
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
		if (previous) {
			weight = previous.weight;
			reps = previous.reps;
		}
	});

	// Default to the first non-archived exercise on first render
	$effect(() => {
		if (!selectedExerciseId && exercises.length > 0) {
			selectedExerciseId = exercises[0].id;
		}
	});

	let setsForCurrent = $derived(
		sets.filter((s) => s.workoutId === workout.id).sort((a, b) => a.order - b.order)
	);

	let setsByExercise = $derived.by(() => {
		const map = new Map<string, BodySet[]>();
		for (const s of setsForCurrent) {
			const list = map.get(s.exerciseId) ?? [];
			list.push(s);
			map.set(s.exerciseId, list);
		}
		return map;
	});

	async function addSet() {
		if (!selectedExerciseId || reps <= 0) return;
		await bodyStore.logSet({
			workoutId: workout.id,
			exerciseId: selectedExerciseId,
			reps,
			weight,
			weightUnit: 'kg',
			isWarmup,
		});
	}

	async function finish() {
		await bodyStore.finishWorkout(workout.id);
	}

	function exerciseName(id: string): string {
		return exercises.find((e) => e.id === id)?.name ?? id;
	}
</script>

<div class="workout-logger">
	<header>
		<h3>{$_('body.activeWorkout', { default: 'Aktives Workout' })}</h3>
		<button type="button" class="finish" onclick={finish}>
			{$_('body.finish', { default: 'Beenden' })}
		</button>
	</header>

	{#each [...setsByExercise.entries()] as [exerciseId, exSets] (exerciseId)}
		<section class="exercise-block">
			<h4>{exerciseName(exerciseId)}</h4>
			<div class="set-list">
				{#each exSets as set, i (set.id)}
					<SetRow {set} index={i} />
				{/each}
			</div>
		</section>
	{/each}

	<form
		class="add-set"
		onsubmit={(e) => {
			e.preventDefault();
			addSet();
		}}
	>
		<button type="button" class="exercise-picker-btn" onclick={() => (pickerOpen = true)}>
			<div class="picker-name">
				{selectedExercise?.name ?? $_('body.exercisePicker.pick', { default: 'Übung wählen' })}
			</div>
			{#if lastForSelected}
				<div class="picker-last">
					Last: {lastForSelected.weight}kg × {lastForSelected.reps}
					· {relativeDays(lastForSelected.createdAt)}
				</div>
			{/if}
		</button>

		<label class="field">
			<span class="label">kg</span>
			<input type="number" step="0.5" bind:value={weight} />
		</label>

		<label class="field">
			<span class="label">reps</span>
			<input type="number" step="1" min="0" bind:value={reps} />
		</label>

		<label class="warmup-check">
			<input type="checkbox" bind:checked={isWarmup} />
			W
		</label>

		<button type="submit">+ Set</button>
	</form>
</div>

{#if pickerOpen}
	<ExercisePicker
		{exercises}
		{sets}
		onPick={(id) => (selectedExerciseId = id)}
		onClose={() => (pickerOpen = false)}
	/>
{/if}

<style>
	.workout-logger {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	h4 {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin-bottom: 0.375rem;
	}
	.exercise-block {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.set-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.add-set {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted) / 0.4);
	}
	.exercise-picker-btn {
		flex: 1 1 100%;
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		text-align: left;
		cursor: pointer;
	}
	.exercise-picker-btn:hover {
		border-color: hsl(var(--color-primary));
	}
	.picker-name {
		font-weight: 500;
	}
	.picker-last {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.125rem;
		font-variant-numeric: tabular-nums;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.field .label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}
	.field input {
		width: 4.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
	}
	.warmup-check {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	button {
		padding: 0.5rem 0.875rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
	}
	button.finish {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}
</style>
