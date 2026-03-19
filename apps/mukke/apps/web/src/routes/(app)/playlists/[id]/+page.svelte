<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import type { Song } from '@mukke/shared';

	let isEditingName = $state(false);
	let editName = $state('');

	let id = $derived($page.params.id ?? '');

	onMount(() => {
		if (id) playlistStore.loadPlaylist(id);
	});

	function formatDuration(seconds: number | null | undefined): string {
		if (!seconds) return '0:00';
		return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
	}

	function shuffleArray<T>(arr: T[]): T[] {
		const result = [...arr];
		for (let i = result.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[result[i], result[j]] = [result[j], result[i]];
		}
		return result;
	}

	function handlePlayAll() {
		const playlist = playlistStore.currentPlaylist;
		if (!playlist || playlist.songs.length === 0) return;
		playerStore.playQueue(playlist.songs, 0);
	}

	function handleShufflePlay() {
		const playlist = playlistStore.currentPlaylist;
		if (!playlist || playlist.songs.length === 0) return;
		const shuffled = shuffleArray(playlist.songs);
		playerStore.playQueue(shuffled, 0);
	}

	function handlePlaySong(song: Song, index: number) {
		const playlist = playlistStore.currentPlaylist;
		if (!playlist) return;
		playerStore.playSong(song, playlist.songs, index);
	}

	async function handleRemoveSong(songId: string, e: Event) {
		e.stopPropagation();
		await playlistStore.removeSong(id, songId);
	}

	function startEditName() {
		if (!playlistStore.currentPlaylist) return;
		editName = playlistStore.currentPlaylist.name;
		isEditingName = true;
	}

	async function saveName() {
		if (!editName.trim()) return;
		await playlistStore.updatePlaylist(id, { name: editName.trim() });
		isEditingName = false;
	}

	function handleNameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			saveName();
		} else if (e.key === 'Escape') {
			isEditingName = false;
		}
	}
</script>

<svelte:head>
	<title>{playlistStore.currentPlaylist?.name ?? 'Playlist'} - Mukke</title>
</svelte:head>

<div class="p-6 max-w-6xl mx-auto">
	<!-- Back button -->
	<a
		href="/playlists"
		class="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground transition-colors mb-4"
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		Back to Playlists
	</a>

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
				onclick={() => playlistStore.loadPlaylist(id)}
				class="text-sm text-primary hover:underline"
			>
				Try again
			</button>
		</div>
	{:else if playlistStore.currentPlaylist}
		<!-- Header -->
		<div class="mb-6">
			{#if isEditingName}
				<input
					type="text"
					bind:value={editName}
					onkeydown={handleNameKeydown}
					onblur={() => saveName()}
					class="text-2xl font-bold bg-transparent border-b-2 border-primary focus:outline-none w-full"
					autofocus
				/>
			{:else}
				<h1
					class="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
					onclick={startEditName}
					title="Click to edit name"
				>
					{playlistStore.currentPlaylist.name}
				</h1>
			{/if}
			{#if playlistStore.currentPlaylist.description}
				<p class="text-foreground-secondary mt-1">
					{playlistStore.currentPlaylist.description}
				</p>
			{/if}
			<p class="text-sm text-foreground-secondary mt-2">
				{playlistStore.currentPlaylist.songs.length}
				{playlistStore.currentPlaylist.songs.length === 1 ? 'song' : 'songs'}
			</p>
		</div>

		<!-- Action buttons -->
		<div class="flex items-center gap-3 mb-6">
			<button
				onclick={handlePlayAll}
				disabled={playlistStore.currentPlaylist.songs.length === 0}
				class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
			>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
					<path d="M8 5v14l11-7z" />
				</svg>
				Play All
			</button>
			<button
				onclick={handleShufflePlay}
				disabled={playlistStore.currentPlaylist.songs.length === 0}
				class="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-background transition-colors text-sm font-medium disabled:opacity-50"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4h7l5 5v11H4V4zm10 0h6v6m-6-6l6 6M4 20l6-6"
					/>
				</svg>
				Shuffle
			</button>
			<a
				href="/library"
				class="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-background transition-colors text-sm font-medium"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Add Songs
			</a>
		</div>

		<!-- Song list -->
		{#if playlistStore.currentPlaylist.songs.length === 0}
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
						d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
					/>
				</svg>
				<p class="text-foreground-secondary mb-2">No songs in this playlist</p>
				<a href="/library" class="text-sm text-primary hover:underline">
					Browse your library to add songs
				</a>
			</div>
		{:else}
			<div class="bg-surface rounded-lg overflow-hidden">
				<!-- Header -->
				<div
					class="grid grid-cols-[40px_1fr_1fr_1fr_80px_40px] gap-4 px-4 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wide border-b border-border"
				>
					<span></span>
					<span>Title</span>
					<span>Artist</span>
					<span>Album</span>
					<span class="text-right">Duration</span>
					<span></span>
				</div>
				<!-- Song rows -->
				{#each playlistStore.currentPlaylist.songs as song, index}
					<div
						class="grid grid-cols-[40px_1fr_1fr_1fr_80px_40px] gap-4 px-4 py-3 hover:bg-background transition-colors items-center cursor-pointer"
						onclick={() => handlePlaySong(song, index)}
						role="button"
						tabindex="0"
						onkeydown={(e) => {
							if (e.key === 'Enter') handlePlaySong(song, index);
						}}
					>
						<div
							class="w-10 h-10 rounded bg-background flex items-center justify-center overflow-hidden flex-shrink-0"
						>
							{#if song.coverArtPath && playlistStore.coverUrls[song.coverArtPath]}
								<img
									src={playlistStore.coverUrls[song.coverArtPath]}
									alt=""
									class="w-full h-full object-cover"
								/>
							{:else}
								<svg
									class="w-5 h-5 text-foreground-secondary"
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
							{/if}
						</div>
						<span class="truncate font-medium">{song.title}</span>
						<span class="truncate text-foreground-secondary">{song.artist ?? 'Unknown'}</span>
						<span class="truncate text-foreground-secondary">{song.album ?? 'Unknown'}</span>
						<span class="text-right text-foreground-secondary text-sm">
							{formatDuration(song.duration)}
						</span>
						<button
							onclick={(e) => handleRemoveSong(song.id, e)}
							class="p-1 text-foreground-secondary hover:text-red-500 transition-colors"
							title="Remove from playlist"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
