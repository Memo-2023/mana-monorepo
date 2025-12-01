<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { spacesStore } from '$lib/stores/spaces.svelte';
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import { PageHeader } from '@manacore/shared-ui';
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
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
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
				<svg
					class="w-16 h-16 text-muted-foreground mx-auto mb-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
				<h3 class="text-lg font-medium text-foreground mb-1">Keine Spaces gefunden</h3>
				<p class="text-muted-foreground mb-4">
					Erstelle einen neuen Space oder frage nach einer Einladung
				</p>
				<button
					onclick={handleCreateNew}
					class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium
                 hover:bg-primary/90 transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
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
