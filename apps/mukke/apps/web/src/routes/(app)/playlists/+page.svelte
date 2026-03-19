<script lang="ts">
	import { onMount } from 'svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';

	let showCreateModal = $state(false);
	let newName = $state('');
	let newDescription = $state('');
	let isCreating = $state(false);

	onMount(() => {
		playlistStore.loadPlaylists();
	});

	async function handleCreate() {
		if (!newName.trim()) return;
		isCreating = true;
		try {
			await playlistStore.createPlaylist(newName.trim(), newDescription.trim() || undefined);
			newName = '';
			newDescription = '';
			showCreateModal = false;
		} catch (e) {
			console.error('Failed to create playlist:', e);
		}
		isCreating = false;
	}

	async function handleDelete(id: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		if (!confirm('Delete this playlist?')) return;
		await playlistStore.deletePlaylist(id);
	}

	function truncate(text: string, max: number): string {
		if (text.length <= max) return text;
		return text.slice(0, max) + '...';
	}
</script>

<svelte:head>
	<title>Playlists - Mukke</title>
</svelte:head>

<div class="p-6 max-w-6xl mx-auto">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold">Playlists</h1>
		<button
			onclick={() => (showCreateModal = true)}
			class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Create Playlist
		</button>
	</div>

	{#if playlistStore.isLoading}
		<div class="flex items-center justify-center py-16">
			<div
				class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
			></div>
		</div>
	{:else if playlistStore.error}
		<div class="text-center py-16">
			<p class="text-red-500 mb-2">{playlistStore.error}</p>
			<button
				onclick={() => playlistStore.loadPlaylists()}
				class="text-sm text-primary hover:underline"
			>
				Try again
			</button>
		</div>
	{:else if playlistStore.playlists.length === 0}
		<div class="text-center py-16">
			<svg
				class="w-12 h-12 text-foreground-secondary mx-auto mb-3"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 10h16M4 14h16M4 18h16"
				/>
			</svg>
			<p class="text-foreground-secondary mb-3">No playlists yet</p>
			<button onclick={() => (showCreateModal = true)} class="text-sm text-primary hover:underline">
				Create your first playlist
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{#each playlistStore.playlists as playlist}
				<a
					href="/playlists/{playlist.id}"
					class="bg-surface rounded-lg p-4 hover:bg-surface-hover transition-colors group relative"
				>
					<div class="aspect-square bg-background rounded-lg mb-3 flex items-center justify-center">
						<svg
							class="w-12 h-12 text-foreground-secondary"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
							/>
						</svg>
					</div>
					<h3 class="font-medium truncate group-hover:text-primary transition-colors">
						{playlist.name}
					</h3>
					{#if playlist.description}
						<p class="text-sm text-foreground-secondary mt-1">
							{truncate(playlist.description, 60)}
						</p>
					{/if}
					<button
						onclick={(e) => handleDelete(playlist.id, e)}
						class="absolute top-3 right-3 p-1.5 rounded-lg bg-background/80 text-foreground-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
						title="Delete playlist"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</button>
				</a>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Playlist Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-surface rounded-xl p-6 w-full max-w-md">
			<h2 class="text-lg font-bold mb-4">Create Playlist</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleCreate();
				}}
			>
				<div class="mb-4">
					<label for="playlist-name" class="block text-sm font-medium mb-1">Name</label>
					<input
						id="playlist-name"
						type="text"
						bind:value={newName}
						placeholder="My Playlist"
						class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</div>
				<div class="mb-6">
					<label for="playlist-description" class="block text-sm font-medium mb-1"
						>Description (optional)</label
					>
					<textarea
						id="playlist-description"
						bind:value={newDescription}
						placeholder="Describe your playlist..."
						rows="3"
						class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
					></textarea>
				</div>
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={() => (showCreateModal = false)}
						class="px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={!newName.trim() || isCreating}
						class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
					>
						{isCreating ? 'Creating...' : 'Create'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
