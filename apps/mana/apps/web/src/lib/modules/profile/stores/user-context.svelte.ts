/**
 * User Context Store — structured profile + freeform markdown.
 *
 * All encrypted fields are encrypted before write, decrypted on read.
 * The interview progress field is NOT encrypted (structural metadata only).
 *
 * Singleton bootstrap (F4 of docs/plans/sync-field-meta-overhaul.md):
 * the per-user `userContext` row is created server-side by mana-auth at
 * `/register` time AND reconciled on every boot via
 * `POST /api/v1/me/bootstrap-singletons` (Punkt 3 follow-up). The first
 * sync pull lands the row before the UI ever tries to read it.
 *
 * The internal `getOrCreateLocalDoc()` helper below stays as a fallback
 * for the narrow race window between "endpoint provisioned the row in
 * mana_sync" and "first pull landed the row in IndexedDB". Without it,
 * a write that lands inside that window would hit `update(SINGLETON_ID,
 * diff)` against a missing key — a Dexie no-op that silently swallows
 * the user's edit. Killing the fallback was on the post-overhaul audit
 * list (Punkt 4) but kept here because the silent-loss failure mode is
 * worse than the cosmetic "client also writes the bootstrap row".
 *
 * The fallback insert is wrapped in `runAsAsync(makeSystemActor(
 * SYSTEM_BOOTSTRAP))` so the Dexie hook stamps `origin: 'system'`
 * (mirroring the server bootstrap), not `origin: 'user'`. When the
 * server's pull arrives later both rows carry the same origin and the
 * conflict-gate stays quiet. The user's subsequent writes stamp
 * `origin: 'user'` for the changed fields as usual.
 */

import { userContextTable } from '../collections';
import { encryptRecord, decryptRecords } from '$lib/data/crypto';
import { makeSystemActor, SYSTEM_BOOTSTRAP } from '@mana/shared-ai';
import { runAsAsync } from '$lib/data/events/actor';
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

const BOOTSTRAP_ACTOR = makeSystemActor(SYSTEM_BOOTSTRAP);

/** Race-window fallback: write a fresh empty doc if neither the server
 *  bootstrap (F4 + Punkt 3 endpoint) nor any prior session has landed
 *  the singleton yet. The insert is stamped `origin: 'system'` so the
 *  server's eventual bootstrap pull won't fight with it. */
async function getOrCreateLocalDoc(): Promise<void> {
	const existing = await userContextTable.get(USER_CONTEXT_SINGLETON_ID);
	if (existing) return;
	const doc = emptyUserContext() as LocalUserContext;
	await encryptRecord('userContext', doc);
	await runAsAsync(BOOTSTRAP_ACTOR, async () => {
		await userContextTable.add(doc);
	});
}

async function readDecrypted(): Promise<LocalUserContext> {
	await getOrCreateLocalDoc();
	const local = (await userContextTable.get(USER_CONTEXT_SINGLETON_ID))!;
	const [decrypted] = await decryptRecords('userContext', [local]);
	return decrypted;
}

export const userContextStore = {
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
		await getOrCreateLocalDoc();
		const current = await readDecrypted();
		const merged = { ...current[section], ...value };
		const diff: Partial<LocalUserContext> = {
			[section]: merged,
		};
		await encryptRecord('userContext', diff);
		await userContextTable.update(USER_CONTEXT_SINGLETON_ID, diff);
	},

	/** Set a single field within a section.
	 *  When `merge` is true and the value is an array, new items are added
	 *  to the existing array instead of replacing it (deduped). */
	async setField(path: string, value: unknown, merge = false): Promise<void> {
		await getOrCreateLocalDoc();
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
			diff = { [section]: sectionObj };
		} else {
			// Top-level field: e.g. 'interests', 'goals'
			diff = {
				[section]: finalValue,
			} as Partial<LocalUserContext>;
		}

		await encryptRecord('userContext', diff);
		await userContextTable.update(USER_CONTEXT_SINGLETON_ID, diff);
	},

	/** Replace the interests array. */
	async setInterests(interests: string[]): Promise<void> {
		await getOrCreateLocalDoc();
		const diff: Partial<LocalUserContext> = {
			interests,
		};
		await encryptRecord('userContext', diff);
		await userContextTable.update(USER_CONTEXT_SINGLETON_ID, diff);
	},

	/** Replace the goals array. */
	async setGoals(goals: string[]): Promise<void> {
		await getOrCreateLocalDoc();
		const diff: Partial<LocalUserContext> = {
			goals,
		};
		await encryptRecord('userContext', diff);
		await userContextTable.update(USER_CONTEXT_SINGLETON_ID, diff);
	},

	/** Set freeform markdown content. */
	async setFreeform(content: string): Promise<void> {
		await getOrCreateLocalDoc();
		const diff: Partial<LocalUserContext> = {
			freeform: content,
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
		await getOrCreateLocalDoc();
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
		});
	},

	/** Mark a question as skipped. */
	async markSkipped(questionId: string): Promise<void> {
		await getOrCreateLocalDoc();
		const current = await readDecrypted();
		const interview = { ...current.interview };
		if (!interview.skippedIds.includes(questionId)) {
			interview.skippedIds = [...interview.skippedIds, questionId];
		}
		interview.lastSessionAt = new Date().toISOString();
		await userContextTable.update(USER_CONTEXT_SINGLETON_ID, {
			interview,
		});
	},
};
