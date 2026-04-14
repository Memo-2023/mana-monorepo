<!--
  MoodPicker — 1-5 mood selection for before/after meditation.
-->
<script lang="ts">
	interface Props {
		value: number | null;
		onSelect: (mood: number) => void;
		label?: string;
	}

	let { value, onSelect, label = 'Stimmung' }: Props = $props();

	const moods = [
		{ value: 1, emoji: '😔', label: 'Schlecht' },
		{ value: 2, emoji: '😕', label: 'Mäßig' },
		{ value: 3, emoji: '😐', label: 'Okay' },
		{ value: 4, emoji: '🙂', label: 'Gut' },
		{ value: 5, emoji: '😊', label: 'Sehr gut' },
	];
</script>

<div class="mood-picker">
	<span class="mood-label">{label}</span>
	<div class="mood-options">
		{#each moods as mood}
			<button
				type="button"
				class="mood-btn"
				class:selected={value === mood.value}
				onclick={() => onSelect(mood.value)}
				title={mood.label}
			>
				<span class="mood-emoji">{mood.emoji}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.mood-picker {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.mood-label {
		font-size: 0.8rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.mood-options {
		display: flex;
		gap: 0.5rem;
	}

	.mood-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 2px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.mood-btn:hover {
		border-color: hsl(var(--color-primary) / 0.5);
		transform: scale(1.1);
	}

	.mood-btn.selected {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.15);
		transform: scale(1.15);
	}

	.mood-emoji {
		font-size: 1.25rem;
	}
</style>
