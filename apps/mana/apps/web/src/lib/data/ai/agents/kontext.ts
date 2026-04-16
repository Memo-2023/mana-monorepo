/**
 * Per-agent kontext documents — replaces the global singleton for scoped
 * agent context. Each agent can have one markdown document that's injected
 * into every planner call for that agent's missions.
 *
 * Encrypted at rest (registered in crypto/registry.ts under
 * 'agentKontextDocs'). Synced via mana-sync under appId='ai'.
 */

import { db } from '../../database';
import { encryptRecord, decryptRecords } from '../../crypto';

const TABLE = 'agentKontextDocs';

export interface LocalAgentKontextDoc {
	id: string;
	agentId: string;
	content: string;
	createdAt?: string;
	updatedAt?: string;
	userId?: string;
	deletedAt?: string;
}

export interface AgentKontextDoc {
	id: string;
	agentId: string;
	content: string;
}

/** Read + decrypt the kontext doc for a specific agent. Returns null if
 *  none exists or content is empty. */
export async function getAgentKontext(agentId: string): Promise<AgentKontextDoc | null> {
	const locals = await db
		.table<LocalAgentKontextDoc>(TABLE)
		.where('agentId')
		.equals(agentId)
		.toArray();
	const visible = locals.filter((d) => !d.deletedAt);
	if (visible.length === 0) return null;
	const [decrypted] = await decryptRecords(TABLE, visible);
	if (!decrypted || !decrypted.content?.trim()) return null;
	return { id: decrypted.id, agentId: decrypted.agentId, content: decrypted.content };
}

/** Create or update the kontext doc for an agent. */
export async function saveAgentKontext(agentId: string, content: string): Promise<void> {
	const existing = await db
		.table<LocalAgentKontextDoc>(TABLE)
		.where('agentId')
		.equals(agentId)
		.first();

	if (existing) {
		const diff: Partial<LocalAgentKontextDoc> = {
			content,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord(TABLE, diff);
		await db.table<LocalAgentKontextDoc>(TABLE).update(existing.id, diff);
	} else {
		const doc: LocalAgentKontextDoc = {
			id: crypto.randomUUID(),
			agentId,
			content,
		};
		await encryptRecord(TABLE, doc);
		await db.table<LocalAgentKontextDoc>(TABLE).add(doc);
	}
}
