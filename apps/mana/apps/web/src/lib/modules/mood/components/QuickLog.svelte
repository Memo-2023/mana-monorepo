<!--
  QuickLog — Fast mood check-in: level slider, emotion pick, optional context.
-->
<script lang="ts">
	import { moodStore } from '../stores/mood.svelte';
	import {
		CORE_EMOTIONS,
		EMOTION_META,
		ACTIVITY_LABELS,
		MOOD_TAG_PRESETS,
		type CoreEmotion,
		type ActivityContext,
	} from '../types';

	interface Props {
		onComplete: () => void;
		onCancel: () => void;
	}

	let { onComplete, onCancel }: Props = $props();

	let level = $state(5);
	let emotion = $state<CoreEmotion | null>(null);
	let activity = $state<ActivityContext | null>(null);
	let notes = $state('');
	let selectedTags = $state<string[]>([]);
	let showDetails = $state(false);

	// Split emotions by valence for the picker layout
	let positiveEmotions = $derived(CORE_EMOTIONS.filter((e) => EMOTION_META[e].valence === 'positive'));
	let neutralEmotions = $derived(CORE_EMOTIONS.filter((e) => EMOTION_META[e].valence === 'neutral'));
	let negativeEmotions = $derived(CORE_EMOTIONS.filter((e) => EMOTION_META[e].valence === 'negative'));

	function toggleTag(tag: string) {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter((t) => t !== tag);
		} else {
			selectedTags = [...selectedTags, tag];
		}
	}

	async function handleSave() {
		if (!emotion) return;
		await moodStore.logMood({
			level,
			emotion,
			activity,
			notes,
			tags: selectedTags,
		});
		onComplete();
	}

	function levelColor(val: number): string {
		if (val >= 8) return '#22c55e';
		if (val >= 6) return '#84cc16';
		if (val >= 4) return '#f59e0b';
		if (val >= 2) return '#f97316';
		return '#ef4444';
	}
</script>

<div class="log-overlay">
	<div class="log-header">
		<button class="close-btn" onclick={onCancel}>×</button>
		<span class="header-title">Wie geht es dir?</span>
	</div>

	<div class="log-body">
		<!-- Level Slider -->
		<div class="level-section">
			<div class="level-display" style:color={levelColor(level)}>
				{level}
			</div>
			<input
				class="level-slider"
				type="range"
				min="1"
				max="10"
				bind:value={level}
				style:accent-color={levelColor(level)}
			/>
			<div class="level-labels">
				<span>Schlecht</span>
				<span>Super</span>
			</div>
		</div>

		<!-- Emotion Picker -->
		<div class="emotion-section">
			<span class="section-label">Was fühlst du?</span>
			<div class="emotion-grid">
				{#each positiveEmotions as e}
					<button
						class="emotion-btn"
						class:selected={emotion === e}
						onclick={() => (emotion = emotion === e ? null : e)}
					>
						<span class="emo-emoji">{EMOTION_META[e].emoji}</span>
						<span class="emo-label">{EMOTION_META[e].de}</span>
					</button>
				{/each}
				{#each neutralEmotions as e}
					<button
						class="emotion-btn"
						class:selected={emotion === e}
						onclick={() => (emotion = emotion === e ? null : e)}
					>
						<span class="emo-emoji">{EMOTION_META[e].emoji}</span>
						<span class="emo-label">{EMOTION_META[e].de}</span>
					</button>
				{/each}
				{#each negativeEmotions as e}
					<button
						class="emotion-btn"
						class:selected={emotion === e}
						onclick={() => (emotion = emotion === e ? null : e)}
					>
						<span class="emo-emoji">{EMOTION_META[e].emoji}</span>
						<span class="emo-label">{EMOTION_META[e].de}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Details Toggle -->
		{#if !showDetails}
			<button class="details-toggle" onclick={() => (showDetails = true)}>
				+ Details hinzufügen
			</button>
		{:else}
			<!-- Activity -->
			<div class="activity-section">
				<span class="section-label">Was machst du gerade?</span>
				<div class="activity-grid">
					{#each Object.entries(ACTIVITY_LABELS) as [key, meta]}
						<button
							class="activity-btn"
							class:selected={activity === key}
							onclick={() => (activity = activity === key ? null : (key as ActivityContext))}
						>
							<span class="act-emoji">{meta.emoji}</span>
							<span class="act-label">{meta.de}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Tags -->
			<div class="tags-section">
				<span class="section-label">Tags</span>
				<div class="tags-row">
					{#each MOOD_TAG_PRESETS as tag}
						<button
							class="tag-chip"
							class:active={selectedTags.includes(tag)}
							onclick={() => toggleTag(tag)}
						>{tag}</button>
					{/each}
				</div>
			</div>

			<!-- Notes -->
			<textarea
				class="notes-input"
				placeholder="Notizen (optional)..."
				bind:value={notes}
				rows="2"
			></textarea>
		{/if}

		<!-- Save -->
		<button class="save-btn" onclick={handleSave} disabled={!emotion}>
			Speichern
		</button>
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
		gap: 1rem;
	}

	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Level ────────────────────────────────────── */
	.level-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
	}

	.level-display {
		font-size: 2.5rem;
		font-weight: 800;
		line-height: 1;
		transition: color 0.2s;
	}

	.level-slider {
		width: 100%;
		max-width: 300px;
		height: 8px;
	}

	.level-labels {
		display: flex;
		justify-content: space-between;
		width: 100%;
		max-width: 300px;
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Emotions ─────────────────────────────────── */
	.emotion-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.emotion-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
		gap: 0.375rem;
	}

	.emotion-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		padding: 0.375rem 0.25rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted));
		border: 2px solid transparent;
		cursor: pointer;
		transition: transform 0.1s, border-color 0.15s;
		color: hsl(var(--color-foreground));
	}

	.emotion-btn:hover {
		transform: scale(1.05);
	}

	.emotion-btn.selected {
		border-color: #f59e0b;
		background: hsl(40 80% 96%);
	}

	:global(.dark) .emotion-btn.selected {
		background: hsl(40 30% 12%);
	}

	.emo-emoji {
		font-size: 1.25rem;
		line-height: 1;
	}

	.emo-label {
		font-size: 0.5625rem;
		text-align: center;
		line-height: 1.2;
	}

	/* ── Activity ─────────────────────────────────── */
	.activity-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.activity-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
		gap: 0.25rem;
	}

	.activity-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.0625rem;
		padding: 0.25rem;
		border-radius: 0.375rem;
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		cursor: pointer;
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
		transition: background 0.15s;
	}

	.activity-btn.selected {
		background: hsl(var(--color-muted));
		border-color: #f59e0b;
		color: hsl(var(--color-foreground));
	}

	.act-emoji {
		font-size: 1rem;
	}

	.act-label {
		line-height: 1.2;
	}

	/* ── Tags & Notes ─────────────────────────────── */
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
	}

	.tag-chip.active {
		background: #f59e0b;
		color: white;
		border-color: #f59e0b;
	}

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
		border-color: #f59e0b;
	}

	.details-toggle {
		text-align: center;
		padding: 0.375rem;
		border: none;
		background: none;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.details-toggle:hover {
		color: hsl(var(--color-foreground));
	}

	/* ── Save ─────────────────────────────────────── */
	.save-btn {
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: #f59e0b;
		color: white;
		border: none;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
	}

	.save-btn:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.save-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
