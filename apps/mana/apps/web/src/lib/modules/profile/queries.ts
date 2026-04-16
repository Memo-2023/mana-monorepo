/**
 * Profile module — read-side queries.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { decryptRecords } from '$lib/data/crypto';
import { userContextTable } from './collections';
import { USER_CONTEXT_SINGLETON_ID, toUserContext, type UserContext } from './types';

/** Reactive live-query for the user context singleton. */
export function useUserContext() {
	return useLiveQueryWithDefault<UserContext | null>(async () => {
		const local = await userContextTable.get(USER_CONTEXT_SINGLETON_ID);
		if (!local || local.deletedAt) return null;
		const [decrypted] = await decryptRecords('userContext', [local]);
		return toUserContext(decrypted);
	}, null);
}
