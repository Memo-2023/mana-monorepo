<!--
  PageCarousel — Shared horizontal carousel with drag reorder, minimized tabs, and add button.
  Used by workbench (home) and todo routes.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { Plus, X, ArrowsOut } from '@mana/shared-icons';
	import type { Snippet } from 'svelte';
	import type { CarouselPage } from './types';

	interface Props {
		pages: CarouselPage[];
		defaultWidth?: number;
		showPicker: boolean;
		onReorder: (fromId: string, toId: string) => void;
		onRestore: (id: string) => void;
		onMaximize: (id: string) => void;
		onRemove: (id: string) => void;
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
		onRestore,
		onMaximize,
		onRemove,
		onTogglePicker,
		onTabContextMenu,
		addLabel = 'Hinzufügen',
		page: pageSnippet,
		picker,
	}: Props = $props();

	let expandedPages = $derived(pages.filter((p) => !p.minimized));
	let minimizedPages = $derived(pages.filter((p) => p.minimized));

	// ── Drag reorder ────────────────────────────────────────
	let dragId = $state<string | null>(null);

	function handleDragStart(e: DragEvent, id: string) {
		// Only allow page reorder drag from the drag-handle, not from items inside the page
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

	// ── Picker scroll ───────────────────────────────────────
	let pickerEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (showPicker && pickerEl) {
			pickerEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
		}
	});
</script>

<div class="carousel-root">
	<!-- Carousel track -->
	<div class="fokus-track" style="--sheet-width: {defaultWidth}px">
		{#each expandedPages as p, idx (p.id)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="page-drag-wrapper"
				class:dragging={dragId === p.id}
				ondragstart={(e) => handleDragStart(e, p.id)}
				ondragover={handleDragOver}
				ondrop={(e) => handleDrop(e, p.id)}
				ondragend={handleDragEnd}
			>
				{@render pageSnippet(p, idx)}
			</div>
		{/each}

		<!-- Picker / add button -->
		{#if expandedPages.length === 0}
			<div class="empty-wrapper">
				{#if showPicker && picker}
					{@render picker()}
				{:else}
					<button class="add-card alone" onclick={onTogglePicker}>
						<Plus size={24} />
						<span class="add-label">{addLabel}</span>
					</button>
				{/if}
			</div>
		{:else if showPicker && picker}
			<div bind:this={pickerEl}>
				{@render picker()}
			</div>
		{:else}
			<button class="add-card" onclick={onTogglePicker} title={addLabel}>
				<Plus size={18} />
			</button>
		{/if}
	</div>

	<!-- Minimized tabs -->
	{#if minimizedPages.length > 0}
		<div class="minimized-tabs">
			{#each minimizedPages as p (p.id)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="minimized-tab" oncontextmenu={(e) => onTabContextMenu?.(e, p.id)}>
					<span class="tab-dot" style="background-color: {p.color}"></span>
					<button class="tab-title" onclick={() => onRestore(p.id)}>
						{p.title}
					</button>
					<button class="tab-maximize" onclick={() => onMaximize(p.id)} title="Maximieren">
						<ArrowsOut size={12} />
					</button>
					<button class="tab-close" onclick={() => onRemove(p.id)} title={$_('common.close')}>
						<X size={12} />
					</button>
				</div>
			{/each}
			<button class="tab-add" onclick={onTogglePicker} title={addLabel}>
				<Plus size={14} />
			</button>
		</div>
	{/if}
</div>

<style>
	.carousel-root {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	/* Carousel track */
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

	/* Add button */
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

	/* Minimized tabs */
	.minimized-tabs {
		position: fixed;
		bottom: var(--bottom-chrome-height, 4.5rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 91;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		animation: slideUp 0.25s ease-out;
	}
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
	.minimized-tab {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		transition: background 0.15s;
	}
	.minimized-tab:hover {
		background: hsl(var(--color-surface-hover));
	}
	.tab-dot {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.tab-title {
		border: none;
		background: none;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding: 0;
	}
	.tab-title:hover {
		color: hsl(var(--color-primary));
	}
	.tab-maximize,
	.tab-close {
		border: none;
		background: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		padding: 0.125rem;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		opacity: 0;
		transition: all 0.15s;
	}
	.minimized-tab:hover .tab-maximize,
	.minimized-tab:hover .tab-close {
		opacity: 1;
	}
	.tab-maximize:hover {
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.08);
	}
	.tab-close:hover {
		color: hsl(var(--color-error));
		background: hsl(var(--color-error) / 0.08);
	}
	.tab-add {
		border: none;
		background: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		transition: all 0.15s;
		margin-left: 0.125rem;
	}
	.tab-add:hover {
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.08);
	}
</style>
