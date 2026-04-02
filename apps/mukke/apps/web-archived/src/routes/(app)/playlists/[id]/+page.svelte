<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { playlistStore } from '$lib/stores/playlist.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import { MukkeEvents } from '@manacore/shared-utils/analytics';
	import type { Song } from '@mukke/shared';
	import { CaretLeft, FileText, MusicNote, Play, Plus, X } from '@manacore/shared-icons';

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
		MukkeEvents.playlistPlayAll();
	}

	function handleShufflePlay() {
		const playlist = playlistStore.currentPlaylist;
		if (!playlist || playlist.songs.length === 0) return;
		const shuffled = shuffleArray(playlist.songs);
		playerStore.playQueue(shuffled, 0);
		MukkeEvents.playlistShufflePlay();
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
		<CaretLeft size={16} />
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
				<Play size={16} weight="fill" />
				Play All
			</button>
			<button
				onclick={handleShufflePlay}
				disabled={playlistStore.currentPlaylist.songs.length === 0}
				class="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-background transition-colors text-sm font-medium disabled:opacity-50"
			>
				<FileText size={16} />
				Shuffle
			</button>
			<a
				href="/library"
				class="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-background transition-colors text-sm font-medium"
			>
				<Plus size={16} />
				Add Songs
			</a>
		</div>

		<!-- Song list -->
		{#if playlistStore.currentPlaylist.songs.length === 0}
			<div class="text-center py-16">
				<MusicNote size={48} class="text-foreground-secondary mx-auto mb-3" />
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
								<MusicNote size={20} class="text-foreground-secondary" />
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
							<X size={16} />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
