<script lang="ts">
	import { KIND_LABELS } from '../constants';
	import type { DraftKind } from '../types';

	let {
		active,
		counts,
		onselect,
	}: {
		active: DraftKind | 'all';
		counts: Record<DraftKind, number>;
		onselect: (kind: DraftKind | 'all') => void;
	} = $props();

	const ORDER: DraftKind[] = [
		'blog',
		'essay',
		'email',
		'social',
		'story',
		'letter',
		'speech',
		'cover-letter',
		'product-description',
		'press-release',
		'bio',
		'other',
	];
	const total = $derived(ORDER.reduce((s, k) => s + counts[k], 0));
</script>

<div class="tabs" role="tablist">
	<button
		type="button"
		class="tab"
		class:active={active === 'all'}
		onclick={() => onselect('all')}
		role="tab"
		aria-selected={active === 'all'}
	>
		Alle <span class="count">{total}</span>
	</button>
	{#each ORDER as kind (kind)}
		{#if counts[kind] > 0 || active === kind}
			<button
				type="button"
				class="tab"
				class:active={active === kind}
				onclick={() => onselect(kind)}
				role="tab"
				aria-selected={active === kind}
			>
				<span class="emoji" aria-hidden="true">{KIND_LABELS[kind].emoji}</span>
				{KIND_LABELS[kind].de}
				<span class="count">{counts[kind]}</span>
			</button>
		{/if}
	{/each}
</div>

<style>
	.tabs {
		display: flex;
		gap: 0.25rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
	}
	.tab {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0.85rem;
		border-radius: 0.6rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		cursor: pointer;
		font-size: 0.9rem;
		color: hsl(var(--color-foreground));
		white-space: nowrap;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}
	.tab:hover {
		background: hsl(var(--color-surface));
	}
	.tab.active {
		background: hsl(var(--color-primary) / 0.12);
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
		font-weight: 500;
	}
	.emoji {
		font-size: 1rem;
	}
	.count {
		font-size: 0.75rem;
		opacity: 0.7;
		background: hsl(var(--color-muted));
		padding: 0.05rem 0.4rem;
		border-radius: 999px;
	}
	.tab.active .count {
		background: hsl(var(--color-primary) / 0.2);
	}
</style>
