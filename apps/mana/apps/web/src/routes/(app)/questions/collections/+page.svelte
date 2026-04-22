<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { db } from '$lib/data/database';
	import {
		useAllCollections,
		useAllQuestions,
		getQuestionCountByCollection,
	} from '$lib/modules/questions/queries';
	import type { Collection } from '$lib/modules/questions/queries';
	import type { CreateCollectionDto, UpdateCollectionDto } from '$lib/modules/questions/types';
	import { ArrowLeft, Plus, PencilSimple, Trash, FolderOpen } from '@mana/shared-icons';

	const allCollections = useAllCollections();
	const allQuestions = useAllQuestions();

	let collections = $derived(allCollections.value);
	let questions = $derived(allQuestions.value);

	let showModal = $state(false);
	let editingCollection = $state<Collection | null>(null);
	let deleteConfirm = $state<string | null>(null);

	// Modal form state
	let formName = $state('');
	let formDescription = $state('');
	let formColor = $state('#6366f1');
	let formIcon = $state('folder');

	function openCreateModal() {
		editingCollection = null;
		formName = '';
		formDescription = '';
		formColor = '#6366f1';
		formIcon = 'folder';
		showModal = true;
	}

	function openEditModal(collection: Collection) {
		editingCollection = collection;
		formName = collection.name;
		formDescription = collection.description || '';
		formColor = collection.color;
		formIcon = collection.icon;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingCollection = null;
	}

	async function handleSave() {
		if (!formName.trim()) return;

		const now = new Date().toISOString();

		if (editingCollection) {
			await db.table('qCollections').update(editingCollection.id, {
				name: formName.trim(),
				description: formDescription.trim() || null,
				color: formColor,
				icon: formIcon,
				updatedAt: now,
			});
		} else {
			await db.table('qCollections').add({
				id: crypto.randomUUID(),
				name: formName.trim(),
				description: formDescription.trim() || null,
				color: formColor,
				icon: formIcon,
				isDefault: false,
				sortOrder: collections.length,
				createdAt: now,
				updatedAt: now,
			});
		}

		closeModal();
	}

	async function handleDelete(id: string) {
		await db.table('qCollections').update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		deleteConfirm = null;
	}
</script>

<svelte:head>
	<title>Sammlungen - Fragen - Mana</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<a
				href="/questions"
				class="mb-4 inline-flex items-center gap-2 text-sm text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
			>
				<ArrowLeft class="h-4 w-4" />
				Zurueck zu Fragen
			</a>
			<h1 class="text-2xl font-bold text-[hsl(var(--color-foreground))]">Sammlungen</h1>
			<p class="mt-1 text-sm text-[hsl(var(--color-muted-foreground))]">
				Organisiere deine Fragen in Sammlungen
			</p>
		</div>
		<button
			onclick={openCreateModal}
			class="flex items-center gap-2 rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-primary-foreground))] hover:opacity-90"
		>
			<Plus class="h-5 w-5" />
			Neue Sammlung
		</button>
	</div>

	<!-- Collections List -->
	{#if collections.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--color-border))] py-16"
		>
			<span class="mb-4 text-4xl">📁</span>
			<h2 class="mb-2 text-lg font-semibold text-[hsl(var(--color-foreground))]">
				Keine Sammlungen
			</h2>
			<p class="mb-4 text-sm text-[hsl(var(--color-muted-foreground))]">
				Erstelle deine erste Sammlung, um Fragen zu organisieren.
			</p>
			<button
				onclick={openCreateModal}
				class="flex items-center gap-2 rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-primary-foreground))]"
			>
				<Plus class="h-5 w-5" />
				Sammlung erstellen
			</button>
		</div>
	{:else}
		<div class="space-y-3">
			{#each collections as collection (collection.id)}
				<div
					class="flex items-center gap-4 rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4 transition-colors hover:border-[hsl(var(--color-primary)/0.3)]"
				>
					<!-- Icon & Color -->
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg"
						style="background-color: {collection.color}20"
					>
						<FolderOpen class="h-5 w-5" style="color: {collection.color}" />
					</div>

					<!-- Info -->
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<h3 class="font-medium text-[hsl(var(--color-foreground))]">{collection.name}</h3>
							{#if collection.isDefault}
								<span
									class="rounded-full bg-[hsl(var(--color-primary)/0.1)] px-2 py-0.5 text-xs text-[hsl(var(--color-primary))]"
								>
									Standard
								</span>
							{/if}
						</div>
						{#if collection.description}
							<p class="mt-0.5 truncate text-sm text-[hsl(var(--color-muted-foreground))]">
								{collection.description}
							</p>
						{/if}
						<p class="mt-1 text-xs text-[hsl(var(--color-muted-foreground))]">
							{getQuestionCountByCollection(questions, collection.id)} Fragen
						</p>
					</div>

					<!-- Actions -->
					<div class="flex items-center gap-2">
						<button
							onclick={() => openEditModal(collection)}
							class="rounded-lg p-2 text-[hsl(var(--color-muted-foreground))] hover:bg-[hsl(var(--color-muted))] hover:text-[hsl(var(--color-foreground))]"
							title={$_('common.edit')}
						>
							<PencilSimple class="h-4 w-4" />
						</button>

						{#if deleteConfirm === collection.id}
							<div class="flex items-center gap-1">
								<button
									onclick={() => handleDelete(collection.id)}
									class="rounded-lg bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
								>
									Loeschen
								</button>
								<button
									onclick={() => (deleteConfirm = null)}
									class="rounded-lg border border-[hsl(var(--color-border))] px-3 py-1 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-muted))]"
								>
									Abbrechen
								</button>
							</div>
						{:else}
							<button
								onclick={() => (deleteConfirm = collection.id)}
								class="rounded-lg p-2 text-[hsl(var(--color-muted-foreground))] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
								title="Loeschen"
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
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div
			class="mx-4 w-full max-w-md rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-6"
		>
			<h2 class="mb-4 text-lg font-semibold text-[hsl(var(--color-foreground))]">
				{editingCollection ? 'Sammlung bearbeiten' : 'Neue Sammlung'}
			</h2>

			<div class="space-y-4">
				<div>
					<label
						for="collection-name"
						class="mb-1 block text-sm font-medium text-[hsl(var(--color-foreground))]"
					>
						Name
					</label>
					<input
						id="collection-name"
						type="text"
						bind:value={formName}
						placeholder="Sammlungsname"
						class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
					/>
				</div>

				<div>
					<label
						for="collection-desc"
						class="mb-1 block text-sm font-medium text-[hsl(var(--color-foreground))]"
					>
						Beschreibung
					</label>
					<textarea
						id="collection-desc"
						bind:value={formDescription}
						placeholder="Optionale Beschreibung"
						rows="2"
						class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
					></textarea>
				</div>

				<div>
					<label
						for="collection-color"
						class="mb-1 block text-sm font-medium text-[hsl(var(--color-foreground))]"
					>
						Farbe
					</label>
					<input
						id="collection-color"
						type="color"
						bind:value={formColor}
						class="h-10 w-20 cursor-pointer rounded-lg border border-[hsl(var(--color-border))]"
					/>
				</div>
			</div>

			<div class="mt-6 flex justify-end gap-3">
				<button
					onclick={closeModal}
					class="rounded-lg border border-[hsl(var(--color-border))] px-4 py-2 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-muted))]"
				>
					{$_('common.cancel')}
				</button>
				<button
					onclick={handleSave}
					disabled={!formName.trim()}
					class="rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-primary-foreground))] hover:opacity-90 disabled:opacity-50"
				>
					{editingCollection ? $_('common.save') : $_('common.create')}
				</button>
			</div>
		</div>
	</div>
{/if}
