<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { dataService } from '$lib/api';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { Story } from '$lib/types/story';

	// Types
	interface Collection {
		id: string;
		name: string;
		description?: string;
		color: string;
		storyIds: string[];
		stories?: Story[];
		createdAt: string;
		updatedAt: string;
	}

	// State
	let collections = $state<Collection[]>([]);
	let stories = $state<Story[]>([]);
	let loading = $state(true);
	let showCreateModal = $state(false);
	let editingCollection = $state<Collection | null>(null);

	// Form state
	let formName = $state('');
	let formDescription = $state('');
	let formColor = $state('pink');

	// Available colors
	const colors = [
		{ id: 'pink', bg: 'bg-pink-500', gradient: 'from-pink-400 to-pink-600' },
		{ id: 'purple', bg: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600' },
		{ id: 'blue', bg: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600' },
		{ id: 'green', bg: 'bg-green-500', gradient: 'from-green-400 to-green-600' },
		{ id: 'amber', bg: 'bg-amber-500', gradient: 'from-amber-400 to-amber-600' },
		{ id: 'red', bg: 'bg-red-500', gradient: 'from-red-400 to-red-600' },
	];

	// Fetch data (collections API not implemented yet - using mock data)
	async function fetchData() {
		loading = true;
		try {
			// Fetch stories from API
			stories = await dataService.getStories();

			// TODO: Replace with actual API call when collections endpoint is available
			// Collections are stored locally for now
			const savedCollections = localStorage.getItem('maerchenzauber-collections');
			if (savedCollections) {
				collections = JSON.parse(savedCollections);
			} else {
				collections = [
					{
						id: '1',
						name: 'Gutenachtgeschichten',
						description: 'Beruhigende Geschichten zum Einschlafen',
						color: 'purple',
						storyIds: [],
						createdAt: '2024-01-15',
						updatedAt: '2024-01-20',
					},
					{
						id: '2',
						name: 'Emmas Favoriten',
						description: 'Die Lieblingsgeschichten von Emma',
						color: 'pink',
						storyIds: [],
						createdAt: '2024-01-10',
						updatedAt: '2024-01-18',
					},
				];
			}
		} catch (err) {
			console.error('[Collections] Failed to fetch:', err);
			stories = [];
			collections = [];
		} finally {
			loading = false;
		}
	}

	// Save collections to localStorage
	function saveCollections() {
		localStorage.setItem('maerchenzauber-collections', JSON.stringify(collections));
	}

	onMount(() => {
		fetchData();
	});

	// Open create modal
	function openCreateModal() {
		formName = '';
		formDescription = '';
		formColor = 'pink';
		editingCollection = null;
		showCreateModal = true;
	}

	// Open edit modal
	function openEditModal(collection: Collection) {
		formName = collection.name;
		formDescription = collection.description || '';
		formColor = collection.color;
		editingCollection = collection;
		showCreateModal = true;
	}

	// Save collection (localStorage only - API not implemented yet)
	function saveCollection() {
		if (!formName.trim()) {
			toastStore.warning('Bitte gib einen Namen ein');
			return;
		}

		if (editingCollection) {
			collections = collections.map((c) =>
				c.id === editingCollection!.id
					? {
							...c,
							name: formName,
							description: formDescription,
							color: formColor,
							updatedAt: new Date().toISOString(),
						}
					: c
			);
			toastStore.success('Sammlung aktualisiert');
		} else {
			collections = [
				...collections,
				{
					id: Date.now().toString(),
					name: formName,
					description: formDescription,
					color: formColor,
					storyIds: [],
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			];
			toastStore.success('Sammlung erstellt');
		}
		saveCollections();
		showCreateModal = false;
	}

	// Delete collection (localStorage only - API not implemented yet)
	function deleteCollection(collectionId: string) {
		if (!confirm('Diese Sammlung wirklich löschen?')) return;

		collections = collections.filter((c) => c.id !== collectionId);
		saveCollections();
		toastStore.success('Sammlung gelöscht');
	}

	// Get color class
	function getColorGradient(colorId: string): string {
		return colors.find((c) => c.id === colorId)?.gradient || 'from-pink-400 to-pink-600';
	}

	// Get story count
	function getStoryCount(collection: Collection): number {
		return collection.storyIds?.length || 0;
	}

	// Get preview images
	function getPreviewImages(collection: Collection): string[] {
		const collectionStories = stories.filter((s) => collection.storyIds?.includes(s.id));
		return collectionStories
			.slice(0, 3)
			.map((s) => s.pages?.[0]?.image || '/images/placeholder-story.png');
	}
</script>

<svelte:head>
	<title>Sammlungen | Märchenzauber</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Sammlungen</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Organisiere deine Geschichten in Sammlungen
			</p>
		</div>
		<button
			onclick={openCreateModal}
			class="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Neue Sammlung
		</button>
	</div>

	<!-- Collections Grid -->
	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="h-48 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
			{/each}
		</div>
	{:else if collections.length === 0}
		<div class="rounded-2xl bg-gray-50 p-8 text-center dark:bg-gray-800/50">
			<svg
				class="mx-auto h-16 w-16 text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
				/>
			</svg>
			<h3 class="mt-4 font-medium text-gray-700 dark:text-gray-300">Keine Sammlungen</h3>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Erstelle deine erste Sammlung, um Geschichten zu organisieren
			</p>
			<button
				onclick={openCreateModal}
				class="mt-4 rounded-xl bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600"
			>
				Sammlung erstellen
			</button>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each collections as collection (collection.id)}
				<div
					class="group relative overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:shadow-xl dark:bg-gray-800"
				>
					<!-- Gradient header -->
					<div class="h-24 bg-gradient-to-br {getColorGradient(collection.color)} p-4">
						<!-- Preview images -->
						<div class="flex -space-x-3">
							{#each getPreviewImages(collection) as image, i}
								<div
									class="h-12 w-12 overflow-hidden rounded-lg border-2 border-white shadow-md"
									style="z-index: {3 - i}"
								>
									<img src={image} alt="" class="h-full w-full object-cover" />
								</div>
							{/each}
							{#if getStoryCount(collection) === 0}
								<div
									class="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-white/50 bg-white/20"
								>
									<svg
										class="h-6 w-6 text-white/70"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
										/>
									</svg>
								</div>
							{/if}
						</div>
					</div>

					<!-- Content -->
					<div class="p-4">
						<h3 class="font-semibold text-gray-800 dark:text-gray-200">
							{collection.name}
						</h3>
						{#if collection.description}
							<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
								{collection.description}
							</p>
						{/if}
						<p class="mt-2 text-xs text-gray-500 dark:text-gray-500">
							{getStoryCount(collection)}
							{getStoryCount(collection) === 1 ? 'Geschichte' : 'Geschichten'}
						</p>
					</div>

					<!-- Actions (shown on hover) -->
					<div
						class="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
					>
						<button
							onclick={() => openEditModal(collection)}
							class="rounded-lg bg-white/90 p-2 text-gray-600 hover:bg-white hover:text-gray-800 dark:bg-gray-700/90 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</button>
						<button
							onclick={() => deleteCollection(collection.id)}
							class="rounded-lg bg-white/90 p-2 text-red-500 hover:bg-white hover:text-red-600 dark:bg-gray-700/90 dark:hover:bg-gray-700"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</div>

					<!-- Click overlay -->
					<a
						href="/collections/{collection.id}"
						class="absolute inset-0 z-0"
						aria-label="Sammlung öffnen: {collection.name}"
					></a>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Create/Edit Modal -->
	{#if showCreateModal}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
			onclick={() => (showCreateModal = false)}
			onkeydown={(e) => e.key === 'Escape' && (showCreateModal = false)}
			role="button"
			tabindex="0"
		>
			<div
				class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="dialog"
			>
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">
						{editingCollection ? 'Sammlung bearbeiten' : 'Neue Sammlung'}
					</h2>
					<button
						onclick={() => (showCreateModal = false)}
						class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						saveCollection();
					}}
					class="space-y-4"
				>
					<!-- Name -->
					<div>
						<label
							for="name"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Name
						</label>
						<input
							id="name"
							type="text"
							bind:value={formName}
							placeholder="z.B. Gutenachtgeschichten"
							class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
						/>
					</div>

					<!-- Description -->
					<div>
						<label
							for="description"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Beschreibung (optional)
						</label>
						<textarea
							id="description"
							bind:value={formDescription}
							rows="2"
							placeholder="Worum geht es in dieser Sammlung?"
							class="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
						></textarea>
					</div>

					<!-- Color -->
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Farbe
						</label>
						<div class="flex flex-wrap gap-2">
							{#each colors as color}
								<button
									type="button"
									onclick={() => (formColor = color.id)}
									class="h-10 w-10 rounded-xl {color.bg} transition-transform {formColor ===
									color.id
										? 'scale-110 ring-2 ring-gray-800 ring-offset-2 dark:ring-white'
										: 'hover:scale-105'}"
									aria-label={color.id}
								></button>
							{/each}
						</div>
					</div>

					<!-- Submit -->
					<button
						type="submit"
						class="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-[1.02]"
					>
						{editingCollection ? 'Speichern' : 'Erstellen'}
					</button>
				</form>
			</div>
		</div>
	{/if}
</div>
