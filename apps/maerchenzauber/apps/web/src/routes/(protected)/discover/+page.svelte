<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { dataService } from '$lib/api';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { Story } from '$lib/types/story';
	import type { Character } from '$lib/types/character';

	// Tab state
	let activeSection = $state<'stories' | 'characters'>('stories');
	let activeFilter = $state<'popular' | 'new' | 'featured'>('popular');
	let searchQuery = $state('');

	// Stories state
	let stories = $state<Story[]>([]);
	let storiesLoading = $state(false);
	let storiesError = $state<string | null>(null);
	let storiesHasMore = $state(false);

	// Characters state
	let characters = $state<Character[]>([]);
	let charactersLoading = $state(false);
	let charactersError = $state<string | null>(null);
	let charactersHasMore = $state(false);

	// Filtered results
	let filteredStories = $derived.by(() => {
		if (!searchQuery.trim()) return stories;
		const query = searchQuery.toLowerCase();
		return stories.filter(
			(s) =>
				s.title?.toLowerCase().includes(query) ||
				s.prompt?.toLowerCase().includes(query) ||
				s.characterName?.toLowerCase().includes(query)
		);
	});

	let filteredCharacters = $derived.by(() => {
		if (!searchQuery.trim()) return characters;
		const query = searchQuery.toLowerCase();
		return characters.filter(
			(c) =>
				c.name?.toLowerCase().includes(query) ||
				c.originalDescription?.toLowerCase().includes(query)
		);
	});

	// Fetch public stories
	async function fetchStories() {
		storiesLoading = true;
		storiesError = null;

		try {
			const result = await dataService.getPublicStories(activeFilter, 1, 20);
			stories = result.stories;
			storiesHasMore = result.hasMore;
		} catch (err) {
			console.error('[Discover] Failed to fetch stories:', err);
			storiesError = 'Geschichten konnten nicht geladen werden';
		} finally {
			storiesLoading = false;
		}
	}

	// Fetch public characters
	async function fetchCharacters() {
		charactersLoading = true;
		charactersError = null;

		try {
			const result = await dataService.getPublicCharacters(activeFilter, 20, 0);
			characters = result.characters;
			charactersHasMore = result.hasMore;
		} catch (err) {
			console.error('[Discover] Failed to fetch characters:', err);
			charactersError = 'Charaktere konnten nicht geladen werden';
		} finally {
			charactersLoading = false;
		}
	}

	// Load data when section or filter changes
	$effect(() => {
		if (activeSection === 'stories') {
			fetchStories();
		} else {
			fetchCharacters();
		}
	});

	// Vote for a story
	async function handleVoteStory(storyId: string) {
		try {
			const story = stories.find((s) => s.id === storyId);
			if (story?.user_vote) {
				await dataService.unvoteStory(storyId);
				stories = stories.map((s) =>
					s.id === storyId
						? { ...s, user_vote: null, vote_count: (s.vote_count || 1) - 1 }
						: s
				);
			} else {
				await dataService.voteForStory(storyId, 'like');
				stories = stories.map((s) =>
					s.id === storyId
						? { ...s, user_vote: 'like', vote_count: (s.vote_count || 0) + 1 }
						: s
				);
			}
		} catch (err) {
			console.error('[Discover] Vote failed:', err);
		}
	}

	// Vote for a character
	async function handleVoteCharacter(characterId: string) {
		try {
			const character = characters.find((c) => c.id === characterId);
			if (character?.user_vote) {
				await dataService.removeCharacterVote(characterId);
				characters = characters.map((c) =>
					c.id === characterId
						? { ...c, user_vote: null, vote_count: (c.vote_count || 1) - 1 }
						: c
				);
			} else {
				await dataService.voteForCharacter(characterId, 'like');
				characters = characters.map((c) =>
					c.id === characterId
						? { ...c, user_vote: 'like', vote_count: (c.vote_count || 0) + 1 }
						: c
				);
			}
		} catch (err) {
			console.error('[Discover] Vote failed:', err);
		}
	}

	// Clone a character
	async function handleCloneCharacter(characterId: string) {
		try {
			toastStore.info('Charakter wird geklont...');
			const cloned = await dataService.cloneCharacter(characterId);
			toastStore.success('Charakter erfolgreich geklont!');
			// Navigate to the cloned character
			goto(`/characters/${cloned.id}`);
		} catch (err) {
			console.error('[Discover] Clone failed:', err);
			toastStore.error('Charakter konnte nicht geklont werden');
		}
	}

	// Get image URL helper
	function getStoryImage(story: Story): string {
		return story.pages?.[0]?.image || '/images/placeholder-story.png';
	}

	function getCharacterImage(character: Character): string {
		return character.imageUrl || character.image_url || '/images/placeholder-character.png';
	}
</script>

<svelte:head>
	<title>Entdecken | Märchenzauber</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Entdecken</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Entdecke Geschichten und Charaktere von anderen Nutzern
			</p>
		</div>

		<!-- Search -->
		<div class="relative w-full sm:max-w-xs">
			<svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="text"
				placeholder="Suchen..."
				bind:value={searchQuery}
				class="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
			/>
		</div>
	</div>

	<!-- Section Tabs -->
	<div class="flex gap-2">
		<button
			onclick={() => (activeSection = 'stories')}
			class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all {activeSection === 'stories' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
			</svg>
			Geschichten
		</button>
		<button
			onclick={() => (activeSection = 'characters')}
			class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all {activeSection === 'characters' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
			</svg>
			Charaktere
		</button>
	</div>

	<!-- Filter Tabs -->
	<div class="flex gap-2 border-b border-gray-200 pb-3 dark:border-gray-700">
		<button
			onclick={() => (activeFilter = 'popular')}
			class="rounded-lg px-3 py-1.5 text-sm font-medium transition-all {activeFilter === 'popular' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
		>
			🔥 Beliebt
		</button>
		<button
			onclick={() => (activeFilter = 'new')}
			class="rounded-lg px-3 py-1.5 text-sm font-medium transition-all {activeFilter === 'new' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
		>
			✨ Neu
		</button>
		<button
			onclick={() => (activeFilter = 'featured')}
			class="rounded-lg px-3 py-1.5 text-sm font-medium transition-all {activeFilter === 'featured' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
		>
			⭐ Featured
		</button>
	</div>

	<!-- Content -->
	{#if activeSection === 'stories'}
		<!-- Stories Section -->
		{#if storiesLoading}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each Array(8) as _}
					<div class="aspect-[4/3] animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
				{/each}
			</div>
		{:else if storiesError}
			<div class="rounded-2xl bg-red-50 p-6 text-center dark:bg-red-900/20">
				<svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<p class="mt-2 text-red-600 dark:text-red-400">{storiesError}</p>
				<button
					onclick={fetchStories}
					class="mt-4 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
				>
					Erneut versuchen
				</button>
			</div>
		{:else if filteredStories.length === 0}
			<div class="rounded-2xl bg-gray-50 p-8 text-center dark:bg-gray-800/50">
				<svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
				<h3 class="mt-4 font-medium text-gray-700 dark:text-gray-300">Keine Geschichten gefunden</h3>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
					{searchQuery ? 'Versuche es mit anderen Suchbegriffen' : 'Schau später nochmal vorbei'}
				</p>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each filteredStories as story (story.id)}
					<a
						href="/stories/{story.id}"
						class="group relative overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:shadow-xl dark:bg-gray-800"
					>
						<!-- Image -->
						<div class="aspect-[4/3] overflow-hidden">
							<img
								src={getStoryImage(story)}
								alt={story.title}
								class="h-full w-full object-cover transition-transform group-hover:scale-105"
								loading="lazy"
							/>
						</div>

						<!-- Featured Badge -->
						{#if story.visibility === 'featured'}
							<div class="absolute left-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white shadow">
								⭐ Featured
							</div>
						{/if}

						<!-- Vote Count -->
						<button
							onclick={(e) => { e.preventDefault(); e.stopPropagation(); handleVoteStory(story.id); }}
							class="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium shadow backdrop-blur {story.user_vote ? 'bg-pink-500 text-white' : 'bg-white/90 text-gray-700 dark:bg-gray-800/90 dark:text-gray-300'}"
						>
							<svg class="h-4 w-4" fill={story.user_vote ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
							</svg>
							{story.vote_count || 0}
						</button>

						<!-- Info -->
						<div class="p-4">
							<h3 class="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">
								{story.title || 'Ohne Titel'}
							</h3>
							<p class="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
								{story.prompt || 'Keine Beschreibung'}
							</p>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Characters Section -->
		{#if charactersLoading}
			<div class="grid gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
				{#each Array(10) as _}
					<div class="flex flex-col items-center gap-3">
						<div class="h-24 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
						<div class="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
					</div>
				{/each}
			</div>
		{:else if charactersError}
			<div class="rounded-2xl bg-red-50 p-6 text-center dark:bg-red-900/20">
				<svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<p class="mt-2 text-red-600 dark:text-red-400">{charactersError}</p>
				<button
					onclick={fetchCharacters}
					class="mt-4 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
				>
					Erneut versuchen
				</button>
			</div>
		{:else if filteredCharacters.length === 0}
			<div class="rounded-2xl bg-gray-50 p-8 text-center dark:bg-gray-800/50">
				<svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
				<h3 class="mt-4 font-medium text-gray-700 dark:text-gray-300">Keine Charaktere gefunden</h3>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
					{searchQuery ? 'Versuche es mit anderen Suchbegriffen' : 'Schau später nochmal vorbei'}
				</p>
			</div>
		{:else}
			<div class="grid gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
				{#each filteredCharacters as character (character.id)}
					<div class="group flex flex-col items-center text-center">
						<!-- Avatar with actions -->
						<div class="relative">
							<a
								href="/characters/{character.id}"
								class="block h-24 w-24 overflow-hidden rounded-full border-3 border-white shadow-lg transition-all group-hover:scale-105 group-hover:shadow-xl dark:border-gray-700"
							>
								<img
									src={getCharacterImage(character)}
									alt={character.name}
									class="h-full w-full object-cover"
									loading="lazy"
								/>
							</a>

							<!-- Vote Button -->
							<button
								onclick={() => handleVoteCharacter(character.id)}
								class="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full shadow transition-all {character.user_vote ? 'bg-pink-500 text-white' : 'bg-white text-gray-500 hover:text-pink-500 dark:bg-gray-800 dark:text-gray-400'}"
								title="Gefällt mir"
							>
								<svg class="h-4 w-4" fill={character.user_vote ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
								</svg>
							</button>

							<!-- Clone Button -->
							<button
								onclick={() => handleCloneCharacter(character.id)}
								class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-purple-500 text-white shadow transition-all hover:bg-purple-600"
								title="Charakter übernehmen"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
								</svg>
							</button>
						</div>

						<!-- Name & Votes -->
						<a
							href="/characters/{character.id}"
							class="mt-3 font-medium text-gray-700 hover:text-pink-600 dark:text-gray-300 dark:hover:text-pink-400"
						>
							{character.name}
						</a>
						<span class="text-xs text-gray-500 dark:text-gray-400">
							{character.vote_count || 0} Likes
						</span>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
