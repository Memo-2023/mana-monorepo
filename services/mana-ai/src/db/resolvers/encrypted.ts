/**
 * Encrypted-table resolver factory.
 *
 * One resolver per encrypted module (notes, tasks, events, journal,
 * kontext, …). The factory parametrises the module/table name, the
 * mini-formatter for the Planner's context string, and the set of
 * encrypted fields we try to expose post-decrypt.
 *
 * Flow per resolve:
 *   1. Check context has an MDK + allowlist (mission has a valid grant).
 *      Missing → return null; the tick loop already flagged the mission
 *      as grant-missing and the planner runs without this input.
 *   2. Check `${table}:${recordId}` is on the allowlist. Record not
 *      allowlisted → write `scope-violation` audit row, bump metric,
 *      return null. This is belt+braces: the scope-bound HKDF would
 *      have produced a different key anyway, so decrypt would fail
 *      cryptographically. But we catch it earlier with a clear signal.
 *   3. Replay the record with LWW. Record missing / deleted → null.
 *   4. Decrypt all `enc:1:`-prefixed fields in place with the MDK.
 *      Crypto failure → `failed` audit row, return null.
 *   5. Write `ok` audit row, format the Planner context, return.
 */

import type { MissionInputRef, ResolvedInput } from '@mana/shared-ai';
import { decryptRecordFields } from '../../crypto/decrypt-value';
import { writeDecryptAudit } from '../audit';
import { replayRecord } from './record-replay';
import type { ResolverContext, ServerInputResolver } from './types';
import { decryptsTotal, grantScopeViolationsTotal } from '../../metrics';

export interface EncryptedResolverConfig {
	/** Module name registered with the resolver registry. */
	readonly module: string;
	/** Dexie/app_id where the records live in `sync_changes` (usually
	 *  the same as `module`, but decoupled because some modules sync
	 *  under a different app id — e.g. `aiMissions` lives under `ai`). */
	readonly appId: string;
	/** Human label used in the Planner's context title. */
	readonly label: string;
	/** Extracts a short content string from the (decrypted) record for
	 *  the Planner. Typical impl: pluck `title`/`content`, truncate. */
	readonly formatContent: (record: Record<string, unknown>) => string;
	/** Extracts a title line for the Planner; falls back to the record id
	 *  if unset. */
	readonly formatTitle?: (record: Record<string, unknown>) => string;
}

export function createEncryptedResolver(cfg: EncryptedResolverConfig): ServerInputResolver {
	return async function encryptedResolver(sql, ref, userId, ctx) {
		if (!ctx.mdk || !ctx.allowlist) {
			// No grant → silently yield null. The Planner runs without
			// this input; the foreground runner picks up the slack when
			// the user next opens a tab. No audit row: no decrypt attempt.
			return null;
		}

		const scopeKey = `${ref.table}:${ref.id}`;
		if (!ctx.allowlist.has(scopeKey)) {
			grantScopeViolationsTotal.inc({ table: ref.table });
			await writeDecryptAudit(sql, userId, {
				missionId: ctx.missionId,
				tableName: ref.table,
				recordId: ref.id,
				status: 'scope-violation',
				reason: 'record-not-in-grant-allowlist',
			});
			return null;
		}

		const record = (await replayRecord(sql, userId, cfg.appId, ref.table, ref.id)) as Record<
			string,
			unknown
		> | null;
		if (!record) return null;

		try {
			const { decryptedFields } = await decryptRecordFields(record, ctx.mdk);
			if (decryptedFields.length > 0) {
				decryptsTotal.inc({ table: ref.table }, decryptedFields.length);
			}
		} catch (err) {
			await writeDecryptAudit(sql, userId, {
				missionId: ctx.missionId,
				tableName: ref.table,
				recordId: ref.id,
				status: 'failed',
				reason: errorReason(err),
			});
			return null;
		}

		await writeDecryptAudit(sql, userId, {
			missionId: ctx.missionId,
			tableName: ref.table,
			recordId: ref.id,
			status: 'ok',
		});

		return toResolvedInput(cfg, ref, record);
	};
}

function toResolvedInput(
	cfg: EncryptedResolverConfig,
	ref: MissionInputRef,
	record: Record<string, unknown>
): ResolvedInput {
	const title =
		(cfg.formatTitle ? cfg.formatTitle(record) : undefined) ||
		(typeof record.title === 'string' ? record.title : cfg.label);
	return {
		id: ref.id,
		module: ref.module,
		table: ref.table,
		title,
		content: cfg.formatContent(record),
	};
}

function errorReason(err: unknown): string {
	const msg = err instanceof Error ? err.message : String(err);
	if (msg.includes('malformed')) return 'ciphertext-malformed';
	// AES-GCM auth-tag failures surface as DOMException/OperationError.
	// Return a stable short string rather than the DOM message (which
	// varies across Bun versions).
	if (/OperationError|decrypt/i.test(msg)) return 'ciphertext-tampered-or-wrong-key';
	return 'decrypt-failed';
}

// ─── Built-in configs for the five encrypted modules ────────

/** Truncate long text content so the Planner prompt stays tight. */
function truncate(s: string, max = 500): string {
	if (s.length <= max) return s;
	return s.slice(0, max) + '…';
}

export const notesResolver = createEncryptedResolver({
	module: 'notes',
	appId: 'notes',
	label: 'Notiz',
	formatContent: (r) =>
		truncate(typeof r.content === 'string' ? r.content : JSON.stringify(r.content ?? '')),
});

export const tasksResolver = createEncryptedResolver({
	module: 'tasks',
	appId: 'todo',
	label: 'Task',
	formatContent: (r) => {
		const title = typeof r.title === 'string' ? r.title : '(ohne Titel)';
		const desc = typeof r.description === 'string' ? r.description : '';
		const status = typeof r.status === 'string' ? r.status : '';
		const due = typeof r.dueDate === 'string' ? r.dueDate : '';
		const parts = [status && `[${status}]`, title, desc && `— ${desc}`, due && `(faellig: ${due})`]
			.filter(Boolean)
			.join(' ');
		return truncate(parts);
	},
});

export const eventsResolver = createEncryptedResolver({
	module: 'calendar',
	appId: 'calendar',
	label: 'Termin',
	formatContent: (r) => {
		const title = typeof r.title === 'string' ? r.title : '(ohne Titel)';
		const start = typeof r.startDate === 'string' ? r.startDate : '';
		const location = typeof r.location === 'string' ? r.location : '';
		return truncate(
			[title, start && `@ ${start}`, location && `in ${location}`].filter(Boolean).join(' ')
		);
	},
});

export const journalResolver = createEncryptedResolver({
	module: 'journal',
	appId: 'journal',
	label: 'Journal-Eintrag',
	formatContent: (r) => truncate(typeof r.content === 'string' ? r.content : ''),
});

export const kontextResolver = createEncryptedResolver({
	module: 'kontext',
	appId: 'kontext',
	label: 'Kontext',
	formatTitle: () => 'Mana-Kontext',
	formatContent: (r) =>
		truncate(typeof r.content === 'string' ? r.content : JSON.stringify(r.content ?? ''), 1500),
});
