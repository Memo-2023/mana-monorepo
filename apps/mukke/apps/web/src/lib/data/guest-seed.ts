/**
 * Guest seed data for the Mukke app.
 *
 * Provides a demo playlist. Songs require upload, so no audio seeds.
 */

import type { LocalPlaylist } from './local-store';

export const guestPlaylists: LocalPlaylist[] = [
	{
		id: 'playlist-favorites',
		name: 'Meine Favoriten',
		description: 'Lade Songs hoch und füge sie zu dieser Playlist hinzu.',
	},
];
