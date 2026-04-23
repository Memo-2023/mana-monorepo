<script lang="ts">
	import { getBlockSpec, type BlockMode, type Block as BlockType } from '@mana/website-blocks';
	import type { WebsiteBlock } from '../types';

	interface Props {
		blocks: WebsiteBlock[];
		mode: BlockMode;
		selectedBlockId?: string | null;
		onSelect?: (blockId: string) => void;
	}

	let { blocks, mode, selectedBlockId, onSelect }: Props = $props();

	// Top-level blocks for M1 — containers come in M3 (columns/rows).
	const topLevel = $derived(
		blocks.filter((b) => b.parentBlockId === null).sort((a, b) => a.order - b.order)
	);

	function asRegistryBlock(b: WebsiteBlock): BlockType<unknown> {
		return {
			id: b.id,
			type: b.type,
			props: b.props,
			schemaVersion: b.schemaVersion,
			order: b.order,
			parentBlockId: b.parentBlockId,
			slotKey: b.slotKey,
		};
	}
</script>

{#each topLevel as block (block.id)}
	{@const spec = getBlockSpec(block.type)}
	{#if spec}
		{#if mode === 'edit'}
			<div
				class="wb-block-wrap wb-block-wrap--editable"
				class:wb-block-wrap--selected={selectedBlockId === block.id}
				role="button"
				tabindex="0"
				onclick={() => onSelect?.(block.id)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onSelect?.(block.id);
					}
				}}
			>
				<spec.Component block={asRegistryBlock(block)} {mode} />
			</div>
		{:else}
			<div class="wb-block-wrap">
				<spec.Component block={asRegistryBlock(block)} {mode} />
			</div>
		{/if}
	{:else if mode === 'edit'}
		<div class="wb-block-wrap wb-block-wrap--unknown">
			Unbekannter Block-Typ: {block.type}
		</div>
	{/if}
{/each}

<style>
	.wb-block-wrap {
		position: relative;
	}
	.wb-block-wrap--editable {
		cursor: pointer;
		outline: 2px solid transparent;
		outline-offset: -2px;
		transition: outline-color 0.12s ease;
	}
	.wb-block-wrap--editable:hover {
		outline-color: rgba(99, 102, 241, 0.35);
	}
	.wb-block-wrap--selected {
		outline-color: rgba(99, 102, 241, 0.9) !important;
	}
	.wb-block-wrap--unknown {
		padding: 1rem;
		background: rgba(248, 113, 113, 0.1);
		border: 1px dashed rgba(248, 113, 113, 0.5);
		color: rgb(248, 113, 113);
		font-family: ui-monospace, monospace;
		font-size: 0.8125rem;
	}
</style>
