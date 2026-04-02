<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { Plus, MagnifyingGlass } from '@manacore/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import { spacesStore } from '$lib/stores/spaces.svelte';
	import { useAllSpaces } from '$lib/data/queries';
	import SpaceCard from '$lib/components/SpaceCard.svelte';
	import CreateSpaceModal from '$lib/components/CreateSpaceModal.svelte';
	import { ConfirmationModal } from '@manacore/shared-ui';
	import type { Space } from '$lib/types';

	let searchQuery = $state('');
	let showCreateModal = $state(false);
	let creating = $state(false);
	let deleteTarget = $state<string | null>(null);
	let editTarget = $state<Space | null>(null);

	const allSpaces = useAllSpaces();
	let spaces = $derived(allSpaces.value ?? []);

	let filteredSpaces = $derived(
		searchQuery.trim()
			? spaces.filter(
					(s) =>
						s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						s.description?.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: spaces
	);

	async function handleCreate(name: string, description: string) {
		if (!authStore.user?.id) return;
		creating = true;
		await spacesStore.create(authStore.user.id, name, description);
		creating = false;
		showCreateModal = false;
	}

	function handleTogglePin(id: string) {
		const space = spaces.find((s) => s.id === id);
		spacesStore.togglePinned(id, space?.pinned ?? false);
	}

	function handleDeleteClick(id: string) {
		deleteTarget = id;
	}

	async function handleDeleteConfirm() {
		if (deleteTarget) {
			await spacesStore.delete(deleteTarget);
			deleteTarget = null;
		}
	}

	function handleEdit(space: Space) {
		editTarget = space;
	}
</script>

<svelte:head>
	<title>Spaces | Context</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-foreground">{$_('spaces.title')}</h1>
		<button
			class="btn btn-primary flex items-center gap-2"
			onclick={() => (showCreateModal = true)}
		>
			<Plus size={16} />
			{$_('spaces.create')}
		</button>
	</div>

	<!-- Search -->
	<div class="relative mb-6">
		<MagnifyingGlass
			size={16}
			class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
		/>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Spaces durchsuchen..."
			class="w-full pl-9 pr-4 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
		/>
	</div>

	{#if spacesStore.loading}
		<div class="text-center py-12 text-muted-foreground">Lade Spaces...</div>
	{:else if filteredSpaces.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			{#each filteredSpaces as space}
				<SpaceCard
					{space}
					onTogglePin={handleTogglePin}
					onDelete={handleDeleteClick}
					onEdit={handleEdit}
				/>
			{/each}
		</div>
	{:else if searchQuery}
		<div class="text-center py-12">
			<p class="text-muted-foreground">Keine Spaces gefunden für "{searchQuery}"</p>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center py-16 text-center">
			<div class="p-4 rounded-full bg-muted mb-4">
				<Plus size={48} class="text-muted-foreground" />
			</div>
			<h2 class="text-lg font-medium text-foreground mb-2">{$_('spaces.empty')}</h2>
			<p class="text-sm text-muted-foreground max-w-md mb-4">
				Spaces helfen dir, dein Wissen zu organisieren. Erstelle deinen ersten Space, um loszulegen.
			</p>
			<button
				class="btn btn-primary flex items-center gap-2"
				onclick={() => (showCreateModal = true)}
			>
				<Plus size={16} />
				{$_('spaces.create')}
			</button>
		</div>
	{/if}
</div>

<CreateSpaceModal
	open={showCreateModal}
	loading={creating}
	onSubmit={handleCreate}
	onClose={() => (showCreateModal = false)}
/>

<ConfirmationModal
	visible={deleteTarget !== null}
	title="Space löschen?"
	message="Alle Dokumente in diesem Space werden ebenfalls gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
	confirmLabel="Löschen"
	onConfirm={handleDeleteConfirm}
	onClose={() => (deleteTarget = null)}
/>
