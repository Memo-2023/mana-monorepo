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

// Minimal duck-typed local shapes for the tag tables. Full types live
// in @mana/shared-stores but the fields we write are a strict subset —
// importing the shared-stores type from a data-layer module would create
// an awkward dependency direction.
interface LocalTagShape {
	id: string;
	spaceId: string;
	userId?: string;
	name: string;
	color: string;
	icon?: string | null;
	groupId?: string | null;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

interface LocalTagGroupShape {
	id: string;
	spaceId: string;
	userId?: string;
	name: string;
	color: string;
	icon?: string | null;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

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
		await table.update(row.id, { isDefault: false });
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
		};
		await encryptRecord('userTagPresets', diff);
		await table.update(id, diff);
	},

	async deletePreset(id: string): Promise<void> {
		await table.update(id, { deletedAt: now() });
	},

	async setDefault(id: string): Promise<void> {
		const existing = await table.get(id);
		if (!existing) throw new Error(`Preset ${id} not found`);
		await clearDefaultFlag(existing.userId, id);
		await table.update(id, { isDefault: true });
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

	/**
	 * One-shot-copy a preset's entries into a target Space as fresh
	 * globalTags rows (+ tagGroups for each distinct groupName). No
	 * live link — renaming the preset afterwards does not rename the
	 * applied tags. Returns the number of tags created.
	 *
	 * Stamps `spaceId` explicitly on every written row so the write
	 * lands in the target Space even if the user's active-space
	 * context is still the source Space when this runs (SpaceCreateDialog
	 * flow: create Space → apply preset → activate Space → reload).
	 */
	async applyPresetToSpace(presetId: string, targetSpaceId: string): Promise<number> {
		const existing = await table.get(presetId);
		if (!existing) throw new Error(`Preset ${presetId} not found`);
		const [decrypted] = await decryptRecords('userTagPresets', [existing]);
		if (!decrypted) return 0;

		const userId = getEffectiveUserId();
		const timestamp = now();

		// Build a groupName → new groupId map so multiple tag entries
		// sharing the same groupName land in the same freshly-created
		// tagGroups row.
		const groupMap = new Map<string, string>();
		const groupsToWrite: LocalTagGroupShape[] = [];
		for (const entry of decrypted.tags ?? []) {
			if (!entry.groupName || groupMap.has(entry.groupName)) continue;
			const groupId = crypto.randomUUID();
			groupMap.set(entry.groupName, groupId);
			groupsToWrite.push({
				id: groupId,
				spaceId: targetSpaceId,
				userId,
				name: entry.groupName,
				color: '#6b7280',
				icon: null,
				sortOrder: groupMap.size - 1,
				createdAt: timestamp,
				updatedAt: timestamp,
			});
		}

		const tagsToWrite: LocalTagShape[] = [];
		let sortOrder = 0;
		for (const entry of decrypted.tags ?? []) {
			tagsToWrite.push({
				id: crypto.randomUUID(),
				spaceId: targetSpaceId,
				userId,
				name: entry.name,
				color: entry.color,
				icon: entry.icon ?? null,
				groupId: entry.groupName ? (groupMap.get(entry.groupName) ?? null) : null,
				sortOrder: sortOrder++,
				createdAt: timestamp,
				updatedAt: timestamp,
			});
		}

		// Encrypt + write each row. The Dexie creating-hook stamps
		// __fieldMeta automatically; spaceId is pre-populated here so
		// the hook leaves it alone.
		await db.transaction('rw', db.table('globalTags'), db.table('tagGroups'), async () => {
			for (const group of groupsToWrite) {
				await encryptRecord('tagGroups', group);
				await db.table('tagGroups').add(group);
			}
			for (const tag of tagsToWrite) {
				await encryptRecord('globalTags', tag);
				await db.table('globalTags').add(tag);
			}
		});

		return tagsToWrite.length;
	},

	/**
	 * Copy every tag + tagGroup from `sourceSpaceId` into
	 * `targetSpaceId` with fresh ids. Used by the "copy tags from my
	 * current Space" convenience in SpaceCreateDialog so solo-Space
	 * users don't have to build a named preset before they can inherit
	 * their personal taxonomy.
	 */
	async copyTagsBetweenSpaces(sourceSpaceId: string, targetSpaceId: string): Promise<number> {
		const [rawTags, rawGroups] = await Promise.all([
			db.table<LocalTagShape>('globalTags').toArray(),
			db.table<LocalTagGroupShape>('tagGroups').toArray(),
		]);

		const sourceTags = rawTags.filter(
			(t) => t.spaceId === sourceSpaceId && !(t as unknown as { deletedAt?: string }).deletedAt
		);
		const sourceGroups = rawGroups.filter(
			(g) => g.spaceId === sourceSpaceId && !(g as unknown as { deletedAt?: string }).deletedAt
		);

		if (sourceTags.length === 0 && sourceGroups.length === 0) return 0;

		const decryptedTags = await decryptRecords<LocalTagShape>('globalTags', sourceTags);
		const decryptedGroups = await decryptRecords<LocalTagGroupShape>('tagGroups', sourceGroups);

		const userId = getEffectiveUserId();
		const timestamp = now();

		const groupIdMap = new Map<string, string>();
		const groupsToWrite: LocalTagGroupShape[] = decryptedGroups.map((g) => {
			const newId = crypto.randomUUID();
			groupIdMap.set(g.id, newId);
			return {
				id: newId,
				spaceId: targetSpaceId,
				userId,
				name: g.name,
				color: g.color,
				icon: g.icon ?? null,
				sortOrder: g.sortOrder,
				createdAt: timestamp,
				updatedAt: timestamp,
			};
		});

		const tagsToWrite: LocalTagShape[] = decryptedTags.map((t) => ({
			id: crypto.randomUUID(),
			spaceId: targetSpaceId,
			userId,
			name: t.name,
			color: t.color,
			icon: t.icon ?? null,
			groupId: t.groupId ? (groupIdMap.get(t.groupId) ?? null) : null,
			sortOrder: t.sortOrder,
			createdAt: timestamp,
			updatedAt: timestamp,
		}));

		await db.transaction('rw', db.table('globalTags'), db.table('tagGroups'), async () => {
			for (const group of groupsToWrite) {
				await encryptRecord('tagGroups', group);
				await db.table('tagGroups').add(group);
			}
			for (const tag of tagsToWrite) {
				await encryptRecord('globalTags', tag);
				await db.table('globalTags').add(tag);
			}
		});

		return tagsToWrite.length;
	},
};
