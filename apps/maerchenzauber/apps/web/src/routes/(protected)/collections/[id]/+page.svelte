<script lang="ts">
	import { page } from '$app/stores';
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
	}

	// Get ID from route
	const collectionId = $page.params.id;

	// State
	let collection = $state<Collection | null>(null);
	let stories = $state<Story[]>([]);
	let allStories = $state<Story[]>([]);
	let loading = $state(true);
	let showAddModal = $state(false);

	// Colors
	const colorGradients: Record<string, string> = {
		pink: 'from-pink-400 to-pink-600',
		purple: 'from-purple-400 to-purple-600',
		blue: 'from-blue-400 to-blue-600',
		green: 'from-green-400 to-green-600',
		amber: 'from-amber-400 to-amber-600',
		red: 'from-red-400 to-red-600'
	};

	// Fetch data
	async function fetchData() {
		loading = true;
		try {
			const [collectionData, allStoriesData] = await Promise.all([
				dataService.getCollection?.(collectionId),
				dataService.getStories()
			]);

			if (collectionData) {
				collection = collectionData;
				allStories = allStoriesData || [];
				stories = allStories.filter((s) => collectionData.storyIds?.includes(s.id));
			} else {
				// Mock data
				collection = {
					id: collectionId,
					name: 'Gutenachtgeschichten',
					description: 'Beruhigende Geschichten zum Einschlafen',
					color: 'purple',
					storyIds: []
				};
				allStories = [];
				stories = [];
			}
		} catch (err) {
			console.error('[Collection] Failed to fetch:', err);
			collection = {
				id: collectionId,
				name: 'Sammlung',
				color: 'pink',
				storyIds: []
			};
			stories = [];
			allStories = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchData();
	});

	// Add story to collection
	async function addStory(storyId: string) {
		if (!collection) return;

		try {
			await dataService.addStoryToCollection?.(collectionId, storyId);
			collection.storyIds = [...(collection.storyIds || []), storyId];
			stories = allStories.filter((s) => collection!.storyIds.includes(s.id));
			toastStore.success('Geschichte hinzugefügt');
		} catch (err) {
			// Optimistic update
			collection.storyIds = [...(collection.storyIds || []), storyId];
			stories = allStories.filter((s) => collection!.storyIds.includes(s.id));
			toastStore.success('Geschichte hinzugefügt');
		}
	}

	// Remove story from collection
	async function removeStory(storyId: string) {
		if (!collection) return;

		try {
			await dataService.removeStoryFromCollection?.(collectionId, storyId);
			collection.storyIds = collection.storyIds.filter((id) => id !== storyId);
			stories = stories.filter((s) => s.id !== storyId);
			toastStore.success('Geschichte entfernt');
		} catch (err) {
			collection.storyIds = collection.storyIds.filter((id) => id !== storyId);
			stories = stories.filter((s) => s.id !== storyId);
			toastStore.success('Geschichte entfernt');
		}
	}

	// Get stories not in collection
	let availableStories = $derived(
		allStories.filter((s) => !collection?.storyIds?.includes(s.id))
	);

	// Get story image
	function getStoryImage(story: Story): string {
		return story.pages?.[0]?.image || '/images/placeholder-story.png';
	}
</script>

<svelte:head>
	<title>{collection?.name || 'Sammlung'} | Märchenzauber</title>
</svelte:head>

<div class="space-y-6">
	{#if loading}
		<div class="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="h-48 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
			{/each}
		</div>
	{:else if collection}
		<!-- Header -->
		<div class="overflow-hidden rounded-2xl bg-gradient-to-br {colorGradients[collection.color] || colorGradients.pink}">
			<div class="p-6">
				<div class="flex items-start gap-4">
					<a
						href="/collections"
						class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
					</a>
					<div class="flex-1">
						<h1 class="text-2xl font-bold text-white">{collection.name}</h1>
						{#if collection.description}
							<p class="mt-1 text-white/80">{collection.description}</p>
						{/if}
						<p class="mt-2 text-sm text-white/70">
							{stories.length} {stories.length === 1 ? 'Geschichte' : 'Geschichten'}
						</p>
					</div>
					<button
						onclick={() => (showAddModal = true)}
						class="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						Hinzufügen
					</button>
				</div>
			</div>
		</div>

		<!-- Stories Grid -->
		{#if stories.length === 0}
			<div class="rounded-2xl bg-gray-50 p-8 text-center dark:bg-gray-800/50">
				<svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
				<h3 class="mt-4 font-medium text-gray-700 dark:text-gray-300">Keine Geschichten</h3>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
					Füge Geschichten zu dieser Sammlung hinzu
				</p>
				<button
					onclick={() => (showAddModal = true)}
					class="mt-4 rounded-xl bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600"
				>
					Geschichten hinzufügen
				</button>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each stories as story (story.id)}
					<div class="group relative overflow-hidden rounded-2xl bg-white shadow-md dark:bg-gray-800">
						<!-- Image -->
						<div class="aspect-video overflow-hidden">
							<img
								src={getStoryImage(story)}
								alt={story.title}
								class="h-full w-full object-cover transition-transform group-hover:scale-105"
								loading="lazy"
							/>
						</div>

						<!-- Info -->
						<div class="p-4">
							<h3 class="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">
								{story.title || 'Ohne Titel'}
							</h3>
							<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
								{story.description || 'Keine Beschreibung'}
							</p>
						</div>

						<!-- Remove button -->
						<button
							onclick={() => removeStory(story.id)}
							class="absolute right-2 top-2 rounded-lg bg-white/90 p-2 text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:bg-gray-700/90"
							aria-label="Aus Sammlung entfernen"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>

						<!-- Click overlay -->
						<a
							href="/stories/{story.id}"
							class="absolute inset-0 z-0"
							aria-label="Geschichte öffnen: {story.title}"
						></a>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Add Stories Modal -->
	{#if showAddModal}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
			onclick={() => (showAddModal = false)}
			onkeydown={(e) => e.key === 'Escape' && (showAddModal = false)}
			role="button"
			tabindex="0"
		>
			<div
				class="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="dialog"
			>
				<div class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
					<h2 class="text-lg font-bold text-gray-800 dark:text-gray-200">Geschichten hinzufügen</h2>
					<button
						onclick={() => (showAddModal = false)}
						class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="max-h-96 overflow-y-auto p-4">
					{#if availableStories.length === 0}
						<div class="py-8 text-center">
							<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
								Alle Geschichten sind bereits in dieser Sammlung
							</p>
						</div>
					{:else}
						<div class="space-y-2">
							{#each availableStories as story (story.id)}
								<button
									onclick={() => { addStory(story.id); showAddModal = false; }}
									class="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
								>
									<div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
										<img
											src={getStoryImage(story)}
											alt={story.title}
											class="h-full w-full object-cover"
										/>
									</div>
									<div class="flex-1 min-w-0">
										<h3 class="font-medium text-gray-800 dark:text-gray-200 truncate">
											{story.title || 'Ohne Titel'}
										</h3>
										<p class="text-sm text-gray-500 dark:text-gray-400 truncate">
											{story.description || 'Keine Beschreibung'}
										</p>
									</div>
									<svg class="h-5 w-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
									</svg>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
