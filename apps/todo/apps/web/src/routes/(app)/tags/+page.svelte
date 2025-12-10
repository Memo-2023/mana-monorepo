<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { TagList, TagEditModal, ConfirmationModal, type Tag } from '@manacore/shared-ui';
	import { MagnifyingGlass, Plus, CaretLeft } from '@manacore/shared-icons';
	import { labelsStore } from '$lib/stores/labels.svelte';
	import type { Label } from '@todo/shared';

	let searchQuery = $state('');
	let showModal = $state(false);
	let editingLabel = $state<Label | null>(null);
	let showDeleteConfirm = $state(false);
	let labelToDelete = $state<Tag | null>(null);

	const filteredLabels = $derived.by(() => {
		if (!searchQuery.trim()) return labelsStore.labels;
		const query = searchQuery.toLowerCase();
		return labelsStore.labels.filter((l) => l.name.toLowerCase().includes(query));
	});

	// Convert Label to Tag type for shared-ui components
	function labelToTag(label: Label): Tag {
		return {
			id: label.id,
			name: label.name,
			color: label.color,
		};
	}

	function openCreateModal() {
		editingLabel = null;
		showModal = true;
	}

	function openEditModal(tag: Tag) {
		const label = labelsStore.labels.find((l) => l.id === tag.id);
		if (label) {
			editingLabel = label;
			showModal = true;
		}
	}

	function closeModal() {
		showModal = false;
		editingLabel = null;
	}

	async function handleSave(name: string, color: string) {
		try {
			if (editingLabel) {
				await labelsStore.updateLabel(editingLabel.id, { name, color });
			} else {
				await labelsStore.createLabel({ name, color });
			}
			closeModal();
		} catch (e) {
			console.error('Failed to save label:', e);
		}
	}

	async function handleDelete() {
		if (!editingLabel) return;

		try {
			await labelsStore.deleteLabel(editingLabel.id);
			closeModal();
		} catch (e) {
			console.error('Failed to delete label:', e);
		}
	}

	function handleDeleteFromList(tag: Tag) {
		labelToDelete = tag;
		showDeleteConfirm = true;
	}

	async function confirmDeleteLabel() {
		if (!labelToDelete) return;

		try {
			await labelsStore.deleteLabel(labelToDelete.id);
		} catch (e) {
			console.error('Failed to delete label:', e);
		} finally {
			showDeleteConfirm = false;
			labelToDelete = null;
		}
	}

	function handleTagClick(tag: Tag) {
		goto(`/tag/${tag.id}`);
	}

	onMount(() => {
		if (labelsStore.labels.length === 0) {
			labelsStore.fetchLabels();
		}
	});
</script>

<svelte:head>
	<title>Tags - Todo</title>
</svelte:head>

<div class="page-container">
	<!-- Header -->
	<header class="header">
		<a href="/" class="back-button" aria-label="Zurück">
			<CaretLeft size={20} weight="bold" />
		</a>
		<h1 class="title">Tags</h1>
		<button onclick={openCreateModal} class="add-button" aria-label="Neuer Tag">
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

	{#if labelsStore.error}
		<div class="error-banner" role="alert">
			<span>{labelsStore.error}</span>
		</div>
	{/if}

	<!-- Tag List using shared component -->
	<TagList
		tags={filteredLabels.map(labelToTag)}
		loading={labelsStore.loading}
		onEdit={openEditModal}
		onDelete={handleDeleteFromList}
		onClick={handleTagClick}
		emptyMessage={searchQuery ? 'Keine Tags gefunden' : 'Keine Tags vorhanden'}
		emptyDescription={searchQuery
			? `Kein Tag für "${searchQuery}" gefunden`
			: 'Erstelle deinen ersten Tag'}
	/>

	{#if !labelsStore.loading && labelsStore.labels.length > 0}
		<p class="tags-count">
			{labelsStore.labels.length}
			{labelsStore.labels.length === 1 ? 'Tag' : 'Tags'}
		</p>
	{/if}

	{#if !labelsStore.loading && labelsStore.labels.length === 0 && !searchQuery}
		<div class="empty-cta">
			<button onclick={openCreateModal} class="btn btn-primary">
				<Plus size={16} weight="bold" />
				Neuer Tag
			</button>
		</div>
	{/if}
</div>

<!-- Create/Edit Modal using shared component -->
<TagEditModal
	tag={editingLabel ? labelToTag(editingLabel) : null}
	isOpen={showModal}
	onClose={closeModal}
	onSave={handleSave}
	onDelete={editingLabel ? handleDelete : undefined}
	title={editingLabel ? 'Tag bearbeiten' : 'Neuer Tag'}
	saveLabel={editingLabel ? 'Speichern' : 'Erstellen'}
	deleteLabel="Löschen"
	cancelLabel="Abbrechen"
	namePlaceholder="Tag Name"
	colorLabel="Farbe"
	previewLabel="Vorschau"
	deleteConfirmMessage={`Tag "${editingLabel?.name || ''}" wirklich löschen?`}
/>

<!-- Delete confirmation modal -->
<ConfirmationModal
	visible={showDeleteConfirm}
	onClose={() => {
		showDeleteConfirm = false;
		labelToDelete = null;
	}}
	onConfirm={confirmDeleteLabel}
	variant="danger"
	title="Tag löschen?"
	message={`Der Tag "${labelToDelete?.name ?? ''}" wird unwiderruflich gelöscht.`}
	confirmLabel="Löschen"
	cancelLabel="Abbrechen"
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
