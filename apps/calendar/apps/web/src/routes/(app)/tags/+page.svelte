<script lang="ts">
	import { onMount } from 'svelte';
	import { Modal, Input, TagColorPicker, TagBadge } from '@manacore/shared-ui';
	import { MagnifyingGlass, Plus, CaretLeft } from '@manacore/shared-icons';
	import { eventTagsStore } from '$lib/stores/event-tags.svelte';
	import type { EventTag } from '@calendar/shared';

	let searchQuery = $state('');
	let showTagModal = $state(false);
	let editingTag = $state<EventTag | null>(null);

	// Filtered tags based on search, sorted alphabetically
	const filteredTags = $derived.by(() => {
		const sorted = [...eventTagsStore.tags].sort((a, b) => a.name.localeCompare(b.name, 'de'));
		if (!searchQuery.trim()) return sorted;
		const query = searchQuery.toLowerCase();
		return sorted.filter((t) => t.name.toLowerCase().includes(query));
	});

	// Form state
	let tagName = $state('');
	let tagColor = $state('#3B82F6');

	const DEFAULT_COLOR = '#3B82F6';

	$effect(() => {
		if (showTagModal) {
			tagName = editingTag?.name ?? '';
			tagColor = editingTag?.color ?? DEFAULT_COLOR;
		}
	});

	function openCreateTagModal() {
		editingTag = null;
		showTagModal = true;
	}

	function openEditTagModal(tag: EventTag) {
		editingTag = tag;
		showTagModal = true;
	}

	function closeTagModal() {
		showTagModal = false;
		editingTag = null;
	}

	async function handleSaveTag() {
		if (!tagName.trim()) return;

		try {
			if (editingTag) {
				await eventTagsStore.updateTag(editingTag.id, {
					name: tagName.trim(),
					color: tagColor,
				});
			} else {
				await eventTagsStore.createTag({
					name: tagName.trim(),
					color: tagColor,
				});
			}
			closeTagModal();
		} catch (e) {
			console.error('Failed to save tag:', e);
		}
	}

	async function handleDeleteTag() {
		if (!editingTag) return;

		if (!confirm(`Tag "${editingTag.name}" wirklich löschen?`)) return;

		try {
			await eventTagsStore.deleteTag(editingTag.id);
			closeTagModal();
		} catch (e) {
			console.error('Failed to delete tag:', e);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && tagName.trim()) {
			e.preventDefault();
			handleSaveTag();
		}
	}

	const previewTag = $derived({ name: tagName || 'Tag Name', color: tagColor });

	onMount(async () => {
		if (eventTagsStore.tags.length === 0) {
			await eventTagsStore.fetchTags();
		}
	});
</script>

<svelte:head>
	<title>Tags - Kalender</title>
</svelte:head>

<div class="page-container">
	<!-- Header -->
	<header class="header">
		<a href="/" class="back-button" aria-label="Zurück">
			<CaretLeft size={20} weight="bold" />
		</a>
		<h1 class="title">Tags</h1>
		<button onclick={openCreateTagModal} class="add-button" aria-label="Neues Tag">
			<Plus size={20} weight="bold" />
		</button>
	</header>

	<!-- Search -->
	<div class="search-wrapper">
		<MagnifyingGlass size={20} class="search-icon" />
		<input
			type="text"
			placeholder="Tags durchsuchen..."
			bind:value={searchQuery}
			class="search-input"
		/>
	</div>

	{#if eventTagsStore.error}
		<div class="error-banner" role="alert">
			<span>{eventTagsStore.error}</span>
		</div>
	{/if}

	<!-- Tag List -->
	{#if eventTagsStore.loading}
		<div class="flex justify-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	{:else if filteredTags.length === 0}
		<div class="text-center py-12">
			<div class="text-muted-foreground mb-2">
				{searchQuery ? 'Keine Tags gefunden' : 'Keine Tags vorhanden'}
			</div>
		</div>
	{:else}
		<div class="tags-list">
			{#each filteredTags as tag (tag.id)}
				<button type="button" class="tag-item" onclick={() => openEditTagModal(tag)}>
					<div class="tag-color" style="background-color: {tag.color}"></div>
					<span class="tag-label">{tag.name}</span>
				</button>
			{/each}
		</div>
	{/if}

	{#if !eventTagsStore.loading && eventTagsStore.tags.length > 0}
		<p class="tags-count">
			{eventTagsStore.tags.length}
			{eventTagsStore.tags.length === 1 ? 'Tag' : 'Tags'}
		</p>
	{/if}

	{#if !eventTagsStore.loading && eventTagsStore.tags.length === 0 && !searchQuery}
		<div class="empty-cta">
			<button onclick={openCreateTagModal} class="btn btn-primary">
				<Plus size={16} weight="bold" />
				Neues Tag
			</button>
		</div>
	{/if}
</div>

<!-- Tag Edit Modal -->
<Modal
	visible={showTagModal}
	onClose={closeTagModal}
	title={editingTag ? 'Tag bearbeiten' : 'Neues Tag'}
	maxWidth="sm"
>
	<div class="space-y-6">
		<div>
			<Input bind:value={tagName} placeholder="Tag Name" onkeydown={handleKeyDown} />
		</div>

		<div>
			<span class="block text-sm font-medium text-muted-foreground mb-3"> Farbe </span>
			<TagColorPicker selectedColor={tagColor} onColorChange={(c) => (tagColor = c)} />
		</div>

		<div>
			<span class="block text-sm font-medium text-muted-foreground mb-3"> Vorschau </span>
			<div class="flex items-center gap-2">
				<TagBadge tag={previewTag} />
			</div>
		</div>
	</div>

	{#snippet footer()}
		<div class="flex items-center justify-between">
			<div>
				{#if editingTag}
					<button
						type="button"
						onclick={handleDeleteTag}
						class="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
					>
						Löschen
					</button>
				{/if}
			</div>
			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={closeTagModal}
					class="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
				>
					Abbrechen
				</button>
				<button
					type="button"
					onclick={handleSaveTag}
					disabled={!tagName.trim()}
					class="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{editingTag ? 'Speichern' : 'Erstellen'}
				</button>
			</div>
		</div>
	{/snippet}
</Modal>

<style>
	.page-container {
		max-width: 640px;
		margin: 0 auto;
		padding: 0 1rem 2rem;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 0;
		margin-bottom: 0.5rem;
	}

	.back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
		transition: all 0.2s ease;
	}

	.back-button:hover {
		background: hsl(var(--muted-foreground) / 0.2);
		transform: translateX(-2px);
	}

	.title {
		flex: 1;
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--foreground));
	}

	.add-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-button:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
	}

	.search-wrapper {
		position: relative;
		margin-bottom: 1.5rem;
	}

	.search-wrapper :global(.search-icon) {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: hsl(var(--muted-foreground));
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.875rem 1rem 0.875rem 3rem;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.9375rem;
		transition: all 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: hsl(0 84% 60% / 0.1);
		border: 1px solid hsl(0 84% 60% / 0.3);
		border-radius: 0.75rem;
		color: hsl(0 84% 60%);
		margin-bottom: 1.5rem;
	}

	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.tag-item:hover {
		background: hsl(var(--muted) / 0.5);
		transform: scale(1.02);
	}

	.tag-color {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.tag-label {
		font-weight: 500;
		color: hsl(var(--foreground));
		font-size: 0.9375rem;
	}

	.tags-count {
		text-align: center;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-top: 1.5rem;
	}

	.empty-cta {
		display: flex;
		justify-content: center;
		margin-top: 1rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		border-radius: 0.625rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		text-decoration: none;
	}

	.btn-primary {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.btn-primary:hover {
		box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
	}
</style>
