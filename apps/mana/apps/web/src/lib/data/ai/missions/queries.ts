/**
 * Svelte 5 reactive queries over the `aiMissions` Dexie table.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '../../database';
import { decryptRecords } from '../../crypto';
import type { Mission, MissionState } from './types';
import { MISSIONS_TABLE } from './types';

export interface UseMissionsOptions {
	state?: MissionState;
}

/** All non-deleted missions, newest first. */
export function useMissions(options: UseMissionsOptions = {}) {
	const { state } = options;
	return useLiveQueryWithDefault(async () => {
		const all = await db.table<Mission>(MISSIONS_TABLE).orderBy('createdAt').reverse().toArray();
		const visible = all.filter((m) => !m.deletedAt);
		const filtered = state ? visible.filter((m) => m.state === state) : visible;
		// Decrypt user-typed fields if the table ever gets added to the crypto
		// registry. Today it isn't, so this is a no-op; keeps the hook future-proof.
		return decryptRecords(MISSIONS_TABLE, filtered) as Promise<Mission[]>;
	}, [] as Mission[]);
}

/** Single mission by id, reactively. */
export function useMission(id: string) {
	return useLiveQueryWithDefault(
		async () => {
			const m = await db.table<Mission>(MISSIONS_TABLE).get(id);
			if (!m || m.deletedAt) return null;
			const [decrypted] = await decryptRecords(MISSIONS_TABLE, [m]);
			return decrypted as Mission;
		},
		null as Mission | null
	);
}
