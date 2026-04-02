<!--
  PageCarousel — Shared horizontal carousel with drag reorder, minimized tabs, and add button.
  Used by workbench (home) and todo routes.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { Plus, X, ArrowsOut } from '@manacore/shared-icons';
	import type { Snippet } from 'svelte';

	export interface CarouselPage {
		id: string;
		minimized: boolean;
		maximized?: boolean;
		widthPx: number;
		heightPx?: number;
		title: string;
		color: string;
	}

	interface Props {
		pages: CarouselPage[];
		defaultWidth?: number;
		showPicker: boolean;
		onReorder: (fromId: string, toId: string) => void;
		onRestore: (id: string) => void;
		onMaximize: (id: string) => void;
		onRemove: (id: string) => void;
		onTogglePicker: () => void;
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
		addLabel = 'Hinzufügen',
		page: pageSnippet,
		picker,
	}: Props = $props();

	let expandedPages = $derived(pages.filter((p) => !p.minimized));
	let minimizedPages = $derived(pages.filter((p) => p.minimized));

	// ── Drag reorder ────────────────────────────────────────
	let dragId = $state<string | null>(null);

	function handleDragStart(e: DragEvent, id: string) {
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
				draggable={true}
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
				<div class="minimized-tab">
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
		gap: 1.5rem;
		overflow-x: auto;
		padding: 1rem calc(50% - var(--sheet-width) / 2);
		scrollbar-width: none;
		flex: 1;
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
		border: 2px dashed rgba(0, 0, 0, 0.08);
		border-radius: 0.375rem;
		background: transparent;
		color: #9ca3af;
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
		border-color: rgba(0, 0, 0, 0.12);
	}
	.add-card:hover {
		border-color: var(--color-primary, #8b5cf6);
		color: var(--color-primary, #8b5cf6);
		background: color-mix(in srgb, var(--color-primary, #8b5cf6) 4%, transparent);
	}
	:global(.dark) .add-card {
		border-color: rgba(255, 255, 255, 0.06);
		color: #4b5563;
	}
	:global(.dark) .add-card.alone {
		border-color: rgba(255, 255, 255, 0.1);
		color: #6b7280;
	}
	:global(.dark) .add-card:hover {
		border-color: var(--color-primary, #8b5cf6);
		color: var(--color-primary, #8b5cf6);
		background: color-mix(in srgb, var(--color-primary, #8b5cf6) 8%, transparent);
	}
	.add-label {
		font-size: 0.875rem;
		font-weight: 500;
	}

	/* Minimized tabs */
	.minimized-tabs {
		position: fixed;
		bottom: 4.5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 91;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.75rem;
		background: #fffef5;
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		animation: slideUp 0.25s ease-out;
	}
	:global(.dark) .minimized-tabs {
		background: #252220;
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
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
		background: rgba(0, 0, 0, 0.04);
	}
	:global(.dark) .minimized-tab:hover {
		background: rgba(255, 255, 255, 0.06);
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
		color: #374151;
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
		color: var(--color-primary, #8b5cf6);
	}
	:global(.dark) .tab-title {
		color: #e5e7eb;
	}
	:global(.dark) .tab-title:hover {
		color: var(--color-primary, #8b5cf6);
	}
	.tab-maximize,
	.tab-close {
		border: none;
		background: none;
		color: #9ca3af;
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
		color: var(--color-primary, #8b5cf6);
		background: rgba(139, 92, 246, 0.08);
	}
	.tab-close:hover {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.08);
	}
	.tab-add {
		border: none;
		background: none;
		color: #9ca3af;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		transition: all 0.15s;
		margin-left: 0.125rem;
	}
	.tab-add:hover {
		color: var(--color-primary, #8b5cf6);
		background: rgba(139, 92, 246, 0.08);
	}
</style>
