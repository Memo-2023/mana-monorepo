<script lang="ts">
	import { onMount } from 'svelte';
	import { tags, isLoadingTags } from '$lib/stores/tags';
	import { getAllTags, createTag, updateTag, deleteTag } from '$lib/api/tags';
	import { showToast } from '$lib/stores/toast';
	import type { Database } from '@picture/shared/types';

	type Tag = Database['public']['Tables']['tags']['Row'];

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let editingTag = $state<Tag | null>(null);
	let newTagName = $state('');
	let newTagColor = $state('#3B82F6');
	let editTagName = $state('');
	let editTagColor = $state('');

	const predefinedColors = [
		'#EF4444', // red
		'#F59E0B', // amber
		'#10B981', // emerald
		'#3B82F6', // blue
		'#8B5CF6', // violet
		'#EC4899', // pink
		'#6366F1', // indigo
		'#14B8A6'  // teal
	];

	onMount(async () => {
		await loadTags();
	});

	async function loadTags() {
		isLoadingTags.set(true);
		try {
			const data = await getAllTags();
			tags.set(data);
		} catch (error) {
			console.error('Error loading tags:', error);
			showToast('Fehler beim Laden der Tags', 'error');
		} finally {
			isLoadingTags.set(false);
		}
	}

	async function handleCreateTag() {
		if (!newTagName.trim()) return;

		try {
			await createTag({
				name: newTagName.trim(),
				color: newTagColor
			});
			await loadTags();
			showToast('Tag erfolgreich erstellt', 'success');
			newTagName = '';
			newTagColor = '#3B82F6';
			showCreateModal = false;
		} catch (error) {
			console.error('Error creating tag:', error);
			showToast('Fehler beim Erstellen des Tags', 'error');
		}
	}

	function openEditModal(tag: Tag) {
		editingTag = tag;
		editTagName = tag.name;
		editTagColor = tag.color || '#3B82F6';
		showEditModal = true;
	}

	async function handleUpdateTag() {
		if (!editingTag || !editTagName.trim()) return;

		try {
			await updateTag(editingTag.id, {
				name: editTagName.trim(),
				color: editTagColor
			});
			await loadTags();
			showToast('Tag erfolgreich aktualisiert', 'success');
			showEditModal = false;
			editingTag = null;
		} catch (error) {
			console.error('Error updating tag:', error);
			showToast('Fehler beim Aktualisieren des Tags', 'error');
		}
	}

	async function handleDeleteTag(tagId: string) {
		if (!confirm('Möchten Sie diesen Tag wirklich löschen?')) return;

		try {
			await deleteTag(tagId);
			await loadTags();
			showToast('Tag erfolgreich gelöscht', 'success');
		} catch (error) {
			console.error('Error deleting tag:', error);
			showToast('Fehler beim Löschen des Tags', 'error');
		}
	}
</script>

<svelte:head>
	<title>Tag-Verwaltung - Picture</title>
</svelte:head>

<div class="min-h-screen px-4 py-8">
	<div class="mx-auto max-w-4xl">
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Tag-Verwaltung</h1>
				<p class="mt-2 text-gray-600 dark:text-gray-400">
					Verwalte deine Tags für eine bessere Organisation deiner Bilder
				</p>
			</div>
			<button
				onclick={() => (showCreateModal = true)}
				class="flex items-center gap-2 rounded-2xl bg-blue-600/90 px-6 py-3 text-sm font-medium text-white backdrop-blur-xl transition-all hover:bg-blue-700/90 dark:bg-blue-500/90 dark:hover:bg-blue-600/90"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Neuer Tag
			</button>
		</div>

		<!-- Tags Grid -->
		{#if $isLoadingTags}
			<div class="flex items-center justify-center py-12">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent dark:border-blue-400"
				></div>
			</div>
		{:else if $tags.length === 0}
			<div class="rounded-3xl border border-gray-200/50 bg-white/80 p-12 text-center backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/80">
				<svg
					class="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
					/>
				</svg>
				<h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Keine Tags vorhanden</h3>
				<p class="mt-2 text-gray-600 dark:text-gray-400">
					Erstelle deinen ersten Tag, um deine Bilder zu organisieren
				</p>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each $tags as tag (tag.id)}
					<div
						class="group relative rounded-2xl border border-gray-200/50 bg-white/80 p-6 backdrop-blur-xl transition-all hover:shadow-lg dark:border-gray-700/50 dark:bg-gray-900/80"
					>
						<div class="flex items-start justify-between">
							<div class="flex items-center gap-3">
								{#if tag.color}
									<div
										class="h-8 w-8 rounded-full"
										style="background-color: {tag.color};"
									></div>
								{/if}
								<div>
									<h3 class="font-medium text-gray-900 dark:text-gray-100">{tag.name}</h3>
									<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
										{tag.created_at ? new Date(tag.created_at).toLocaleDateString('de-DE') : ''}
									</p>
								</div>
							</div>

							<div class="flex gap-2">
								<button
									onclick={() => openEditModal(tag)}
									class="rounded-lg bg-gray-100/80 p-2 text-gray-600 backdrop-blur-xl transition-all hover:bg-gray-200/80 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700/80"
									aria-label="Bearbeiten"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
								</button>
								<button
									onclick={() => handleDeleteTag(tag.id)}
									class="rounded-lg bg-red-100/80 p-2 text-red-600 backdrop-blur-xl transition-all hover:bg-red-200/80 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
									aria-label="Löschen"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Create Tag Modal -->
{#if showCreateModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		onclick={() => (showCreateModal = false)}
		role="presentation"
	>
		<div
			class="w-full max-w-md rounded-3xl border border-gray-200/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
		>
			<h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Neuer Tag</h2>

			<div class="space-y-4">
				<div>
					<label for="tag-name" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Name
					</label>
					<input
						id="tag-name"
						type="text"
						bind:value={newTagName}
						placeholder="z.B. Landschaft, Portrait, etc."
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
					/>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Farbe
					</label>
					<div class="flex flex-wrap gap-3">
						{#each predefinedColors as color}
							<button
								onclick={() => (newTagColor = color)}
								class="h-10 w-10 rounded-full transition-all {newTagColor === color
									? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
									: ''}"
								style="background-color: {color}; {newTagColor === color ? `--tw-ring-color: ${color}` : ''}"
								aria-label="Farbe auswählen"
							></button>
						{/each}
					</div>
				</div>
			</div>

			<div class="mt-6 flex gap-3">
				<button
					onclick={() => (showCreateModal = false)}
					class="flex-1 rounded-xl bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					Abbrechen
				</button>
				<button
					onclick={handleCreateTag}
					disabled={!newTagName.trim()}
					class="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
				>
					Erstellen
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Tag Modal -->
{#if showEditModal && editingTag}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		onclick={() => (showEditModal = false)}
		role="presentation"
	>
		<div
			class="w-full max-w-md rounded-3xl border border-gray-200/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
		>
			<h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Tag bearbeiten</h2>

			<div class="space-y-4">
				<div>
					<label for="edit-tag-name" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Name
					</label>
					<input
						id="edit-tag-name"
						type="text"
						bind:value={editTagName}
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
					/>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Farbe
					</label>
					<div class="flex flex-wrap gap-3">
						{#each predefinedColors as color}
							<button
								onclick={() => (editTagColor = color)}
								class="h-10 w-10 rounded-full transition-all {editTagColor === color
									? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
									: ''}"
								style="background-color: {color}; {editTagColor === color ? `--tw-ring-color: ${color}` : ''}"
								aria-label="Farbe auswählen"
							></button>
						{/each}
					</div>
				</div>
			</div>

			<div class="mt-6 flex gap-3">
				<button
					onclick={() => (showEditModal = false)}
					class="flex-1 rounded-xl bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					Abbrechen
				</button>
				<button
					onclick={handleUpdateTag}
					disabled={!editTagName.trim()}
					class="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
				>
					Speichern
				</button>
			</div>
		</div>
	</div>
{/if}
