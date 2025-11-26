<script lang="ts">
	import { onMount } from 'svelte';
	import { dataService } from '$lib/api';
	import type { Story } from '$lib/types/story';
	import StoryCard from '$lib/components/story/StoryCard.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';

	let stories = $state<Story[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let filter = $state<'all' | 'favorites'>('all');
	let searchQuery = $state('');

	let filteredStories = $derived.by(() => {
		let result = stories.filter((s) => !s.archived);

		// Apply filter
		if (filter === 'favorites') {
			result = result.filter((s) => s.is_favorite);
		}

		// Apply search
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(s) =>
					s.title?.toLowerCase().includes(query) ||
					s.prompt?.toLowerCase().includes(query) ||
					s.characterName?.toLowerCase().includes(query)
			);
		}

		// Sort by date (newest first)
		return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	});

	async function fetchStories() {
		try {
			loading = true;
			error = null;
			stories = await dataService.getStories();
		} catch (e) {
			console.error('[Stories] Failed to fetch:', e);
			error = 'Geschichten konnten nicht geladen werden';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchStories();
	});
</script>

<svelte:head>
	<title>Geschichten | Märchenzauber</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Deine Geschichten</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				{filteredStories.length} {filteredStories.length === 1 ? 'Geschichte' : 'Geschichten'}
			</p>
		</div>
		<a
			href="/stories/create"
			class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-pink-600 hover:to-purple-700 hover:shadow-lg"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Neue Geschichte
		</a>
	</div>

	<!-- Filters & Search -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
		<!-- Filter Tabs -->
		<div class="flex gap-2">
			<button
				onclick={() => (filter = 'all')}
				class="rounded-xl px-4 py-2 text-sm font-medium transition-all"
				class:bg-pink-500={filter === 'all'}
				class:text-white={filter === 'all'}
				class:bg-gray-100={filter !== 'all'}
				class:text-gray-600={filter !== 'all'}
				class:dark:bg-gray-700={filter !== 'all'}
				class:dark:text-gray-300={filter !== 'all'}
			>
				Alle
			</button>
			<button
				onclick={() => (filter = 'favorites')}
				class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all"
				class:bg-pink-500={filter === 'favorites'}
				class:text-white={filter === 'favorites'}
				class:bg-gray-100={filter !== 'favorites'}
				class:text-gray-600={filter !== 'favorites'}
				class:dark:bg-gray-700={filter !== 'favorites'}
				class:dark:text-gray-300={filter !== 'favorites'}
			>
				<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
					<path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
				</svg>
				Favoriten
			</button>
		</div>

		<!-- Search -->
		<div class="relative flex-1 sm:max-w-xs">
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

	<!-- Content -->
	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each Array(8) as _}
				<div class="aspect-[4/3] animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
			{/each}
		</div>
	{:else if error}
		<div class="rounded-2xl bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
			{error}
		</div>
	{:else if filteredStories.length === 0}
		{#if searchQuery || filter === 'favorites'}
			<EmptyState
				title="Keine Ergebnisse"
				description="Versuche einen anderen Suchbegriff oder Filter."
				icon="search"
			/>
		{:else}
			<EmptyState
				title="Noch keine Geschichten"
				description="Erstelle deine erste magische Geschichte!"
				actionLabel="Geschichte erstellen"
				actionHref="/stories/create"
			/>
		{/if}
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each filteredStories as story (story.id)}
				<StoryCard {story} />
			{/each}
		</div>
	{/if}
</div>
