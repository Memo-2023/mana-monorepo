<script lang="ts">
	import { RRule } from 'rrule';

	interface Props {
		initialRule?: string | null;
		onApply: (rule: string) => void;
		onCancel: () => void;
	}

	let { initialRule, onApply, onCancel }: Props = $props();

	// Parse initial rule if provided
	// svelte-ignore state_referenced_locally
	const parsed = initialRule ? parseRule(initialRule) : null;

	let freq = $state<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>(parsed?.freq ?? 'WEEKLY');
	let interval = $state(parsed?.interval ?? 1);
	let selectedDays = $state<number[]>(parsed?.byDay ?? [new Date().getDay()]);
	let endType = $state<'never' | 'count' | 'until'>(parsed?.endType ?? 'never');
	let count = $state(parsed?.count ?? 10);
	let untilDate = $state(parsed?.until ?? '');

	const DAYS = [
		{ value: 0, short: 'So', rrule: 'SU' },
		{ value: 1, short: 'Mo', rrule: 'MO' },
		{ value: 2, short: 'Di', rrule: 'TU' },
		{ value: 3, short: 'Mi', rrule: 'WE' },
		{ value: 4, short: 'Do', rrule: 'TH' },
		{ value: 5, short: 'Fr', rrule: 'FR' },
		{ value: 6, short: 'Sa', rrule: 'SA' },
	];

	const FREQ_LABELS: Record<string, string> = {
		DAILY: 'Tag(e)',
		WEEKLY: 'Woche(n)',
		MONTHLY: 'Monat(e)',
		YEARLY: 'Jahr(e)',
	};

	function toggleDay(day: number) {
		if (selectedDays.includes(day)) {
			if (selectedDays.length > 1) {
				selectedDays = selectedDays.filter((d) => d !== day);
			}
		} else {
			selectedDays = [...selectedDays, day].sort();
		}
	}

	function buildRule(): string {
		let parts = [`FREQ=${freq}`];
		if (interval > 1) parts.push(`INTERVAL=${interval}`);
		if (freq === 'WEEKLY' && selectedDays.length > 0 && selectedDays.length < 7) {
			const byDay = selectedDays.map((d) => DAYS[d].rrule).join(',');
			parts.push(`BYDAY=${byDay}`);
		}
		if (endType === 'count' && count > 0) {
			parts.push(`COUNT=${count}`);
		} else if (endType === 'until' && untilDate) {
			const d = new Date(untilDate);
			const formatted = d
				.toISOString()
				.replace(/[-:]/g, '')
				.replace(/\.\d{3}/, '')
				.split('T')[0];
			parts.push(`UNTIL=${formatted}T235959Z`);
		}
		return parts.join(';');
	}

	function handleApply() {
		onApply(buildRule());
	}

	function parseRule(rule: string): {
		freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
		interval: number;
		byDay: number[];
		endType: 'never' | 'count' | 'until';
		count: number;
		until: string;
	} | null {
		const clean = rule.replace(/^RRULE:/, '');
		const parts = Object.fromEntries(clean.split(';').map((p) => p.split('=')));
		const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

		let endType: 'never' | 'count' | 'until' = 'never';
		let count = 10;
		let until = '';

		if (parts.COUNT) {
			endType = 'count';
			count = parseInt(parts.COUNT);
		} else if (parts.UNTIL) {
			endType = 'until';
			// Parse UNTIL back to YYYY-MM-DD
			const u = parts.UNTIL.replace(/T.*$/, '');
			if (u.length === 8) {
				until = `${u.slice(0, 4)}-${u.slice(4, 6)}-${u.slice(6, 8)}`;
			}
		}

		return {
			freq: (parts.FREQ as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY') ?? 'WEEKLY',
			interval: parts.INTERVAL ? parseInt(parts.INTERVAL) : 1,
			byDay: parts.BYDAY ? parts.BYDAY.split(',').map((d: string) => dayMap[d] ?? 0) : [],
			endType,
			count,
			until,
		};
	}

	// Preview text
	let preview = $derived.by(() => {
		let text = `Alle ${interval > 1 ? interval + ' ' : ''}${FREQ_LABELS[freq]}`;
		if (freq === 'WEEKLY' && selectedDays.length > 0 && selectedDays.length < 7) {
			text += ` an ${selectedDays.map((d) => DAYS[d].short).join(', ')}`;
		}
		if (endType === 'count') text += `, ${count}x`;
		else if (endType === 'until' && untilDate) text += ` bis ${untilDate}`;
		return text;
	});
</script>

<div class="recurrence-builder">
	<div class="builder-header">Benutzerdefinierte Wiederholung</div>

	<!-- Frequency + Interval -->
	<div class="builder-row">
		<span class="row-label">Alle</span>
		<input type="number" class="interval-input" bind:value={interval} min="1" max="99" />
		<select class="freq-select" bind:value={freq}>
			<option value="DAILY">Tag(e)</option>
			<option value="WEEKLY">Woche(n)</option>
			<option value="MONTHLY">Monat(e)</option>
			<option value="YEARLY">Jahr(e)</option>
		</select>
	</div>

	<!-- Weekday picker (only for WEEKLY) -->
	{#if freq === 'WEEKLY'}
		<div class="builder-section">
			<span class="section-label">Wochentage</span>
			<div class="day-picker">
				{#each DAYS as day}
					<button
						type="button"
						class="day-btn"
						class:active={selectedDays.includes(day.value)}
						onclick={() => toggleDay(day.value)}
					>
						{day.short}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- End condition -->
	<div class="builder-section">
		<span class="section-label">Endet</span>
		<div class="end-options">
			<label class="radio-label">
				<input type="radio" bind:group={endType} value="never" />
				<span>Nie</span>
			</label>
			<label class="radio-label">
				<input type="radio" bind:group={endType} value="count" />
				<span>Nach</span>
				{#if endType === 'count'}
					<input type="number" class="count-input" bind:value={count} min="1" max="999" />
					<span>Terminen</span>
				{/if}
			</label>
			<label class="radio-label">
				<input type="radio" bind:group={endType} value="until" />
				<span>Am</span>
				{#if endType === 'until'}
					<input type="date" class="until-input" bind:value={untilDate} />
				{/if}
			</label>
		</div>
	</div>

	<!-- Preview -->
	<div class="preview">{preview}</div>

	<!-- Actions -->
	<div class="builder-actions">
		<button type="button" class="btn btn-secondary" onclick={onCancel}>Abbrechen</button>
		<button type="button" class="btn btn-primary" onclick={handleApply}>Übernehmen</button>
	</div>
</div>

<style>
	.recurrence-builder {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md, 8px);
		background: hsl(var(--color-card));
	}

	.builder-header {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.builder-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.row-label {
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}

	.interval-input {
		width: 3.5rem;
		padding: 0.375rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md, 8px);
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		text-align: center;
	}

	.freq-select {
		padding: 0.375rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md, 8px);
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
	}

	.builder-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}

	.day-picker {
		display: flex;
		gap: 0.25rem;
	}

	.day-btn {
		width: 2.25rem;
		height: 2.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.day-btn:hover {
		background: hsl(var(--color-muted));
	}

	.day-btn.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}

	.end-options {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.radio-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		cursor: pointer;
	}

	.radio-label input[type='radio'] {
		accent-color: hsl(var(--color-primary));
	}

	.count-input {
		width: 3.5rem;
		padding: 0.25rem 0.375rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md, 8px);
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		text-align: center;
	}

	.until-input {
		padding: 0.25rem 0.375rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md, 8px);
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
	}

	.preview {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		padding: 0.5rem 0.75rem;
		background: hsl(var(--color-muted) / 0.5);
		border-radius: var(--radius-md, 8px);
		font-style: italic;
	}

	.builder-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-md, 8px);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease;
		border: none;
	}

	.btn-secondary {
		background: transparent;
		color: hsl(var(--color-foreground));
		border: 1px solid hsl(var(--color-border));
	}

	.btn-secondary:hover {
		background: hsl(var(--color-muted));
	}

	.btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.btn-primary:hover {
		opacity: 0.9;
	}
</style>
