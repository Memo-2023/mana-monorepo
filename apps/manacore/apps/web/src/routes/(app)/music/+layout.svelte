<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import {
		useAllSongs,
		useAllPlaylists,
		useAllPlaylistSongs,
		useAllProjects,
	} from '$lib/modules/music/queries';

	let { children }: { children: Snippet } = $props();

	// Live queries — auto-update when IndexedDB changes
	const allSongs = useAllSongs();
	const allPlaylists = useAllPlaylists();
	const allPlaylistSongs = useAllPlaylistSongs();
	const allProjects = useAllProjects();

	// Provide data to child components via Svelte context
	setContext('songs', allSongs);
	setContext('playlists', allPlaylists);
	setContext('playlistSongs', allPlaylistSongs);
	setContext('projects', allProjects);
</script>

{@render children()}
