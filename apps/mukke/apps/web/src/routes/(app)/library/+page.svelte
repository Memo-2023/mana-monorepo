<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { playerStore } from '$lib/stores/player.svelte';
	import { MukkeEvents } from '@manacore/shared-utils/analytics';
	import SongEditor from '$lib/components/SongEditor.svelte';
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import type { Song } from '@mukke/shared';
	import { useAllSongs } from '$lib/data/queries';
	import type { LocalSong } from '$lib/data/local-store';
	import { Heart, MusicNote, Pause, PencilSimple, Play, User } from '@manacore/shared-icons';

	// Live query — auto-updates on IndexedDB changes
	const allSongs = useAllSongs();
	// Cast LocalSong[] to Song[] for compatibility with existing UI
	let songs = $derived(allSongs.value as unknown as Song[]);

	const tabs = ['songs', 'albums', 'artists', 'genres'] as const;

	let editingSong = $state<Song | null>(null);
	let failedCovers = $state<Set<string>>(new Set());

	// Context menu state
	let contextMenuVisible = $state(false);
	let contextMenuX = $state(0);
	let contextMenuY = $state(0);
	let contextMenuSong = $state<{ song: Song; index: number } | null>(null);

	function handleContextMenu(e: MouseEvent, song: Song, index: number) {
		e.preventDefault();
		e.stopPropagation();
		contextMenuX = e.clientX;
		contextMenuY = e.clientY;
		contextMenuSong = { song, index };
		contextMenuVisible = true;
	}

	function getContextMenuItems(): ContextMenuItem[] {
		if (!contextMenuSong) return [];
		const { song } = contextMenuSong;
		return [
			{
				id: 'play',
				label: playerStore.currentSong?.id === song.id && playerStore.isPlaying ? 'Pause' : 'Play',
				action: () => handlePlaySong(contextMenuSong!.song, contextMenuSong!.index),
			},
			{ id: 'divider-1', label: '', type: 'divider' as const },
			{
				id: 'edit',
				label: 'Edit Metadata',
				action: () => {
					editingSong = contextMenuSong!.song;
				},
			},
			{
				id: 'editor',
				label: 'Open in Editor',
				action: () => openInEditor(contextMenuSong!.song.id, new MouseEvent('click')),
			},
			{ id: 'divider-2', label: '', type: 'divider' as const },
			{
				id: 'favorite',
				label: song.favorite ? 'Remove from Favorites' : 'Add to Favorites',
				action: () => libraryStore.toggleFavorite(contextMenuSong!.song.id),
			},
			{ id: 'divider-3', label: '', type: 'divider' as const },
			{
				id: 'delete',
				label: 'Delete Song',
				variant: 'danger' as const,
				action: () => {
					if (confirm(`Delete "${contextMenuSong!.song.title}"?`)) {
						libraryStore.deleteSong(contextMenuSong!.song.id);
					}
				},
			},
		];
	}

	function getBackendUrl(): string {
		let baseUrl = 'http://localhost:3010';
		if (typeof window !== 'undefined') {
			baseUrl =
				(window as unknown as { __PUBLIC_BACKEND_URL__: string }).__PUBLIC_BACKEND_URL__ ||
				'http://localhost:3010';
		}
		return baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
	}

	async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
		const authHeaders = await authStore.getAuthHeaders();
		const response = await fetch(`${getBackendUrl()}${path}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...authHeaders,
				...options.headers,
			},
		});
		if (!response.ok) throw new Error('Request failed');
		return response.json();
	}

	onMount(() => {
		libraryStore.setActiveTab('songs');
	});

	function formatDuration(seconds: number | null | undefined): string {
		if (!seconds) return '0:00';
		return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
	}

	async function handleToggleFavorite(id: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		const song = songs.find((s) => s.id === id);
		await libraryStore.toggleFavorite(id);
		MukkeEvents.songFavorited(!song?.favorite);
	}

	function handleEditSong(song: Song, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		editingSong = song;
	}

	function handlePlaySong(song: Song, index: number) {
		playerStore.playSong(song, songs, index);
		MukkeEvents.songPlayed();
	}

	async function openInEditor(songId: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		try {
			const response = await fetchApi<{ project: { id: string } }>(
				`/projects/from-song/${songId}`,
				{
					method: 'POST',
				}
			);
			goto(`/editor/${response.project.id}`);
		} catch (err) {
			console.error('Failed to open in editor:', err);
		}
	}
</script>

<svelte:head>
	<title>Library - Mukke</title>
</svelte:head>

<div class="p-6 max-w-6xl mx-auto">
	<h1 class="text-2xl font-bold mb-6">Library</h1>

	<!-- Tab Bar -->
	<div class="flex bg-surface rounded-lg p-1 mb-6 max-w-md">
		{#each tabs as tab}
			<button
				onclick={() => libraryStore.setActiveTab(tab)}
				class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize {libraryStore.activeTab ===
				tab
					? 'bg-primary text-white'
					: 'text-foreground-secondary hover:text-foreground'}"
			>
				{tab}
			</button>
		{/each}
	</div>

	<!-- Loading -->
	{#if libraryStore.isLoading}
		<div class="flex items-center justify-center py-16">
			<div
				class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
			></div>
		</div>
	{:else if libraryStore.error}
		<div class="text-center py-16">
			<p class="text-red-500 mb-2">{libraryStore.error}</p>
		</div>
	{:else}
		<!-- Songs Tab -->
		{#if libraryStore.activeTab === 'songs'}
			{#if songs.length === 0}
				<div class="text-center py-16">
					<MusicNote size={48} class="text-foreground-secondary mx-auto mb-3" />
					<p class="text-foreground-secondary mb-2">No songs in your library</p>
					<a href="/upload" class="text-sm text-primary hover:underline">Upload your first song</a>
				</div>
			{:else}
				<div class="bg-surface rounded-lg overflow-hidden">
					<!-- Header -->
					<div
						class="grid grid-cols-[40px_1fr_1fr_1fr_80px_40px_40px_40px] gap-4 px-4 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wide border-b border-border"
					>
						<span></span>
						<span>Title</span>
						<span>Artist</span>
						<span>Album</span>
						<span class="text-right">Duration</span>
						<span></span>
						<span></span>
						<span></span>
					</div>
					<!-- Song rows -->
					{#each songs as song, index}
						<div
							role="button"
							tabindex="0"
							onclick={() => handlePlaySong(song, index)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									handlePlaySong(song, index);
								}
							}}
							oncontextmenu={(e) => handleContextMenu(e, song, index)}
							class="grid grid-cols-[40px_1fr_1fr_1fr_80px_40px_40px_40px] gap-4 px-4 py-3 hover:bg-background transition-colors items-center cursor-pointer group {playerStore
								.currentSong?.id === song.id
								? 'bg-primary/5'
								: ''}"
						>
							<div
								class="w-10 h-10 rounded bg-background flex items-center justify-center overflow-hidden flex-shrink-0 relative"
							>
								{#if song.coverArtPath && libraryStore.coverUrls[song.coverArtPath] && !failedCovers.has(song.id)}
									<img
										src={libraryStore.coverUrls[song.coverArtPath]}
										alt=""
										class="w-full h-full object-cover"
										onerror={() => {
											failedCovers = new Set([...failedCovers, song.id]);
										}}
									/>
								{:else}
									<MusicNote
										size={20}
										class="text-foreground-secondary transition-opacity {playerStore.currentSong
											?.id === song.id && playerStore.isPlaying
											? 'opacity-0'
											: 'group-hover:opacity-0'}"
									/>
								{/if}
								<!-- Playing indicator or play icon on hover -->
								{#if playerStore.currentSong?.id === song.id && playerStore.isPlaying}
									<div
										class="absolute inset-0 flex items-center justify-center bg-black/40 rounded"
									>
										<Pause size={20} weight="fill" class="text-white" />
									</div>
								{:else}
									<div
										class="absolute inset-0 items-center justify-center bg-black/40 rounded hidden group-hover:flex"
									>
										<Play size={20} weight="fill" class="text-white" />
									</div>
								{/if}
							</div>
							<span
								class="truncate font-medium {playerStore.currentSong?.id === song.id
									? 'text-primary'
									: ''}">{song.title}</span
							>
							<span class="truncate text-foreground-secondary">{song.artist ?? 'Unknown'}</span>
							<span class="truncate text-foreground-secondary">{song.album ?? 'Unknown'}</span>
							<span class="text-right text-foreground-secondary text-sm">
								{formatDuration(song.duration)}
							</span>
							<button
								onclick={(e) => handleEditSong(song, e)}
								class="p-1 text-foreground-secondary hover:text-primary transition-colors"
								title="Edit metadata"
							>
								<PencilSimple size={16} />
							</button>
							<button
								onclick={(e) => openInEditor(song.id, e)}
								class="p-1 text-foreground-secondary hover:text-primary transition-colors"
								title="Open in Editor"
							>
								<MusicNote size={16} />
							</button>
							<button
								onclick={(e) => handleToggleFavorite(song.id, e)}
								class="p-1 transition-colors {song.favorite
									? 'text-red-500'
									: 'text-foreground-secondary hover:text-red-500'}"
								title={song.favorite ? 'Remove from favorites' : 'Add to favorites'}
							>
								<Heart size={16} />
							</button>
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- Albums Tab -->
		{#if libraryStore.activeTab === 'albums'}
			{#if libraryStore.albums.length === 0}
				<div class="text-center py-16">
					<p class="text-foreground-secondary">No albums found</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{#each libraryStore.albums as album}
						<a
							href="/library/albums/{encodeURIComponent(album.album)}"
							class="bg-surface rounded-lg p-4 hover:bg-surface-hover transition-colors group"
						>
							<div
								class="aspect-square bg-background rounded-lg mb-3 flex items-center justify-center overflow-hidden"
							>
								{#if album.coverArtPath && libraryStore.coverUrls[album.coverArtPath] && !failedCovers.has(album.coverArtPath)}
									<img
										src={libraryStore.coverUrls[album.coverArtPath]}
										alt={album.album}
										class="w-full h-full object-cover"
										onerror={() => {
											if (album.coverArtPath)
												failedCovers = new Set([...failedCovers, album.coverArtPath]);
										}}
									/>
								{:else}
									<MusicNote size={48} class="text-foreground-secondary" />
								{/if}
							</div>
							<h3 class="font-medium truncate group-hover:text-primary transition-colors">
								{album.album}
							</h3>
							<p class="text-sm text-foreground-secondary">
								{album.songCount}
								{album.songCount === 1 ? 'song' : 'songs'}
							</p>
						</a>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- Artists Tab -->
		{#if libraryStore.activeTab === 'artists'}
			{#if libraryStore.artists.length === 0}
				<div class="text-center py-16">
					<p class="text-foreground-secondary">No artists found</p>
				</div>
			{:else}
				<div class="bg-surface rounded-lg overflow-hidden">
					{#each libraryStore.artists as artist}
						<a
							href="/library/artists/{encodeURIComponent(artist.artist)}"
							class="flex items-center justify-between px-4 py-3 hover:bg-background transition-colors border-b border-border last:border-b-0"
						>
							<div class="flex items-center gap-3">
								<div
									class="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground-secondary"
								>
									<User size={20} />
								</div>
								<span class="font-medium">{artist.artist}</span>
							</div>
							<span class="text-sm text-foreground-secondary">
								{artist.songCount}
								{artist.songCount === 1 ? 'song' : 'songs'}
							</span>
						</a>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- Genres Tab -->
		{#if libraryStore.activeTab === 'genres'}
			{#if libraryStore.genres.length === 0}
				<div class="text-center py-16">
					<p class="text-foreground-secondary">No genres found</p>
				</div>
			{:else}
				<div class="bg-surface rounded-lg overflow-hidden">
					{#each libraryStore.genres as genre}
						<a
							href="/library/genres/{encodeURIComponent(genre.genre)}"
							class="flex items-center justify-between px-4 py-3 hover:bg-background transition-colors border-b border-border last:border-b-0"
						>
							<span class="font-medium">{genre.genre}</span>
							<span class="text-sm text-foreground-secondary">
								{genre.songCount}
								{genre.songCount === 1 ? 'song' : 'songs'}
							</span>
						</a>
					{/each}
				</div>
			{/if}
		{/if}
	{/if}
</div>

{#if editingSong}
	<SongEditor
		song={editingSong}
		open={editingSong !== null}
		onclose={() => {
			editingSong = null;
		}}
	/>
{/if}

<ContextMenu
	visible={contextMenuVisible}
	x={contextMenuX}
	y={contextMenuY}
	items={getContextMenuItems()}
	onClose={() => {
		contextMenuVisible = false;
		contextMenuSong = null;
	}}
/>
