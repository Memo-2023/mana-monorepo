<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { eventTagsStore } from '$lib/stores/event-tags.svelte';
	import { eventTagGroupsStore } from '$lib/stores/event-tag-groups.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { DotsThree, Plus } from '@manacore/shared-icons';
	import TagStripModal from './TagStripModal.svelte';

	interface Props {
		isSidebarMode?: boolean;
	}

	let { isSidebarMode = false }: Props = $props();

	let showModal = $state(false);

	function handleTagClick(tagId: string) {
		// Navigate to tags page with the tag selected for editing
		goto(`/tags?edit=${tagId}`);
	}

	function handleOpenModal() {
		showModal = true;
	}

	function handleCloseModal() {
		showModal = false;
	}

	// Sort tags by group, then by name
	const sortedTags = $derived.by(() => {
		const tags = [...eventTagsStore.tags];
		const groupOrder = new Map(eventTagGroupsStore.groups.map((g, i) => [g.id, i]));

		return tags.sort((a, b) => {
			// Ungrouped tags go last
			const aOrder = a.groupId ? (groupOrder.get(a.groupId) ?? 999) : 1000;
			const bOrder = b.groupId ? (groupOrder.get(b.groupId) ?? 999) : 1000;

			if (aOrder !== bOrder) return aOrder - bOrder;
			return a.name.localeCompare(b.name, 'de');
		});
	});

	const hasTags = $derived(eventTagsStore.tags.length > 0);

	onMount(async () => {
		// Fetch tags and groups if not already loaded
		if (eventTagsStore.tags.length === 0) {
			await eventTagsStore.fetchTags();
		}
		if (eventTagGroupsStore.groups.length === 0) {
			await eventTagGroupsStore.fetchGroups();
		}
	});
</script>

<div class="tag-strip-wrapper" class:sidebar-mode={isSidebarMode}>
	<div class="tag-strip-container">
		<!-- More Pill (opens modal) -->
		<button class="more-pill glass-tag" onclick={handleOpenModal} title="Alle Tags anzeigen">
			<DotsThree size={18} weight="bold" />
			<span class="tag-name">Mehr</span>
		</button>

		{#if eventTagsStore.loading}
			<div class="loading-state">Lädt...</div>
		{:else if !hasTags}
			<button class="empty-state glass-tag" onclick={() => goto('/tags')}>
				<span>Keine Tags vorhanden</span>
				<span class="add-hint">+ Erstellen</span>
			</button>
		{:else}
			{#each sortedTags as tag (tag.id)}
				<button
					class="tag-pill glass-tag"
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
			</button>
		{/if}
	</div>
</div>

<!-- Tags Modal -->
<TagStripModal visible={showModal} onClose={handleCloseModal} {isSidebarMode} />

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

	/* When PillNav is in sidebar mode, TagStrip at very bottom */
	.tag-strip-wrapper.sidebar-mode {
		bottom: calc(0px + env(safe-area-inset-bottom, 0px));
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
	.create-pill {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s ease;
	}

	/* More pill with muted style */
	.more-pill {
		color: #6b7280;
	}

	.more-pill .tag-name {
		color: #6b7280;
		font-weight: 600;
	}

	:global(.dark) .more-pill {
		color: #9ca3af;
	}

	:global(.dark) .more-pill .tag-name {
		color: #9ca3af;
	}

	/* Create pill with primary accent */
	.create-pill {
		color: #3b82f6;
		padding: 0.5rem !important;
	}

	:global(.dark) .create-pill {
		color: #60a5fa;
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
