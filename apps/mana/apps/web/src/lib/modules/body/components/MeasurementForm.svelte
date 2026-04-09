<!--
  MeasurementForm — quick-log a body measurement.

  Defaults to weight in kg, which is what 95% of users actually log.
  Type picker for the rarer fields (body fat, circumferences). The
  unit defaults follow the type: weight/muscle → kg, bodyfat → %,
  everything else → cm.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { bodyStore } from '../stores/body.svelte';
	import { MEASUREMENT_TYPES } from '../types';
	import type { MeasurementType } from '../types';

	let type = $state<MeasurementType>('weight');
	let value = $state<number | null>(null);
	let saving = $state(false);

	function unitFor(t: MeasurementType): 'kg' | 'cm' | 'percent' {
		if (t === 'weight' || t === 'muscle') return 'kg';
		if (t === 'bodyfat') return 'percent';
		return 'cm';
	}

	let unit = $derived(unitFor(type));

	async function submit() {
		if (value === null || !Number.isFinite(value) || value <= 0) return;
		saving = true;
		try {
			await bodyStore.logMeasurement({ type, value, unit });
			value = null;
		} finally {
			saving = false;
		}
	}
</script>

<form
	class="measurement-form"
	onsubmit={(e) => {
		e.preventDefault();
		submit();
	}}
>
	<select bind:value={type}>
		{#each MEASUREMENT_TYPES as t (t)}
			<option value={t}>{$_(`body.measurement.${t}`, { default: t })}</option>
		{/each}
	</select>

	<div class="value-row">
		<input type="number" step="0.1" placeholder="0" bind:value />
		<span class="unit">{unit === 'percent' ? '%' : unit}</span>
	</div>

	<button type="submit" disabled={saving || value === null}>
		{$_('body.log', { default: 'Loggen' })}
	</button>
</form>

<style>
	.measurement-form {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		align-items: center;
	}
	select {
		flex: 1 1 7rem;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
	}
	.value-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	input {
		width: 5rem;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-variant-numeric: tabular-nums;
	}
	.unit {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		min-width: 1.5rem;
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
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
