<script lang="ts">
	import { onMount } from 'svelte';
	import { dataService } from '$lib/api';
	import type { Character } from '$lib/types/character';
	import CharacterAvatar from '$lib/components/character/CharacterAvatar.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';

	let characters = $state<Character[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state('');

	let filteredCharacters = $derived.by(() => {
		let result = characters.filter((c) => !c.archived);

		// Apply search
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter((c) => c.name?.toLowerCase().includes(query));
		}

		// Sort by date (newest first)
		return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	});

	async function fetchCharacters() {
		try {
			loading = true;
			error = null;
			characters = await dataService.getCharacters();
		} catch (e) {
			console.error('[Characters] Failed to fetch:', e);
			error = 'Charaktere konnten nicht geladen werden';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchCharacters();
	});
</script>

<svelte:head>
	<title>Charaktere | Märchenzauber</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Deine Charaktere</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				{filteredCharacters.length}
				{filteredCharacters.length === 1 ? 'Charakter' : 'Charaktere'}
			</p>
		</div>
		<a
			href="/characters/create"
			class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-pink-600 hover:to-purple-700 hover:shadow-lg"
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

	<!-- Search -->
	<div class="relative max-w-xs">
		<svg
			class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
		<input
			type="text"
			placeholder="Charakter suchen..."
			bind:value={searchQuery}
			class="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
		/>
	</div>

	<!-- Content -->
	{#if loading}
		<div class="grid gap-6 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
			{#each Array(12) as _}
				<div class="flex flex-col items-center gap-2">
					<div class="h-24 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
					<div class="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="rounded-2xl bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
			{error}
		</div>
	{:else if filteredCharacters.length === 0}
		{#if searchQuery}
			<EmptyState
				title="Keine Ergebnisse"
				description="Kein Charakter mit diesem Namen gefunden."
				icon="search"
			/>
		{:else}
			<EmptyState
				title="Noch keine Charaktere"
				description="Erstelle deinen ersten Charakter!"
				actionLabel="Charakter erstellen"
				actionHref="/characters/create"
				icon="users"
			/>
		{/if}
	{:else}
		<div class="grid gap-6 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
			<!-- Create Character Button -->
			<a href="/characters/create" class="flex flex-col items-center gap-2">
				<div
					class="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-3 border-dashed border-pink-300 bg-pink-50 text-pink-500 transition-all hover:border-pink-400 hover:bg-pink-100 dark:border-pink-700 dark:bg-pink-900/20 dark:text-pink-400 dark:hover:border-pink-600 dark:hover:bg-pink-900/30"
				>
					<svg class="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
				</div>
				<span class="text-xs font-medium text-pink-600 dark:text-pink-400">Neu</span>
			</a>

			{#each filteredCharacters as character (character.id)}
				<CharacterAvatar {character} size="md" />
			{/each}
		</div>
	{/if}
</div>
