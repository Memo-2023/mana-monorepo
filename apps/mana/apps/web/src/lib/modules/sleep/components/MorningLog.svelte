<!--
  MorningLog — Quick entry form for last night's sleep.
  Bedtime, wake time, quality stars, interruptions, dream link, notes.
-->
<script lang="ts">
	import { sleepStore } from '../stores/sleep.svelte';
	import { yesterdayDateStr, calcDurationMin, formatDuration } from '../queries';
	import { QUALITY_LABELS, SLEEP_TAG_PRESETS } from '../types';

	interface Props {
		onComplete: () => void;
		onCancel: () => void;
		defaultBedtime?: string;
	}

	let { onComplete, onCancel, defaultBedtime }: Props = $props();

	// Smart defaults
	const yesterday = yesterdayDateStr();
	const now = new Date();
	const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

	// svelte-ignore state_referenced_locally
	let bedtimeTime = $state(defaultBedtime ?? '23:00');
	let wakeTimeTime = $state(nowTime);
	let quality = $state(0);
	let interruptions = $state(0);
	let notes = $state('');
	let selectedTags = $state<string[]>([]);

	// Build full ISO datetimes
	let bedtimeISO = $derived(`${yesterday}T${bedtimeTime}:00`);
	let wakeTimeISO = $derived(`${now.toISOString().split('T')[0]}T${wakeTimeTime}:00`);
	let durationMin = $derived(calcDurationMin(bedtimeISO, wakeTimeISO));

	function toggleTag(tag: string) {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter((t) => t !== tag);
		} else {
			selectedTags = [...selectedTags, tag];
		}
	}

	async function handleSave() {
		if (quality === 0) return;
		await sleepStore.logSleep({
			date: yesterday,
			bedtime: bedtimeISO,
			wakeTime: wakeTimeISO,
			quality,
			interruptions,
			notes,
			tags: selectedTags,
		});
		onComplete();
	}
</script>

<div class="log-overlay">
	<div class="log-header">
		<button class="close-btn" onclick={onCancel}>×</button>
		<span class="header-title">Wie hast du geschlafen?</span>
	</div>

	<div class="log-body">
		<!-- Times -->
		<div class="times-section">
			<div class="time-field">
				<label class="time-label" for="sleep-bedtime">Eingeschlafen</label>
				<input id="sleep-bedtime" class="time-input" type="time" bind:value={bedtimeTime} />
				<span class="time-hint">gestern</span>
			</div>
			<div class="duration-display">
				{#if durationMin > 0}
					{formatDuration(durationMin)}
				{:else}
					—
				{/if}
			</div>
			<div class="time-field">
				<label class="time-label" for="sleep-wake">Aufgewacht</label>
				<input id="sleep-wake" class="time-input" type="time" bind:value={wakeTimeTime} />
				<span class="time-hint">heute</span>
			</div>
		</div>

		<!-- Quality -->
		<div class="quality-section">
			<span class="section-label">Schlafqualität</span>
			<div class="stars-row">
				{#each [1, 2, 3, 4, 5] as val}
					<button
						class="star-btn"
						class:filled={quality >= val}
						onclick={() => (quality = quality === val ? 0 : val)}
					>
						★
					</button>
				{/each}
			</div>
			{#if quality > 0}
				<span class="quality-text">{QUALITY_LABELS[quality]?.de ?? ''}</span>
			{/if}
		</div>

		<!-- Interruptions -->
		<div class="interruptions-section">
			<span class="section-label">Aufwacher in der Nacht</span>
			<div class="counter-row">
				<button
					class="counter-btn"
					onclick={() => (interruptions = Math.max(0, interruptions - 1))}
					disabled={interruptions === 0}>−</button
				>
				<span class="counter-value">{interruptions}</span>
				<button class="counter-btn" onclick={() => interruptions++}>+</button>
			</div>
		</div>

		<!-- Tags -->
		<div class="tags-section">
			<span class="section-label">Tags (optional)</span>
			<div class="tags-row">
				{#each SLEEP_TAG_PRESETS as tag}
					<button
						class="tag-chip"
						class:active={selectedTags.includes(tag)}
						onclick={() => toggleTag(tag)}>{tag}</button
					>
				{/each}
			</div>
		</div>

		<!-- Notes -->
		<div class="notes-section">
			<textarea class="notes-input" placeholder="Notizen (optional)..." bind:value={notes} rows="2"
			></textarea>
		</div>

		<!-- Save -->
		<button class="save-btn" onclick={handleSave} disabled={quality === 0}> Speichern </button>
	</div>
</div>

<style>
	.log-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: hsl(var(--color-background));
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.log-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.close-btn {
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
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.log-body {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Times ────────────────────────────────────── */
	.times-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.time-field {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.time-label {
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
	}

	.time-input {
		width: 100%;
		padding: 0.5rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 1.125rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		text-align: center;
	}

	.time-input:focus {
		outline: none;
		border-color: #6366f1;
	}

	.time-hint {
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
	}

	.duration-display {
		font-size: 1rem;
		font-weight: 700;
		color: #6366f1;
		white-space: nowrap;
		min-width: 4rem;
		text-align: center;
	}

	/* ── Quality Stars ────────────────────────────── */
	.quality-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
	}

	.stars-row {
		display: flex;
		gap: 0.5rem;
	}

	.star-btn {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		border: 2px solid transparent;
		font-size: 1.25rem;
		color: hsl(var(--color-border));
		cursor: pointer;
		transition:
			transform 0.15s,
			color 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.star-btn.filled {
		color: #f59e0b;
	}

	.star-btn:hover {
		transform: scale(1.15);
	}

	.quality-text {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Interruptions ────────────────────────────── */
	.interruptions-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
	}

	.counter-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.counter-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.counter-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.counter-value {
		font-size: 1.25rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
		min-width: 1.5rem;
		text-align: center;
	}

	/* ── Tags ─────────────────────────────────────── */
	.tags-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.tags-row {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.tag-chip {
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

	.tag-chip.active {
		background: #6366f1;
		color: white;
		border-color: #6366f1;
	}

	/* ── Notes ────────────────────────────────────── */
	.notes-input {
		width: 100%;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		resize: vertical;
	}

	.notes-input:focus {
		outline: none;
		border-color: #6366f1;
	}

	.notes-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Save ─────────────────────────────────────── */
	.save-btn {
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: #6366f1;
		color: white;
		border: none;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: filter 0.15s;
	}

	.save-btn:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.save-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
