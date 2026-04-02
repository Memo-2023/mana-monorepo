<script lang="ts">
	import type { DurationUnit, EffectiveDuration } from '@todo/shared';
	import { t } from 'svelte-i18n';
	import { X } from '@manacore/shared-icons';

	interface Props {
		value: EffectiveDuration | null;
		onChange: (value: EffectiveDuration | null) => void;
	}

	let { value, onChange }: Props = $props();

	let showCustom = $state(false);
	let customValue = $state<number | null>(null);
	let customUnit = $state<DurationUnit>('hours');

	// Quick duration options
	const quickOptions: { label: string; value: number; unit: DurationUnit }[] = [
		{ label: '15m', value: 15, unit: 'minutes' },
		{ label: '30m', value: 30, unit: 'minutes' },
		{ label: '1h', value: 1, unit: 'hours' },
		{ label: '2h', value: 2, unit: 'hours' },
		{ label: '4h', value: 4, unit: 'hours' },
		{ label: '1d', value: 1, unit: 'days' },
		{ label: '2d', value: 2, unit: 'days' },
	];

	let unitOptions = $derived([
		{ value: 'minutes' as DurationUnit, label: $t('durationPicker.minutes') },
		{ value: 'hours' as DurationUnit, label: $t('durationPicker.hours') },
		{ value: 'days' as DurationUnit, label: $t('durationPicker.days') },
	]);

	// Sync custom inputs with value prop
	$effect(() => {
		if (value) {
			const isQuickOption = quickOptions.some(
				(opt) => opt.value === value.value && opt.unit === value.unit
			);
			if (!isQuickOption) {
				showCustom = true;
				customValue = value.value;
				customUnit = value.unit;
			} else {
				showCustom = false;
			}
		} else {
			showCustom = false;
			customValue = null;
			customUnit = 'hours';
		}
	});

	function selectQuick(opt: { value: number; unit: DurationUnit }) {
		showCustom = false;
		onChange({ value: opt.value, unit: opt.unit });
	}

	function isQuickSelected(opt: { value: number; unit: DurationUnit }): boolean {
		return value !== null && value.value === opt.value && value.unit === opt.unit && !showCustom;
	}

	function toggleCustom() {
		showCustom = !showCustom;
		if (showCustom && customValue && customValue > 0) {
			onChange({ value: customValue, unit: customUnit });
		}
	}

	function handleCustomChange() {
		if (customValue && customValue > 0) {
			onChange({ value: customValue, unit: customUnit });
		}
	}

	function clear() {
		showCustom = false;
		customValue = null;
		customUnit = 'hours';
		onChange(null);
	}
</script>

<div class="duration-picker">
	<div class="duration-buttons">
		{#each quickOptions as opt}
			<button
				type="button"
				class="duration-btn"
				class:selected={isQuickSelected(opt)}
				onclick={() => selectQuick(opt)}
			>
				{opt.label}
			</button>
		{/each}
		<button type="button" class="duration-btn" class:selected={showCustom} onclick={toggleCustom}>
			...
		</button>
		{#if value !== null}
			<button type="button" class="duration-clear" onclick={clear} title={$t('common.reset')}>
				<X size={16} />
			</button>
		{/if}
	</div>

	{#if showCustom}
		<div class="duration-custom">
			<input
				type="number"
				class="duration-input"
				bind:value={customValue}
				oninput={handleCustomChange}
				placeholder={$t('durationPicker.value')}
				min="1"
			/>
			<select class="duration-unit" bind:value={customUnit} onchange={handleCustomChange}>
				{#each unitOptions as unit}
					<option value={unit.value}>{unit.label}</option>
				{/each}
			</select>
		</div>
	{/if}
</div>

<style>
	.duration-picker {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.duration-buttons {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.duration-btn {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 9999px;
		background: var(--color-surface);
		font-size: 0.8125rem;
		color: var(--color-foreground);
		cursor: pointer;
		transition: all 0.15s;
	}

	.duration-btn:hover {
		border-color: var(--color-primary);
	}

	.duration-btn.selected {
		background: color-mix(in srgb, var(--color-primary) 15%, transparent);
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.duration-clear {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--color-error) 10%, transparent);
		color: var(--color-error);
		cursor: pointer;
		transition: all 0.15s;
	}

	.duration-clear:hover {
		background: color-mix(in srgb, var(--color-error) 20%, transparent);
	}

	.duration-custom {
		display: flex;
		gap: 0.5rem;
	}

	.duration-input {
		width: 80px;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		background: var(--color-surface);
		font-size: 0.875rem;
		color: var(--color-foreground);
	}

	.duration-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
	}

	.duration-unit {
		width: 120px;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		background: var(--color-surface);
		font-size: 0.875rem;
		color: var(--color-foreground);
	}

	.duration-unit:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
	}
</style>
