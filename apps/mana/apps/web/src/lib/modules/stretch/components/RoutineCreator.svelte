<!--
  RoutineCreator — Build a custom stretch routine from the exercise library.
-->
<script lang="ts">
	import type { StretchExercise, RoutineExercise, BodyRegion } from '../types';
	import { BODY_REGION_LABELS } from '../types';
	import { stretchStore } from '../stores/stretch.svelte';

	interface Props {
		exercises: StretchExercise[];
		onComplete: () => void;
		onCancel: () => void;
	}

	let { exercises, onComplete, onCancel }: Props = $props();

	let name = $state('');
	let description = $state('');
	let selectedExercises = $state<RoutineExercise[]>([]);
	let filterRegion = $state<BodyRegion | 'all'>('all');

	let activeExercises = $derived(exercises.filter((e) => !e.isArchived));
	let filteredExercises = $derived(
		filterRegion === 'all'
			? activeExercises
			: activeExercises.filter((e) => e.bodyRegion === filterRegion)
	);

	let totalDurationSec = $derived(
		selectedExercises.reduce((sum, e) => sum + e.durationSec + e.restAfterSec, 0)
	);
	let estimatedMin = $derived(Math.ceil(totalDurationSec / 60));

	// Unique regions from selected exercises
	let targetRegions = $derived(() => {
		const regions = new Set<BodyRegion>();
		for (const slot of selectedExercises) {
			const ex = exercises.find((e) => e.id === slot.exerciseId);
			if (ex) regions.add(ex.bodyRegion);
		}
		return [...regions];
	});

	function addExercise(ex: StretchExercise) {
		if (selectedExercises.some((s) => s.exerciseId === ex.id)) return;
		selectedExercises = [
			...selectedExercises,
			{
				exerciseId: ex.id,
				durationSec: ex.defaultDurationSec,
				restAfterSec: 5,
				notes: '',
			},
		];
	}

	function removeExercise(exerciseId: string) {
		selectedExercises = selectedExercises.filter((s) => s.exerciseId !== exerciseId);
	}

	function moveUp(index: number) {
		if (index <= 0) return;
		const arr = [...selectedExercises];
		[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
		selectedExercises = arr;
	}

	function moveDown(index: number) {
		if (index >= selectedExercises.length - 1) return;
		const arr = [...selectedExercises];
		[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
		selectedExercises = arr;
	}

	async function handleSave() {
		if (!name.trim() || selectedExercises.length === 0) return;
		await stretchStore.createRoutine({
			name: name.trim(),
			description: description.trim(),
			exercises: selectedExercises,
			targetBodyRegions: targetRegions(),
		});
		onComplete();
	}
</script>

<div class="creator-overlay">
	<div class="creator-header">
		<button class="back-btn" onclick={onCancel}>×</button>
		<span class="header-title">Neue Routine</span>
		<button
			class="save-btn"
			onclick={handleSave}
			disabled={!name.trim() || selectedExercises.length === 0}
		>
			Speichern
		</button>
	</div>

	<div class="creator-body">
		<!-- Name & Description -->
		<div class="form-section">
			<!-- svelte-ignore a11y_autofocus -->
			<input
				class="name-input"
				type="text"
				placeholder="Name der Routine..."
				bind:value={name}
				autofocus
			/>
			<input
				class="desc-input"
				type="text"
				placeholder="Beschreibung (optional)..."
				bind:value={description}
			/>
		</div>

		<!-- Selected Exercises -->
		{#if selectedExercises.length > 0}
			<div class="selected-section">
				<span class="section-label">
					{selectedExercises.length} Übungen &middot; ~{estimatedMin} Min
				</span>
				{#each selectedExercises as slot, i (slot.exerciseId)}
					{@const ex = exercises.find((e) => e.id === slot.exerciseId)}
					<div class="selected-item">
						<span class="sel-num">{i + 1}</span>
						<span class="sel-name">{ex?.name ?? '?'}</span>
						<span class="sel-dur">{slot.durationSec}s</span>
						<button class="sel-btn" onclick={() => moveUp(i)} disabled={i === 0}>↑</button>
						<button
							class="sel-btn"
							onclick={() => moveDown(i)}
							disabled={i === selectedExercises.length - 1}>↓</button
						>
						<button class="sel-btn remove" onclick={() => removeExercise(slot.exerciseId)}>×</button
						>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Exercise Picker -->
		<div class="picker-section">
			<span class="section-label">Übung hinzufügen</span>
			<!-- Region Filter -->
			<div class="filter-row">
				<button
					class="filter-chip"
					class:active={filterRegion === 'all'}
					onclick={() => (filterRegion = 'all')}>Alle</button
				>
				{#each ['neck', 'shoulders', 'upper_back', 'lower_back', 'hips', 'hamstrings', 'quads', 'full_body'] as region}
					<button
						class="filter-chip"
						class:active={filterRegion === region}
						onclick={() => (filterRegion = region as BodyRegion)}
						>{BODY_REGION_LABELS[region as BodyRegion]?.de ?? region}</button
					>
				{/each}
			</div>

			<div class="picker-list">
				{#each filteredExercises as ex (ex.id)}
					{@const alreadyAdded = selectedExercises.some((s) => s.exerciseId === ex.id)}
					<button
						class="picker-item"
						class:added={alreadyAdded}
						onclick={() => addExercise(ex)}
						disabled={alreadyAdded}
					>
						<span class="pick-name">{ex.name}</span>
						<span class="pick-region">{BODY_REGION_LABELS[ex.bodyRegion]?.de ?? ex.bodyRegion}</span
						>
						<span class="pick-dur">{ex.defaultDurationSec}s</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.creator-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: hsl(var(--color-background));
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.creator-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.back-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		border: none;
		font-size: 1.125rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.header-title {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.save-btn {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		background: #10b981;
		color: white;
		border: none;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}

	.save-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.creator-body {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.name-input,
	.desc-input {
		width: 100%;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
	}

	.name-input:focus,
	.desc-input:focus {
		outline: none;
		border-color: #10b981;
	}

	.name-input::placeholder,
	.desc-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.desc-input {
		font-size: 0.8125rem;
	}

	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Selected ─────────────────────────────────── */
	.selected-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.selected-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-muted));
		font-size: 0.8125rem;
	}

	.sel-num {
		width: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
		text-align: center;
		flex-shrink: 0;
	}

	.sel-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: hsl(var(--color-foreground));
	}

	.sel-dur {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	.sel-btn {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.25rem;
		background: transparent;
		border: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sel-btn:hover:not(:disabled) {
		background: hsl(var(--color-border));
	}

	.sel-btn:disabled {
		opacity: 0.3;
	}

	.sel-btn.remove {
		color: #ef4444;
	}

	/* ── Picker ───────────────────────────────────── */
	.picker-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.filter-row {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.filter-chip {
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		font-size: 0.625rem;
		font-weight: 500;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.filter-chip.active {
		background: #10b981;
		color: white;
		border-color: #10b981;
	}

	.picker-list {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.picker-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		transition: background 0.15s;
	}

	.picker-item:hover:not(:disabled) {
		background: hsl(var(--color-muted));
	}

	.picker-item.added {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.pick-name {
		flex: 1;
	}

	.pick-region {
		font-size: 0.625rem;
		color: #10b981;
	}

	.pick-dur {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}
</style>
