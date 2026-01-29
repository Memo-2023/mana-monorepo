<script lang="ts">
	import { collectionsStore } from '$lib/stores';
	import CollectionModal from '$lib/components/CollectionModal.svelte';
	import {
		ArrowLeft,
		Plus,
		PencilSimple,
		Trash,
		FolderOpen,
		DotsSixVertical,
	} from '@manacore/shared-icons';
	import type { Collection } from '$lib/types';

	let showModal = $state(false);
	let editingCollection = $state<Collection | null>(null);
	let deleteConfirm = $state<string | null>(null);

	function openCreateModal() {
		editingCollection = null;
		showModal = true;
	}

	function openEditModal(collection: Collection) {
		editingCollection = collection;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingCollection = null;
	}

	function handleSave() {
		closeModal();
	}

	async function handleDelete(id: string) {
		const success = await collectionsStore.delete(id);
		if (success) {
			deleteConfirm = null;
		}
	}
</script>

<div class="mx-auto max-w-2xl p-6">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<a
				href="/"
				class="mb-4 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft class="h-4 w-4" />
				Back to questions
			</a>
			<h1 class="text-2xl font-bold text-foreground">Collections</h1>
			<p class="mt-1 text-muted-foreground">Organize your questions into collections</p>
		</div>
		<button
			onclick={openCreateModal}
			class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary-hover"
		>
			<Plus class="h-5 w-5" />
			New Collection
		</button>
	</div>

	<!-- Collections List -->
	{#if collectionsStore.collections.length === 0}
		<div class="rounded-xl border border-dashed border-border p-8 text-center">
			<div class="mb-4 text-4xl">📁</div>
			<h2 class="mb-2 text-lg font-semibold text-foreground">No collections yet</h2>
			<p class="mb-4 text-muted-foreground">
				Create your first collection to organize your questions.
			</p>
			<button
				onclick={openCreateModal}
				class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary-hover"
			>
				<Plus class="h-5 w-5" />
				Create Collection
			</button>
		</div>
	{:else}
		<div class="space-y-3">
			{#each collectionsStore.collections as collection}
				<div
					class="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50"
				>
					<!-- Drag Handle -->
					<div class="cursor-grab text-muted-foreground">
						<DotsSixVertical class="h-5 w-5" />
					</div>

					<!-- Icon & Color -->
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg"
						style="background-color: {collection.color}20"
					>
						<FolderOpen class="h-5 w-5" style="color: {collection.color}" />
					</div>

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<h3 class="font-medium text-foreground">{collection.name}</h3>
							{#if collection.isDefault}
								<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
									Default
								</span>
							{/if}
						</div>
						{#if collection.description}
							<p class="mt-0.5 text-sm text-muted-foreground truncate">
								{collection.description}
							</p>
						{/if}
						<p class="mt-1 text-xs text-muted-foreground">
							{collection.questionCount || 0} questions
						</p>
					</div>

					<!-- Actions -->
					<div class="flex items-center gap-2">
						<button
							onclick={() => openEditModal(collection)}
							class="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
							title="Edit"
						>
							<PencilSimple class="h-4 w-4" />
						</button>

						{#if deleteConfirm === collection.id}
							<div class="flex items-center gap-1">
								<button
									onclick={() => handleDelete(collection.id)}
									class="rounded-lg bg-destructive px-3 py-1 text-sm text-destructive-foreground hover:bg-destructive/90"
								>
									Delete
								</button>
								<button
									onclick={() => (deleteConfirm = null)}
									class="rounded-lg border border-border px-3 py-1 text-sm text-foreground hover:bg-secondary"
								>
									Cancel
								</button>
							</div>
						{:else}
							<button
								onclick={() => (deleteConfirm = collection.id)}
								class="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
								title="Delete"
							>
								<Trash class="h-4 w-4" />
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Modal -->
{#if showModal}
	<CollectionModal collection={editingCollection} onClose={closeModal} onSave={handleSave} />
{/if}
