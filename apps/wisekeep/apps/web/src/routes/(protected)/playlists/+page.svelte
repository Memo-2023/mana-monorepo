<script lang="ts">
	import { useLiveQuery } from '@manacore/local-store/svelte';
	import { playlistCollection } from '$lib/data/local-store';
	import { toast } from 'svelte-sonner';

	const playlists = useLiveQuery(() => playlistCollection.getAll({}, { sortBy: 'order' }));

	let newName = $state('');
	let newCategory = $state('');

	async function createPlaylist() {
		if (!newName || !newCategory) return;
		await playlistCollection.insert({
			id: crypto.randomUUID(),
			name: newName,
			category: newCategory,
			order: playlists.value?.length ?? 0,
		});
		toast.success(`Playlist "${newName}" erstellt`);
		newName = '';
		newCategory = '';
	}

	async function deletePlaylist(id: string, name: string) {
		if (!confirm(`"${name}" löschen?`)) return;
		await playlistCollection.delete(id);
		toast.success('Gelöscht');
	}
</script>

<div class="mx-auto max-w-2xl">
	<h1 class="mb-6 text-3xl font-bold">Playlists</h1>

	<div class="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
		<div class="flex gap-3">
			<input
				type="text"
				bind:value={newCategory}
				placeholder="Kategorie"
				class="w-1/3 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500"
			/>
			<input
				type="text"
				bind:value={newName}
				placeholder="Name"
				class="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500"
				onkeydown={(e) => e.key === 'Enter' && createPlaylist()}
			/>
			<button
				onclick={createPlaylist}
				disabled={!newName || !newCategory}
				class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
				>Erstellen</button
			>
		</div>
	</div>

	{#if playlists.loading}
		<div class="space-y-3">
			{#each Array(2) as _}
				<div class="h-16 animate-pulse rounded-xl bg-gray-800"></div>
			{/each}
		</div>
	{:else if !playlists.value?.length}
		<div class="rounded-xl border-2 border-dashed border-gray-700 p-12 text-center">
			<p class="text-lg font-medium text-gray-400">Keine Playlists</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each playlists.value as pl (pl.id)}
				<div
					class="group flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-gray-700"
				>
					<div>
						<span class="rounded bg-violet-900 px-2 py-0.5 text-xs text-violet-300"
							>{pl.category}</span
						>
						<span class="ml-2 font-semibold">{pl.name}</span>
					</div>
					<button
						onclick={() => deletePlaylist(pl.id, pl.name)}
						class="rounded p-1 text-gray-500 opacity-0 hover:bg-gray-800 hover:text-red-400 group-hover:opacity-100"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/></svg
						>
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
