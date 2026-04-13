import type { ModuleTool } from '$lib/data/tools/types';

export const musicTools: ModuleTool[] = [
	{
		name: 'create_playlist',
		module: 'music',
		description: 'Erstellt eine neue Playlist',
		parameters: [
			{ name: 'name', type: 'string', description: 'Name der Playlist', required: true },
		],
		async execute(params) {
			const { playlistsStore } = await import('./stores/playlists.svelte');
			const playlist = await playlistsStore.create(params.name as string);
			return { success: true, data: playlist, message: `Playlist "${params.name}" erstellt` };
		},
	},
];
