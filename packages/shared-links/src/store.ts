/**
 * ManaLink — Local-First Store
 *
 * Creates a shared IndexedDB database ('mana-links') that all apps
 * can read from. Links are synced to the server via mana-sync.
 */

import { createLocalStore } from '@mana/local-store';
import type { LocalManaLink } from './types.js';

const SYNC_SERVER_URL =
	(typeof window !== 'undefined' &&
		(window as unknown as { __PUBLIC_SYNC_SERVER_URL__?: string }).__PUBLIC_SYNC_SERVER_URL__) ||
	(typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SYNC_SERVER_URL) ||
	'http://localhost:3050';

export const linkLocalStore = createLocalStore({
	appId: 'links',
	collections: [
		{
			name: 'links',
			indexes: [
				'pairId',
				'direction',
				'sourceApp',
				'sourceId',
				'targetApp',
				'targetId',
				'linkType',
				'[sourceApp+sourceId]',
				'[sourceApp+sourceCollection+sourceId]',
			],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

export const linkCollection = linkLocalStore.collection<LocalManaLink>('links');
