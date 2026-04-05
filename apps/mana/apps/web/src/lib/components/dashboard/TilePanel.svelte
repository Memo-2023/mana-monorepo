<script lang="ts">
	/**
	 * TilePanel — Renders a single widget in a tiling leaf panel.
	 * In edit mode, shows controls for split, change widget, and close.
	 */

	import { _ } from 'svelte-i18n';
	import { Card } from '@mana/shared-ui';
	import type { TileLeaf } from '$lib/types/tiling';
	import type { WidgetType } from '$lib/types/dashboard';
	import { WIDGET_REGISTRY, getWidgetMeta } from '$lib/types/dashboard';
	import { tilingStore } from '$lib/stores/tiling.svelte';
	import { widgetComponents } from './widget-registry';

	interface Props {
		leaf: TileLeaf;
	}

	let { leaf }: Props = $props();

	const WidgetComponent = $derived(widgetComponents[leaf.widgetType]);
	const meta = $derived(getWidgetMeta(leaf.widgetType));

	let showWidgetPicker = $state(false);

	function handleChangeWidget(widgetType: WidgetType) {
		tilingStore.setWidget(leaf.id, widgetType);
		showWidgetPicker = false;
	}

	// Drag & drop for panel swapping
	function handleDragStart(e: DragEvent) {
		e.dataTransfer?.setData('text/plain', leaf.id);
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const sourceId = e.dataTransfer?.getData('text/plain');
		if (sourceId && sourceId !== leaf.id) {
			tilingStore.swapPanels(sourceId, leaf.id);
		}
	}
</script>

<div
	class="tile-panel"
	draggable={tilingStore.isEditing ? 'true' : undefined}
	ondragstart={tilingStore.isEditing ? handleDragStart : undefined}
	ondragover={tilingStore.isEditing ? handleDragOver : undefined}
	ondrop={tilingStore.isEditing ? handleDrop : undefined}
	role="region"
	aria-label={meta?.nameKey ? $_(meta.nameKey) : leaf.widgetType}
>
	<Card class="relative h-full">
		{#if tilingStore.isEditing}
			<div class="tile-edit-overlay">
				<div class="tile-edit-header">
					<span class="tile-edit-title"
						>{meta?.icon} {meta ? $_(meta.nameKey) : leaf.widgetType}</span
					>
				</div>

				<div class="tile-edit-actions">
					<!-- Split buttons -->
					<button
						type="button"
						class="tile-edit-btn"
						onclick={() => tilingStore.splitPanel(leaf.id, 'horizontal', 'quick-actions')}
						title="Horizontal teilen"
					>
						⬌ Split H
					</button>
					<button
						type="button"
						class="tile-edit-btn"
						onclick={() => tilingStore.splitPanel(leaf.id, 'vertical', 'quick-actions')}
						title="Vertikal teilen"
					>
						⬍ Split V
					</button>

					<!-- Change widget -->
					<button
						type="button"
						class="tile-edit-btn"
						onclick={() => (showWidgetPicker = !showWidgetPicker)}
					>
						🔄 Widget
					</button>

					<!-- Close -->
					<button
						type="button"
						class="tile-edit-btn tile-edit-btn-danger"
						onclick={() => tilingStore.removePanel(leaf.id)}
						title="Panel schließen"
					>
						✕
					</button>
				</div>

				{#if showWidgetPicker}
					<div class="tile-widget-picker">
						{#each WIDGET_REGISTRY as w}
							<button
								type="button"
								class="tile-widget-option"
								class:active={w.type === leaf.widgetType}
								onclick={() => handleChangeWidget(w.type)}
							>
								{w.icon}
								{$_(w.nameKey)}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<div class="tile-panel-content" class:opacity-0={tilingStore.isEditing}>
			{#if WidgetComponent}
				<svelte:boundary>
					<WidgetComponent />
					{#snippet failed(error, reset)}
						<div class="flex flex-col items-center justify-center p-6 text-center">
							<div class="mb-2 text-2xl">⚠️</div>
							<p class="mb-3 text-sm text-muted-foreground">
								{(error as Error)?.message || 'Widget-Fehler'}
							</p>
							<button
								type="button"
								onclick={reset}
								class="rounded-md bg-muted px-3 py-1 text-xs hover:bg-muted/80"
							>
								Erneut versuchen
							</button>
						</div>
					{/snippet}
				</svelte:boundary>
			{:else}
				<p class="p-4 text-muted-foreground">Unbekanntes Widget: {leaf.widgetType}</p>
			{/if}
		</div>
	</Card>
</div>

<style>
	.tile-panel {
		height: 100%;
		width: 100%;
		min-height: 0;
		min-width: 0;
	}

	.tile-panel-content {
		height: 100%;
		overflow: auto;
		padding: 1rem;
	}

	.tile-edit-overlay {
		position: absolute;
		inset: 0;
		z-index: 10;
		display: flex;
		flex-direction: column;
		border-radius: 0.75rem;
		border: 2px dashed var(--color-primary, #6366f1);
		background: var(--color-background, #fff);
		opacity: 0.95;
	}

	.tile-edit-header {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border-bottom: 1px solid var(--color-border, #e5e7eb);
		cursor: grab;
	}

	.tile-edit-header:active {
		cursor: grabbing;
	}

	.tile-edit-title {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.tile-edit-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.75rem;
		flex: 1;
	}

	.tile-edit-btn {
		padding: 0.375rem 0.75rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		background: var(--color-surface, #f3f4f6);
		color: var(--color-text, #374151);
		transition: background 0.15s;
	}

	.tile-edit-btn:hover {
		background: var(--color-surface-hover, #e5e7eb);
	}

	.tile-edit-btn-danger {
		color: var(--color-destructive, #ef4444);
	}

	.tile-edit-btn-danger:hover {
		background: var(--color-destructive, #ef4444);
		color: white;
	}

	.tile-widget-picker {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.25rem;
		padding: 0.5rem;
		max-height: 200px;
		overflow-y: auto;
		border-top: 1px solid var(--color-border, #e5e7eb);
	}

	.tile-widget-option {
		padding: 0.375rem 0.5rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.7rem;
		text-align: left;
		cursor: pointer;
		background: transparent;
		color: var(--color-text, #374151);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tile-widget-option:hover {
		background: var(--color-surface-hover, #e5e7eb);
	}

	.tile-widget-option.active {
		background: var(--color-primary, #6366f1);
		color: white;
	}
</style>
