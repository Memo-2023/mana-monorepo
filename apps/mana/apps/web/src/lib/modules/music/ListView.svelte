<!--
  Music — Workbench ListView
  Song library with recent plays and playlists.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import { BaseListView } from '@mana/shared-ui';
	import type { LocalSong, LocalPlaylist } from './types';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate }: ViewProps = $props();

	const songsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalSong>('songs').toArray();
		const visible = all.filter((s) => !s.deletedAt);
		return decryptRecords('songs', visible);
	}, [] as LocalSong[]);

	const playlistsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalPlaylist>('playlists').toArray();
		return all.filter((p) => !p.deletedAt);
	}, [] as LocalPlaylist[]);

	const songs = $derived(songsQuery.value);
	const playlists = $derived(playlistsQuery.value);

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

<BaseListView items={recentlyPlayed} getKey={(s) => s.id} emptyTitle="Noch nichts gehört">
	{#snippet header()}
		<span>{songs.length} Songs</span>
		<span>{playlists.length} Playlists</span>
		<span>{favorites.length} Favoriten</span>
	{/snippet}

	{#snippet listHeader()}
		<h3 class="mb-2 text-xs font-medium text-white/50">Zuletzt gehört</h3>
	{/snippet}

	{#snippet item(song)}
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
	{/snippet}
</BaseListView>
