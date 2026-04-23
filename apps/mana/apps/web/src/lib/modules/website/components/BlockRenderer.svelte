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

	/**
	 * Build a parent→children map once, sort each bucket. The renderChild
	 * snippet below does the recursive lookup against this map so both
	 * top-level blocks and container children render through the same
	 * chrome (click-to-select, outline).
	 */
	const byParent = $derived.by(() => {
		const map = new Map<string | null, WebsiteBlock[]>();
		for (const b of blocks) {
			const parent = b.parentBlockId;
			const list = map.get(parent);
			if (list) list.push(b);
			else map.set(parent, [b]);
		}
		for (const list of map.values()) {
			list.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
		}
		return map;
	});

	const topLevel = $derived(byParent.get(null) ?? []);

	function asRegistryBlock(b: WebsiteBlock): BlockType<unknown> {
		return {
			id: b.id,
			type: b.type,
			props: b.props,
			schemaVersion: b.schemaVersion,
			order: b.order,
			parentBlockId: b.parentBlockId,
			slotKey: b.slotKey,
			// `children` is intentionally omitted at this level — containers
			// look up their own via the `children` prop we pass below.
		};
	}
</script>

{#snippet renderBlock(block: WebsiteBlock)}
	{@const spec = getBlockSpec(block.type)}
	{#if spec}
		{@const children = (byParent.get(block.id) ?? []).map(asRegistryBlock)}
		{#if mode === 'edit'}
			<div
				class="wb-block-wrap wb-block-wrap--editable"
				class:wb-block-wrap--selected={selectedBlockId === block.id}
				role="button"
				tabindex="0"
				onclick={(e) => {
					e.stopPropagation();
					onSelect?.(block.id);
				}}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						e.stopPropagation();
						onSelect?.(block.id);
					}
				}}
			>
				<spec.Component
					block={asRegistryBlock(block)}
					{mode}
					{children}
					renderChild={renderInnerChild}
				/>
			</div>
		{:else}
			<div class="wb-block-wrap">
				<spec.Component
					block={asRegistryBlock(block)}
					{mode}
					{children}
					renderChild={renderInnerChild}
				/>
			</div>
		{/if}
	{:else if mode === 'edit'}
		<div class="wb-block-wrap wb-block-wrap--unknown">
			Unbekannter Block-Typ: {block.type}
		</div>
	{/if}
{/snippet}

{#snippet renderInnerChild(child: BlockType<unknown>)}
	{@const fullBlock = blocks.find((b) => b.id === child.id)}
	{#if fullBlock}
		{@render renderBlock(fullBlock)}
	{/if}
{/snippet}

{#each topLevel as block (block.id)}
	{@render renderBlock(block)}
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
