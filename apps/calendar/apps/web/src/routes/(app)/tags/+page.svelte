<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { TagList, TagEditModal, type Tag } from '@manacore/shared-ui';
	import { MagnifyingGlass, Plus, CaretLeft } from '@manacore/shared-icons';
	import { eventTagsStore } from '$lib/stores/event-tags.svelte';
	import type { EventTag } from '@calendar/shared';

	let searchQuery = $state('');
	let showModal = $state(false);
	let editingTag = $state<EventTag | null>(null);

	const filteredTags = $derived.by(() => {
		if (!searchQuery.trim()) return eventTagsStore.tags;
		const query = searchQuery.toLowerCase();
		return eventTagsStore.tags.filter((t) => t.name.toLowerCase().includes(query));
	});

	// Convert EventTag to Tag type for shared-ui components
	function eventTagToTag(tag: EventTag): Tag {
		return {
			id: tag.id,
			name: tag.name,
			color: tag.color,
		};
	}

	function openCreateModal() {
		editingTag = null;
		showModal = true;
	}

	function openEditModal(tag: Tag) {
		const eventTag = eventTagsStore.tags.find((t) => t.id === tag.id);
		if (eventTag) {
			editingTag = eventTag;
			showModal = true;
		}
	}

	function closeModal() {
		showModal = false;
		editingTag = null;
	}

	async function handleSave(name: string, color: string) {
		try {
			if (editingTag) {
				await eventTagsStore.updateTag(editingTag.id, { name, color });
			} else {
				await eventTagsStore.createTag({ name, color });
			}
			closeModal();
		} catch (e) {
			console.error('Failed to save tag:', e);
		}
	}

	async function handleDelete() {
		if (!editingTag) return;

		try {
			await eventTagsStore.deleteTag(editingTag.id);
			closeModal();
		} catch (e) {
			console.error('Failed to delete tag:', e);
		}
	}

	async function handleDeleteFromList(tag: Tag) {
		if (!confirm(`Tag "${tag.name}" wirklich löschen?`)) return;

		try {
			await eventTagsStore.deleteTag(tag.id);
		} catch (e) {
			console.error('Failed to delete tag:', e);
		}
	}

	onMount(() => {
		if (eventTagsStore.tags.length === 0) {
			eventTagsStore.fetchTags();
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
		<button onclick={openCreateModal} class="add-button" aria-label="Neues Tag">
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

	<!-- Tag List using shared component -->
	<TagList
		tags={filteredTags.map(eventTagToTag)}
		loading={eventTagsStore.loading}
		onEdit={openEditModal}
		onDelete={handleDeleteFromList}
		emptyMessage={searchQuery ? 'Keine Tags gefunden' : 'Keine Tags vorhanden'}
		emptyDescription={searchQuery
			? `Kein Tag für "${searchQuery}" gefunden`
			: 'Erstelle dein erstes Tag'}
	/>

	{#if !eventTagsStore.loading && eventTagsStore.tags.length > 0}
		<p class="tags-count">
			{eventTagsStore.tags.length}
			{eventTagsStore.tags.length === 1 ? 'Tag' : 'Tags'}
		</p>
	{/if}

	{#if !eventTagsStore.loading && eventTagsStore.tags.length === 0 && !searchQuery}
		<div class="empty-cta">
			<button onclick={openCreateModal} class="btn btn-primary">
				<Plus size={16} weight="bold" />
				Neues Tag
			</button>
		</div>
	{/if}
</div>

<!-- Create/Edit Modal using shared component -->
<TagEditModal
	tag={editingTag ? eventTagToTag(editingTag) : null}
	isOpen={showModal}
	onClose={closeModal}
	onSave={handleSave}
	onDelete={editingTag ? handleDelete : undefined}
	title={editingTag ? 'Tag bearbeiten' : 'Neues Tag'}
	saveLabel={editingTag ? 'Speichern' : 'Erstellen'}
	deleteLabel="Löschen"
	cancelLabel="Abbrechen"
	namePlaceholder="Tag Name"
	colorLabel="Farbe"
	previewLabel="Vorschau"
	deleteConfirmMessage={`Tag "${editingTag?.name || ''}" wirklich löschen?`}
/>

<style>
	.page-container {
		max-width: 640px;
		margin: 0 auto;
		padding: 0 1rem 2rem;
	}

	/* Header */
	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
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

	/* Search */
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

	/* Error */
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

	/* Count */
	.tags-count {
		text-align: center;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-top: 1.5rem;
	}

	/* Empty CTA */
	.empty-cta {
		display: flex;
		justify-content: center;
		margin-top: 1rem;
	}

	/* Buttons */
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
