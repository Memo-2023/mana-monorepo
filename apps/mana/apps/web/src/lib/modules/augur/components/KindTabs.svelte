<script lang="ts">
	import { KIND_LABELS, type AugurKind } from '../types';

	let {
		active,
		counts,
		onselect,
	}: {
		active: AugurKind | 'all';
		counts: Record<AugurKind, number>;
		onselect: (kind: AugurKind | 'all') => void;
	} = $props();

	const ORDER: AugurKind[] = ['omen', 'fortune', 'hunch'];
	const total = $derived(ORDER.reduce((s, k) => s + counts[k], 0));
	const labelAll = 'alle';
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
		{labelAll} <span class="count">{total}</span>
	</button>
	{#each ORDER as kind (kind)}
		<button
			type="button"
			class="tab"
			class:active={active === kind}
			onclick={() => onselect(kind)}
			role="tab"
			aria-selected={active === kind}
		>
			{KIND_LABELS[kind].de}
			<span class="count">{counts[kind]}</span>
		</button>
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
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
		background: transparent;
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--color-text, inherit);
		white-space: nowrap;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}
	.tab:hover {
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
	}
	.tab.active {
		background: color-mix(in srgb, #7c3aed 14%, transparent);
		border-color: #7c3aed;
		color: #c4b5fd;
		font-weight: 500;
	}
	.count {
		font-size: 0.75rem;
		opacity: 0.7;
		background: var(--color-surface-muted, rgba(255, 255, 255, 0.05));
		padding: 0.05rem 0.4rem;
		border-radius: 999px;
	}
	.tab.active .count {
		background: color-mix(in srgb, #7c3aed 22%, transparent);
	}
</style>
