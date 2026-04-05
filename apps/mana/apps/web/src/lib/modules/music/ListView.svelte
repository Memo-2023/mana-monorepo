<!--
  Music — Workbench ListView
  Song library with recent plays and playlists.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalSong, LocalPlaylist } from './types';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate, goBack, params }: ViewProps = $props();

	let songs = $state<LocalSong[]>([]);
	let playlists = $state<LocalPlaylist[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalSong>('songs')
				.toArray()
				.then((all) => all.filter((s) => !s.deletedAt));
		}).subscribe((val) => {
			songs = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalPlaylist>('playlists')
				.toArray()
				.then((all) => all.filter((p) => !p.deletedAt));
		}).subscribe((val) => {
			playlists = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	const recentlyPlayed = $derived(
		[...songs]
			.filter((s) => s.lastPlayedAt)
			.sort((a, b) => (b.lastPlayedAt ?? '').localeCompare(a.lastPlayedAt ?? ''))
			.slice(0, 10)
	);

	const favorites = $derived(songs.filter((s) => s.favorite));

	function formatDuration(sec?: number | null): string {
		if (!sec) return '--:--';
		const m = Math.floor(sec / 60);
		const s = Math.round(sec % 60);
		return `${m}:${String(s).padStart(2, '0')}`;
	}
</script>

<div class="flex h-full flex-col gap-3 p-3 sm:p-4">
	<div class="flex gap-3 text-xs text-white/40">
		<span>{songs.length} Songs</span>
		<span>{playlists.length} Playlists</span>
		<span>{favorites.length} Favoriten</span>
	</div>

	<div class="flex-1 overflow-auto">
		<h3 class="mb-2 text-xs font-medium text-white/50">Zuletzt gehört</h3>
		{#each recentlyPlayed as song (song.id)}
			<button
				onclick={() =>
					navigate('detail', {
						songId: song.id,
						_siblingIds: recentlyPlayed.map((s) => s.id),
						_siblingKey: 'songId',
					})}
				class="flex w-full min-h-[44px] items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-white/5 cursor-pointer text-left"
			>
				<div
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white/10 text-xs text-white/30"
				>
					&#9835;
				</div>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm text-white/80">{song.title}</p>
					<p class="truncate text-xs text-white/40">{song.artist ?? 'Unbekannt'}</p>
				</div>
				<span class="text-xs text-white/30">{formatDuration(song.duration)}</span>
			</button>
		{/each}

		{#if recentlyPlayed.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Noch nichts gehört</p>
		{/if}
	</div>
</div>
