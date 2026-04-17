<script lang="ts">
	let {
		value,
		onchange,
		readonly = false,
		size = 'sm',
	}: {
		value: number | null;
		onchange?: (next: number | null) => void;
		readonly?: boolean;
		size?: 'sm' | 'md' | 'lg';
	} = $props();

	const positions = [1, 2, 3, 4, 5];

	function click(pos: number) {
		if (readonly || !onchange) return;
		if (value === pos) {
			onchange(null);
		} else {
			onchange(pos);
		}
	}

	function half(pos: number): 'full' | 'half' | 'empty' {
		const v = value ?? 0;
		if (v >= pos) return 'full';
		if (v >= pos - 0.5) return 'half';
		return 'empty';
	}
</script>

<div class="stars" class:md={size === 'md'} class:lg={size === 'lg'} class:readonly>
	{#each positions as pos (pos)}
		<button
			type="button"
			class="star state-{half(pos)}"
			aria-label={`${pos} Sterne`}
			onclick={() => click(pos)}
			disabled={readonly}
		>
			★
		</button>
	{/each}
	{#if value != null && !readonly}
		<span class="value">{value.toFixed(1)}</span>
	{/if}
</div>

<style>
	.stars {
		display: inline-flex;
		align-items: center;
		gap: 0.1rem;
	}
	.star {
		background: none;
		border: none;
		padding: 0 0.1rem;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		color: #cbd5e1;
		transition: color 0.12s ease;
	}
	.stars.md .star {
		font-size: 1.3rem;
	}
	.stars.lg .star {
		font-size: 1.65rem;
	}
	.star.state-full {
		color: #f59e0b;
	}
	.star.state-half {
		color: #fbbf24;
		opacity: 0.7;
	}
	.stars.readonly .star {
		cursor: default;
	}
	.star:hover:not(:disabled) {
		color: #f59e0b;
	}
	.value {
		margin-left: 0.35rem;
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
	}
</style>
