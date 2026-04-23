/**
 * Thin client for mana-sync's push/pull protocol.
 *
 * Tool handlers never touch Postgres directly — they speak the same
 * sync protocol the Dexie-backed clients use. This keeps RLS,
 * field-level LWW, and membership checks intact.
 *
 * Wire format reference: services/mana-sync/CLAUDE.md
 */

export interface SyncFieldChange {
	value: unknown;
	updatedAt: string;
}

export interface SyncChange {
	table: string;
	id: string;
	op: 'insert' | 'update' | 'delete';
	spaceId?: string;
	data?: Record<string, unknown>;
	fields?: Record<string, SyncFieldChange>;
	deletedAt?: string;
}

export interface SyncPushRequest {
	clientId: string;
	/**
	 * ISO timestamp; we pass the tool-call start time so the server's
	 * response only contains anything that changed *since* we started
	 * (not our own just-inserted row).
	 */
	since: string;
	changes: SyncChange[];
}

export interface SyncPullResponse<TRow = Record<string, unknown>> {
	changes: Array<{ table: string; id: string; op: string; data?: TRow }>;
	syncedUntil: string;
}

export interface SyncClientConfig {
	baseUrl: string;
	jwt: string;
	/** Stable identifier for the calling process — lands in sync_changes.client_id. */
	clientId: string;
}

/**
 * Push a single insert. Returns once mana-sync has persisted the row.
 * Handlers that need multi-record writes should call `push()` directly
 * with a batched changes array.
 */
export async function pushInsert(
	config: SyncClientConfig,
	appId: string,
	change: Omit<SyncChange, 'op'>
): Promise<void> {
	await push(config, appId, [{ ...change, op: 'insert' }]);
}

export async function push(
	config: SyncClientConfig,
	appId: string,
	changes: SyncChange[]
): Promise<void> {
	const body: SyncPushRequest = {
		clientId: config.clientId,
		since: new Date().toISOString(),
		changes,
	};

	const res = await fetch(`${config.baseUrl}/sync/${appId}`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: `Bearer ${config.jwt}`,
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const text = await res.text().catch(() => '<unreadable body>');
		throw new Error(
			`mana-sync push failed: ${res.status} ${res.statusText} — ${text.slice(0, 500)}`
		);
	}
}

/**
 * Pull all rows of a collection since a given timestamp. The registry
 * uses this for `*.list` and `*.recent` tools — we fetch the current
 * state rather than maintaining our own cache, matching the local-first
 * model where mana-sync is the source of truth.
 *
 * `since` defaults to epoch zero, which returns everything.
 */
export async function pullAll<TRow = Record<string, unknown>>(
	config: SyncClientConfig,
	appId: string,
	collection: string,
	since = '1970-01-01T00:00:00.000Z'
): Promise<SyncPullResponse<TRow>> {
	const url = new URL(`${config.baseUrl}/sync/${appId}/pull`);
	url.searchParams.set('collection', collection);
	url.searchParams.set('since', since);

	const res = await fetch(url, {
		headers: {
			authorization: `Bearer ${config.jwt}`,
			'x-client-id': config.clientId,
		},
	});

	if (!res.ok) {
		const text = await res.text().catch(() => '<unreadable body>');
		throw new Error(
			`mana-sync pull failed: ${res.status} ${res.statusText} — ${text.slice(0, 500)}`
		);
	}

	return (await res.json()) as SyncPullResponse<TRow>;
}
