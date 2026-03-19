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

	let artistName = $derived(decodeURIComponent($page.params.name ?? ''));

	$effect(() => {
		const name = $page.params.name;
		if (!name) return;

		isLoading = true;
		error = null;

		fetchApi<{ songs: Song[] }>(`/library/artists/${encodeURIComponent(decodeURIComponent(name))}`)
			.then((data) => {
				songs = data.songs;
			})
			.catch((e) => {
				error = e instanceof Error ? e.message : 'Failed to load artist';
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
	<title>{artistName} - Mukke</title>
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
		<!-- Artist header -->
		<div class="flex items-end gap-6 mb-8">
			<div class="w-36 h-36 bg-surface rounded-full flex items-center justify-center flex-shrink-0">
				<svg
					class="w-14 h-14 text-foreground-secondary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
					/>
				</svg>
			</div>
			<div>
				<h1 class="text-3xl font-bold mb-1">{artistName}</h1>
				<p class="text-foreground-secondary text-sm">
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
					class="grid grid-cols-[1fr_1fr_80px] gap-4 px-4 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wide border-b border-border"
				>
					<span>Title</span>
					<span>Album</span>
					<span class="text-right">Duration</span>
				</div>
				{#each songs as song, i}
					<button
						onclick={() => playSong(i)}
						class="grid grid-cols-[1fr_1fr_80px] gap-4 px-4 py-3 hover:bg-background transition-colors items-center w-full text-left"
					>
						<span class="truncate font-medium">{song.title}</span>
						<span class="truncate text-foreground-secondary">{song.album ?? 'Unknown'}</span>
						<span class="text-right text-foreground-secondary text-sm"
							>{formatDuration(song.duration)}</span
						>
					</button>
				{/each}
			</div>
		{/if}
	{/if}
</div>
