<script lang="ts">
	import { getContext } from 'svelte';
	import type { Tag } from '@manacore/shared-tags';
	import { tagMutations } from '@manacore/shared-stores';
	import { Plus, X, Check, Pencil, Trash, MagnifyingGlass } from '@manacore/shared-icons';
	import { TagColorPicker, focusTrap } from '@manacore/shared-ui';
	import { t } from 'svelte-i18n';

	const tagsCtx: { readonly value: Tag[] } = getContext('tags');

	interface Props {
		visible: boolean;
		onClose: () => void;
	}

	let { visible, onClose }: Props = $props();

	// Search state
	let searchQuery = $state('');

	// New tag form state
	let showNewTagForm = $state(false);
	let newTagName = $state('');
	let newTagColor = $state('#8b5cf6');
	let isCreatingTag = $state(false);

	// Edit tag state
	let editingTag = $state<Tag | null>(null);
	let editTagName = $state('');
	let editTagColor = $state('#8b5cf6');
	let isSavingTag = $state(false);

	// Filtered and sorted tags
	const sortedTags = $derived.by(() => {
		const tags = [...tagsCtx.value].sort((a, b) => a.name.localeCompare(b.name, 'de'));
		if (!searchQuery.trim()) return tags;
		const query = searchQuery.toLowerCase();
		return tags.filter((t) => t.name.toLowerCase().includes(query));
	});

	// ==================== NEW TAG ====================
	function openNewTagForm() {
		showNewTagForm = true;
		newTagName = '';
		newTagColor = '#8b5cf6';
	}

	function closeNewTagForm() {
		showNewTagForm = false;
		newTagName = '';
		newTagColor = '#8b5cf6';
	}

	async function handleCreateTag() {
		if (!newTagName.trim() || isCreatingTag) return;

		isCreatingTag = true;
		try {
			await tagMutations.createTag({
				name: newTagName.trim(),
				color: newTagColor,
			});
			closeNewTagForm();
		} catch (e) {
			console.error('Failed to create tag:', e);
		}
		isCreatingTag = false;
	}

	function handleNewTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && newTagName.trim()) {
			e.preventDefault();
			handleCreateTag();
		} else if (e.key === 'Escape') {
			e.stopPropagation();
			closeNewTagForm();
		}
	}

	// ==================== EDIT TAG ====================
	function openEditTag(tag: Tag) {
		editingTag = tag;
		editTagName = tag.name;
		editTagColor = tag.color;
	}

	function closeEditTag() {
		editingTag = null;
		editTagName = '';
		editTagColor = '#8b5cf6';
	}

	async function handleSaveTag() {
		if (!editingTag || !editTagName.trim() || isSavingTag) return;

		isSavingTag = true;
		try {
			await tagMutations.updateTag(editingTag.id, {
				name: editTagName.trim(),
				color: editTagColor,
			});
			closeEditTag();
		} catch (e) {
			console.error('Failed to update tag:', e);
		}
		isSavingTag = false;
	}

	async function handleDeleteTag() {
		if (!editingTag) return;

		try {
			await tagMutations.deleteTag(editingTag.id);
			closeEditTag();
		} catch (e) {
			console.error('Failed to delete tag:', e);
		}
	}

	function handleEditTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && editTagName.trim()) {
			e.preventDefault();
			handleSaveTag();
		} else if (e.key === 'Escape') {
			e.stopPropagation();
			closeEditTag();
		}
	}

	// ==================== KEYBOARD ====================
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (editingTag) {
				closeEditTag();
			} else if (showNewTagForm) {
				closeNewTagForm();
			} else {
				onClose();
			}
		}
	}

	const hasOpenForm = $derived(showNewTagForm || editingTag !== null);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={onClose}></div>

	<!-- Modal -->
	<div class="tag-modal" role="dialog" aria-modal="true" aria-label="Tags" use:focusTrap>
		<!-- Header -->
		<div class="modal-header">
			<h2 class="modal-title">Tags</h2>
			<div class="header-actions">
				<button class="header-btn" onclick={openNewTagForm} title={$t('tags.newTag')}>
					<Plus size={18} weight="bold" />
				</button>
				<button class="header-btn close-btn" onclick={onClose} title={$t('common.close')}>
					<X size={18} weight="bold" />
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="modal-content">
			{#if tagsCtx.value.length === 0 && !showNewTagForm}
				<div class="empty-state">
					<p>{$t('tags.noTagsAvailable')}</p>
					<button class="create-btn" onclick={openNewTagForm}>
						<Plus size={16} weight="bold" />
						{$t('tags.createTag')}
					</button>
				</div>
			{:else}
				<!-- New Tag Form -->
				{#if showNewTagForm}
					<div class="edit-form-section">
						<div class="edit-form-header">
							<span class="edit-form-title">{$t('tags.newTag')}</span>
							<button class="icon-btn" onclick={closeNewTagForm} title={$t('common.cancel')}>
								<X size={14} weight="bold" />
							</button>
						</div>
						<div class="edit-form">
							<div class="form-row">
								<div class="color-preview" style="background-color: {newTagColor}"></div>
								<input
									type="text"
									bind:value={newTagName}
									onkeydown={handleNewTagKeydown}
									placeholder={$t('tags.tagName')}
									class="name-input"
									autofocus
								/>
							</div>
							<div class="color-picker-row">
								<TagColorPicker
									selectedColor={newTagColor}
									onColorChange={(c) => (newTagColor = c)}
								/>
							</div>
							<div class="form-actions">
								<button
									class="btn btn-primary"
									onclick={handleCreateTag}
									disabled={!newTagName.trim() || isCreatingTag}
								>
									<Check size={14} weight="bold" />
									{$t('tags.createTag')}
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Edit Tag Form -->
				{#if editingTag}
					<div class="edit-form-section">
						<div class="edit-form-header">
							<span class="edit-form-title">{$t('tags.editTag')}</span>
							<button class="icon-btn" onclick={closeEditTag} title={$t('common.cancel')}>
								<X size={14} weight="bold" />
							</button>
						</div>
						<div class="edit-form">
							<div class="form-row">
								<div class="color-preview" style="background-color: {editTagColor}"></div>
								<input
									type="text"
									bind:value={editTagName}
									onkeydown={handleEditTagKeydown}
									placeholder={$t('tags.tagName')}
									class="name-input"
									autofocus
								/>
							</div>
							<div class="color-picker-row">
								<TagColorPicker
									selectedColor={editTagColor}
									onColorChange={(c) => (editTagColor = c)}
								/>
							</div>
							<div class="form-actions">
								<button
									class="btn btn-danger"
									onclick={handleDeleteTag}
									title={$t('tags.deleteTag')}
								>
									<Trash size={14} weight="bold" />
								</button>
								<button
									class="btn btn-primary"
									onclick={handleSaveTag}
									disabled={!editTagName.trim() || isSavingTag}
								>
									<Check size={14} weight="bold" />
									{$t('common.save')}
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Tags list -->
				{#if !hasOpenForm || sortedTags.length > 0}
					<div class="tags-grid">
						{#each sortedTags as tag (tag.id)}
							<div
								class="tag-pill glass-tag"
								role="button"
								tabindex="0"
								style="--tag-color: {tag.color || '#8b5cf6'}"
							>
								<span class="tag-dot"></span>
								<span class="tag-name">{tag.name}</span>
								<button
									class="tag-edit-btn"
									onclick={() => openEditTag(tag)}
									title={$t('tags.editTag')}
								>
									<Pencil size={10} weight="bold" />
								</button>
							</div>
						{/each}
					</div>

					{#if searchQuery && sortedTags.length === 0}
						<div class="search-empty">
							<p>{$t('tags.noTagsFound', { values: { query: searchQuery } })}</p>
						</div>
					{/if}
				{/if}
			{/if}
		</div>

		<!-- Search (sticky bottom) -->
		<div class="search-wrapper">
			<MagnifyingGlass size={16} class="search-icon" />
			<input
				type="text"
				placeholder={$t('tags.searchTags')}
				bind:value={searchQuery}
				class="search-input"
			/>
			{#if searchQuery}
				<button
					class="search-clear"
					onclick={() => (searchQuery = '')}
					title={$t('tags.clearSearch')}
				>
					<X size={14} weight="bold" />
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: transparent;
		z-index: 99;
	}

	.tag-modal {
		position: fixed;
		bottom: calc(140px + env(safe-area-inset-bottom, 0px));
		left: 50%;
		transform: translateX(-50%);
		width: calc(100% - 2rem);
		max-width: 500px;
		max-height: 70vh;
		z-index: 100;
		background: var(--color-surface-elevated-2);
		border: 1px solid var(--color-border);
		border-radius: 1rem;
		box-shadow: var(--shadow-xl);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1rem 0.5rem;
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.header-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--color-muted-foreground);
		transition: all 0.15s ease;
	}

	.header-btn:hover {
		background: var(--color-surface-hover);
		color: var(--color-foreground);
	}

	/* Search (sticky bottom) */
	.search-wrapper {
		position: relative;
		padding: 0.75rem 1rem;
		border-top: 1px solid var(--color-border);
		background: var(--color-surface-elevated-2);
		flex-shrink: 0;
	}

	.search-wrapper :global(.search-icon) {
		position: absolute;
		left: 1.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-muted-foreground);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 2rem 0.5rem 2.25rem;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		background: var(--color-surface);
		color: var(--color-foreground);
		font-size: 0.8125rem;
		outline: none;
		transition: all 0.15s ease;
	}

	.search-input:focus {
		border-color: var(--color-primary);
		background: var(--color-surface-elevated-2);
	}

	.search-clear {
		position: absolute;
		right: 1.5rem;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: var(--color-surface-hover);
		border: none;
		cursor: pointer;
		color: var(--color-muted-foreground);
	}

	.search-clear:hover {
		background: var(--color-border);
	}

	.search-empty {
		text-align: center;
		padding: 1.5rem;
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0.75rem 0.75rem;
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
		gap: 1rem;
	}

	.create-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.create-btn:hover {
		background: var(--color-primary-hover);
	}

	/* Edit Form Section */
	.edit-form-section {
		background: color-mix(in srgb, var(--color-primary) 5%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
		border-radius: 0.75rem;
		margin-bottom: 0.75rem;
		overflow: hidden;
	}

	.edit-form-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
	}

	.edit-form-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-primary);
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.edit-form {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.form-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.color-preview {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		flex-shrink: 0;
		border: 2px solid var(--color-border);
	}

	.name-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		background: var(--color-surface);
		color: var(--color-foreground);
		font-size: 0.875rem;
		outline: none;
		transition: all 0.15s ease;
	}

	.name-input:focus {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent);
	}

	.color-picker-row {
		padding-left: 32px;
	}

	.color-picker-row :global(.color-picker) {
		gap: 0.375rem;
	}

	.color-picker-row :global(.color-swatch) {
		width: 24px;
		height: 24px;
	}

	.form-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.15s ease;
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-danger {
		background: var(--color-error);
		color: white;
	}

	.btn-danger:hover {
		background: color-mix(in srgb, var(--color-error) 85%, black);
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.375rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--color-muted-foreground);
		transition: all 0.15s ease;
	}

	.icon-btn:hover {
		background: var(--color-surface-hover);
		color: var(--color-foreground);
	}

	/* Tags grid */
	.tags-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.25rem 0;
	}

	/* Tag Pill */
	.tag-pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		border-radius: 9999px;
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s ease;
		position: relative;
	}

	.glass-tag {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 2px 4px -1px rgba(0, 0, 0, 0.06),
			0 1px 2px -1px rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .glass-tag {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.glass-tag:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
	}

	:global(.dark) .glass-tag:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.tag-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--tag-color);
		flex-shrink: 0;
	}

	.tag-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-foreground);
		white-space: nowrap;
	}

	.tag-edit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		background: var(--color-surface-hover);
		border: none;
		cursor: pointer;
		color: var(--color-muted-foreground);
		opacity: 0;
		transition: all 0.15s ease;
		margin-left: 0.125rem;
	}

	.tag-pill:hover .tag-edit-btn {
		opacity: 1;
	}

	.tag-edit-btn:hover {
		background: var(--color-border);
		color: var(--color-foreground);
	}
</style>
