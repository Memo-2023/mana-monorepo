<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { tagsApi } from '$lib/api/contacts';
	import type { ContactTag } from '$lib/api/contacts';
	import { TagGridSkeleton } from '$lib/components/skeletons';

	let loading = $state(true);
	let tags = $state<ContactTag[]>([]);
	let error = $state<string | null>(null);
	let searchQuery = $state('');

	// Modal state
	let showModal = $state(false);
	let editingTag = $state<ContactTag | null>(null);
	let tagName = $state('');
	let tagColor = $state('#6366f1');
	let saving = $state(false);

	const filteredTags = $derived.by(() => {
		if (!searchQuery.trim()) return tags;
		const query = searchQuery.toLowerCase();
		return tags.filter((t) => t.name.toLowerCase().includes(query));
	});

	const colorOptions = [
		'#ef4444', // red
		'#f97316', // orange
		'#f59e0b', // amber
		'#84cc16', // lime
		'#22c55e', // green
		'#14b8a6', // teal
		'#06b6d4', // cyan
		'#3b82f6', // blue
		'#6366f1', // indigo
		'#8b5cf6', // violet
		'#a855f7', // purple
		'#ec4899', // pink
		'#64748b', // slate
	];

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
		tagName = '';
		tagColor = '#6366f1';
		showModal = true;
	}

	function openEditModal(tag: ContactTag) {
		editingTag = tag;
		tagName = tag.name;
		tagColor = tag.color || '#6366f1';
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingTag = null;
		tagName = '';
		tagColor = '#6366f1';
	}

	async function handleSave() {
		if (!tagName.trim()) return;

		saving = true;
		error = null;
		try {
			if (editingTag) {
				const response = await tagsApi.update(editingTag.id, {
					name: tagName.trim(),
					color: tagColor,
				});
				tags = tags.map((t) => (t.id === editingTag!.id ? response.tag : t));
			} else {
				const response = await tagsApi.create({
					name: tagName.trim(),
					color: tagColor,
				});
				tags = [...tags, response.tag];
			}
			closeModal();
		} catch (e) {
			error = e instanceof Error ? e.message : $_('messages.error');
		} finally {
			saving = false;
		}
	}

	async function handleDelete(tag: ContactTag) {
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
			<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="title">{$_('tags.title')}</h1>
		<button onclick={openCreateModal} class="add-button" aria-label={$_('tags.new')}>
			<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
		</button>
	</header>

	<!-- Search -->
	<div class="search-wrapper">
		<svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
		<input
			type="text"
			placeholder={$_('tags.search')}
			bind:value={searchQuery}
			class="search-input"
		/>
	</div>

	{#if error}
		<div class="error-banner" role="alert">
			<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
			<span>{error}</span>
		</div>
	{/if}

	{#if loading}
		<TagGridSkeleton count={6} />
	{:else if tags.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
					/>
				</svg>
			</div>
			<h2 class="empty-title">{$_('tags.noTags')}</h2>
			<p class="empty-description">{$_('tags.createFirst')}</p>
			<button onclick={openCreateModal} class="btn btn-primary">
				<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				{$_('tags.new')}
			</button>
		</div>
	{:else if filteredTags.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>
			<h2 class="empty-title">{$_('tags.noResults')}</h2>
			<p class="empty-description">{$_('tags.noResultsFor', { values: { query: searchQuery } })}</p>
		</div>
	{:else}
		<div class="tags-grid">
			{#each filteredTags as tag (tag.id)}
				<div class="tag-card">
					<div class="tag-color" style="background-color: {tag.color || '#6366f1'}">
						<svg class="tag-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
							/>
						</svg>
					</div>
					<div class="tag-info">
						<h3 class="tag-name">{tag.name}</h3>
					</div>
					<div class="tag-actions">
						<button
							onclick={() => openEditModal(tag)}
							class="action-button"
							aria-label={$_('actions.edit')}
						>
							<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</button>
						<button
							onclick={() => handleDelete(tag)}
							class="action-button delete"
							aria-label={$_('actions.delete')}
						>
							<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</div>
				</div>
			{/each}
		</div>

		<p class="tags-count">
			{tags.length}
			{tags.length === 1 ? $_('tags.tagSingular') : $_('tags.tagPlural')}
		</p>
	{/if}
</div>

<!-- Create/Edit Modal -->
{#if showModal}
	<div class="modal-backdrop" onclick={closeModal} role="presentation">
		<div
			class="modal"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<header class="modal-header">
				<h2 id="modal-title" class="modal-title">
					{editingTag ? $_('tags.edit') : $_('tags.new')}
				</h2>
				<button onclick={closeModal} class="modal-close" aria-label={$_('common.cancel')}>
					<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</header>

			<div class="modal-body">
				<div class="form-group">
					<label for="tag-name" class="form-label">{$_('tags.name')}</label>
					<input
						id="tag-name"
						type="text"
						bind:value={tagName}
						placeholder={$_('tags.namePlaceholder')}
						class="form-input"
					/>
				</div>

				<div class="form-group">
					<label class="form-label">{$_('tags.color')}</label>
					<div class="color-picker">
						{#each colorOptions as color}
							<button
								type="button"
								class="color-option"
								class:selected={tagColor === color}
								style="background-color: {color}"
								onclick={() => (tagColor = color)}
								aria-label={color}
							>
								{#if tagColor === color}
									<svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<!-- Preview -->
				<div class="form-group">
					<label class="form-label">{$_('tags.preview')}</label>
					<div class="tag-preview">
						<span class="preview-tag" style="background-color: {tagColor}">
							{tagName || $_('tags.namePlaceholder')}
						</span>
					</div>
				</div>
			</div>

			<footer class="modal-footer">
				<button onclick={closeModal} class="btn btn-secondary" disabled={saving}>
					{$_('common.cancel')}
				</button>
				<button onclick={handleSave} class="btn btn-primary" disabled={saving || !tagName.trim()}>
					{#if saving}
						<span class="btn-spinner"></span>
					{/if}
					{editingTag ? $_('actions.save') : $_('actions.create')}
				</button>
			</footer>
		</div>
	</div>
{/if}

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

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1.25rem;
		height: 1.25rem;
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

	/* Loading */
	.loading-container {
		display: flex;
		justify-content: center;
		padding: 4rem 0;
	}

	.spinner {
		width: 2.5rem;
		height: 2.5rem;
		border: 3px solid hsl(var(--muted));
		border-top-color: hsl(var(--primary));
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 1rem;
		text-align: center;
	}

	.empty-icon {
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		background: hsl(var(--muted));
		color: hsl(var(--muted-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.5rem;
	}

	.empty-icon svg {
		width: 2.5rem;
		height: 2.5rem;
	}

	.empty-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 0.5rem;
	}

	.empty-description {
		color: hsl(var(--muted-foreground));
		margin-bottom: 1.5rem;
		max-width: 280px;
	}

	/* Tags Grid */
	.tags-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
	}

	.tag-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		transition: all 0.2s ease;
	}

	.tag-card:hover {
		border-color: hsl(var(--primary) / 0.3);
		box-shadow: 0 4px 12px hsl(var(--foreground) / 0.05);
	}

	.tag-color {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.625rem;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tag-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: white;
	}

	.tag-info {
		flex: 1;
		min-width: 0;
	}

	.tag-name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tag-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.tag-card:hover .tag-actions {
		opacity: 1;
	}

	.action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--muted-foreground));
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-button:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.action-button.delete:hover {
		background: hsl(0 84% 60% / 0.1);
		color: hsl(0 84% 60%);
	}

	/* Count */
	.tags-count {
		text-align: center;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-top: 1.5rem;
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.modal {
		background: hsl(var(--background));
		border-radius: 1rem;
		width: 100%;
		max-width: 400px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.modal-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--muted-foreground));
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.modal-close:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.modal-body {
		padding: 1.5rem;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid hsl(var(--border));
	}

	/* Form */
	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	.form-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		margin-bottom: 0.5rem;
	}

	.form-input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.625rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.9375rem;
		transition: all 0.2s ease;
	}

	.form-input:focus {
		outline: none;
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
	}

	/* Color Picker */
	.color-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.color-option {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.5rem;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.color-option:hover {
		transform: scale(1.1);
	}

	.color-option.selected {
		border-color: hsl(var(--foreground));
		box-shadow: 0 0 0 2px hsl(var(--background));
	}

	.check-icon {
		width: 1rem;
		height: 1rem;
		color: white;
	}

	/* Tag Preview */
	.tag-preview {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.preview-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: white;
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

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.btn-primary:hover:not(:disabled) {
		box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
	}

	.btn-secondary {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.btn-secondary:hover:not(:disabled) {
		background: hsl(var(--muted-foreground) / 0.2);
	}

	.btn-spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	/* Icons */
	.icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.icon-sm {
		width: 1rem;
		height: 1rem;
	}
</style>
