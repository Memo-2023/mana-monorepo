<script lang="ts">
	import { page } from '$app/stores';
	import { playerStore } from '$lib/stores/player.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import type { Song } from '@mukke/shared';

	function getBackendUrl(): string {
		let baseUrl = 'http://localhost:3010';
		if (typeof window !== 'undefined') {
			baseUrl =
				(window as unknown as { __PUBLIC_BACKEND_URL__: string }).__PUBLIC_BACKEND_URL__ ||
				'http://localhost:3010';
		}
		return baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
	}

	async function fetchApi<T>(path: string): Promise<T> {
		const authHeaders = await authStore.getAuthHeaders();
		const response = await fetch(`${getBackendUrl()}${path}`, {
			headers: {
				'Content-Type': 'application/json',
				...authHeaders,
			},
		});
		if (!response.ok) throw new Error('Request failed');
		return response.json();
	}

	let songs = $state<Song[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	let albumName = $derived(decodeURIComponent($page.params.name ?? ''));
	let albumArtist = $derived(
		songs.length > 0 ? (songs[0].albumArtist ?? songs[0].artist ?? 'Unknown') : ''
	);
	let albumYear = $derived(songs.find((s) => s.year)?.year ?? null);

	$effect(() => {
		const name = $page.params.name;
		if (!name) return;

		isLoading = true;
		error = null;

		fetchApi<{ songs: Song[] }>(`/library/albums/${encodeURIComponent(decodeURIComponent(name))}`)
			.then((data) => {
				songs = data.songs;
			})
			.catch((e) => {
				error = e instanceof Error ? e.message : 'Failed to load album';
			})
			.finally(() => {
				isLoading = false;
			});
	});

	function formatDuration(seconds: number | null | undefined): string {
		if (!seconds) return '0:00';
		return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
	}

	function playSong(index: number) {
		playerStore.playQueue(songs, index);
	}

	function playAll() {
		if (songs.length > 0) {
			playerStore.playQueue(songs, 0);
		}
	}
</script>

<svelte:head>
	<title>{albumName} - Mukke</title>
</svelte:head>

<div class="p-6 max-w-4xl mx-auto">
	<!-- Back button -->
	<a
		href="/library"
		class="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground mb-6 transition-colors"
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		Back to Library
	</a>

	{#if isLoading}
		<div class="flex items-center justify-center py-16">
			<div
				class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
			></div>
		</div>
	{:else if error}
		<div class="text-center py-16">
			<p class="text-red-500">{error}</p>
		</div>
	{:else}
		<!-- Album header -->
		<div class="flex items-end gap-6 mb-8">
			<div class="w-48 h-48 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
				<svg
					class="w-16 h-16 text-foreground-secondary"
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
			<div>
				<h1 class="text-3xl font-bold mb-1">{albumName}</h1>
				<p class="text-foreground-secondary text-lg">{albumArtist}</p>
				<p class="text-foreground-secondary text-sm mt-1">
					{#if albumYear}{albumYear} &middot;
					{/if}
					{songs.length}
					{songs.length === 1 ? 'song' : 'songs'}
				</p>
				<button
					onclick={playAll}
					class="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
				>
					Play All
				</button>
			</div>
		</div>

		<!-- Song list -->
		{#if songs.length > 0}
			<div class="bg-surface rounded-lg overflow-hidden">
				<div
					class="grid grid-cols-[40px_1fr_1fr_80px] gap-4 px-4 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wide border-b border-border"
				>
					<span class="text-right">#</span>
					<span>Title</span>
					<span>Artist</span>
					<span class="text-right">Duration</span>
				</div>
				{#each songs as song, i}
					<button
						onclick={() => playSong(i)}
						class="grid grid-cols-[40px_1fr_1fr_80px] gap-4 px-4 py-3 hover:bg-background transition-colors items-center w-full text-left"
					>
						<span class="text-right text-foreground-secondary text-sm"
							>{song.trackNumber ?? i + 1}</span
						>
						<span class="truncate font-medium">{song.title}</span>
						<span class="truncate text-foreground-secondary">{song.artist ?? 'Unknown'}</span>
						<span class="text-right text-foreground-secondary text-sm"
							>{formatDuration(song.duration)}</span
						>
					</button>
				{/each}
			</div>
		{/if}
	{/if}
</div>
