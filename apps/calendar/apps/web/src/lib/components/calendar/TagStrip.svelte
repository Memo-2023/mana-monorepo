<script lang="ts">
	import { getContext } from 'svelte';
	import type { Tag } from '@manacore/shared-tags';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { goto } from '$app/navigation';
	import { DotsThree, Plus, X } from '@manacore/shared-icons';
	import TagStripModal from './TagStripModal.svelte';

	// Live tags from layout context
	const tagsCtx: { readonly value: Tag[] } = getContext('tags');

	let showModal = $state(false);

	function handleTagClick(tagId: string) {
		settingsStore.toggleTagSelection(tagId);
	}

	function isTagSelected(tagId: string): boolean {
		return settingsStore.isTagSelected(tagId);
	}

	const hasSelectedTags = $derived(settingsStore.hasSelectedTags);

	function handleOpenModal() {
		showModal = true;
	}

	function handleCloseModal() {
		showModal = false;
	}

	const sortedTags = $derived.by(() => {
		return [...tagsCtx.value].sort((a, b) => a.name.localeCompare(b.name, 'de'));
	});

	const hasTags = $derived(tagsCtx.value.length > 0);
</script>

<div class="tag-strip-wrapper">
	<div class="tag-strip-container">
		<!-- Clear Filter Button (always rendered to prevent layout shift) -->
		<button
			class="clear-filter-pill glass-tag"
			class:hidden={!hasSelectedTags}
			onclick={() => settingsStore.clearTagSelection()}
			title="Filter löschen"
			disabled={!hasSelectedTags}
		>
			<X size={16} weight="bold" />
			<span class="tag-name">Filter</span>
		</button>

		<!-- More Pill (opens modal) -->
		<button class="more-pill glass-tag" onclick={handleOpenModal} title="Alle Tags anzeigen">
			<DotsThree size={18} weight="bold" />
			<span class="tag-name">Alle Tags</span>
		</button>

		{#if !hasTags}
			<button class="empty-state glass-tag" onclick={() => goto('/tags')}>
				<span>Keine Tags vorhanden</span>
				<span class="add-hint">+ Erstellen</span>
			</button>
		{:else}
			{#each sortedTags as tag (tag.id)}
				<button
					class="tag-pill glass-tag"
					class:selected={isTagSelected(tag.id)}
					onclick={() => handleTagClick(tag.id)}
					title={tag.name}
					style="--tag-color: {tag.color || '#3b82f6'}"
				>
					<span class="tag-dot"></span>
					<span class="tag-name">{tag.name}</span>
				</button>
			{/each}

			<!-- Create Tag Button -->
			<button
				class="create-pill glass-tag"
				onclick={() => goto('/tags?new=true')}
				title="Neuer Tag"
			>
				<Plus size={16} weight="bold" />
				<span class="tag-name">Neuer Tag</span>
			</button>
		{/if}
	</div>
</div>

<!-- Tags Modal -->
<TagStripModal visible={showModal} onClose={handleCloseModal} />

<style>
	.tag-strip-wrapper {
		position: fixed;
		bottom: calc(70px + env(safe-area-inset-bottom, 0px)); /* Directly above PillNav */
		left: 0;
		right: 0;
		z-index: 49; /* Above other strips */
		display: flex;
		flex-direction: column;
		align-items: stretch;
		pointer-events: none;
		transition: bottom 0.2s ease;
	}

	.tag-strip-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: transparent;
		pointer-events: auto;
		/* Center when content fits, left-align and scroll when it overflows */
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
	.more-pill,
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

	/* Hidden state for clear filter pill (prevents layout shift) */
	.clear-filter-pill.hidden {
		visibility: hidden;
		pointer-events: none;
	}

	/* More pill with neutral style */
	.more-pill {
		color: #374151;
	}

	.more-pill .tag-name {
		color: #374151;
		font-weight: 500;
	}

	:global(.dark) .more-pill {
		color: #f3f4f6;
	}

	:global(.dark) .more-pill .tag-name {
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

	/* Glass tag styling - same as PillNavigation pills */
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
		color: #3b82f6;
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
