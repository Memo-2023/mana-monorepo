<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api/client';
import type { Playlist } from '$lib/api/client';

	let playlists = $state<Playlist[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			playlists = await api.getPlaylists();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load playlists';
		} finally {
			loading = false;
		}
	});

	const groupedPlaylists = $derived(() => {
		const grouped: Record<string, Playlist[]> = {};
		for (const playlist of playlists) {
			if (!grouped[playlist.category]) {
				grouped[playlist.category] = [];
			}
			grouped[playlist.category].push(playlist);
		}
		return grouped;
	});
</script>

<svelte:head>
	<title>Playlists | Wisekeep</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">Playlists</h1>

	{#if loading}
		<div class="text-gray-500">Loading...</div>
	{:else if error}
		<div class="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
	{:else if playlists.length === 0}
		<div class="bg-gray-50 rounded-lg p-8 text-center">
			<p class="text-gray-500">No playlists yet</p>
		</div>
	{:else}
		{#each Object.entries(groupedPlaylists()) as [category, categoryPlaylists]}
			<div class="mb-8">
				<h2 class="text-xl font-semibold mb-4 capitalize">{category}</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each categoryPlaylists as playlist}
						<div class="bg-white rounded-lg shadow-sm border p-4">
							<h3 class="font-medium">{playlist.name}</h3>
							{#if playlist.description}
								<p class="text-sm text-gray-500 mt-1">{playlist.description}</p>
							{/if}
							<p class="text-xs text-gray-400 mt-2">{playlist.urlCount} URLs</p>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>
