<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { spacesStore } from '$lib/stores/spaces.svelte';
	import { PageHeader } from '@manacore/shared-ui';
	import { Plus, UsersThree } from '@manacore/shared-icons';
	import SpaceCard from '$lib/components/spaces/SpaceCard.svelte';
	import SpaceForm from '$lib/components/spaces/SpaceForm.svelte';
	import type { Space } from '@chat/types';

	let showForm = $state(false);
	let editingSpace = $state<Space | undefined>(undefined);

	onMount(async () => {
		if (authStore.user) {
			await spacesStore.loadSpaces(authStore.user.id);
		}
	});

	function handleCreateNew() {
		editingSpace = undefined;
		showForm = true;
	}

	function handleSelect(id: string) {
		// Navigate to space - load conversations filtered by this space
		goto(`/spaces/${id}`);
	}

	function handleEdit(id: string) {
		const space = spacesStore.spaces.find((s) => s.id === id);
		if (space) {
			editingSpace = space;
			showForm = true;
		}
	}

	async function handleDelete(id: string) {
		if (
			confirm(
				'Möchtest du diesen Space wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
			)
		) {
			await spacesStore.deleteSpace(id);
		}
	}

	async function handleLeave(id: string) {
		if (!authStore.user) return;

		if (confirm('Möchtest du diesen Space wirklich verlassen?')) {
			await spacesStore.leaveSpace(id, authStore.user.id);
		}
	}

	async function handleSubmit(data: { name: string; description?: string }) {
		if (!authStore.user) return;

		if (editingSpace) {
			// Update existing space
			await spacesStore.updateSpace(editingSpace.id, data);
		} else {
			// Create new space
			await spacesStore.createSpace({
				name: data.name,
				description: data.description,
				ownerId: authStore.user.id,
			});
		}

		showForm = false;
		editingSpace = undefined;
	}

	function handleCancel() {
		showForm = false;
		editingSpace = undefined;
	}

	function isOwner(space: Space): boolean {
		return space.ownerId === authStore.user?.id;
	}
</script>

<svelte:head>
	<title>Spaces | ManaChat</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] bg-background py-8">
	<div class="max-w-4xl mx-auto px-4">
		<PageHeader
			title="Spaces"
			description="Organisiere deine Konversationen in kollaborativen Arbeitsbereichen."
			size="lg"
		>
			{#snippet actions()}
				<button
					onclick={handleCreateNew}
					class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium
                   hover:bg-primary/90 transition-colors"
				>
					<Plus size={20} />
					Neuen Space erstellen
				</button>
			{/snippet}
		</PageHeader>

		<!-- Loading State -->
		{#if spacesStore.isLoading}
			<div class="flex items-center justify-center py-16">
				<div
					class="animate-spin w-8 h-8 border-4 border-primary border-r-transparent rounded-full"
				></div>
			</div>
		{:else if spacesStore.spaces.length === 0}
			<!-- Empty State -->
			<div class="text-center py-16">
				<UsersThree size={64} class="text-muted-foreground mx-auto mb-4" />
				<h3 class="text-lg font-medium text-foreground mb-1">Keine Spaces gefunden</h3>
				<p class="text-muted-foreground mb-4">
					Erstelle einen neuen Space oder frage nach einer Einladung
				</p>
				<button
					onclick={handleCreateNew}
					class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium
                 hover:bg-primary/90 transition-colors"
				>
					<Plus size={20} />
					Ersten Space erstellen
				</button>
			</div>
		{:else}
			<!-- Spaces Grid -->
			<div class="grid gap-4 sm:grid-cols-2">
				{#each spacesStore.spaces as space (space.id)}
					<SpaceCard
						{space}
						isOwner={isOwner(space)}
						onSelect={handleSelect}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onLeave={handleLeave}
					/>
				{/each}
			</div>
		{/if}

		<!-- Error Message -->
		{#if spacesStore.error}
			<div class="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
				{spacesStore.error}
			</div>
		{/if}
	</div>
</div>

<!-- Form Modal -->
{#if showForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
		<div class="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-xl">
			<SpaceForm space={editingSpace} onSubmit={handleSubmit} onCancel={handleCancel} />
		</div>
	</div>
{/if}
