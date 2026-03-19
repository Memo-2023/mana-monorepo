<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import SongEditor from '$lib/components/SongEditor.svelte';
	import type { Song } from '@mukke/shared';

	const tabs = ['songs', 'albums', 'artists', 'genres'] as const;

	let editingSong = $state<Song | null>(null);

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
		if (libraryStore.songs.length === 0) {
			libraryStore.loadSongs();
		}
	});

	function formatDuration(seconds: number | null | undefined): string {
		if (!seconds) return '0:00';
		return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
	}

	async function handleToggleFavorite(id: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		await libraryStore.toggleFavorite(id);
	}

	function handleEditSong(song: Song, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		editingSong = song;
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
			<button onclick={() => libraryStore.loadSongs()} class="text-sm text-primary hover:underline">
				Try again
			</button>
		</div>
	{:else}
		<!-- Songs Tab -->
		{#if libraryStore.activeTab === 'songs'}
			{#if libraryStore.songs.length === 0}
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
					<p class="text-foreground-secondary mb-2">No songs in your library</p>
					<a href="/upload" class="text-sm text-primary hover:underline">Upload your first song</a>
				</div>
			{:else}
				<div class="bg-surface rounded-lg overflow-hidden">
					<!-- Header -->
					<div
						class="grid grid-cols-[1fr_1fr_1fr_80px_40px_40px_40px] gap-4 px-4 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wide border-b border-border"
					>
						<span>Title</span>
						<span>Artist</span>
						<span>Album</span>
						<span class="text-right">Duration</span>
						<span></span>
						<span></span>
						<span></span>
					</div>
					<!-- Song rows -->
					{#each libraryStore.songs as song}
						<div
							class="grid grid-cols-[1fr_1fr_1fr_80px_40px_40px_40px] gap-4 px-4 py-3 hover:bg-background transition-colors items-center"
						>
							<span class="truncate font-medium">{song.title}</span>
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
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
									/>
								</svg>
							</button>
							<button
								onclick={(e) => openInEditor(song.id, e)}
								class="p-1 text-foreground-secondary hover:text-primary transition-colors"
								title="Open in Editor"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
									/>
								</svg>
							</button>
							<button
								onclick={(e) => handleToggleFavorite(song.id, e)}
								class="p-1 transition-colors {song.favorite
									? 'text-red-500'
									: 'text-foreground-secondary hover:text-red-500'}"
								title={song.favorite ? 'Remove from favorites' : 'Add to favorites'}
							>
								<svg
									class="w-4 h-4"
									fill={song.favorite ? 'currentColor' : 'none'}
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
									/>
								</svg>
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
								class="aspect-square bg-background rounded-lg mb-3 flex items-center justify-center"
							>
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
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
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
			libraryStore.loadSongs();
		}}
	/>
{/if}
