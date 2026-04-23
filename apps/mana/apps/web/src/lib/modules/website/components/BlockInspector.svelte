<script lang="ts">
	import type { Component } from 'svelte';
	import { getBlockSpec, type Block, type BlockInspectorProps } from '@mana/website-blocks';
	import { blocksStore, InvalidBlockPropsError } from '../stores/blocks.svelte';
	import type { WebsiteBlock } from '../types';
	import ImageInspector from './ImageInspector.svelte';
	import GalleryInspector from './GalleryInspector.svelte';

	interface Props {
		block: WebsiteBlock;
		onDeleted?: () => void;
	}

	let { block, onDeleted }: Props = $props();

	const spec = $derived(getBlockSpec(block.type));

	/**
	 * Some blocks need app-level features (image upload via mana-media)
	 * that can't live in the registry package (which is pure Svelte +
	 * Zod). Override table: block.type → app-side inspector component.
	 * Missing entries fall back to `spec.Inspector` from the registry.
	 *
	 * Typed as `Component<BlockInspectorProps<unknown>>` because each
	 * override targets a different block-type's props shape — Svelte's
	 * generic-component-assignability check can't know the union without
	 * widening.
	 */
	const CUSTOM_INSPECTORS: Record<string, Component<BlockInspectorProps<unknown>> | undefined> = {
		image: ImageInspector as unknown as Component<BlockInspectorProps<unknown>>,
		gallery: GalleryInspector as unknown as Component<BlockInspectorProps<unknown>>,
	};

	const CustomInspector = $derived(CUSTOM_INSPECTORS[block.type]);

	let lastError = $state<string | null>(null);

	// Typed as `unknown` to match the registry's Inspector contract
	// (`Partial<unknown>`); the underlying store accepts anything the
	// block's Zod schema validates.
	async function onChange(patch: unknown) {
		lastError = null;
		try {
			await blocksStore.updateBlockProps(block.id, patch as Record<string, unknown>);
		} catch (err) {
			if (err instanceof InvalidBlockPropsError) {
				lastError = `Validation failed: ${err.message}`;
			} else {
				lastError = err instanceof Error ? err.message : String(err);
			}
		}
	}

	async function onDelete() {
		if (!confirm('Diesen Block löschen?')) return;
		await blocksStore.deleteBlock(block.id);
		onDeleted?.();
	}

	function asRegistryBlock(b: WebsiteBlock): Block<unknown> {
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

<div class="wb-inspector">
	{#if spec}
		<header class="wb-inspector__head">
			<div>
				<p class="wb-inspector__kind">{spec.category}</p>
				<h3>{spec.label}</h3>
			</div>
			<button class="wb-inspector__delete" onclick={onDelete} title="Block löschen"> × </button>
		</header>

		<div class="wb-inspector__body">
			{#if CustomInspector}
				<CustomInspector block={asRegistryBlock(block)} {onChange} />
			{:else}
				<spec.Inspector block={asRegistryBlock(block)} {onChange} />
			{/if}
		</div>

		{#if lastError}
			<p class="wb-inspector__error">{lastError}</p>
		{/if}
	{:else}
		<p class="wb-inspector__empty">Unbekannter Block-Typ: {block.type}</p>
	{/if}
</div>

<style>
	.wb-inspector {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
	}
	.wb-inspector__head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}
	.wb-inspector__head h3 {
		margin: 0;
		font-size: 1rem;
	}
	.wb-inspector__kind {
		margin: 0 0 0.1rem;
		font-size: 0.7rem;
		opacity: 0.5;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.wb-inspector__delete {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: inherit;
		padding: 0.1rem 0.5rem;
		font-size: 1.15rem;
		line-height: 1;
		border-radius: 0.375rem;
		cursor: pointer;
		opacity: 0.7;
	}
	.wb-inspector__delete:hover {
		background: rgba(248, 113, 113, 0.15);
		border-color: rgba(248, 113, 113, 0.5);
		color: rgb(248, 113, 113);
		opacity: 1;
	}
	.wb-inspector__body {
		flex: 1 1 auto;
		overflow-y: auto;
	}
	.wb-inspector__error {
		margin: 0;
		padding: 0.5rem 0.75rem;
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid rgba(248, 113, 113, 0.3);
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		color: rgb(248, 113, 113);
	}
	.wb-inspector__empty {
		padding: 1rem;
		opacity: 0.6;
		font-size: 0.875rem;
	}
</style>
