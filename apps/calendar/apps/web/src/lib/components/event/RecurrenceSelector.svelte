<script lang="ts">
	import {
		RECURRENCE_PRESETS,
		type RecurrencePattern,
		type Weekday,
		WEEKDAY_SHORT_LABELS,
	} from '@calendar/shared';
	import { parseRRule, formatRRule, describeRecurrence } from '@calendar/shared';
	import { ArrowsClockwise } from '@manacore/shared-icons';

	interface Props {
		recurrenceRule: string | null;
		recurrenceEndDate: string | null;
		onRecurrenceChange: (rule: string | null, endDate: string | null) => void;
	}

	let { recurrenceRule, recurrenceEndDate, onRecurrenceChange }: Props = $props();

	let showCustom = $state(false);
	let selectedPreset = $state<string | null>(recurrenceRule);

	// Custom recurrence state
	let pattern = $state<RecurrencePattern>(
		(recurrenceRule ? parseRRule(recurrenceRule) : null) || { frequency: 'WEEKLY' }
	);
	let endDate = $state(recurrenceEndDate || '');

	// Check if current rule matches a preset
	const isCustom = $derived.by(() => {
		if (!recurrenceRule) return false;
		return !RECURRENCE_PRESETS.some((p) => p.value === recurrenceRule);
	});

	$effect(() => {
		if (isCustom && recurrenceRule) {
			showCustom = true;
			selectedPreset = '__custom__';
		} else {
			selectedPreset = recurrenceRule;
		}
	});

	function handlePresetChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;

		if (value === '') {
			// No repeat
			selectedPreset = null;
			showCustom = false;
			onRecurrenceChange(null, null);
		} else if (value === '__custom__') {
			showCustom = true;
			selectedPreset = '__custom__';
			// Apply current pattern
			const rule = formatRRule(pattern);
			onRecurrenceChange(rule, endDate || null);
		} else {
			selectedPreset = value;
			showCustom = false;
			onRecurrenceChange(value, null);
		}
	}

	function handleFrequencyChange(e: Event) {
		pattern = {
			...pattern,
			frequency: (e.target as HTMLSelectElement).value as RecurrencePattern['frequency'],
		};
		applyCustomPattern();
	}

	function handleIntervalChange(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value, 10);
		pattern = { ...pattern, interval: val > 1 ? val : undefined };
		applyCustomPattern();
	}

	function toggleWeekday(day: Weekday) {
		const current = pattern.byDay || [];
		const updated = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
		pattern = { ...pattern, byDay: updated.length > 0 ? updated : undefined };
		applyCustomPattern();
	}

	function handleEndDateChange(e: Event) {
		endDate = (e.target as HTMLInputElement).value;
		const rule = formatRRule(pattern);
		onRecurrenceChange(rule, endDate || null);
	}

	function applyCustomPattern() {
		const rule = formatRRule(pattern);
		onRecurrenceChange(rule, endDate || null);
	}

	const weekdays: Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

	const currentDescription = $derived(
		recurrenceRule ? describeRecurrence(parseRRule(recurrenceRule)) : 'Wiederholt sich nicht'
	);
</script>

<div class="recurrence-selector">
	<div class="flex items-center gap-2 mb-2">
		<ArrowsClockwise size={16} class="text-muted-foreground" />
		<span class="text-sm font-medium text-foreground">Wiederholung</span>
	</div>

	<select class="select-input" value={selectedPreset ?? ''} onchange={handlePresetChange}>
		{#each RECURRENCE_PRESETS as preset}
			<option value={preset.value ?? ''}>{preset.label}</option>
		{/each}
		<option value="__custom__">Benutzerdefiniert...</option>
	</select>

	{#if showCustom}
		<div class="custom-section">
			<div class="custom-row">
				<label class="custom-label">Alle</label>
				<input
					type="number"
					min="1"
					max="99"
					value={pattern.interval || 1}
					onchange={handleIntervalChange}
					class="interval-input"
				/>
				<select class="frequency-select" value={pattern.frequency} onchange={handleFrequencyChange}>
					<option value="DAILY">Tage</option>
					<option value="WEEKLY">Wochen</option>
					<option value="MONTHLY">Monate</option>
					<option value="YEARLY">Jahre</option>
				</select>
			</div>

			{#if pattern.frequency === 'WEEKLY'}
				<div class="weekday-row">
					<label class="custom-label">An</label>
					<div class="weekday-buttons">
						{#each weekdays as day}
							<button
								type="button"
								class="weekday-btn"
								class:active={pattern.byDay?.includes(day)}
								onclick={() => toggleWeekday(day)}
							>
								{WEEKDAY_SHORT_LABELS[day].substring(0, 2)}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<div class="custom-row">
				<label class="custom-label">Bis</label>
				<input
					type="date"
					value={endDate}
					onchange={handleEndDateChange}
					class="date-input"
					placeholder="Kein Enddatum"
				/>
			</div>
		</div>
	{/if}

	{#if recurrenceRule}
		<p class="recurrence-description">{currentDescription}</p>
	{/if}
</div>

<style>
	.recurrence-selector {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.select-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 2px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.875rem;
		cursor: pointer;
	}

	.select-input:focus {
		outline: none;
		border-color: hsl(var(--primary));
	}

	.custom-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
		background: hsl(var(--muted) / 0.3);
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--border));
	}

	.custom-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.custom-label {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		min-width: 2.5rem;
	}

	.interval-input {
		width: 4rem;
		padding: 0.375rem 0.5rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.875rem;
		text-align: center;
	}

	.interval-input:focus {
		outline: none;
		border-color: hsl(var(--primary));
	}

	.frequency-select {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.875rem;
		cursor: pointer;
	}

	.frequency-select:focus {
		outline: none;
		border-color: hsl(var(--primary));
	}

	.weekday-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.weekday-buttons {
		display: flex;
		gap: 0.25rem;
	}

	.weekday-btn {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.weekday-btn:hover {
		border-color: hsl(var(--primary));
	}

	.weekday-btn.active {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		border-color: hsl(var(--primary));
	}

	.date-input {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.875rem;
	}

	.date-input:focus {
		outline: none;
		border-color: hsl(var(--primary));
	}

	.recurrence-description {
		font-size: 0.75rem;
		color: hsl(var(--primary));
		font-style: italic;
	}
</style>
