/**
 * User Context Store — structured profile + freeform markdown.
 *
 * All encrypted fields are encrypted before write, decrypted on read.
 * The interview progress field is NOT encrypted (structural metadata only).
 */

import { userContextTable } from '../collections';
import { encryptRecord, decryptRecords } from '$lib/data/crypto';
import {
	USER_CONTEXT_SINGLETON_ID,
	emptyUserContext,
	type LocalUserContext,
	type UserContextAbout,
	type UserContextRoutine,
	type UserContextNutrition,
	type UserContextLeisure,
	type UserContextSocial,
} from '../types';

async function ensureDoc(): Promise<void> {
	const existing = await userContextTable.get(USER_CONTEXT_SINGLETON_ID);
	if (existing) return;
	const doc = emptyUserContext() as LocalUserContext;
	await encryptRecord('userContext', doc);
	await userContextTable.add(doc);
}

async function readDecrypted(): Promise<LocalUserContext> {
	await ensureDoc();
	const local = (await userContextTable.get(USER_CONTEXT_SINGLETON_ID))!;
	const [decrypted] = await decryptRecords('userContext', [local]);
	return decrypted;
}

export const userContextStore = {
	ensureDoc,

	/** Replace a full section (about, routine, nutrition, leisure, social). */
	async updateSection<K extends 'about' | 'routine' | 'nutrition' | 'leisure' | 'social'>(
		section: K,
		value: K extends 'about'
			? UserContextAbout
			: K extends 'routine'
				? UserContextRoutine
				: K extends 'nutrition'
					? UserContextNutrition
					: K extends 'leisure'
						? UserContextLeisure
						: UserContextSocial
	): Promise<void> {
		await ensureDoc();
		const current = await readDecrypted();
		const merged = { ...current[section], ...value };
		const diff: Partial<LocalUserContext> = {
			[section]: merged,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('userContext', diff);
		await userContextTable.update(USER_CONTEXT_SINGLETON_ID, diff);
	},

	/** Set a single field within a section.
	 *  When `merge` is true and the value is an array, new items are added
	 *  to the existing array instead of replacing it (deduped). */
	async setField(path: string, value: unknown, merge = false): Promise<void> {
		await ensureDoc();
		const current = await readDecrypted();
		const [section, field] = path.split('.') as [keyof LocalUserContext, string];

		let finalValue = value;
		if (merge && Array.isArray(value)) {
			// Merge arrays: get existing value, dedupe
			let existing: unknown[];
			if (field && typeof current[section] === 'object' && !Array.isArray(current[section])) {
				existing = ((current[section] as Record<string, unknown>)[field] as unknown[]) ?? [];
			} else {
				existing = (current[section] as unknown[]) ?? [];
			}
			if (Array.isArray(existing)) {
				const set = new Set([...existing, ...value]);
				finalValue = [...set];
			}
		}

		let diff: Partial<LocalUserContext>;

		if (field && typeof current[section] === 'object' && !Array.isArray(current[section])) {
			// Nested field: e.g. 'about.occupation'
			const sectionObj = { ...(current[section] as Record<string, unknown>) };
			sectionObj[field] = finalValue;
			diff = { [section]: sectionObj, updatedAt: new Date().toISOString() };
		} else {
			// Top-level field: e.g. 'interests', 'goals'
			diff = {
				[section]: finalValue,
				updatedAt: new Date().toISOString(),
			} as Partial<LocalUserContext>;
		}

		await encryptRecord('userContext', diff);
		await userContextTable.update(USER_CONTEXT_SINGLETON_ID, diff);
	},

	/** Replace the interests array. */
	async setInterests(interests: string[]): Promise<void> {
		await ensureDoc();
		const diff: Partial<LocalUserContext> = {
			interests,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('userContext', diff);
		await userContextTable.update(USER_CONTEXT_SINGLETON_ID, diff);
	},

	/** Replace the goals array. */
	async setGoals(goals: string[]): Promise<void> {
		await ensureDoc();
		const diff: Partial<LocalUserContext> = {
			goals,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('userContext', diff);
		await userContextTable.update(USER_CONTEXT_SINGLETON_ID, diff);
	},

	/** Set freeform markdown content. */
	async setFreeform(content: string): Promise<void> {
		await ensureDoc();
		const diff: Partial<LocalUserContext> = {
			freeform: content,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('userContext', diff);
		await userContextTable.update(USER_CONTEXT_SINGLETON_ID, diff);
	},

	/** Append text to freeform with a separator. */
	async appendFreeform(chunk: string): Promise<void> {
		const current = await readDecrypted();
		const existing = current.freeform?.trim() ?? '';
		const separator = existing ? '\n\n---\n\n' : '';
		await this.setFreeform(`${existing}${separator}${chunk}`);
	},

	/** Mark a question as answered in the interview progress. */
	async markAnswered(questionId: string): Promise<void> {
		await ensureDoc();
		const current = await readDecrypted();
		const interview = { ...current.interview };
		if (!interview.answeredIds.includes(questionId)) {
			interview.answeredIds = [...interview.answeredIds, questionId];
		}
		interview.skippedIds = interview.skippedIds.filter((id) => id !== questionId);
		interview.lastSessionAt = new Date().toISOString();
		// interview is not encrypted — update directly
		await userContextTable.update(USER_CONTEXT_SINGLETON_ID, {
			interview,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Mark a question as skipped. */
	async markSkipped(questionId: string): Promise<void> {
		await ensureDoc();
		const current = await readDecrypted();
		const interview = { ...current.interview };
		if (!interview.skippedIds.includes(questionId)) {
			interview.skippedIds = [...interview.skippedIds, questionId];
		}
		interview.lastSessionAt = new Date().toISOString();
		await userContextTable.update(USER_CONTEXT_SINGLETON_ID, {
			interview,
			updatedAt: new Date().toISOString(),
		});
	},
};
