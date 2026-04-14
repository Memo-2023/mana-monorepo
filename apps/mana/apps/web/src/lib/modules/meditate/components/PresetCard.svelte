<!--
  PresetCard — clickable card for a meditation preset.
-->
<script lang="ts">
	import type { MeditatePreset } from '../types';
	import { CATEGORY_LABELS } from '../types';
	import { formatDurationLong } from '../queries';

	interface Props {
		preset: MeditatePreset;
		onStart: (preset: MeditatePreset) => void;
	}

	let { preset, onStart }: Props = $props();

	const categoryLabel = $derived(CATEGORY_LABELS[preset.category].de);
	const durationLabel = $derived(formatDurationLong(preset.defaultDurationSec));

	const categoryIcon = $derived.by(() => {
		if (preset.category === 'silence') return '🧘';
		if (preset.category === 'breathing') return '🌬️';
		return '✨'; // bodyscan
	});

	const patternLabel = $derived.by(() => {
		if (!preset.breathPattern) return null;
		const p = preset.breathPattern;
		const parts = [p.inhale, p.hold1, p.exhale, p.hold2].filter((v) => v > 0);
		return parts.join('-');
	});
</script>

<button type="button" class="preset-card" onclick={() => onStart(preset)}>
	<div class="preset-icon">{categoryIcon}</div>
	<div class="preset-info">
		<div class="preset-name">{preset.name}</div>
		<div class="preset-meta">
			<span class="preset-category">{categoryLabel}</span>
			<span class="preset-dot">·</span>
			<span class="preset-duration">{durationLabel}</span>
			{#if patternLabel}
				<span class="preset-dot">·</span>
				<span class="preset-pattern">{patternLabel}</span>
			{/if}
		</div>
		{#if preset.description}
			<div class="preset-desc">{preset.description}</div>
		{/if}
	</div>
</button>

<style>
	.preset-card {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		width: 100%;
		padding: 1rem;
		border-radius: 0.75rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
	}

	.preset-card:hover {
		border-color: hsl(var(--color-primary) / 0.5);
		box-shadow: 0 2px 12px hsl(var(--color-primary) / 0.1);
	}

	.preset-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: hsl(var(--color-primary) / 0.1);
		font-size: 1.25rem;
	}

	.preset-info {
		flex: 1;
		min-width: 0;
	}

	.preset-name {
		font-weight: 600;
		color: hsl(var(--color-foreground));
		font-size: 0.95rem;
	}

	.preset-meta {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.15rem;
	}

	.preset-dot {
		opacity: 0.5;
	}

	.preset-pattern {
		font-variant-numeric: tabular-nums;
		font-family: monospace;
		font-size: 0.75rem;
	}

	.preset-desc {
		margin-top: 0.35rem;
		font-size: 0.8rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
