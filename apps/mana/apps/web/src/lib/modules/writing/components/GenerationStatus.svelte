<!--
  Compact status strip for the currently-running (or most-recent) generation.
  In M3 we only render when a generation is queued/running/failed — on
  success the new version auto-replaces the editor content via the
  currentVersionId pointer, so there's nothing to show here.
-->
<script lang="ts">
	import { GENERATION_STATUS_LABELS } from '../constants';
	import type { Generation } from '../types';

	let {
		generation,
		ondismiss,
	}: {
		generation: Generation;
		ondismiss?: () => void;
	} = $props();

	const isError = $derived(generation.status === 'failed');
	const isDone = $derived(generation.status === 'succeeded' || generation.status === 'cancelled');
	const label = $derived(GENERATION_STATUS_LABELS[generation.status].de);
</script>

<aside class="status" class:error={isError} class:running={!isDone && !isError}>
	<div class="row">
		<span class="dot" aria-hidden="true"></span>
		<strong>{label}</strong>
		{#if generation.model}
			<span class="meta">· {generation.model}</span>
		{/if}
		{#if generation.durationMs}
			<span class="meta">· {(generation.durationMs / 1000).toFixed(1)}s</span>
		{/if}
		{#if ondismiss && (isDone || isError)}
			<button type="button" class="dismiss" onclick={ondismiss}>×</button>
		{/if}
	</div>
	{#if generation.error}
		<p class="err-msg">{generation.error}</p>
	{/if}
</aside>

<style>
	.status {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.55rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		font-size: 0.85rem;
	}
	.status.running {
		border-color: hsl(var(--color-primary) / 0.4);
		background: hsl(var(--color-primary) / 0.06);
	}
	.status.error {
		border-color: color-mix(in srgb, #ef4444 50%, transparent);
		background: color-mix(in srgb, #ef4444 6%, transparent);
	}
	.row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		background: #94a3b8;
	}
	.status.running .dot {
		background: hsl(var(--color-primary));
		animation: pulse 1.1s ease-in-out infinite;
	}
	.status.error .dot {
		background: #ef4444;
	}
	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(0.7);
			opacity: 0.5;
		}
	}
	.meta {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8rem;
	}
	.err-msg {
		margin: 0;
		color: #ef4444;
		font-size: 0.8rem;
		line-height: 1.35;
	}
	.dismiss {
		margin-left: auto;
		padding: 0 0.4rem;
		background: transparent;
		border: none;
		font-size: 1.1rem;
		cursor: pointer;
		color: inherit;
		line-height: 1;
	}
</style>
