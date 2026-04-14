<script lang="ts">
	import { goto } from '$app/navigation';
	import { dragSource } from '../dnd/drag-source';
	import { passiveDropZone } from '../dnd/passive-drop';
	import type { DragPayload, DragType } from '../dnd/types';
	import Pill from './Pill.svelte';

	interface TagItem {
		id: string;
		name: string;
		color: string;
	}

	interface Props {
		/** Available tags to display */
		tags: TagItem[];
		/** Currently selected tag IDs */
		selectedIds: string[];
		/** Called when a tag is toggled */
		onToggle: (tagId: string) => void;
		/** Called when filter is cleared */
		onClear: () => void;
		/** Called when an item (task, card, etc.) is dropped on a tag pill */
		onTagDrop?: (tagId: string, payload: DragPayload) => void;
		/** Drag types accepted for drop-on-tag (default: ['task']) */
		dropAccepts?: DragType[];
		/** Link for "Tags verwalten" pill */
		managementHref?: string;
		/** Loading state */
		loading?: boolean;
		/** Whether to show the "+ Neuer Tag" button */
		showCreateButton?: boolean;
		/** Link for "+ Neuer Tag" pill */
		createHref?: string;
		/** Whether the filter strip below is visible (adjusts bottom position) */
		aboveFilterStrip?: boolean;
		/** Use 'static' when inside a flex container (bottom-stack pattern). Default: 'fixed'. */
		positioning?: 'fixed' | 'static';
	}

	let {
		tags,
		selectedIds,
		onToggle,
		onClear,
		onTagDrop,
		dropAccepts = ['task'],
		managementHref = '/tags',
		loading = false,
		showCreateButton = true,
		createHref,
		aboveFilterStrip = false,
		positioning = 'fixed',
	}: Props = $props();

	const resolvedCreateHref = $derived(createHref ?? managementHref + '?new=true');
	const hasSelectedTags = $derived(selectedIds.length > 0);
	const hasTags = $derived(tags.length > 0);

	const sortedTags = $derived.by(() => {
		return [...tags].sort((a, b) => a.name.localeCompare(b.name, 'de'));
	});

	function isTagSelected(tagId: string): boolean {
		return selectedIds.includes(tagId);
	}
</script>

<div
	class="tag-strip-wrapper"
	class:above-filter-strip={aboveFilterStrip}
	class:tag-strip-static={positioning === 'static'}
>
	<div class="tag-strip-container">
		<!-- Clear Filter Button (always rendered to prevent layout shift) -->
		<div class:hidden={!hasSelectedTags} class="filter-slot">
			<Pill
				icon="x"
				label="Filter"
				danger
				onclick={() => onClear()}
				title="Filter löschen"
				disabled={!hasSelectedTags}
			/>
		</div>

		<!-- Tags verwalten Pill -->
		<Pill
			icon="tag"
			label="Tags verwalten"
			onclick={() => goto(managementHref)}
			title="Tags verwalten"
		/>

		{#if loading}
			<div class="loading-state">Lädt...</div>
		{:else if !hasTags}
			<Pill label="Keine Tags vorhanden — + Erstellen" onclick={() => goto(managementHref)} />
		{:else}
			{#each sortedTags as tag (tag.id)}
				<button
					class="tag-pill"
					class:selected={isTagSelected(tag.id)}
					onclick={() => onToggle(tag.id)}
					title={tag.name}
					style="--tag-color: {tag.color || '#8b5cf6'}"
					use:dragSource={{
						type: 'tag',
						data: () => ({ id: tag.id, name: tag.name, color: tag.color || '#8b5cf6' }),
					}}
					use:passiveDropZone={{
						accepts: dropAccepts,
						onDrop: (payload) => onTagDrop?.(tag.id, payload),
						highlightClass: 'tag-drop-highlight',
						disabled: !onTagDrop,
					}}
				>
					<span class="tag-dot"></span>
					<span class="tag-name">{tag.name}</span>
				</button>
			{/each}

			<!-- Create Tag Button -->
			{#if showCreateButton}
				<Pill
					icon="plus"
					label="Neuer Tag"
					primary
					onclick={() => goto(resolvedCreateHref)}
					title="Neuer Tag"
				/>
			{/if}
		{/if}
	</div>
</div>

<style>
	.tag-strip-wrapper {
		position: fixed;
		bottom: calc(70px + env(safe-area-inset-bottom, 0px));
		left: 0;
		right: 0;
		z-index: 49;
	}

	.tag-strip-static {
		position: relative;
		bottom: auto;
		z-index: auto;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: center;
		pointer-events: none;
		transition: bottom 0.2s ease;
		/* Tight wrapper around 44px pills (see bottomChromeHeight in (app)/+layout.svelte). */
		height: 64px;
	}

	/* When filter strip is also visible, stack above it */
	.tag-strip-wrapper.above-filter-strip {
		bottom: calc(110px + env(safe-area-inset-bottom, 0px));
	}

	.tag-strip-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: transparent;
		pointer-events: auto;
		width: fit-content;
		max-width: 100%;
		margin-left: auto;
		margin-right: auto;
		padding: 0;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		/* Fade edges to indicate scrollable content */
		mask-image: linear-gradient(
			to right,
			transparent 0%,
			black 2rem,
			black calc(100% - 2rem),
			transparent 100%
		);
		-webkit-mask-image: linear-gradient(
			to right,
			transparent 0%,
			black 2rem,
			black calc(100% - 2rem),
			transparent 100%
		);
	}

	.tag-strip-container::-webkit-scrollbar {
		display: none;
	}

	/* Tag pill — matches Pill base, with drag-source and colored dot. */
	.tag-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0 0.875rem;
		height: 44px;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		box-shadow:
			0 1px 2px hsl(0 0% 0% / 0.05),
			0 2px 6px hsl(0 0% 0% / 0.04);
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s ease;
	}

	.tag-pill:hover {
		background: hsl(var(--color-surface-hover, var(--color-card)));
		transform: translateY(-1px);
	}

	.tag-pill.selected {
		background: var(--tag-color) !important;
		border-color: var(--tag-color) !important;
	}

	.tag-pill.selected .tag-dot {
		background-color: white;
	}

	.tag-pill.selected .tag-name {
		color: white;
	}

	.filter-slot.hidden {
		visibility: hidden;
		pointer-events: none;
	}

	.tag-pill:active {
		transform: scale(0.98);
	}

	.tag-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: var(--tag-color);
		flex-shrink: 0;
	}

	.tag-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		white-space: nowrap;
	}

	:global(.dark) .tag-name {
		color: #f3f4f6;
	}

	.loading-state {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		padding: 0.5rem;
	}

	/* DnD: Tag is being dragged */
	:global(.tag-pill.mana-drag-source-active) {
		opacity: 0.5;
		transform: scale(0.95) !important;
	}

	/* DnD: Success flash after drop */
	:global(.tag-pill.mana-passive-zone-success) {
		animation: tag-drop-success 400ms ease-out;
	}

	@keyframes tag-drop-success {
		0% {
			transform: scale(1.2);
		}
		50% {
			transform: scale(0.95);
		}
		100% {
			transform: scale(1);
		}
	}

	/* Responsive */
	@media (max-width: 640px) {
		.tag-strip-wrapper {
			left: 0;
			right: 0;
		}

		.tag-strip-container {
			padding: 0;
		}
	}
</style>
