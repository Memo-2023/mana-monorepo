<script lang="ts">
	import { STATUS_LABELS } from '../constants';
	import type { DraftStatus } from '../types';

	let {
		active,
		onselect,
	}: {
		active: DraftStatus | null;
		onselect: (status: DraftStatus | null) => void;
	} = $props();

	const ORDER: DraftStatus[] = ['draft', 'refining', 'complete', 'published'];
</script>

<div class="chips" role="toolbar" aria-label="Status-Filter">
	<button type="button" class="chip" class:active={active === null} onclick={() => onselect(null)}>
		Alle
	</button>
	{#each ORDER as status (status)}
		<button
			type="button"
			class="chip"
			class:active={active === status}
			onclick={() => onselect(active === status ? null : status)}
		>
			{STATUS_LABELS[status].de}
		</button>
	{/each}
</div>

<style>
	.chips {
		display: inline-flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.chip {
		padding: 0.3rem 0.65rem;
		border-radius: 999px;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
		background: transparent;
		cursor: pointer;
		font-size: 0.8rem;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
	}
	.chip:hover {
		background: var(--color-surface, rgba(0, 0, 0, 0.04));
	}
	.chip.active {
		background: color-mix(in srgb, #0ea5e9 10%, transparent);
		border-color: #0ea5e9;
		color: #0ea5e9;
		font-weight: 500;
	}
</style>
