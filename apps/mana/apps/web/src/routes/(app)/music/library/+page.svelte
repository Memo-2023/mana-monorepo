<script lang="ts">
	import { getContext } from 'svelte';
	import { libraryStore } from '$lib/modules/music/stores/library.svelte';
	import { playerStore } from '$lib/modules/music/stores/player.svelte';
	import {
		searchSongs,
		filterFavorites,
		groupByAlbum,
		groupByGenre,
		formatDuration,
	} from '$lib/modules/music/queries';
	import type { Song } from '$lib/modules/music/types';
	import {
		MusicNote,
		Heart,
		Play,
		Pause,
		Trash,
		MagnifyingGlass,
		ArrowLeft,
	} from '@mana/shared-icons';

	const songsCtx: { readonly value: Song[] } = getContext('songs');

	const tabs = ['songs', 'albums', 'genres'] as const;
	type Tab = (typeof tabs)[number];

	let activeTab = $state<Tab>('songs');
	let searchQuery = $state('');

	let filteredSongs = $derived(searchSongs(songsCtx.value, searchQuery));
	let albums = $derived(groupByAlbum(songsCtx.value));
	let genres = $derived(groupByGenre(songsCtx.value));

	function handlePlaySong(song: Song, index: number) {
		playerStore.playSong(song, filteredSongs, index);
	}

	async function handleToggleFavorite(id: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		await libraryStore.toggleFavorite(id);
	}

	async function handleDelete(id: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		const song = songsCtx.value.find((s) => s.id === id);
		if (confirm(`"${song?.title}" wirklich loschen?`)) {
			await libraryStore.delete(id);
		}
	}
</script>

<svelte:head>
	<title>Bibliothek - Music - Mana</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<a
			href="/music"
			class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
		>
			<ArrowLeft size={20} />
		</a>
		<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Bibliothek</h1>
	</div>

	<!-- Tab Bar -->
	<div class="flex max-w-md rounded-lg bg-[hsl(var(--muted))] p-1">
		{#each tabs as tab}
			<button
				onclick={() => (activeTab = tab)}
				class="flex-1 rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors {activeTab ===
				tab
					? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
					: 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}"
			>
				{tab === 'songs' ? 'Songs' : tab === 'albums' ? 'Alben' : 'Genres'}
			</button>
		{/each}
	</div>

	<!-- Search (songs tab only) -->
	{#if activeTab === 'songs'}
		<div class="relative">
			<MagnifyingGlass
				size={18}
				class="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
			/>
			<input
				type="text"
				placeholder="Songs durchsuchen..."
				bind:value={searchQuery}
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			/>
		</div>
	{/if}

	<!-- Songs Tab -->
	{#if activeTab === 'songs'}
		{#if filteredSongs.length === 0}
			<div class="flex flex-col items-center justify-center py-16">
				<MusicNote size={48} class="mb-3 text-[hsl(var(--muted-foreground))]" />
				<p class="text-[hsl(var(--muted-foreground))]">
					{searchQuery ? 'Keine Songs gefunden' : 'Noch keine Songs in deiner Bibliothek'}
				</p>
			</div>
		{:else}
			<div
				class="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
			>
				<!-- Header -->
				<div
					class="grid grid-cols-[40px_1fr_1fr_80px_40px_40px] gap-4 border-b border-[hsl(var(--border))] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]"
				>
					<span></span>
					<span>Titel</span>
					<span>Kunstler</span>
					<span class="text-right">Dauer</span>
					<span></span>
					<span></span>
				</div>
				<!-- Song rows -->
				{#each filteredSongs as song, index (song.id)}
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
						class="group grid grid-cols-[40px_1fr_1fr_80px_40px_40px] items-center gap-4 px-4 py-3 transition-colors hover:bg-[hsl(var(--muted))] {playerStore
							.currentSong?.id === song.id
							? 'bg-[hsl(var(--primary)/0.05)]'
							: ''}"
					>
						<div
							class="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-[hsl(var(--muted))]"
						>
							<MusicNote size={20} class="text-[hsl(var(--muted-foreground))]" />
							{#if playerStore.currentSong?.id === song.id && playerStore.isPlaying}
								<div class="absolute inset-0 flex items-center justify-center rounded bg-black/40">
									<Pause size={20} weight="fill" class="text-white" />
								</div>
							{:else}
								<div
									class="absolute inset-0 hidden items-center justify-center rounded bg-black/40 group-hover:flex"
								>
									<Play size={20} weight="fill" class="text-white" />
								</div>
							{/if}
						</div>
						<span
							class="truncate font-medium {playerStore.currentSong?.id === song.id
								? 'text-[hsl(var(--primary))]'
								: 'text-[hsl(var(--foreground))]'}"
						>
							{song.title}
						</span>
						<span class="truncate text-[hsl(var(--muted-foreground))]">
							{song.artist ?? 'Unbekannt'}
						</span>
						<span class="text-right text-sm text-[hsl(var(--muted-foreground))]">
							{formatDuration(song.duration)}
						</span>
						<button
							onclick={(e) => handleToggleFavorite(song.id, e)}
							class="transition-colors {song.favorite
								? 'text-red-500'
								: 'text-[hsl(var(--muted-foreground))] hover:text-red-500'}"
						>
							<Heart size={16} weight={song.favorite ? 'fill' : 'regular'} />
						</button>
						<button
							onclick={(e) => handleDelete(song.id, e)}
							class="text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
						>
							<Trash size={16} />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Albums Tab -->
	{#if activeTab === 'albums'}
		{#if albums.length === 0}
			<div class="flex flex-col items-center justify-center py-16">
				<p class="text-[hsl(var(--muted-foreground))]">Keine Alben gefunden</p>
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
				{#each albums as album}
					<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
						<div
							class="mb-3 flex aspect-square items-center justify-center rounded-lg bg-[hsl(var(--muted))]"
						>
							<MusicNote size={48} class="text-[hsl(var(--muted-foreground))]" />
						</div>
						<h3 class="truncate font-medium text-[hsl(var(--foreground))]">{album.album}</h3>
						<p class="text-sm text-[hsl(var(--muted-foreground))]">
							{album.songCount}
							{album.songCount === 1 ? 'Song' : 'Songs'}
						</p>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Genres Tab -->
	{#if activeTab === 'genres'}
		{#if genres.length === 0}
			<div class="flex flex-col items-center justify-center py-16">
				<p class="text-[hsl(var(--muted-foreground))]">Keine Genres gefunden</p>
			</div>
		{:else}
			<div
				class="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
			>
				{#each genres as genre}
					<div
						class="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3 last:border-b-0"
					>
						<span class="font-medium text-[hsl(var(--foreground))]">{genre.genre}</span>
						<span class="text-sm text-[hsl(var(--muted-foreground))]">
							{genre.songCount}
							{genre.songCount === 1 ? 'Song' : 'Songs'}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
