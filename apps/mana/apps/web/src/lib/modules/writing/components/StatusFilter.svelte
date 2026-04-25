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
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		cursor: pointer;
		font-size: 0.8rem;
		color: hsl(var(--color-muted-foreground));
	}
	.chip:hover {
		background: hsl(var(--color-surface));
	}
	.chip.active {
		background: hsl(var(--color-primary) / 0.1);
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
		font-weight: 500;
	}
</style>
