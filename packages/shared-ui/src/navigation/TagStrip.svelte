<script lang="ts">
	import { goto } from '$app/navigation';
	import { Tag, Plus, X } from '@manacore/shared-icons';

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
	}

	let {
		tags,
		selectedIds,
		onToggle,
		onClear,
		managementHref = '/tags',
		loading = false,
		showCreateButton = true,
		createHref,
		aboveFilterStrip = false,
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

<div class="tag-strip-wrapper" class:above-filter-strip={aboveFilterStrip}>
	<div class="tag-strip-container">
		<!-- Clear Filter Button (always rendered to prevent layout shift) -->
		<button
			class="clear-filter-pill glass-tag"
			class:hidden={!hasSelectedTags}
			onclick={() => onClear()}
			title="Filter löschen"
			disabled={!hasSelectedTags}
		>
			<X size={16} weight="bold" />
			<span class="tag-name">Filter</span>
		</button>

		<!-- Tags verwalten Pill -->
		<button
			class="manage-pill glass-tag"
			onclick={() => goto(managementHref)}
			title="Tags verwalten"
		>
			<Tag size={18} weight="bold" />
			<span class="tag-name">Tags verwalten</span>
		</button>

		{#if loading}
			<div class="loading-state">Lädt...</div>
		{:else if !hasTags}
			<button class="empty-state glass-tag" onclick={() => goto(managementHref)}>
				<span>Keine Tags vorhanden</span>
				<span class="add-hint">+ Erstellen</span>
			</button>
		{:else}
			{#each sortedTags as tag (tag.id)}
				<button
					class="tag-pill glass-tag"
					class:selected={isTagSelected(tag.id)}
					onclick={() => onToggle(tag.id)}
					title={tag.name}
					style="--tag-color: {tag.color || '#8b5cf6'}"
				>
					<span class="tag-dot"></span>
					<span class="tag-name">{tag.name}</span>
				</button>
			{/each}

			<!-- Create Tag Button -->
			{#if showCreateButton}
				<button
					class="create-pill glass-tag"
					onclick={() => goto(resolvedCreateHref)}
					title="Neuer Tag"
				>
					<Plus size={16} weight="bold" />
					<span class="tag-name">Neuer Tag</span>
				</button>
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
		display: flex;
		flex-direction: column;
		align-items: stretch;
		pointer-events: none;
		transition: bottom 0.2s ease;
	}

	/* When filter strip is also visible, stack above it */
	.tag-strip-wrapper.above-filter-strip {
		bottom: calc(110px + env(safe-area-inset-bottom, 0px));
	}

	.tag-strip-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: transparent;
		pointer-events: auto;
		width: fit-content;
		max-width: 100%;
		margin-left: auto;
		margin-right: auto;
		padding: 0.5rem 2rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.tag-strip-container::-webkit-scrollbar {
		display: none;
	}

	.tag-pill,
	.manage-pill,
	.create-pill,
	.clear-filter-pill {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s ease;
	}

	/* Selected tag state */
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

	/* Clear filter pill */
	.clear-filter-pill {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.1) !important;
		border-color: rgba(239, 68, 68, 0.3) !important;
	}

	.clear-filter-pill .tag-name {
		color: #ef4444;
		font-weight: 600;
	}

	:global(.dark) .clear-filter-pill {
		color: #f87171;
		background: rgba(239, 68, 68, 0.15) !important;
		border-color: rgba(239, 68, 68, 0.3) !important;
	}

	:global(.dark) .clear-filter-pill .tag-name {
		color: #f87171;
	}

	.clear-filter-pill:hover:not(.hidden) {
		background: rgba(239, 68, 68, 0.2) !important;
		border-color: rgba(239, 68, 68, 0.5) !important;
	}

	.clear-filter-pill.hidden {
		visibility: hidden;
		pointer-events: none;
	}

	/* Manage pill with neutral style */
	.manage-pill {
		color: #374151;
	}

	.manage-pill .tag-name {
		color: #374151;
		font-weight: 500;
	}

	:global(.dark) .manage-pill {
		color: #f3f4f6;
	}

	:global(.dark) .manage-pill .tag-name {
		color: #f3f4f6;
	}

	/* Create pill with neutral style */
	.create-pill {
		color: #374151;
	}

	.create-pill .tag-name {
		color: #374151;
		font-weight: 500;
	}

	:global(.dark) .create-pill {
		color: #f3f4f6;
	}

	:global(.dark) .create-pill .tag-name {
		color: #f3f4f6;
	}

	/* Glass tag styling */
	.glass-tag {
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .glass-tag {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.glass-tag:hover {
		transform: scale(1.05);
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .glass-tag:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.glass-tag:active {
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
		font-size: 0.9375rem;
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

	.empty-state {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		color: #6b7280;
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	:global(.dark) .empty-state {
		color: #9ca3af;
	}

	.add-hint {
		font-size: 0.875rem;
		color: #8b5cf6;
		font-weight: 500;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.tag-strip-wrapper {
			left: 0;
			right: 0;
		}

		.tag-strip-container {
			padding: 0.5rem 1rem;
		}
	}
</style>
