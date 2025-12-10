<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { TagList, TagEditModal, ConfirmationModal, type Tag } from '@manacore/shared-ui';
	import { MagnifyingGlass, Plus, CaretLeft, Check } from '@manacore/shared-icons';
	import { labelsStore } from '$lib/stores/labels.svelte';
	import type { Label } from '@todo/shared';

	let searchQuery = $state('');
	let showModal = $state(false);
	let editingLabel = $state<Label | null>(null);
	let showDeleteConfirm = $state(false);
	let labelToDelete = $state<Tag | null>(null);

	// Inline create state
	let newTagName = $state('');
	let newTagColor = $state('#8b5cf6');
	let isCreating = $state(false);
	let newTagInputRef = $state<HTMLInputElement | null>(null);

	// Predefined color palette
	const colorPalette = [
		'#ef4444', // red
		'#f97316', // orange
		'#eab308', // yellow
		'#22c55e', // green
		'#14b8a6', // teal
		'#3b82f6', // blue
		'#8b5cf6', // violet
		'#ec4899', // pink
		'#6b7280', // gray
	];

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

	// Inline create handlers
	async function handleInlineCreate() {
		if (!newTagName.trim() || isCreating) return;

		isCreating = true;
		try {
			await labelsStore.createLabel({ name: newTagName.trim(), color: newTagColor });
			newTagName = '';
			newTagColor = '#8b5cf6';
		} catch (e) {
			console.error('Failed to create tag:', e);
		} finally {
			isCreating = false;
		}
	}

	function handleInlineKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && newTagName.trim()) {
			e.preventDefault();
			handleInlineCreate();
		}
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
	</header>

	<!-- Inline Create Form -->
	<div class="inline-create-form">
		<div class="create-input-row">
			<!-- Name input -->
			<input
				bind:this={newTagInputRef}
				type="text"
				placeholder="Neuer Tag..."
				bind:value={newTagName}
				onkeydown={handleInlineKeydown}
				class="create-input"
				disabled={isCreating}
			/>

			<!-- Submit button -->
			<button
				type="button"
				class="create-button"
				onclick={handleInlineCreate}
				disabled={!newTagName.trim() || isCreating}
				aria-label="Tag erstellen"
			>
				{#if isCreating}
					<div class="spinner"></div>
				{:else}
					<Plus size={18} weight="bold" />
				{/if}
			</button>
		</div>

		<!-- Color palette (always visible) -->
		<div class="color-row">
			<div class="color-palette">
				{#each colorPalette as color}
					<button
						type="button"
						class="color-option"
						class:active={newTagColor === color}
						style="background-color: {color}"
						onclick={() => (newTagColor = color)}
						aria-label="Farbe {color}"
					></button>
				{/each}
			</div>

			<!-- Preview -->
			{#if newTagName.trim()}
				<div class="create-preview">
					<span class="preview-tag" style="--tag-color: {newTagColor}">
						{newTagName}
					</span>
				</div>
			{/if}
		</div>
	</div>

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

	/* Inline Create Form */
	.inline-create-form {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: hsl(var(--muted) / 0.3);
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.75rem;
	}

	.create-input-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	/* Color Row */
	.color-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.75rem;
	}

	.color-palette {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.color-option {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.color-option:hover {
		transform: scale(1.15);
	}

	.color-option.active {
		border-color: hsl(var(--foreground));
		box-shadow: 0 0 0 2px hsl(var(--background));
	}

	/* Create Input */
	.create-input {
		flex: 1;
		padding: 0.625rem 1rem;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.9375rem;
		transition: all 0.2s ease;
	}

	.create-input:focus {
		outline: none;
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
	}

	.create-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.create-input::placeholder {
		color: hsl(var(--muted-foreground));
	}

	/* Create Button */
	.create-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.5rem;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.create-button:hover:not(:disabled) {
		transform: scale(1.05);
		box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
	}

	.create-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Spinner */
	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid hsl(var(--primary-foreground) / 0.3);
		border-top-color: hsl(var(--primary-foreground));
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Preview */
	.create-preview {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.preview-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 9999px;
		background: var(--tag-color);
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
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
</style>
