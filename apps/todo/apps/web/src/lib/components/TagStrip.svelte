<script lang="ts">
	import { getContext } from 'svelte';
	import type { Tag } from '@manacore/shared-tags';
	import { viewStore } from '$lib/stores/view.svelte';
	import { goto } from '$app/navigation';
	import { DotsThree, Plus, X } from '@manacore/shared-icons';
	import TagStripModal from './TagStripModal.svelte';
	import { t } from 'svelte-i18n';

	const tagsCtx: { readonly value: Tag[] } = getContext('tags');

	interface Props {
		/** Whether the filter strip below is visible (affects vertical position) */
		filterStripVisible?: boolean;
	}

	let { filterStripVisible = false }: Props = $props();

	let showModal = $state(false);

	function handleTagClick(tagId: string) {
		const current = viewStore.filterLabelIds;
		if (current.includes(tagId)) {
			viewStore.setFilterLabelIds(current.filter((id) => id !== tagId));
		} else {
			viewStore.setFilterLabelIds([...current, tagId]);
		}
	}

	function isTagSelected(tagId: string): boolean {
		return viewStore.filterLabelIds.includes(tagId);
	}

	const hasSelectedTags = $derived(viewStore.filterLabelIds.length > 0);

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

<div class="tag-strip-wrapper" class:above-filter-strip={filterStripVisible}>
	<div class="tag-strip-container">
		<!-- Clear Filter Button (always rendered to prevent layout shift) -->
		<button
			class="clear-filter-pill glass-tag"
			class:hidden={!hasSelectedTags}
			onclick={() => viewStore.setFilterLabelIds([])}
			title={$t('filters.clearFilter')}
			disabled={!hasSelectedTags}
		>
			<X size={16} weight="bold" />
			<span class="tag-name">Filter</span>
		</button>

		<!-- More Pill (opens modal) -->
		<button class="more-pill glass-tag" onclick={handleOpenModal} title={$t('tags.showAllTags')}>
			<DotsThree size={18} weight="bold" />
			<span class="tag-name">{$t('tags.allTags')}</span>
		</button>

		{#if !hasTags}
			<button class="empty-state glass-tag" onclick={() => goto('/tags')}>
				<span>{$t('tags.noTagsAvailable')}</span>
				<span class="add-hint">{$t('tags.createShort')}</span>
			</button>
		{:else}
			{#each sortedTags as tag (tag.id)}
				<button
					class="tag-pill glass-tag"
					class:selected={isTagSelected(tag.id)}
					onclick={() => handleTagClick(tag.id)}
					title={tag.name}
					style="--tag-color: {tag.color || '#8b5cf6'}"
				>
					<span class="tag-dot"></span>
					<span class="tag-name">{tag.name}</span>
				</button>
			{/each}

			<!-- Create Tag Button -->
			<button
				class="create-pill glass-tag"
				onclick={() => goto('/tags?new=true')}
				title={$t('tags.newTag')}
			>
				<Plus size={16} weight="bold" />
				<span class="tag-name">{$t('tags.newTag')}</span>
			</button>
		{/if}
	</div>
</div>

<!-- Tags Modal -->
<TagStripModal visible={showModal} onClose={handleCloseModal} />

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
		color: var(--color-error);
		background: color-mix(in srgb, var(--color-error) 10%, transparent) !important;
		border-color: color-mix(in srgb, var(--color-error) 30%, transparent) !important;
	}

	.clear-filter-pill .tag-name {
		color: var(--color-error);
		font-weight: 600;
	}

	.clear-filter-pill:hover:not(.hidden) {
		background: color-mix(in srgb, var(--color-error) 20%, transparent) !important;
		border-color: color-mix(in srgb, var(--color-error) 50%, transparent) !important;
	}

	.clear-filter-pill.hidden {
		visibility: hidden;
		pointer-events: none;
	}

	/* More pill with neutral style */
	.more-pill {
		color: var(--color-foreground);
	}

	.more-pill .tag-name {
		color: var(--color-foreground);
		font-weight: 500;
	}

	/* Create pill with neutral style */
	.create-pill {
		color: var(--color-foreground);
	}

	.create-pill .tag-name {
		color: var(--color-foreground);
		font-weight: 500;
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
		color: var(--color-foreground);
		white-space: nowrap;
	}

	.loading-state {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
		padding: 0.5rem;
	}

	.empty-state {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.add-hint {
		font-size: 0.875rem;
		color: var(--color-primary);
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
