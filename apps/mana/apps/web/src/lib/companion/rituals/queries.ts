import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import type { LocalRitual } from './types';

export function useActiveRituals() {
	return useLiveQueryWithDefault<LocalRitual[]>(async () => {
		const all = await db.table<LocalRitual>('rituals').toArray();
		return all
			.filter((r) => r.status === 'active' && !r.deletedAt)
			.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	}, []);
}

export function useAllRituals() {
	return useLiveQueryWithDefault<LocalRitual[]>(async () => {
		const all = await db.table<LocalRitual>('rituals').toArray();
		return all.filter((r) => !r.deletedAt);
	}, []);
}
