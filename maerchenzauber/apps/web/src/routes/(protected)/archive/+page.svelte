<script lang="ts">
	import { onMount } from 'svelte';
	import { dataService } from '$lib/api';
	import type { Story } from '$lib/types/story';
	import type { Character } from '$lib/types/character';

	// Tab state
	let activeTab = $state<'stories' | 'characters'>('stories');

	// Data
	let archivedStories = $state<Story[]>([]);
	let archivedCharacters = $state<Character[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Fetch archived items
	async function fetchArchived() {
		loading = true;
		error = null;

		try {
			const [stories, characters] = await Promise.all([
				dataService.getStories(true), // Include archived
				dataService.getCharacters(true), // Include archived
			]);

			archivedStories = stories.filter((s) => s.archived);
			archivedCharacters = characters.filter((c) => c.archived);
		} catch (err) {
			console.error('[Archive] Failed to fetch:', err);
			error = 'Archiv konnte nicht geladen werden';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchArchived();
	});

	// Restore a story
	async function restoreStory(storyId: string) {
		try {
			await dataService.updateStory(storyId, { archived: false });
			archivedStories = archivedStories.filter((s) => s.id !== storyId);
		} catch (err) {
			console.error('[Archive] Failed to restore story:', err);
		}
	}

	// Restore a character
	async function restoreCharacter(characterId: string) {
		try {
			await dataService.updateCharacter(characterId, { archived: false });
			archivedCharacters = archivedCharacters.filter((c) => c.id !== characterId);
		} catch (err) {
			console.error('[Archive] Failed to restore character:', err);
		}
	}

	// Delete a story permanently
	async function deleteStory(storyId: string) {
		if (!confirm('Diese Geschichte wird unwiderruflich gelöscht. Fortfahren?')) return;

		try {
			await dataService.deleteStory(storyId);
			archivedStories = archivedStories.filter((s) => s.id !== storyId);
		} catch (err) {
			console.error('[Archive] Failed to delete story:', err);
		}
	}

	// Delete a character permanently
	async function deleteCharacter(characterId: string) {
		if (!confirm('Dieser Charakter wird unwiderruflich gelöscht. Fortfahren?')) return;

		try {
			await dataService.deleteCharacter(characterId);
			archivedCharacters = archivedCharacters.filter((c) => c.id !== characterId);
		} catch (err) {
			console.error('[Archive] Failed to delete character:', err);
		}
	}

	// Get image URLs
	function getStoryImage(story: Story): string {
		return story.pages?.[0]?.image || '/images/placeholder-story.png';
	}

	function getCharacterImage(character: Character): string {
		return character.imageUrl || character.image_url || '/images/placeholder-character.png';
	}
</script>

<svelte:head>
	<title>Archiv | Märchenzauber</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a
			href="/settings"
			class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
			</svg>
		</a>
		<div>
			<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Archiv</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Archivierte Geschichten und Charaktere
			</p>
		</div>
	</div>

	<!-- Tabs -->
	<div class="flex gap-2">
		<button
			onclick={() => (activeTab = 'stories')}
			class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all {activeTab === 'stories' ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
			</svg>
			Geschichten ({archivedStories.length})
		</button>
		<button
			onclick={() => (activeTab = 'characters')}
			class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all {activeTab === 'characters' ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
			</svg>
			Charaktere ({archivedCharacters.length})
		</button>
	</div>

	<!-- Content -->
	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
			{/each}
		</div>
	{:else if error}
		<div class="rounded-2xl bg-red-50 p-6 text-center dark:bg-red-900/20">
			<p class="text-red-600 dark:text-red-400">{error}</p>
			<button
				onclick={fetchArchived}
				class="mt-4 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
			>
				Erneut versuchen
			</button>
		</div>
	{:else if activeTab === 'stories'}
		<!-- Archived Stories -->
		{#if archivedStories.length === 0}
			<div class="rounded-2xl bg-gray-50 p-8 text-center dark:bg-gray-800/50">
				<svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
				</svg>
				<h3 class="mt-4 font-medium text-gray-700 dark:text-gray-300">Keine archivierten Geschichten</h3>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
					Archivierte Geschichten erscheinen hier
				</p>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each archivedStories as story (story.id)}
					<div class="group relative overflow-hidden rounded-2xl bg-white shadow-md dark:bg-gray-800">
						<!-- Image -->
						<div class="aspect-video overflow-hidden">
							<img
								src={getStoryImage(story)}
								alt={story.title}
								class="h-full w-full object-cover opacity-60"
								loading="lazy"
							/>
						</div>

						<!-- Info -->
						<div class="p-4">
							<h3 class="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">
								{story.title || 'Ohne Titel'}
							</h3>
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Archiviert am {new Date(story.createdAt).toLocaleDateString('de-DE')}
							</p>

							<!-- Actions -->
							<div class="mt-3 flex gap-2">
								<button
									onclick={() => restoreStory(story.id)}
									class="flex-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
								>
									Wiederherstellen
								</button>
								<button
									onclick={() => deleteStory(story.id)}
									class="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
								>
									Löschen
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Archived Characters -->
		{#if archivedCharacters.length === 0}
			<div class="rounded-2xl bg-gray-50 p-8 text-center dark:bg-gray-800/50">
				<svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
				</svg>
				<h3 class="mt-4 font-medium text-gray-700 dark:text-gray-300">Keine archivierten Charaktere</h3>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
					Archivierte Charaktere erscheinen hier
				</p>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each archivedCharacters as character (character.id)}
					<div class="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md dark:bg-gray-800">
						<!-- Avatar -->
						<div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full opacity-60">
							<img
								src={getCharacterImage(character)}
								alt={character.name}
								class="h-full w-full object-cover"
								loading="lazy"
							/>
						</div>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-gray-800 dark:text-gray-200 truncate">
								{character.name}
							</h3>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								Archiviert
							</p>

							<!-- Actions -->
							<div class="mt-2 flex gap-2">
								<button
									onclick={() => restoreCharacter(character.id)}
									class="rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600"
								>
									Wiederherstellen
								</button>
								<button
									onclick={() => deleteCharacter(character.id)}
									class="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
								>
									Löschen
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
