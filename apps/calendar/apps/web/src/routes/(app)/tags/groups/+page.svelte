<script lang="ts">
	import { onMount } from 'svelte';
	import { CaretLeft, Plus, Pencil, Trash } from '@manacore/shared-icons';
	import { eventTagGroupsStore } from '$lib/stores/event-tag-groups.svelte';
	import { TagGroupEditModal } from '$lib/components/tags';
	import type { EventTagGroup } from '@calendar/shared';

	let showModal = $state(false);
	let editingGroup = $state<EventTagGroup | null>(null);

	function openCreateModal() {
		editingGroup = null;
		showModal = true;
	}

	function openEditModal(group: EventTagGroup) {
		editingGroup = group;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingGroup = null;
	}

	async function handleSave(name: string, color: string) {
		try {
			if (editingGroup) {
				await eventTagGroupsStore.updateGroup(editingGroup.id, { name, color });
			} else {
				await eventTagGroupsStore.createGroup({ name, color });
			}
			closeModal();
		} catch (e) {
			console.error('Failed to save group:', e);
		}
	}

	async function handleDelete() {
		if (!editingGroup) return;

		try {
			await eventTagGroupsStore.deleteGroup(editingGroup.id);
			closeModal();
		} catch (e) {
			console.error('Failed to delete group:', e);
		}
	}

	async function handleDeleteFromList(group: EventTagGroup) {
		if (
			!confirm(
				`Gruppe "${group.name}" wirklich löschen? Tags in dieser Gruppe werden nicht gelöscht.`
			)
		)
			return;

		try {
			await eventTagGroupsStore.deleteGroup(group.id);
		} catch (e) {
			console.error('Failed to delete group:', e);
		}
	}

	onMount(() => {
		if (eventTagGroupsStore.groups.length === 0) {
			eventTagGroupsStore.fetchGroups();
		}
	});
</script>

<svelte:head>
	<title>Tag-Gruppen - Kalender</title>
</svelte:head>

<div class="page-container">
	<!-- Header -->
	<header class="header">
		<a href="/tags" class="back-button" aria-label="Zurück zu Tags">
			<CaretLeft size={20} weight="bold" />
		</a>
		<h1 class="title">Tag-Gruppen</h1>
		<button onclick={openCreateModal} class="add-button" aria-label="Neue Gruppe">
			<Plus size={20} weight="bold" />
		</button>
	</header>

	{#if eventTagGroupsStore.error}
		<div class="error-banner" role="alert">
			<span>{eventTagGroupsStore.error}</span>
		</div>
	{/if}

	{#if eventTagGroupsStore.loading}
		<div class="flex justify-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	{:else if eventTagGroupsStore.groups.length === 0}
		<div class="empty-state">
			<p class="text-muted-foreground mb-4">Noch keine Gruppen vorhanden</p>
			<button onclick={openCreateModal} class="btn btn-primary">
				<Plus size={16} weight="bold" />
				Neue Gruppe erstellen
			</button>
		</div>
	{:else}
		<div class="groups-list">
			{#each eventTagGroupsStore.groups as group (group.id)}
				<div class="group-item">
					<div class="group-info">
						<div class="group-color" style="background-color: {group.color}"></div>
						<div class="group-details">
							<span class="group-name">{group.name}</span>
							<span class="group-tag-count">
								{group.tagCount ?? 0}
								{(group.tagCount ?? 0) === 1 ? 'Tag' : 'Tags'}
							</span>
						</div>
					</div>
					<div class="group-actions">
						<button
							type="button"
							onclick={() => openEditModal(group)}
							class="action-btn"
							aria-label="Gruppe bearbeiten"
						>
							<Pencil size={16} />
						</button>
						<button
							type="button"
							onclick={() => handleDeleteFromList(group)}
							class="action-btn action-btn-delete"
							aria-label="Gruppe löschen"
						>
							<Trash size={16} />
						</button>
					</div>
				</div>
			{/each}
		</div>

		<p class="groups-count">
			{eventTagGroupsStore.groups.length}
			{eventTagGroupsStore.groups.length === 1 ? 'Gruppe' : 'Gruppen'}
		</p>
	{/if}

	<!-- Info about ungrouped tags -->
	{#if eventTagGroupsStore.ungroupedTagCount > 0}
		<div class="ungrouped-info">
			<span>
				{eventTagGroupsStore.ungroupedTagCount}
				{eventTagGroupsStore.ungroupedTagCount === 1 ? 'Tag' : 'Tags'} ohne Gruppe
			</span>
		</div>
	{/if}
</div>

<!-- Group Edit Modal -->
<TagGroupEditModal
	group={editingGroup}
	isOpen={showModal}
	onClose={closeModal}
	onSave={handleSave}
	onDelete={editingGroup ? handleDelete : undefined}
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
		margin-bottom: 1rem;
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

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
	}

	/* Groups List */
	.groups-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.group-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.875rem 1rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		transition: all 0.2s ease;
	}

	.group-item:hover {
		background: hsl(var(--muted) / 0.3);
	}

	.group-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.group-color {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.group-details {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.group-name {
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.group-tag-count {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.group-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.group-item:hover .group-actions {
		opacity: 1;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border-radius: 0.5rem;
		color: hsl(var(--muted-foreground));
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn:hover {
		color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.1);
	}

	.action-btn-delete:hover {
		color: hsl(0 84% 60%);
		background: hsl(0 84% 60% / 0.1);
	}

	/* Count */
	.groups-count {
		text-align: center;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-top: 1.5rem;
	}

	/* Ungrouped Info */
	.ungrouped-info {
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin-top: 0.75rem;
		padding: 0.5rem;
		background: hsl(var(--muted) / 0.3);
		border-radius: 0.5rem;
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
