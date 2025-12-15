<script lang="ts">
	import { eventTagsStore } from '$lib/stores/event-tags.svelte';
	import { eventTagGroupsStore } from '$lib/stores/event-tag-groups.svelte';
	import {
		CaretDown,
		CaretRight,
		Plus,
		X,
		Check,
		FolderSimplePlus,
		Pencil,
		Trash,
		MagnifyingGlass,
		DotsSixVertical,
	} from '@manacore/shared-icons';
	import { TagColorPicker } from '@manacore/shared-ui';
	import type { EventTag, EventTagGroup } from '@calendar/shared';

	interface Props {
		visible: boolean;
		onClose: () => void;
		isSidebarMode?: boolean;
	}

	let { visible, onClose, isSidebarMode = false }: Props = $props();

	// Search state
	let searchQuery = $state('');

	// Track collapsed state
	let collapsedGroups = $state<Set<string | null>>(new Set());

	// New group form state
	let showNewGroupForm = $state(false);
	let newGroupName = $state('');
	let newGroupColor = $state('#3b82f6');
	let isCreatingGroup = $state(false);

	// New tag form state
	let showNewTagForm = $state(false);
	let newTagName = $state('');
	let newTagColor = $state('#3b82f6');
	let newTagGroupId = $state<string | null>(null);
	let isCreatingTag = $state(false);

	// Edit tag state
	let editingTag = $state<EventTag | null>(null);
	let editTagName = $state('');
	let editTagColor = $state('#3b82f6');
	let editTagGroupId = $state<string | null>(null);
	let isSavingTag = $state(false);

	// Edit group state
	let editingGroup = $state<EventTagGroup | null>(null);
	let editGroupName = $state('');
	let editGroupColor = $state('#3b82f6');
	let isSavingGroup = $state(false);

	// Drag and drop state for tags
	let draggedTag = $state<EventTag | null>(null);
	let dragOverGroupId = $state<string | null | 'none'>(null);

	// Drag and drop state for groups
	let draggedGroup = $state<EventTagGroup | null>(null);
	let dragOverGroupIndex = $state<number | null>(null);

	// Filtered tags based on search
	const filteredTags = $derived.by(() => {
		if (!searchQuery.trim()) return eventTagsStore.tags;
		const query = searchQuery.toLowerCase();
		return eventTagsStore.tags.filter((t) => t.name.toLowerCase().includes(query));
	});

	function toggleGroup(groupId: string | null) {
		const newSet = new Set(collapsedGroups);
		if (newSet.has(groupId)) {
			newSet.delete(groupId);
		} else {
			newSet.add(groupId);
		}
		collapsedGroups = newSet;
	}

	function isExpanded(groupId: string | null): boolean {
		return !collapsedGroups.has(groupId);
	}

	function getTagsForGroup(groupId: string | null): EventTag[] {
		return filteredTags.filter((t) => (t.groupId ?? null) === groupId);
	}

	// Get ungrouped tags
	const ungroupedTags = $derived(getTagsForGroup(null));

	// ==================== NEW TAG ====================
	function openNewTagForm() {
		showNewTagForm = true;
		newTagName = '';
		newTagColor = '#3b82f6';
		newTagGroupId = null;
	}

	function closeNewTagForm() {
		showNewTagForm = false;
		newTagName = '';
		newTagColor = '#3b82f6';
		newTagGroupId = null;
	}

	async function handleCreateTag() {
		if (!newTagName.trim() || isCreatingTag) return;

		isCreatingTag = true;
		const result = await eventTagsStore.createTag({
			name: newTagName.trim(),
			color: newTagColor,
			groupId: newTagGroupId,
		});

		if (result.error) {
			console.error('Failed to create tag:', result.error);
		} else {
			closeNewTagForm();
			eventTagGroupsStore.fetchGroups();
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
	function openEditTag(tag: EventTag) {
		editingTag = tag;
		editTagName = tag.name;
		editTagColor = tag.color;
		editTagGroupId = tag.groupId ?? null;
	}

	function closeEditTag() {
		editingTag = null;
		editTagName = '';
		editTagColor = '#3b82f6';
		editTagGroupId = null;
	}

	async function handleSaveTag() {
		if (!editingTag || !editTagName.trim() || isSavingTag) return;

		isSavingTag = true;
		const result = await eventTagsStore.updateTag(editingTag.id, {
			name: editTagName.trim(),
			color: editTagColor,
			groupId: editTagGroupId,
		});

		if (result.error) {
			console.error('Failed to update tag:', result.error);
		} else {
			closeEditTag();
			eventTagGroupsStore.fetchGroups();
		}

		isSavingTag = false;
	}

	async function handleDeleteTag() {
		if (!editingTag) return;

		const result = await eventTagsStore.deleteTag(editingTag.id);

		if (result.error) {
			console.error('Failed to delete tag:', result.error);
		} else {
			closeEditTag();
			eventTagGroupsStore.fetchGroups();
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

	// ==================== NEW GROUP ====================
	function toggleNewGroupForm() {
		showNewGroupForm = !showNewGroupForm;
		if (!showNewGroupForm) {
			resetNewGroupForm();
		}
	}

	function resetNewGroupForm() {
		newGroupName = '';
		newGroupColor = '#3b82f6';
	}

	async function handleCreateGroup() {
		if (!newGroupName.trim() || isCreatingGroup) return;

		isCreatingGroup = true;
		const result = await eventTagGroupsStore.createGroup({
			name: newGroupName.trim(),
			color: newGroupColor,
		});

		if (result.error) {
			console.error('Failed to create group:', result.error);
		} else {
			resetNewGroupForm();
			showNewGroupForm = false;
		}

		isCreatingGroup = false;
	}

	function handleNewGroupKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && newGroupName.trim()) {
			e.preventDefault();
			handleCreateGroup();
		} else if (e.key === 'Escape') {
			e.stopPropagation();
			showNewGroupForm = false;
			resetNewGroupForm();
		}
	}

	// ==================== EDIT GROUP ====================
	function openEditGroup(e: MouseEvent, group: EventTagGroup) {
		e.stopPropagation();
		editingGroup = group;
		editGroupName = group.name;
		editGroupColor = group.color;
	}

	function closeEditGroup() {
		editingGroup = null;
		editGroupName = '';
		editGroupColor = '#3b82f6';
	}

	async function handleSaveGroup() {
		if (!editingGroup || !editGroupName.trim() || isSavingGroup) return;

		isSavingGroup = true;
		const result = await eventTagGroupsStore.updateGroup(editingGroup.id, {
			name: editGroupName.trim(),
			color: editGroupColor,
		});

		if (result.error) {
			console.error('Failed to update group:', result.error);
		} else {
			closeEditGroup();
		}

		isSavingGroup = false;
	}

	async function handleDeleteGroup() {
		if (!editingGroup) return;

		const result = await eventTagGroupsStore.deleteGroup(editingGroup.id);

		if (result.error) {
			console.error('Failed to delete group:', result.error);
		} else {
			closeEditGroup();
		}
	}

	function handleEditGroupKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && editGroupName.trim()) {
			e.preventDefault();
			handleSaveGroup();
		} else if (e.key === 'Escape') {
			e.stopPropagation();
			closeEditGroup();
		}
	}

	// ==================== DRAG AND DROP ====================
	function handleDragStart(e: DragEvent, tag: EventTag) {
		draggedTag = tag;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', tag.id);
		}
	}

	function handleDragEnd() {
		draggedTag = null;
		dragOverGroupId = null;
	}

	function handleDragOver(e: DragEvent, groupId: string | null) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
		dragOverGroupId = groupId ?? 'none';
	}

	function handleDragLeave() {
		dragOverGroupId = null;
	}

	async function handleDrop(e: DragEvent, targetGroupId: string | null) {
		e.preventDefault();
		dragOverGroupId = null;

		if (!draggedTag) return;

		const currentGroupId = draggedTag.groupId ?? null;
		if (currentGroupId === targetGroupId) {
			draggedTag = null;
			return;
		}

		const result = await eventTagsStore.updateTag(draggedTag.id, {
			groupId: targetGroupId,
		});

		if (result.error) {
			console.error('Failed to move tag:', result.error);
		} else {
			eventTagGroupsStore.fetchGroups();
		}

		draggedTag = null;
	}

	// ==================== KEYBOARD ====================
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (editingTag) {
				closeEditTag();
			} else if (editingGroup) {
				closeEditGroup();
			} else if (showNewTagForm) {
				closeNewTagForm();
			} else if (showNewGroupForm) {
				showNewGroupForm = false;
				resetNewGroupForm();
			} else {
				onClose();
			}
		}
	}

	// Check if any form is open
	const hasOpenForm = $derived(
		showNewTagForm || showNewGroupForm || editingTag !== null || editingGroup !== null
	);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={onClose}></div>

	<!-- Modal -->
	<div
		class="tag-modal"
		class:sidebar-mode={isSidebarMode}
		role="dialog"
		aria-modal="true"
		aria-label="Tags"
	>
		<!-- Header -->
		<div class="modal-header">
			<h2 class="modal-title">Tags</h2>
			<div class="header-actions">
				<button class="header-btn" onclick={openNewTagForm} title="Neuer Tag">
					<Plus size={18} weight="bold" />
				</button>
				<button class="header-btn close-btn" onclick={onClose} title="Schließen">
					<X size={18} weight="bold" />
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="modal-content">
			{#if eventTagsStore.loading}
				<div class="loading-state">Lädt...</div>
			{:else if eventTagsStore.tags.length === 0 && !showNewTagForm}
				<div class="empty-state">
					<p>Keine Tags vorhanden</p>
					<button class="create-btn" onclick={openNewTagForm}>
						<Plus size={16} weight="bold" />
						Tag erstellen
					</button>
				</div>
			{:else}
				<!-- New Tag Form -->
				{#if showNewTagForm}
					<div class="edit-form-section">
						<div class="edit-form-header">
							<span class="edit-form-title">Neuer Tag</span>
							<button class="icon-btn" onclick={closeNewTagForm} title="Abbrechen">
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
									placeholder="Tag Name"
									class="name-input"
									autofocus
								/>
							</div>
							<div class="form-row">
								<label class="form-label">Gruppe</label>
								<select bind:value={newTagGroupId} class="group-select">
									<option value={null}>Keine Gruppe</option>
									{#each eventTagGroupsStore.groups as group (group.id)}
										<option value={group.id}>{group.name}</option>
									{/each}
								</select>
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
									Erstellen
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Edit Tag Form -->
				{#if editingTag}
					<div class="edit-form-section">
						<div class="edit-form-header">
							<span class="edit-form-title">Tag bearbeiten</span>
							<button class="icon-btn" onclick={closeEditTag} title="Abbrechen">
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
									placeholder="Tag Name"
									class="name-input"
									autofocus
								/>
							</div>
							<div class="form-row">
								<label class="form-label">Gruppe</label>
								<select bind:value={editTagGroupId} class="group-select">
									<option value={null}>Keine Gruppe</option>
									{#each eventTagGroupsStore.groups as group (group.id)}
										<option value={group.id}>{group.name}</option>
									{/each}
								</select>
							</div>
							<div class="color-picker-row">
								<TagColorPicker
									selectedColor={editTagColor}
									onColorChange={(c) => (editTagColor = c)}
								/>
							</div>
							<div class="form-actions">
								<button class="btn btn-danger" onclick={handleDeleteTag} title="Tag löschen">
									<Trash size={14} weight="bold" />
								</button>
								<button
									class="btn btn-primary"
									onclick={handleSaveTag}
									disabled={!editTagName.trim() || isSavingTag}
								>
									<Check size={14} weight="bold" />
									Speichern
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Edit Group Form -->
				{#if editingGroup}
					<div class="edit-form-section">
						<div class="edit-form-header">
							<span class="edit-form-title">Gruppe bearbeiten</span>
							<button class="icon-btn" onclick={closeEditGroup} title="Abbrechen">
								<X size={14} weight="bold" />
							</button>
						</div>
						<div class="edit-form">
							<div class="form-row">
								<div class="color-preview" style="background-color: {editGroupColor}"></div>
								<input
									type="text"
									bind:value={editGroupName}
									onkeydown={handleEditGroupKeydown}
									placeholder="Gruppenname"
									class="name-input"
									autofocus
								/>
							</div>
							<div class="color-picker-row">
								<TagColorPicker
									selectedColor={editGroupColor}
									onColorChange={(c) => (editGroupColor = c)}
								/>
							</div>
							<div class="form-actions">
								<button class="btn btn-danger" onclick={handleDeleteGroup} title="Gruppe löschen">
									<Trash size={14} weight="bold" />
								</button>
								<button
									class="btn btn-primary"
									onclick={handleSaveGroup}
									disabled={!editGroupName.trim() || isSavingGroup}
								>
									<Check size={14} weight="bold" />
									Speichern
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Groups with their tags (show all groups) -->
				{#if !hasOpenForm || (hasOpenForm && filteredTags.length > 0)}
					{#each eventTagGroupsStore.groups as group (group.id)}
						{@const groupTags = getTagsForGroup(group.id)}
						{#if !searchQuery || groupTags.length > 0}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="group-section"
								class:drag-over={dragOverGroupId === group.id}
								ondragover={(e) => handleDragOver(e, group.id)}
								ondragleave={handleDragLeave}
								ondrop={(e) => handleDrop(e, group.id)}
							>
								<div class="group-header">
									<button type="button" onclick={() => toggleGroup(group.id)} class="group-toggle">
										<div class="group-header-left">
											{#if isExpanded(group.id)}
												<CaretDown size={14} weight="bold" />
											{:else}
												<CaretRight size={14} weight="bold" />
											{/if}
											<div class="group-dot" style="background-color: {group.color}"></div>
											<span class="group-name">{group.name}</span>
											<span class="group-count">({groupTags.length})</span>
										</div>
									</button>
									<div class="group-actions">
										<button
											class="icon-btn icon-btn-sm"
											onclick={(e) => openEditGroup(e, group)}
											title="Gruppe bearbeiten"
										>
											<Pencil size={12} weight="bold" />
										</button>
									</div>
								</div>

								{#if isExpanded(group.id)}
									<div class="tags-grid">
										{#if groupTags.length === 0}
											<div class="empty-group-hint">Tags hierher ziehen</div>
										{:else}
											{#each groupTags as tag (tag.id)}
												<div
													class="tag-pill glass-tag"
													class:dragging={draggedTag?.id === tag.id}
													draggable="true"
													ondragstart={(e) => handleDragStart(e, tag)}
													ondragend={handleDragEnd}
													role="button"
													tabindex="0"
													style="--tag-color: {tag.color || '#3b82f6'}"
												>
													<span class="tag-dot"></span>
													<span class="tag-name">{tag.name}</span>
													<button
														class="tag-edit-btn"
														onclick={() => openEditTag(tag)}
														title="Tag bearbeiten"
													>
														<Pencil size={10} weight="bold" />
													</button>
												</div>
											{/each}
										{/if}
									</div>
								{/if}
							</div>
						{/if}
					{/each}

					<!-- Ungrouped tags -->
					{#if !searchQuery || ungroupedTags.length > 0}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="group-section"
							class:drag-over={dragOverGroupId === 'none'}
							ondragover={(e) => handleDragOver(e, null)}
							ondragleave={handleDragLeave}
							ondrop={(e) => handleDrop(e, null)}
						>
							<div class="group-header">
								<button type="button" onclick={() => toggleGroup(null)} class="group-toggle">
									<div class="group-header-left">
										{#if isExpanded(null)}
											<CaretDown size={14} weight="bold" />
										{:else}
											<CaretRight size={14} weight="bold" />
										{/if}
										<span class="group-name muted">Ohne Gruppe</span>
										<span class="group-count">({ungroupedTags.length})</span>
									</div>
								</button>
							</div>

							{#if isExpanded(null)}
								<div class="tags-grid">
									{#if ungroupedTags.length === 0}
										<div class="empty-group-hint">Tags hierher ziehen</div>
									{:else}
										{#each ungroupedTags as tag (tag.id)}
											<div
												class="tag-pill glass-tag"
												class:dragging={draggedTag?.id === tag.id}
												draggable="true"
												ondragstart={(e) => handleDragStart(e, tag)}
												ondragend={handleDragEnd}
												role="button"
												tabindex="0"
												style="--tag-color: {tag.color || '#3b82f6'}"
											>
												<span class="tag-dot"></span>
												<span class="tag-name">{tag.name}</span>
												<button
													class="tag-edit-btn"
													onclick={() => openEditTag(tag)}
													title="Tag bearbeiten"
												>
													<Pencil size={10} weight="bold" />
												</button>
											</div>
										{/each}
									{/if}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Search empty state -->
					{#if searchQuery && filteredTags.length === 0}
						<div class="search-empty">
							<p>Keine Tags gefunden für "{searchQuery}"</p>
						</div>
					{/if}

					<!-- New Group Section -->
					<div class="group-section new-group-section">
						<button
							type="button"
							onclick={toggleNewGroupForm}
							class="group-toggle new-group-header"
						>
							<div class="group-header-left">
								{#if showNewGroupForm}
									<CaretDown size={14} weight="bold" />
								{:else}
									<Plus size={14} weight="bold" />
								{/if}
								<FolderSimplePlus size={14} />
								<span class="group-name muted">Neue Gruppe</span>
							</div>
						</button>

						{#if showNewGroupForm}
							<div class="new-group-form">
								<div class="form-row">
									<div class="color-preview" style="background-color: {newGroupColor}"></div>
									<input
										type="text"
										bind:value={newGroupName}
										onkeydown={handleNewGroupKeydown}
										placeholder="Gruppenname"
										class="name-input"
										autofocus
									/>
									<button
										type="button"
										onclick={handleCreateGroup}
										disabled={!newGroupName.trim() || isCreatingGroup}
										class="save-btn"
										title="Gruppe erstellen"
									>
										<Check size={16} weight="bold" />
									</button>
								</div>
								<div class="color-picker-row">
									<TagColorPicker
										selectedColor={newGroupColor}
										onColorChange={(c) => (newGroupColor = c)}
									/>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			{/if}
		</div>

		<!-- Search (sticky bottom) -->
		<div class="search-wrapper">
			<MagnifyingGlass size={16} class="search-icon" />
			<input
				type="text"
				placeholder="Tags suchen..."
				bind:value={searchQuery}
				class="search-input"
			/>
			{#if searchQuery}
				<button class="search-clear" onclick={() => (searchQuery = '')} title="Suche leeren">
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
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1rem;
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	:global(.dark) .tag-modal {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.tag-modal.sidebar-mode {
		bottom: calc(70px + env(safe-area-inset-bottom, 0px));
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
		color: #1f2937;
	}

	:global(.dark) .modal-title {
		color: #f3f4f6;
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
		color: #6b7280;
		transition: all 0.15s ease;
	}

	.header-btn:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #1f2937;
	}

	:global(.dark) .header-btn {
		color: #9ca3af;
	}

	:global(.dark) .header-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}

	/* Search (sticky bottom) */
	.search-wrapper {
		position: relative;
		padding: 0.75rem 1rem;
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		flex-shrink: 0;
	}

	:global(.dark) .search-wrapper {
		border-top-color: rgba(255, 255, 255, 0.08);
		background: rgba(30, 30, 30, 0.9);
	}

	.search-wrapper :global(.search-icon) {
		position: absolute;
		left: 1.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: #9ca3af;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 2rem 0.5rem 2.25rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.5rem;
		background: rgba(0, 0, 0, 0.03);
		color: #374151;
		font-size: 0.8125rem;
		outline: none;
		transition: all 0.15s ease;
	}

	.search-input:focus {
		border-color: #3b82f6;
		background: white;
	}

	:global(.dark) .search-input {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}

	:global(.dark) .search-input:focus {
		border-color: #60a5fa;
		background: rgba(255, 255, 255, 0.1);
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
		background: rgba(0, 0, 0, 0.1);
		border: none;
		cursor: pointer;
		color: #6b7280;
	}

	.search-clear:hover {
		background: rgba(0, 0, 0, 0.15);
	}

	:global(.dark) .search-clear {
		background: rgba(255, 255, 255, 0.1);
		color: #9ca3af;
	}

	.search-empty {
		text-align: center;
		padding: 1.5rem;
		color: #9ca3af;
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
		color: #6b7280;
		font-size: 0.875rem;
		gap: 1rem;
	}

	:global(.dark) .loading-state,
	:global(.dark) .empty-state {
		color: #9ca3af;
	}

	.create-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.create-btn:hover {
		background: #2563eb;
	}

	/* Edit Form Section */
	.edit-form-section {
		background: rgba(59, 130, 246, 0.05);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.75rem;
		margin-bottom: 0.75rem;
		overflow: hidden;
	}

	:global(.dark) .edit-form-section {
		background: rgba(96, 165, 250, 0.1);
		border-color: rgba(96, 165, 250, 0.2);
	}

	.edit-form-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		background: rgba(59, 130, 246, 0.1);
	}

	:global(.dark) .edit-form-header {
		background: rgba(96, 165, 250, 0.15);
	}

	.edit-form-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: #3b82f6;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	:global(.dark) .edit-form-title {
		color: #60a5fa;
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

	.form-label {
		font-size: 0.75rem;
		color: #6b7280;
		min-width: 50px;
	}

	:global(.dark) .form-label {
		color: #9ca3af;
	}

	.color-preview {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		flex-shrink: 0;
		border: 2px solid rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .color-preview {
		border-color: rgba(255, 255, 255, 0.2);
	}

	.name-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid rgba(0, 0, 0, 0.15);
		border-radius: 0.5rem;
		background: white;
		color: #374151;
		font-size: 0.875rem;
		outline: none;
		transition: all 0.15s ease;
	}

	.name-input:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	:global(.dark) .name-input {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
		color: #f3f4f6;
	}

	:global(.dark) .name-input:focus {
		border-color: #60a5fa;
		box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
	}

	.group-select {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border: 1px solid rgba(0, 0, 0, 0.15);
		border-radius: 0.375rem;
		background: white;
		color: #374151;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	:global(.dark) .group-select {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
		color: #f3f4f6;
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
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-danger {
		background: #ef4444;
		color: white;
	}

	.btn-danger:hover {
		background: #dc2626;
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
		color: #6b7280;
		transition: all 0.15s ease;
	}

	.icon-btn:hover {
		background: rgba(0, 0, 0, 0.1);
		color: #374151;
	}

	:global(.dark) .icon-btn {
		color: #9ca3af;
	}

	:global(.dark) .icon-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}

	.icon-btn-sm {
		width: 1.25rem;
		height: 1.25rem;
	}

	/* Group Section */
	.group-section {
		margin-bottom: 0.5rem;
		border-radius: 0.5rem;
		transition: background 0.15s ease;
	}

	.group-section.drag-over {
		background: rgba(59, 130, 246, 0.1);
	}

	:global(.dark) .group-section.drag-over {
		background: rgba(96, 165, 250, 0.15);
	}

	.group-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.group-toggle {
		flex: 1;
		display: flex;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: none;
		cursor: pointer;
		border-radius: 0.5rem;
		transition: background 0.15s ease;
	}

	.group-toggle:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .group-toggle:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.group-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding-right: 0.5rem;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.group-header:hover .group-actions {
		opacity: 1;
	}

	.group-header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #6b7280;
	}

	:global(.dark) .group-header-left {
		color: #9ca3af;
	}

	.group-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.group-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #374151;
	}

	.group-name.muted {
		color: #6b7280;
	}

	:global(.dark) .group-name {
		color: #e5e7eb;
	}

	:global(.dark) .group-name.muted {
		color: #9ca3af;
	}

	.group-count {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.tags-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.25rem 0.75rem 0.75rem;
	}

	/* Tag Pill */
	.tag-pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		border-radius: 9999px;
		cursor: grab;
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

	.glass-tag.dragging {
		opacity: 0.5;
		transform: scale(0.95);
	}

	.glass-tag:active {
		cursor: grabbing;
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
		color: #374151;
		white-space: nowrap;
	}

	:global(.dark) .tag-name {
		color: #f3f4f6;
	}

	.tag-edit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.1);
		border: none;
		cursor: pointer;
		color: #6b7280;
		opacity: 0;
		transition: all 0.15s ease;
		margin-left: 0.125rem;
	}

	.tag-pill:hover .tag-edit-btn {
		opacity: 1;
	}

	.tag-edit-btn:hover {
		background: rgba(0, 0, 0, 0.2);
		color: #374151;
	}

	:global(.dark) .tag-edit-btn {
		background: rgba(255, 255, 255, 0.15);
		color: #9ca3af;
	}

	:global(.dark) .tag-edit-btn:hover {
		background: rgba(255, 255, 255, 0.25);
		color: #f3f4f6;
	}

	.empty-group-hint {
		font-size: 0.75rem;
		color: #9ca3af;
		font-style: italic;
		padding: 0.25rem 0;
	}

	:global(.dark) .empty-group-hint {
		color: #6b7280;
	}

	/* New Group Section */
	.new-group-section {
		border-top: 1px dashed rgba(0, 0, 0, 0.1);
		margin-top: 0.5rem;
		padding-top: 0.5rem;
	}

	:global(.dark) .new-group-section {
		border-top-color: rgba(255, 255, 255, 0.1);
	}

	.new-group-header {
		color: #3b82f6;
	}

	.new-group-header .group-name {
		color: #3b82f6;
	}

	:global(.dark) .new-group-header {
		color: #60a5fa;
	}

	:global(.dark) .new-group-header .group-name {
		color: #60a5fa;
	}

	.new-group-form {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.save-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 0.5rem;
		background: #3b82f6;
		color: white;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.save-btn:hover:not(:disabled) {
		background: #2563eb;
	}

	.save-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
