<!--
  RoutineManager — list of saved routines (templates) with one-tap
  start. Each routine card shows the exercise list and a "Start"
  button that launches a new workout with the routine pre-attached.

  Edit/delete are deferred to a future revision — the create-flow
  here is a simple inline form (name + comma-separated exercise
  picker via a multi-select) so users can save the routine they
  just built without leaving the page.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { BodyExercise, BodyRoutine, MuscleGroup } from '../types';
	import { MUSCLE_GROUPS } from '../types';
	import { bodyStore } from '../stores/body.svelte';

	interface Props {
		routines: BodyRoutine[];
		exercises: BodyExercise[];
		onStarted?: () => void;
	}
	const { routines, exercises, onStarted }: Props = $props();

	let creating = $state(false);
	let newName = $state('');
	let newSelected = $state<Set<string>>(new Set());

	let addingExercise = $state(false);
	let newExerciseName = $state('');
	let newExerciseMuscle = $state<MuscleGroup>('chest');

	function exerciseName(id: string): string {
		return exercises.find((e) => e.id === id)?.name ?? id;
	}

	function toggle(id: string) {
		const next = new Set(newSelected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		newSelected = next;
	}

	async function startFromRoutine(routine: BodyRoutine) {
		await bodyStore.startWorkout({ routineId: routine.id, title: routine.name });
		onStarted?.();
	}

	async function saveRoutine(e: Event) {
		e.preventDefault();
		const name = newName.trim();
		if (!name) return;
		await bodyStore.createRoutine({
			name,
			description: null,
			exerciseIds: [...newSelected],
		});
		newName = '';
		newSelected = new Set();
		creating = false;
	}

	async function addExerciseInline(e: Event) {
		e.preventDefault();
		const name = newExerciseName.trim();
		if (!name) return;
		const created = await bodyStore.createExercise({
			name,
			muscleGroup: newExerciseMuscle,
			equipment: 'barbell',
		});
		const next = new Set(newSelected);
		next.add(created.id);
		newSelected = next;
		newExerciseName = '';
		addingExercise = false;
	}

	async function archive(id: string) {
		await bodyStore.updateRoutine(id, { isArchived: true });
	}

	let activeRoutines = $derived(routines.filter((r) => !r.isArchived));
</script>

<div class="routines">
	<div class="header">
		<h3>{$_('body.routines.title', { default: 'Routinen' })}</h3>
		<button type="button" class="link" onclick={() => (creating = !creating)}>
			{creating ? 'Schließen' : '+ Neu'}
		</button>
	</div>

	{#if creating}
		<form class="create" onsubmit={saveRoutine}>
			<input type="text" placeholder="Routine-Name" bind:value={newName} required />
			{#if exercises.filter((e) => !e.isArchived).length === 0}
				<p class="empty">
					Noch keine Übungen angelegt. Du kannst die Routine ohne Übungen speichern oder direkt eine
					anlegen.
				</p>
			{:else}
				<div class="picker-grid">
					{#each exercises.filter((e) => !e.isArchived) as ex (ex.id)}
						<label class="ex-chip" class:active={newSelected.has(ex.id)}>
							<input
								type="checkbox"
								checked={newSelected.has(ex.id)}
								onchange={() => toggle(ex.id)}
							/>
							{ex.name}
						</label>
					{/each}
				</div>
			{/if}

			{#if addingExercise}
				<div class="add-exercise">
					<input
						type="text"
						placeholder="Übungs-Name"
						bind:value={newExerciseName}
						onkeydown={(e) => e.key === 'Enter' && addExerciseInline(e)}
					/>
					<select bind:value={newExerciseMuscle}>
						{#each MUSCLE_GROUPS as g (g)}
							<option value={g}>{g}</option>
						{/each}
					</select>
					<button type="button" class="primary" onclick={addExerciseInline}>Anlegen</button>
					<button type="button" onclick={() => (addingExercise = false)}>Abbrechen</button>
				</div>
			{:else}
				<button type="button" class="link add-exercise-btn" onclick={() => (addingExercise = true)}>
					+ Übung anlegen
				</button>
			{/if}

			<button type="submit" class="primary" disabled={!newName.trim()}>
				Speichern{newSelected.size > 0 ? ` (${newSelected.size})` : ''}
			</button>
		</form>
	{/if}

	{#if activeRoutines.length === 0}
		<p class="empty">{$_('body.routines.empty', { default: 'Noch keine Routinen' })}</p>
	{:else}
		<ul>
			{#each activeRoutines as r (r.id)}
				<li class="routine">
					<div class="routine-main">
						<div class="routine-name">{r.name}</div>
						<div class="routine-exercises">
							{r.exerciseIds.map(exerciseName).join(' · ')}
						</div>
					</div>
					<div class="actions">
						<button type="button" class="primary" onclick={() => startFromRoutine(r)}>
							{$_('body.routines.start', { default: 'Start' })}
						</button>
						<button
							type="button"
							class="archive"
							onclick={() => archive(r.id)}
							aria-label="Archivieren">×</button
						>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.routines {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.link {
		font-size: 0.75rem;
		background: none;
		border: none;
		color: hsl(var(--color-primary));
		cursor: pointer;
	}
	.create {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.625rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted) / 0.4);
	}
	.create input[type='text'] {
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
	}
	.add-exercise {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
	}
	.add-exercise input {
		flex: 1 1 8rem;
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
	}
	.add-exercise select {
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
	}
	.add-exercise-btn {
		align-self: flex-start;
		padding: 0;
	}
	.picker-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.ex-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.3125rem 0.625rem;
		border-radius: 999px;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		cursor: pointer;
	}
	.ex-chip.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}
	.ex-chip input {
		display: none;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.routine {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.625rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
	}
	.routine-main {
		min-width: 0;
		flex: 1;
	}
	.routine-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}
	.routine-exercises {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.125rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}
	button {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
		cursor: pointer;
	}
	button.primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}
	button.primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.archive {
		width: 1.75rem;
		padding: 0.375rem;
		color: hsl(var(--color-muted-foreground));
	}
	.empty {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
