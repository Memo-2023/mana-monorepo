/**
 * Goal Queries — Reactive reads for the Goal system.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import type { LocalGoal } from './types';

const TABLE = 'companionGoals';

export function useActiveGoals() {
	return useLiveQueryWithDefault<LocalGoal[]>(async () => {
		const all = await db.table<LocalGoal>(TABLE).toArray();
		return all.filter((g) => g.status === 'active' && !g.deletedAt);
	}, []);
}

export function useAllGoals() {
	return useLiveQueryWithDefault<LocalGoal[]>(async () => {
		const all = await db.table<LocalGoal>(TABLE).toArray();
		return all.filter((g) => !g.deletedAt);
	}, []);
}
