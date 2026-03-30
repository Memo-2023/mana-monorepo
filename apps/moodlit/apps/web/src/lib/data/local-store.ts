import { createLocalStore, type BaseRecord } from '@manacore/local-store';

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export interface LocalMood extends BaseRecord {
	name: string;
	colors: string[];
	animation: string;
	isDefault: boolean;
}

export interface LocalSequence extends BaseRecord {
	name: string;
	moodIds: string[];
	duration: number;
}

import { guestMoods, guestSequences } from './guest-seed';

export const moodlitStore = createLocalStore({
	appId: 'moodlit',
	collections: [
		{
			name: 'moods',
			indexes: ['name', 'animation', 'isDefault'],
			guestSeed: guestMoods,
		},
		{
			name: 'sequences',
			indexes: ['name'],
			guestSeed: guestSequences,
		},
	],
	sync: { serverUrl: SYNC_SERVER_URL },
});

export const moodCollection = moodlitStore.collection<LocalMood>('moods');
export const sequenceCollection = moodlitStore.collection<LocalSequence>('sequences');
