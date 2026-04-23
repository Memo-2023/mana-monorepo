<script lang="ts">
	import type { BlockRenderProps, Block } from '../types';
	import type { ColumnsProps } from './schema';
	import { columnSlotKeys } from './schema';

	let { block, mode, children = [], renderChild }: BlockRenderProps<ColumnsProps> = $props();

	const isEdit = $derived(mode === 'edit');
	const slots = $derived(columnSlotKeys(block.props.count));

	function childrenForSlot(slot: string): Block[] {
		return (children ?? []).filter((c) => c.slotKey === slot);
	}
</script>

<section
	class="wb-columns wb-columns--gap-{block.props.gap} wb-columns--align-{block.props.align}"
	class:wb-columns--2={block.props.count === 2}
	class:wb-columns--3={block.props.count === 3}
	class:wb-columns--stack={block.props.stackOnMobile}
	data-mode={mode}
>
	{#each slots as slot, idx (slot)}
		{@const slotChildren = childrenForSlot(slot)}
		<div
			class="wb-column"
			data-slot={slot}
			data-slot-index={idx}
			class:wb-column--empty={slotChildren.length === 0}
		>
			{#if slotChildren.length === 0 && isEdit}
				<div class="wb-column__empty">Spalte {idx + 1}</div>
			{/if}
			{#each slotChildren as child (child.id)}
				{#if renderChild}
					{@render renderChild(child)}
				{/if}
			{/each}
		</div>
	{/each}
</section>

<style>
	.wb-columns {
		display: grid;
		padding: 1.5rem;
		max-width: 72rem;
		margin: 0 auto;
	}
	.wb-columns--2 {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.wb-columns--3 {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
	.wb-columns--gap-sm {
		gap: 0.75rem;
	}
	.wb-columns--gap-md {
		gap: 1.5rem;
	}
	.wb-columns--gap-lg {
		gap: 3rem;
	}
	.wb-columns--align-start {
		align-items: start;
	}
	.wb-columns--align-center {
		align-items: center;
	}
	.wb-columns--align-stretch {
		align-items: stretch;
	}
	.wb-column {
		min-width: 0;
		display: flex;
		flex-direction: column;
	}
	.wb-column__empty {
		padding: 1.5rem;
		text-align: center;
		border: 1px dashed rgba(127, 127, 127, 0.25);
		border-radius: 0.5rem;
		opacity: 0.4;
		font-size: 0.8125rem;
		font-style: italic;
	}

	@media (max-width: 720px) {
		.wb-columns--stack {
			grid-template-columns: 1fr;
		}
	}
</style>
