/**
 * userTagPresets — reactive read surface.
 *
 * Always scoped to the current user; no active-space filter (presets are
 * user-level and the picker runs from any Space context).
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import { getCurrentUserId } from '$lib/data/current-user';
import type { LocalUserTagPreset, UserTagPreset } from './types';
import { toUserTagPreset } from './types';

export function useUserTagPresets() {
	return useLiveQueryWithDefault(async () => {
		const userId = getCurrentUserId();
		if (!userId) return [] as UserTagPreset[];

		const rows = await db
			.table<LocalUserTagPreset>('userTagPresets')
			.where('userId')
			.equals(userId)
			.toArray();

		const visible = rows.filter((p) => !p.deletedAt);
		const decrypted = await decryptRecords('userTagPresets', visible);
		return decrypted.map(toUserTagPreset).sort((a, b) => a.name.localeCompare(b.name, 'de'));
	}, [] as UserTagPreset[]);
}

export function useDefaultTagPreset() {
	return useLiveQueryWithDefault(
		async () => {
			const userId = getCurrentUserId();
			if (!userId) return null;

			const row = await db
				.table<LocalUserTagPreset>('userTagPresets')
				.where('userId')
				.equals(userId)
				.and((p) => p.isDefault && !p.deletedAt)
				.first();

			if (!row) return null;
			const [decrypted] = await decryptRecords('userTagPresets', [row]);
			return decrypted ? toUserTagPreset(decrypted) : null;
		},
		null as UserTagPreset | null
	);
}
