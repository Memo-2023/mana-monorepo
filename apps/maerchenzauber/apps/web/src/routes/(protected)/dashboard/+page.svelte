<script lang="ts">
	import { onMount } from 'svelte';
	import { dataService } from '$lib/api';
	import type { Story } from '$lib/types/story';
	import type { Character } from '$lib/types/character';
	import StoryCard from '$lib/components/story/StoryCard.svelte';
	import CharacterAvatar from '$lib/components/character/CharacterAvatar.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';

	let stories = $state<Story[]>([]);
	let characters = $state<Character[]>([]);
	let loadingStories = $state(true);
	let loadingCharacters = $state(true);
	let errorStories = $state<string | null>(null);
	let errorCharacters = $state<string | null>(null);

	// Get recent stories (last 4)
	let recentStories = $derived(
		stories
			.filter((s) => !s.archived)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, 4)
	);

	// Get favorite stories
	let favoriteStories = $derived(stories.filter((s) => s.is_favorite && !s.archived));

	// Get recent characters (last 6)
	let recentCharacters = $derived(
		characters
			.filter((c) => !c.archived)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, 6)
	);

	async function fetchStories() {
		try {
			loadingStories = true;
			errorStories = null;
			stories = await dataService.getStories();
		} catch (e) {
			console.error('[Dashboard] Failed to fetch stories:', e);
			errorStories = 'Geschichten konnten nicht geladen werden';
		} finally {
			loadingStories = false;
		}
	}

	async function fetchCharacters() {
		try {
			loadingCharacters = true;
			errorCharacters = null;
			characters = await dataService.getCharacters();
		} catch (e) {
			console.error('[Dashboard] Failed to fetch characters:', e);
			errorCharacters = 'Charaktere konnten nicht geladen werden';
		} finally {
			loadingCharacters = false;
		}
	}

	onMount(() => {
		fetchStories();
		fetchCharacters();
	});
</script>

<svelte:head>
	<title>Dashboard | Märchenzauber</title>
</svelte:head>

<div class="space-y-8">
	<!-- Welcome Section -->
	<section
		class="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white shadow-lg lg:p-8"
	>
		<h1 class="text-2xl font-bold lg:text-3xl">Willkommen bei Märchenzauber! ✨</h1>
		<p class="mt-2 text-pink-100">Erstelle magische Geschichten mit deinen eigenen Charakteren.</p>
		<div class="mt-4 flex flex-wrap gap-3">
			<a
				href="/stories/create"
				class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-pink-600 shadow-md transition-all hover:bg-pink-50 hover:shadow-lg"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Neue Geschichte
			</a>
			<a
				href="/characters/create"
				class="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/30"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
					/>
				</svg>
				Neuer Charakter
			</a>
		</div>
	</section>

	<!-- Recent Stories Section -->
	<section>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">Neueste Geschichten</h2>
			<a
				href="/stories"
				class="text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
			>
				Alle anzeigen →
			</a>
		</div>

		{#if loadingStories}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each Array(4) as _}
					<div class="h-48 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
				{/each}
			</div>
		{:else if errorStories}
			<div class="rounded-2xl bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
				{errorStories}
			</div>
		{:else if recentStories.length === 0}
			<EmptyState
				title="Noch keine Geschichten"
				description="Erstelle deine erste magische Geschichte!"
				actionLabel="Geschichte erstellen"
				actionHref="/stories/create"
			/>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each recentStories as story (story.id)}
					<StoryCard {story} />
				{/each}
			</div>
		{/if}
	</section>

	<!-- Characters Section -->
	<section>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">Deine Charaktere</h2>
			<a
				href="/characters"
				class="text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
			>
				Alle anzeigen →
			</a>
		</div>

		{#if loadingCharacters}
			<div class="flex gap-4 overflow-x-auto pb-2">
				{#each Array(6) as _}
					<div
						class="h-24 w-24 flex-shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"
					></div>
				{/each}
			</div>
		{:else if errorCharacters}
			<div class="rounded-2xl bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
				{errorCharacters}
			</div>
		{:else if recentCharacters.length === 0}
			<EmptyState
				title="Noch keine Charaktere"
				description="Erstelle deinen ersten Charakter!"
				actionLabel="Charakter erstellen"
				actionHref="/characters/create"
			/>
		{:else}
			<div class="flex gap-4 overflow-x-auto pb-2">
				<!-- Create Character Button -->
				<a
					href="/characters/create"
					class="flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center rounded-full border-2 border-dashed border-pink-300 bg-pink-50 text-pink-500 transition-all hover:border-pink-400 hover:bg-pink-100 dark:border-pink-700 dark:bg-pink-900/20 dark:text-pink-400 dark:hover:border-pink-600 dark:hover:bg-pink-900/30"
				>
					<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					<span class="mt-1 text-xs">Neu</span>
				</a>

				{#each recentCharacters as character (character.id)}
					<CharacterAvatar {character} />
				{/each}
			</div>
		{/if}
	</section>

	<!-- Favorites Section (if any) -->
	{#if favoriteStories.length > 0}
		<section>
			<div class="mb-4 flex items-center gap-2">
				<svg class="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"
					/>
				</svg>
				<h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">Favoriten</h2>
			</div>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each favoriteStories.slice(0, 4) as story (story.id)}
					<StoryCard {story} />
				{/each}
			</div>
		</section>
	{/if}

	<!-- Quick Stats -->
	<section class="grid gap-4 sm:grid-cols-3">
		<div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-900/30"
				>
					<svg
						class="h-5 w-5 text-pink-600 dark:text-pink-400"
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
				<div>
					<p class="text-2xl font-bold text-gray-800 dark:text-gray-200">
						{stories.filter((s) => !s.archived).length}
					</p>
					<p class="text-sm text-gray-500 dark:text-gray-400">Geschichten</p>
				</div>
			</div>
		</div>

		<div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30"
				>
					<svg
						class="h-5 w-5 text-purple-600 dark:text-purple-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
						/>
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-800 dark:text-gray-200">
						{characters.filter((c) => !c.archived).length}
					</p>
					<p class="text-sm text-gray-500 dark:text-gray-400">Charaktere</p>
				</div>
			</div>
		</div>

		<div class="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30"
				>
					<svg
						class="h-5 w-5 text-yellow-600 dark:text-yellow-400"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"
						/>
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-gray-800 dark:text-gray-200">
						{favoriteStories.length}
					</p>
					<p class="text-sm text-gray-500 dark:text-gray-400">Favoriten</p>
				</div>
			</div>
		</div>
	</section>
</div>
