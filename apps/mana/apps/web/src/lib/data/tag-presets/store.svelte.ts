/**
 * userTagPresets — CRUD store.
 *
 * Lives at the user level (no spaceId). Encrypted: the preset `name` and
 * the whole `tags` array (which contains per-entry tag names) are
 * user-authored personal content and leak categorization intent.
 *
 * The Dexie creating hook does NOT fire for this table — userTagPresets
 * is intentionally kept out of SYNC_APP_MAP for now (local-only, added
 * to sync as a follow-up once the Space-create UI lands in Phase 5 of
 * the plan). That means we stamp `userId` + timestamps explicitly below.
 *
 * See docs/plans/space-scoped-data-model.md §5.
 */

import { db } from '$lib/data/database';
import { encryptRecord, decryptRecords } from '$lib/data/crypto';
import { getEffectiveUserId } from '$lib/data/current-user';
import type {
	LocalUserTagPreset,
	CreatePresetInput,
	UpdatePresetInput,
	UserTagPreset,
	TagPresetEntry,
} from './types';
import { toUserTagPreset } from './types';

const table = db.table<LocalUserTagPreset>('userTagPresets');

function now(): string {
	return new Date().toISOString();
}

async function clearDefaultFlag(userId: string, exceptId?: string): Promise<void> {
	// Only one preset per user may carry isDefault:true. When setting a new
	// default (or creating a default), flip every other of this user's
	// presets off in the same transaction.
	const rows = await table
		.where('userId')
		.equals(userId)
		.and((p) => p.isDefault && p.id !== exceptId)
		.toArray();
	for (const row of rows) {
		await table.update(row.id, { isDefault: false, updatedAt: now() });
	}
}

export const tagPresetsStore = {
	async createPreset(input: CreatePresetInput): Promise<UserTagPreset> {
		const userId = getEffectiveUserId();
		const timestamp = now();
		const newLocal: LocalUserTagPreset = {
			id: crypto.randomUUID(),
			userId,
			name: input.name,
			isDefault: input.isDefault ?? false,
			tags: input.tags ?? [],
			createdAt: timestamp,
			updatedAt: timestamp,
		};

		if (newLocal.isDefault) await clearDefaultFlag(userId, newLocal.id);

		const plaintextSnapshot = toUserTagPreset(newLocal);
		await encryptRecord('userTagPresets', newLocal);
		await table.add(newLocal);
		return plaintextSnapshot;
	},

	async updatePreset(id: string, input: UpdatePresetInput): Promise<void> {
		const existing = await table.get(id);
		if (!existing) throw new Error(`Preset ${id} not found`);

		if (input.isDefault === true) {
			await clearDefaultFlag(existing.userId, id);
		}

		const diff: Partial<LocalUserTagPreset> = {
			...(input.name !== undefined && { name: input.name }),
			...(input.tags !== undefined && { tags: input.tags }),
			...(input.isDefault !== undefined && { isDefault: input.isDefault }),
			updatedAt: now(),
		};
		await encryptRecord('userTagPresets', diff);
		await table.update(id, diff);
	},

	async deletePreset(id: string): Promise<void> {
		await table.update(id, { deletedAt: now(), updatedAt: now() });
	},

	async setDefault(id: string): Promise<void> {
		const existing = await table.get(id);
		if (!existing) throw new Error(`Preset ${id} not found`);
		await clearDefaultFlag(existing.userId, id);
		await table.update(id, { isDefault: true, updatedAt: now() });
	},

	/**
	 * Adds one entry to an existing preset. Handy for the "promote this
	 * tag into a preset" flow from the tag manager UI — no need to
	 * replace the whole `tags` array from the caller.
	 */
	async appendEntry(id: string, entry: TagPresetEntry): Promise<void> {
		const existing = await table.get(id);
		if (!existing) throw new Error(`Preset ${id} not found`);
		const [decrypted] = await decryptRecords('userTagPresets', [existing]);
		const next = [...(decrypted?.tags ?? []), entry];
		await this.updatePreset(id, { tags: next });
	},
};
