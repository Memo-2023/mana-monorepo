<!--
  PageCarousel — Shared horizontal carousel with drag reorder and add button.
  The scene+app bar is rendered in the layout's bottom-stack via bottomBarStore.
-->
<script lang="ts">
	import { Plus } from '@mana/shared-icons';
	import type { Snippet } from 'svelte';
	import type { CarouselPage } from './types';

	interface Props {
		pages: CarouselPage[];
		defaultWidth?: number;
		showPicker: boolean;
		onReorder: (fromId: string, toId: string) => void;
		onMaximize?: (id: string) => void;
		onRemove?: (id: string) => void;
		onTogglePicker: () => void;
		onTabContextMenu?: (e: MouseEvent, pageId: string) => void;
		addLabel?: string;
		page: Snippet<[CarouselPage, number]>;
		picker?: Snippet;
	}

	let {
		pages,
		defaultWidth = 480,
		showPicker,
		onReorder,
		onMaximize: _onMaximize,
		onRemove: _onRemove,
		onTogglePicker,
		onTabContextMenu: _onTabContextMenu,
		addLabel = 'Hinzufügen',
		page: pageSnippet,
		picker,
	}: Props = $props();

	let dragId = $state<string | null>(null);

	function handleDragStart(e: DragEvent, id: string) {
		const target = e.target as HTMLElement;
		if (!target.closest('.drag-handle')) {
			e.preventDefault();
			return;
		}
		dragId = id;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', id);
		}
	}
	function handleDragOver(e: DragEvent) {
		if (!dragId) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}
	function handleDrop(e: DragEvent, targetId: string) {
		e.preventDefault();
		if (!dragId || dragId === targetId) return;
		onReorder(dragId, targetId);
		dragId = null;
	}
	function handleDragEnd() {
		dragId = null;
	}

	let pickerEl = $state<HTMLDivElement | null>(null);
	$effect(() => {
		if (showPicker && pickerEl)
			pickerEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
	});
</script>

<div class="carousel-root">
	<div class="fokus-track" style="--sheet-width: {defaultWidth}px">
		{#each pages as p, idx (p.id)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="page-drag-wrapper"
				class:dragging={dragId === p.id}
				data-page-id={p.id}
				ondragstart={(e) => handleDragStart(e, p.id)}
				ondragover={handleDragOver}
				ondrop={(e) => handleDrop(e, p.id)}
				ondragend={handleDragEnd}
			>
				{@render pageSnippet(p, idx)}
			</div>
		{/each}

		{#if pages.length === 0}
			<div class="empty-wrapper">
				{#if showPicker && picker}
					{@render picker()}
				{:else}
					<button class="add-card alone" onclick={onTogglePicker}>
						<Plus size={24} /><span class="add-label">{addLabel}</span>
					</button>
				{/if}
			</div>
		{:else if showPicker && picker}
			<div bind:this={pickerEl}>{@render picker()}</div>
		{:else}
			<button class="add-card" onclick={onTogglePicker} title={addLabel}><Plus size={18} /></button>
		{/if}
	</div>
</div>

<style>
	.carousel-root {
		display: flex;
		flex-direction: column;
		flex: 1;
	}
	.fokus-track {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		padding: 0.5rem 2rem 0.5rem calc(50vw - 240px);
		scrollbar-width: none;
		flex: 1;
	}
	@media (max-width: 639px) {
		.fokus-track {
			padding: 0.5rem 1rem;
			gap: 0.75rem;
		}
	}
	.fokus-track::-webkit-scrollbar {
		display: none;
	}
	.page-drag-wrapper {
		flex: 0 0 auto;
		transition: opacity 0.15s;
	}
	.page-drag-wrapper.dragging {
		opacity: 0.4;
	}
	.add-card {
		flex: 0 0 auto;
		width: 48px;
		align-self: stretch;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		border: 2px dashed hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.2s;
	}
	.empty-wrapper {
		flex: 0 0 auto;
		width: var(--sheet-width, 480px);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
	}
	.add-card.alone {
		width: 100%;
		min-height: 60vh;
		border-color: hsl(var(--color-border-strong));
	}
	.add-card:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
		background: color-mix(in srgb, hsl(var(--color-primary)) 4%, transparent);
	}
	.add-label {
		font-size: 0.875rem;
		font-weight: 500;
	}
</style>
