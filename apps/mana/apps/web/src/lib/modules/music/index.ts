/**
 * Music module — barrel exports.
 */

export { libraryStore } from './stores/library.svelte';
export { playlistsStore } from './stores/playlists.svelte';
export { projectsStore } from './stores/projects.svelte';
export { playerStore } from './stores/player.svelte';
export {
	useAllSongs,
	useAllPlaylists,
	useAllPlaylistSongs,
	useAllProjects,
	useMarkersByBeat,
	toSong,
	toPlaylist,
	toProject,
	searchSongs,
	filterFavorites,
	filterByArtist,
	filterByAlbum,
	filterByGenre,
	getPlaylistSongs,
	groupByArtist,
	groupByAlbum,
	groupByGenre,
	computeStats,
	formatDuration,
} from './queries';
export {
	songTable,
	musicPlaylistTable,
	playlistSongTable,
	musicProjectTable,
	markerTable,
	MUSIC_GUEST_SEED,
} from './collections';
export type {
	LocalSong,
	LocalPlaylist,
	LocalPlaylistSong,
	LocalProject,
	LocalMarker,
	Song,
	Playlist,
	Project,
	Album,
	Artist,
	Genre,
	LibraryStats,
	RepeatMode,
} from './types';
