<script lang="ts">
	import type { Component } from 'svelte';
	import { getBlockSpec, type Block, type BlockInspectorProps } from '@mana/website-blocks';
	import { blocksStore, InvalidBlockPropsError } from '../stores/blocks.svelte';
	import { getEditorHistoryContext } from '../history.svelte';
	import type { WebsiteBlock } from '../types';
	import ImageInspector from './ImageInspector.svelte';
	import GalleryInspector from './GalleryInspector.svelte';

	interface Props {
		block: WebsiteBlock;
		siblings: WebsiteBlock[];
		onDeleted?: () => void;
	}

	let { block, siblings, onDeleted }: Props = $props();

	// Route all mutations through the editor's history layer when it's
	// mounted (always, in the current EditorView). Falls back to the raw
	// store so the inspector stays usable on surfaces without history.
	const history = getEditorHistoryContext();

	const siblingIndex = $derived(siblings.findIndex((b) => b.id === block.id));
	const canMoveUp = $derived(siblingIndex > 0);
	const canMoveDown = $derived(siblingIndex >= 0 && siblingIndex < siblings.length - 1);

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
			const p = patch as Record<string, unknown>;
			if (history) await history.updateBlockProps(block.id, p);
			else await blocksStore.updateBlockProps(block.id, p);
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
		if (history) await history.deleteBlock(block.id);
		else await blocksStore.deleteBlock(block.id);
		onDeleted?.();
	}

	async function onMoveUp() {
		if (!canMoveUp) return;
		if (history) await history.moveBlockUp(block.id);
		else await blocksStore.moveBlockUp(block.id);
	}

	async function onMoveDown() {
		if (!canMoveDown) return;
		if (history) await history.moveBlockDown(block.id);
		else await blocksStore.moveBlockDown(block.id);
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
			<div class="wb-inspector__actions">
				<button
					class="wb-inspector__action"
					onclick={onMoveUp}
					disabled={!canMoveUp}
					title="Nach oben verschieben"
					aria-label="Nach oben verschieben"
				>
					↑
				</button>
				<button
					class="wb-inspector__action"
					onclick={onMoveDown}
					disabled={!canMoveDown}
					title="Nach unten verschieben"
					aria-label="Nach unten verschieben"
				>
					↓
				</button>
				<button
					class="wb-inspector__action wb-inspector__action--delete"
					onclick={onDelete}
					title="Block löschen"
					aria-label="Block löschen"
				>
					×
				</button>
			</div>
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
	.wb-inspector__actions {
		display: flex;
		gap: 0.25rem;
		flex: 0 0 auto;
	}
	.wb-inspector__action {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: inherit;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		font-size: 0.9rem;
		line-height: 1;
		border-radius: 0.375rem;
		cursor: pointer;
		opacity: 0.7;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.wb-inspector__action:hover:not(:disabled) {
		background: rgba(99, 102, 241, 0.15);
		border-color: rgba(99, 102, 241, 0.4);
		opacity: 1;
	}
	.wb-inspector__action:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}
	.wb-inspector__action--delete {
		font-size: 1.15rem;
	}
	.wb-inspector__action--delete:hover:not(:disabled) {
		background: rgba(248, 113, 113, 0.15);
		border-color: rgba(248, 113, 113, 0.5);
		color: rgb(248, 113, 113);
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
