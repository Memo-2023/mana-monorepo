<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/auth';
	import { tags, tagUsageCounts } from '$lib/stores/tags';
	import { selectedTagId } from '$lib/stores/memos';
	import { tagService } from '$lib/services/tagService';
	import TagBadge from '$lib/components/TagBadge.svelte';
	import TagEditModal from '$lib/components/TagEditModal.svelte';
	import { TagsPageSkeleton } from '$lib/components/skeletons';
	import type { Tag } from '$lib/types/memo.types';

	// Loading and error states
	let isLoadingTags = $state(true);
	let isLoadingUsageCounts = $state(false);
	let loadError = $state<string | null>(null);
	let actionError = $state<string | null>(null);

	// Operation loading states
	let isCreatingTag = $state(false);

	// UI state
	let isCreating = $state(false);
	let newTagName = $state('');
	let newTagColor = $state('#3b82f6');

	// Modal state
	let editingTag = $state<(Tag & { usage?: number }) | null>(null);
	let isModalOpen = $state(false);

	// Load tags and usage counts on mount
	onMount(async () => {
		if (!$user) {
			loadError = 'User not authenticated';
			isLoadingTags = false;
			return;
		}

		await loadTags();
	});

	async function loadTags() {
		try {
			isLoadingTags = true;
			loadError = null;

			const loadedTags = await tagService.getTags($user!.id);
			tags.setTags(loadedTags);

			// Load usage counts for all tags
			await loadUsageCounts(loadedTags);
		} catch (error) {
			console.error('Failed to load tags:', error);
			loadError = error instanceof Error ? error.message : 'Failed to load tags';
		} finally {
			isLoadingTags = false;
		}
	}

	async function loadUsageCounts(tagsToLoad: Tag[]) {
		if (tagsToLoad.length === 0) return;

		try {
			isLoadingUsageCounts = true;
			const counts: Record<string, number> = {};

			await Promise.all(
				tagsToLoad.map(async (tag) => {
					try {
						const count = await tagService.getTagUsageCount(tag.id);
						counts[tag.id] = count;
					} catch (error) {
						console.error(`Failed to load usage count for tag ${tag.id}:`, error);
						counts[tag.id] = 0;
					}
				})
			);

			tagUsageCounts.set(counts);
		} catch (error) {
			console.error('Failed to load usage counts:', error);
		} finally {
			isLoadingUsageCounts = false;
		}
	}

	async function handleCreateTag(event: Event) {
		event.preventDefault();
		if (!$user || !newTagName.trim()) return;

		try {
			isCreatingTag = true;
			actionError = null;

			const createdTag = await tagService.createTag($user.id, newTagName.trim(), newTagColor);

			// Optimistic UI update
			tags.addTag(createdTag);

			// Load usage count for new tag
			const count = await tagService.getTagUsageCount(createdTag.id);
			tagUsageCounts.update((counts) => ({ ...counts, [createdTag.id]: count }));

			resetCreateForm();
		} catch (error) {
			console.error('Failed to create tag:', error);
			actionError = error instanceof Error ? error.message : 'Failed to create tag';
		} finally {
			isCreatingTag = false;
		}
	}

	async function handleSaveTag(tagId: string, name: string, color: string) {
		try {
			actionError = null;

			const updatedTag = await tagService.updateTag(tagId, {
				name: name.trim(),
				color: color,
			});

			// Optimistic UI update
			tags.updateTag(tagId, updatedTag);
		} catch (error) {
			console.error('Failed to update tag:', error);
			actionError = error instanceof Error ? error.message : 'Fehler beim Speichern des Tags';
		}
	}

	async function handleDeleteTag(tagId: string) {
		try {
			actionError = null;

			// Optimistic UI update
			tags.deleteTag(tagId);
			tagUsageCounts.update((counts) => {
				const { [tagId]: _, ...rest } = counts;
				return rest;
			});

			await tagService.deleteTag(tagId);
		} catch (error) {
			console.error('Failed to delete tag:', error);
			actionError = error instanceof Error ? error.message : 'Fehler beim Löschen des Tags';

			// Revert optimistic update by reloading
			await loadTags();
		}
	}

	function openEditModal(tag: Tag) {
		editingTag = tag;
		isModalOpen = true;
	}

	function closeModal() {
		editingTag = null;
		isModalOpen = false;
	}

	function handleTagClick(tagId: string) {
		// Set the selected tag filter
		selectedTagId.set(tagId);
		// Navigate to dashboard to show filtered memos
		goto('/dashboard');
	}

	function resetCreateForm() {
		newTagName = '';
		newTagColor = '#3b82f6';
		isCreating = false;
		actionError = null;
	}

	const colorPresets = [
		'#3b82f6', // blue
		'#10b981', // green
		'#f59e0b', // amber
		'#ef4444', // red
		'#8b5cf6', // violet
		'#ec4899', // pink
		'#06b6d4', // cyan
		'#84cc16', // lime
		'#f97316', // orange
		'#6366f1', // indigo
	];
</script>

<svelte:head>
	<title>Tags - Memoro</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Content Area -->
	<div class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-5xl space-y-6 pb-12">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-theme">Tags</h1>
					<p class="mt-1 text-theme-secondary">Organisiere deine Memos mit Tags</p>
				</div>
				{#if !isCreating && !isLoadingTags}
					<button
						onclick={() => (isCreating = true)}
						class="btn-primary flex h-12 items-center gap-2 px-6"
						disabled={isCreatingTag}
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Tag erstellen
					</button>
				{/if}
			</div>

			<!-- Loading State -->
			{#if isLoadingTags}
				<TagsPageSkeleton tagCount={12} />
			{:else if loadError}
				<!-- Error State -->
				<div class="rounded-xl bg-content p-6">
					<div class="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
						<p class="mb-2 font-semibold">Fehler beim Laden der Tags</p>
						<p>{loadError}</p>
						<button onclick={loadTags} class="btn-secondary mt-3"> Erneut versuchen </button>
					</div>
				</div>
			{:else}
				<!-- Action Error -->
				{#if actionError}
					<div class="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
						{actionError}
					</div>
				{/if}

				<!-- Create Tag Form -->
				{#if isCreating}
					<form onsubmit={handleCreateTag} class="rounded-xl bg-content p-6 border border-theme">
						<h2 class="mb-6 text-xl font-semibold text-theme">Neuen Tag erstellen</h2>

						<div class="mb-6">
							<label for="name" class="mb-2 block text-sm font-medium text-theme">Tag-Name</label>
							<input
								type="text"
								id="name"
								bind:value={newTagName}
								required
								disabled={isCreatingTag}
								class="w-full rounded-lg border border-theme bg-menu px-4 py-2 text-theme focus:border-mana focus:outline-none focus:ring-2 focus:ring-mana/20 disabled:cursor-not-allowed disabled:opacity-50"
								placeholder="Tag-Name eingeben..."
							/>
						</div>

						<div class="mb-6">
							<label class="mb-2 block text-sm font-medium text-theme">Farbe</label>
							<div class="flex flex-wrap gap-3">
								{#each colorPresets as color}
									<button
										type="button"
										onclick={() => (newTagColor = color)}
										disabled={isCreatingTag}
										class="h-10 w-10 rounded-full border-2 transition-all hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
										class:border-black={newTagColor === color}
										class:ring-2={newTagColor === color}
										class:ring-mana={newTagColor === color}
										class:border-theme={newTagColor !== color}
										style="background-color: {color}"
										title={color}
									></button>
								{/each}
								<input
									type="color"
									bind:value={newTagColor}
									disabled={isCreatingTag}
									class="h-10 w-16 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
								/>
							</div>
						</div>

						<!-- Preview -->
						<div class="mb-6">
							<label class="mb-2 block text-sm font-medium text-theme">Vorschau</label>
							<div class="flex items-center justify-center rounded-lg bg-menu p-4">
								<div
									class="inline-flex items-center gap-2 rounded-full border-2 px-5 py-3 text-base font-medium"
									style="background-color: {newTagColor}20; color: {newTagColor}; border-color: {newTagColor}40"
								>
									<div class="h-4 w-4 rounded-full" style="background-color: {newTagColor}"></div>
									{newTagName || 'Tag-Name'}
								</div>
							</div>
						</div>

						<div class="flex gap-3">
							<button
								type="submit"
								class="btn-primary flex h-12 flex-1 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={isCreatingTag || !newTagName.trim()}
							>
								{#if isCreatingTag}
									Erstelle...
								{:else}
									Tag erstellen
								{/if}
							</button>
							<button
								type="button"
								onclick={resetCreateForm}
								class="btn-secondary flex h-12 flex-1 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={isCreatingTag}
							>
								Abbrechen
							</button>
						</div>
					</form>
				{/if}

				<!-- Tags List -->
				{#if $tags.length === 0}
					<div class="rounded-xl bg-content p-12 text-center">
						<div class="mb-4 text-6xl">🏷️</div>
						<h2 class="mb-2 text-2xl font-semibold text-theme">Noch keine Tags</h2>
						<p class="mb-6 text-theme-secondary">
							Erstelle deinen ersten Tag, um deine Memos zu organisieren
						</p>
						<button
							onclick={() => (isCreating = true)}
							class="btn-primary inline-flex h-12 items-center gap-2 px-6"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4v16m8-8H4"
								/>
							</svg>
							Ersten Tag erstellen
						</button>
					</div>
				{:else}
					<div class="flex flex-wrap gap-4">
						{#each $tags as tag (tag.id)}
							{@const tagColor = tag.style?.color || tag.color || '#3b82f6'}
							<div
								class="group inline-flex items-center gap-2 rounded-full border-2 px-5 py-3 text-base font-medium transition-all hover:brightness-[1.4] cursor-pointer"
								style="background-color: {tagColor}20; color: {tagColor}; border-color: {tagColor}40"
							>
								<!-- Color indicator dot -->
								<div class="h-4 w-4 rounded-full" style="background-color: {tagColor}"></div>

								<button
									type="button"
									onclick={() => handleTagClick(tag.id)}
									class="transition-opacity hover:opacity-80"
									title="Memos mit diesem Tag anzeigen"
								>
									{tag.name || tag.text}
								</button>
								<button
									type="button"
									onclick={(e) => {
										e.stopPropagation();
										openEditModal({ ...tag, usage: $tagUsageCounts[tag.id] || 0 });
									}}
									class="rounded-full p-1 transition-all hover:scale-110 hover:bg-white/20"
									title="Tag bearbeiten"
								>
									<svg
										class="h-4 w-4 transition-transform"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
										/>
									</svg>
								</button>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

<!-- Edit Modal -->
{#if editingTag && isModalOpen}
	<TagEditModal
		tag={editingTag}
		isOpen={isModalOpen}
		onClose={closeModal}
		onSave={handleSaveTag}
		onDelete={handleDeleteTag}
	/>
{/if}
