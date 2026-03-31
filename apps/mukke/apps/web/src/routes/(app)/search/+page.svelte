<script lang="ts">
	import { libraryStore } from '$lib/stores/library.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import type { Song } from '@mukke/shared';
	import { Heart, MagnifyingGlass, Note, Plus } from '@manacore/shared-icons';

	let query = $state('');
	let results = $state<Song[]>([]);
	let isSearching = $state(false);
	let hasSearched = $state(false);
	let debounceTimer = $state<ReturnType<typeof setTimeout> | null>(null);
	let activePlaylistDropdown = $state<string | null>(null);

	function handleInput() {
		if (debounceTimer) clearTimeout(debounceTimer);

		if (!query.trim()) {
			results = [];
			hasSearched = false;
			return;
		}

		debounceTimer = setTimeout(async () => {
			isSearching = true;
			hasSearched = true;
			try {
				results = await libraryStore.searchSongs(query.trim());
			} catch (e) {
				console.error('Search failed:', e);
				results = [];
			}
			isSearching = false;
		}, 300);
	}

	function formatDuration(seconds: number | null | undefined): string {
		if (!seconds) return '0:00';
		return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
	}

	function handlePlaySong(song: Song, index: number) {
		playerStore.playSong(song, results, index);
	}

	async function handleToggleFavorite(id: string, e: Event) {
		e.stopPropagation();
		const updated = await libraryStore.toggleFavorite(id);
		results = results.map((s) => (s.id === id ? updated : s));
	}

	function togglePlaylistDropdown(songId: string, e: Event) {
		e.stopPropagation();
		if (activePlaylistDropdown === songId) {
			activePlaylistDropdown = null;
		} else {
			activePlaylistDropdown = songId;
			if (playlistStore.playlists.length === 0) {
				playlistStore.loadPlaylists();
			}
		}
	}

	async function addToPlaylist(playlistId: string, songId: string, e: Event) {
		e.stopPropagation();
		try {
			await playlistStore.addSong(playlistId, songId);
		} catch (err) {
			console.error('Failed to add song to playlist:', err);
		}
		activePlaylistDropdown = null;
	}
</script>

<svelte:head>
	<title>Search - Mukke</title>
</svelte:head>

<div class="p-6 max-w-6xl mx-auto">
	<h1 class="text-2xl font-bold mb-6">Search</h1>

	<!-- Search input -->
	<div class="relative mb-6">
		<MagnifyingGlass
			size={20}
			class="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary"
		/>
		<input
			type="text"
			bind:value={query}
			oninput={handleInput}
			placeholder="Search your music library..."
			class="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-lg text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary text-lg"
			autofocus
		/>
	</div>

	<!-- Loading -->
	{#if isSearching}
		<div class="flex items-center justify-center py-16">
			<div
				class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
			></div>
		</div>
	{:else if !hasSearched}
		<!-- Empty state before searching -->
		<div class="text-center py-16">
			<MagnifyingGlass size={48} class="text-foreground-secondary mx-auto mb-3" />
			<p class="text-foreground-secondary">Search your music library</p>
		</div>
	{:else if results.length === 0}
		<!-- No results -->
		<div class="text-center py-16">
			<p class="text-foreground-secondary">No results found for "{query}"</p>
		</div>
	{:else}
		<!-- Results -->
		<p class="text-sm text-foreground-secondary mb-4">
			{results.length}
			{results.length === 1 ? 'result' : 'results'}
		</p>
		<div class="bg-surface rounded-lg overflow-hidden">
			<!-- Header -->
			<div
				class="grid grid-cols-[1fr_1fr_1fr_80px_120px] gap-4 px-4 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wide border-b border-border"
			>
				<span>Title</span>
				<span>Artist</span>
				<span>Album</span>
				<span class="text-right">Duration</span>
				<span></span>
			</div>
			<!-- Song rows -->
			{#each results as song, index}
				<div
					class="grid grid-cols-[1fr_1fr_1fr_80px_120px] gap-4 px-4 py-3 hover:bg-background transition-colors items-center cursor-pointer group"
					onclick={() => handlePlaySong(song, index)}
					role="button"
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'Enter') handlePlaySong(song, index);
					}}
				>
					<span class="truncate font-medium">{song.title}</span>
					<span class="truncate text-foreground-secondary">{song.artist ?? 'Unknown'}</span>
					<span class="truncate text-foreground-secondary">{song.album ?? 'Unknown'}</span>
					<span class="text-right text-foreground-secondary text-sm">
						{formatDuration(song.duration)}
					</span>
					<div class="flex items-center justify-end gap-1">
						<!-- Favorite -->
						<button
							onclick={(e) => handleToggleFavorite(song.id, e)}
							class="p-1 transition-colors {song.favorite
								? 'text-red-500'
								: 'text-foreground-secondary hover:text-red-500'}"
							title={song.favorite ? 'Remove from favorites' : 'Add to favorites'}
						>
							<Heart size={16} />
						</button>
						<!-- Add to Playlist -->
						<div class="relative">
							<button
								onclick={(e) => togglePlaylistDropdown(song.id, e)}
								class="p-1 text-foreground-secondary hover:text-foreground transition-colors"
								title="Add to playlist"
							>
								<Plus size={16} />
							</button>
							{#if activePlaylistDropdown === song.id}
								<div
									class="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-lg z-20 py-1"
								>
									{#if playlistStore.playlists.length === 0}
										<p class="px-3 py-2 text-sm text-foreground-secondary">No playlists</p>
									{:else}
										{#each playlistStore.playlists as playlist}
											<button
												onclick={(e) => addToPlaylist(playlist.id, song.id, e)}
												class="w-full text-left px-3 py-2 text-sm hover:bg-background transition-colors truncate"
											>
												{playlist.name}
											</button>
										{/each}
									{/if}
								</div>
							{/if}
						</div>
						<!-- Open in Editor -->
						<a
							href="/projects?songId={song.id}"
							onclick={(e) => e.stopPropagation()}
							class="p-1 text-foreground-secondary hover:text-foreground transition-colors"
							title="Open in editor"
						>
							<Note size={16} />
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
