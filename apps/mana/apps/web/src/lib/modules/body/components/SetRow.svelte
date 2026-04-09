<!--
  SetRow — single editable set inside an active workout.
  Inline weight + reps inputs, RPE picker, warmup toggle, delete button.
-->
<script lang="ts">
	import type { BodySet } from '../types';
	import { bodyStore } from '../stores/body.svelte';

	interface Props {
		set: BodySet;
		index: number;
	}
	const { set, index }: Props = $props();

	// Local editable state mirrors the prop. Re-syncs whenever the parent
	// passes in a new set object — typically because the previous commit
	// re-emitted the row through liveQuery.
	let weight = $state(0);
	let reps = $state(0);
	$effect(() => {
		weight = set.weight;
		reps = set.reps;
	});

	let weightDirty = $derived(weight !== set.weight);
	let repsDirty = $derived(reps !== set.reps);

	async function commit() {
		if (!weightDirty && !repsDirty) return;
		await bodyStore.updateSet(set.id, { weight, reps });
	}

	async function toggleWarmup() {
		await bodyStore.updateSet(set.id, { isWarmup: !set.isWarmup });
	}

	async function remove() {
		await bodyStore.deleteSet(set.id);
	}
</script>

<div class="set-row" class:warmup={set.isWarmup}>
	<button
		type="button"
		class="warmup-toggle"
		onclick={toggleWarmup}
		title={set.isWarmup ? 'Aufwärmsatz' : 'Arbeitssatz'}
	>
		{set.isWarmup ? 'W' : index + 1}
	</button>

	<label class="field">
		<span class="label">kg</span>
		<input
			type="number"
			step="0.5"
			bind:value={weight}
			onblur={commit}
			onkeydown={(e) => e.key === 'Enter' && commit()}
		/>
	</label>

	<label class="field">
		<span class="label">reps</span>
		<input
			type="number"
			step="1"
			min="0"
			bind:value={reps}
			onblur={commit}
			onkeydown={(e) => e.key === 'Enter' && commit()}
		/>
	</label>

	{#if set.rpe !== null}
		<span class="rpe">RPE {set.rpe}</span>
	{/if}

	<button type="button" class="remove" onclick={remove} aria-label="Set löschen">×</button>
</div>

<style>
	.set-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
	}
	.set-row.warmup {
		opacity: 0.65;
	}
	.warmup-toggle {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		flex-shrink: 0;
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
		width: 4rem;
		padding: 0.25rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
	}
	.rpe {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.remove {
		margin-left: auto;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 1rem;
		cursor: pointer;
		border-radius: 0.25rem;
	}
	.remove:hover {
		color: hsl(var(--color-destructive, 0 84% 60%));
		background: hsl(var(--color-muted));
	}
</style>
