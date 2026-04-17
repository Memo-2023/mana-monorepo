<script lang="ts">
	import { STATUS_LABELS } from '../constants';
	import type { LibraryStatus } from '../types';

	let {
		active,
		onselect,
	}: {
		active: LibraryStatus | null;
		onselect: (status: LibraryStatus | null) => void;
	} = $props();

	const ORDER: LibraryStatus[] = ['planned', 'active', 'completed', 'paused', 'dropped'];
</script>

<div class="chips">
	<button type="button" class="chip" class:active={active === null} onclick={() => onselect(null)}>
		Alle Status
	</button>
	{#each ORDER as status (status)}
		<button
			type="button"
			class="chip"
			class:active={active === status}
			onclick={() => onselect(status)}
		>
			{STATUS_LABELS[status].de}
		</button>
	{/each}
</div>

<style>
	.chips {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.chip {
		padding: 0.3rem 0.7rem;
		border-radius: 999px;
		border: 1px solid transparent;
		background: var(--color-surface, rgba(0, 0, 0, 0.04));
		cursor: pointer;
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
		transition: all 0.12s ease;
	}
	.chip:hover {
		background: var(--color-surface-muted, rgba(0, 0, 0, 0.08));
	}
	.chip.active {
		background: color-mix(in srgb, #a855f7 14%, transparent);
		color: #a855f7;
		border-color: #a855f7;
	}
</style>
