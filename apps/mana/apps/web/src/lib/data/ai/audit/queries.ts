/**
 * Queries the mana-ai audit endpoint for server-side decrypt events on
 * the user's missions. Powers the "Datenzugriff" tab in the AI Workbench.
 *
 * The endpoint (GET /api/v1/me/ai-audit) is JWT-gated on mana-ai; rows
 * are RLS-scoped so the user only ever sees their own regardless of the
 * client parameters.
 */

import { getManaAiUrl } from '$lib/api/config';
import { authStore } from '$lib/stores/auth.svelte';

export interface AuditRow {
	id: string;
	missionId: string;
	iterationId: string | null;
	tableName: string;
	recordId: string;
	status: 'ok' | 'failed' | 'scope-violation';
	reason: string | null;
	ts: string;
}

export interface FetchAuditParams {
	missionId?: string;
	limit?: number;
}

export async function fetchDecryptAudit(params: FetchAuditParams = {}): Promise<AuditRow[]> {
	const token = await authStore.getValidToken();
	if (!token) throw new Error('fetchDecryptAudit: no auth token');

	const url = new URL(`${getManaAiUrl()}/api/v1/me/ai-audit`);
	if (params.missionId) url.searchParams.set('missionId', params.missionId);
	if (params.limit) url.searchParams.set('limit', String(params.limit));

	const res = await fetch(url, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok) {
		throw new Error(`fetchDecryptAudit failed: ${res.status} ${res.statusText}`);
	}
	const body = (await res.json()) as { rows: AuditRow[] };
	return body.rows;
}
