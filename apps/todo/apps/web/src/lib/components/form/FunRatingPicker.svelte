<script lang="ts">
	import { X } from '@manacore/shared-icons';

	interface Props {
		value: number | null;
		onChange: (value: number | null) => void;
	}

	let { value, onChange }: Props = $props();

	function getRatingColor(rating: number): string {
		if (rating <= 3) return '#ef4444'; // red
		if (rating <= 6) return '#eab308'; // yellow
		return '#22c55e'; // green
	}

	function handleSelect(rating: number) {
		onChange(value === rating ? null : rating);
	}

	function handleClear() {
		onChange(null);
	}
</script>

<div class="fun-rating-picker">
	<div class="fun-rating">
		{#each Array(10) as _, i}
			{@const rating = i + 1}
			<button
				type="button"
				class="fun-rating-dot"
				class:filled={value !== null && rating <= value}
				style="--dot-color: {getRatingColor(rating)}"
				onclick={() => handleSelect(rating)}
				title={String(rating)}
			>
				<span class="dot"></span>
			</button>
		{/each}
		{#if value !== null}
			<button type="button" class="fun-rating-clear" onclick={handleClear} title="Zurücksetzen">
				<X size={16} />
			</button>
		{/if}
	</div>
	<div class="fun-rating-labels">
		<span>1</span>
		<span>5</span>
		<span>10</span>
	</div>
</div>

<style>
	.fun-rating-picker {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.fun-rating {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}

	.fun-rating-dot {
		padding: 0.25rem;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: transform 0.15s;
	}

	.fun-rating-dot:hover {
		transform: scale(1.2);
	}

	.fun-rating-dot .dot {
		display: block;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 9999px;
		background: var(--color-border);
		transition: all 0.15s;
	}

	.fun-rating-dot.filled .dot {
		background: var(--dot-color);
	}

	.fun-rating-labels {
		display: flex;
		justify-content: space-between;
		padding: 0 0.25rem;
		font-size: 0.6875rem;
		color: var(--color-muted-foreground);
	}

	.fun-rating-clear {
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

	.fun-rating-clear:hover {
		background: color-mix(in srgb, var(--color-error) 20%, transparent);
	}
</style>
