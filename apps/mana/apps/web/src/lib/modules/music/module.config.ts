import type { ModuleConfig } from '$lib/data/module-registry';

export const musicModuleConfig: ModuleConfig = {
	appId: 'music',
	tables: [
		{ name: 'songs' },
		{ name: 'mukkePlaylists', syncName: 'playlists' },
		{ name: 'playlistSongs' },
		{ name: 'mukkeProjects', syncName: 'projects' },
		{ name: 'markers' },
		{ name: 'songTags' },
	],
};
