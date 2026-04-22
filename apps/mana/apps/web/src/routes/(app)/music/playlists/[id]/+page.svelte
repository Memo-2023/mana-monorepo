<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { playlistsStore } from '$lib/modules/music/stores/playlists.svelte';
	import { playerStore } from '$lib/modules/music/stores/player.svelte';
	import { getPlaylistSongs, formatDuration } from '$lib/modules/music/queries';
	import type { Song, Playlist, LocalPlaylistSong } from '$lib/modules/music/types';
	import {
		ArrowLeft,
		Play,
		Pause,
		Trash,
		MusicNote,
		PencilSimple,
		Check,
		X,
		ShareNetwork,
	} from '@mana/shared-icons';
	import { ShareModal } from '@mana/shared-uload';
	import { RoutePage } from '$lib/components/shell';

	const songsCtx: { readonly value: Song[] } = getContext('songs');
	const playlistsCtx: { readonly value: Playlist[] } = getContext('playlists');
	const playlistSongsCtx: { readonly value: LocalPlaylistSong[] } = getContext('playlistSongs');

	const playlistId = $derived($page.params.id ?? '');
	const playlist = $derived(playlistsCtx.value.find((p) => p.id === playlistId));
	const songs = $derived(getPlaylistSongs(songsCtx.value, playlistSongsCtx.value, playlistId));

	let isEditingName = $state(false);
	let editName = $state('');
	let showShare = $state(false);
	let shareUrl = $derived(
		`${typeof window !== 'undefined' ? window.location.origin : ''}/music/playlists/${playlistId}`
	);

	function startEdit() {
		editName = playlist?.name ?? '';
		isEditingName = true;
	}

	async function saveName() {
		if (editName.trim()) {
			await playlistsStore.update(playlistId, { name: editName.trim() });
		}
		isEditingName = false;
	}

	function handlePlaySong(song: Song, index: number) {
		playerStore.playSong(song, songs, index);
	}

	function handlePlayAll() {
		if (songs.length > 0) {
			playerStore.playSong(songs[0], songs, 0);
		}
	}

	async function handleRemoveSong(songId: string, e: Event) {
		e.stopPropagation();
		await playlistsStore.removeSong(playlistId, songId);
	}

	async function handleDeletePlaylist() {
		if (confirm('Playlist wirklich loschen?')) {
			await playlistsStore.delete(playlistId);
			goto('/music/playlists');
		}
	}
</script>

<svelte:head>
	<title>{playlist?.name || 'Playlist'} - Music - Mana</title>
</svelte:head>

<RoutePage appId="music" backHref="/music/playlists" title="Playlist">
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<a
					href="/music/playlists"
					class="rounded-lg p-1.5 text-[hsl(var(--color-muted-foreground))] hover:bg-[hsl(var(--color-muted))]"
				>
					<ArrowLeft size={20} />
				</a>
				<div>
					{#if isEditingName}
						<div class="flex items-center gap-2">
							<input
								type="text"
								bind:value={editName}
								onkeydown={(e) => e.key === 'Enter' && saveName()}
								class="rounded border border-[hsl(var(--color-border))] bg-transparent px-2 py-1 text-xl font-bold focus:outline-none focus:ring-1 focus:ring-[hsl(var(--color-primary))]"
							/>
							<button onclick={saveName} class="text-[hsl(var(--color-primary))]">
								<Check size={18} />
							</button>
							<button
								onclick={() => (isEditingName = false)}
								class="text-[hsl(var(--color-muted-foreground))]"
							>
								<X size={18} />
							</button>
						</div>
					{:else}
						<button onclick={startEdit} class="group flex items-center gap-2">
							<h1 class="text-2xl font-bold text-[hsl(var(--color-foreground))]">
								{playlist?.name || 'Playlist'}
							</h1>
							<PencilSimple
								size={16}
								class="text-[hsl(var(--color-muted-foreground))] opacity-0 group-hover:opacity-100"
							/>
						</button>
					{/if}
					<p class="text-sm text-[hsl(var(--color-muted-foreground))]">
						{songs.length}
						{songs.length === 1 ? 'Song' : 'Songs'}
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				{#if songs.length > 0}
					<button
						onclick={handlePlayAll}
						class="flex items-center gap-2 rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-primary-foreground))] hover:opacity-90"
					>
						<Play size={16} weight="fill" />
						Alle abspielen
					</button>
				{/if}
				<button
					onclick={() => (showShare = true)}
					class="rounded-lg p-2 text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
					title="Kurzlink teilen"
				>
					<ShareNetwork size={20} />
				</button>
				<button
					onclick={handleDeletePlaylist}
					class="rounded-lg p-2 text-[hsl(var(--color-muted-foreground))] hover:text-red-500"
					title="Playlist loschen"
				>
					<Trash size={20} />
				</button>
			</div>
		</div>

		<!-- Songs -->
		{#if songs.length === 0}
			<div class="flex flex-col items-center justify-center py-16">
				<MusicNote size={48} class="mb-3 text-[hsl(var(--color-muted-foreground))]" />
				<p class="text-[hsl(var(--color-muted-foreground))]">Keine Songs in dieser Playlist</p>
			</div>
		{:else}
			<div
				class="overflow-hidden rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))]"
			>
				{#each songs as song, index (song.id)}
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
						class="group flex items-center gap-4 border-b border-[hsl(var(--color-border))] px-4 py-3 transition-colors last:border-b-0 hover:bg-[hsl(var(--color-muted))] {playerStore
							.currentSong?.id === song.id
							? 'bg-[hsl(var(--color-primary)/0.05)]'
							: ''}"
					>
						<div
							class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[hsl(var(--color-muted))]"
						>
							<MusicNote size={20} class="text-[hsl(var(--color-muted-foreground))]" />
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
						<div class="min-w-0 flex-1">
							<p
								class="truncate font-medium {playerStore.currentSong?.id === song.id
									? 'text-[hsl(var(--color-primary))]'
									: 'text-[hsl(var(--color-foreground))]'}"
							>
								{song.title}
							</p>
							<p class="truncate text-sm text-[hsl(var(--color-muted-foreground))]">
								{song.artist ?? 'Unbekannt'}
							</p>
						</div>
						<span class="text-sm text-[hsl(var(--color-muted-foreground))]">
							{formatDuration(song.duration)}
						</span>
						<button
							onclick={(e) => handleRemoveSong(song.id, e)}
							class="rounded p-1 text-[hsl(var(--color-muted-foreground))] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
							title="Aus Playlist entfernen"
						>
							<Trash size={16} />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Share Modal (uLoad integration) -->
	<ShareModal
		visible={showShare}
		onClose={() => (showShare = false)}
		url={shareUrl}
		title={playlist?.name ?? 'Playlist'}
		source="music"
		description="{songs.length} {songs.length === 1 ? 'Song' : 'Songs'}"
	/>
</RoutePage>
