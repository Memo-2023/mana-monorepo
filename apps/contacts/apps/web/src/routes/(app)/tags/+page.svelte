<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { tagsApi } from '$lib/api/contacts';
	import type { ContactTag } from '$lib/api/contacts';
	import {
		TagList,
		TagEditModal,
		TagColorPicker,
		DEFAULT_TAG_COLOR,
		type Tag,
	} from '@manacore/shared-ui';
	import { MagnifyingGlass, Plus, CaretLeft } from '@manacore/shared-icons';

	let loading = $state(true);
	let tags = $state<ContactTag[]>([]);
	let error = $state<string | null>(null);
	let searchQuery = $state('');

	// Modal state
	let showModal = $state(false);
	let editingTag = $state<ContactTag | null>(null);

	const filteredTags = $derived.by(() => {
		if (!searchQuery.trim()) return tags;
		const query = searchQuery.toLowerCase();
		return tags.filter((t) => t.name.toLowerCase().includes(query));
	});

	async function loadTags() {
		loading = true;
		error = null;
		try {
			const response = await tagsApi.list();
			tags = response.tags || [];
		} catch (e) {
			error = e instanceof Error ? e.message : $_('messages.error');
		} finally {
			loading = false;
		}
	}

	function openCreateModal() {
		editingTag = null;
		showModal = true;
	}

	function openEditModal(tag: ContactTag) {
		editingTag = tag;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingTag = null;
	}

	async function handleSave(name: string, color: string) {
		error = null;
		try {
			if (editingTag) {
				const response = await tagsApi.update(editingTag.id, { name, color });
				tags = tags.map((t) => (t.id === editingTag!.id ? response.tag : t));
			} else {
				const response = await tagsApi.create({ name, color });
				tags = [...tags, response.tag];
			}
			closeModal();
		} catch (e) {
			error = e instanceof Error ? e.message : $_('messages.error');
		}
	}

	async function handleDelete() {
		if (!editingTag) return;

		try {
			await tagsApi.delete(editingTag.id);
			tags = tags.filter((t) => t.id !== editingTag!.id);
			closeModal();
		} catch (e) {
			error = e instanceof Error ? e.message : $_('messages.error');
		}
	}

	async function handleDeleteFromList(tag: Tag) {
		if (!confirm($_('tags.confirmDelete', { values: { name: tag.name } }))) return;

		try {
			await tagsApi.delete(tag.id);
			tags = tags.filter((t) => t.id !== tag.id);
		} catch (e) {
			error = e instanceof Error ? e.message : $_('messages.error');
		}
	}

	onMount(loadTags);
</script>

<svelte:head>
	<title>{$_('tags.title')} - Contacts</title>
</svelte:head>

<div class="page-container">
	<!-- Header -->
	<header class="header">
		<a href="/" class="back-button" aria-label={$_('common.back')}>
			<CaretLeft size={20} weight="bold" />
		</a>
		<h1 class="title">{$_('tags.title')}</h1>
		<button onclick={openCreateModal} class="add-button" aria-label={$_('tags.new')}>
			<Plus size={20} weight="bold" />
		</button>
	</header>

	<!-- Search -->
	<div class="search-wrapper">
		<MagnifyingGlass size={20} class="search-icon" />
		<input
			type="text"
			placeholder={$_('tags.search')}
			bind:value={searchQuery}
			class="search-input"
		/>
	</div>

	{#if error}
		<div class="error-banner" role="alert">
			<span>{error}</span>
		</div>
	{/if}

	<!-- Tag List using shared component -->
	<TagList
		tags={filteredTags}
		{loading}
		onEdit={(tag) => openEditModal(tag as ContactTag)}
		onDelete={handleDeleteFromList}
		emptyMessage={searchQuery ? $_('tags.noResults') : $_('tags.noTags')}
		emptyDescription={searchQuery
			? $_('tags.noResultsFor', { values: { query: searchQuery } })
			: $_('tags.createFirst')}
	/>

	{#if !loading && tags.length > 0}
		<p class="tags-count">
			{tags.length}
			{tags.length === 1 ? $_('tags.tagSingular') : $_('tags.tagPlural')}
		</p>
	{/if}

	{#if !loading && tags.length === 0 && !searchQuery}
		<div class="empty-cta">
			<button onclick={openCreateModal} class="btn btn-primary">
				<Plus size={16} weight="bold" />
				{$_('tags.new')}
			</button>
		</div>
	{/if}
</div>

<!-- Create/Edit Modal using shared component -->
<TagEditModal
	tag={editingTag}
	isOpen={showModal}
	onClose={closeModal}
	onSave={handleSave}
	onDelete={editingTag ? handleDelete : undefined}
	title={editingTag ? $_('tags.edit') : $_('tags.new')}
	saveLabel={editingTag ? $_('actions.save') : $_('actions.create')}
	deleteLabel={$_('actions.delete')}
	cancelLabel={$_('common.cancel')}
	namePlaceholder={$_('tags.namePlaceholder')}
	colorLabel={$_('tags.color')}
	previewLabel={$_('tags.preview')}
	deleteConfirmMessage={$_('tags.confirmDelete', { values: { name: editingTag?.name || '' } })}
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
		position: sticky;
		top: 80px;
		background: hsl(var(--background));
		z-index: 10;
		margin-bottom: 0.5rem;
	}

	@media (max-width: 768px) {
		.header {
			top: 90px;
		}
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
