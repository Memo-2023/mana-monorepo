/**
 * Notes tools — AI-accessible read + write over the encrypted notes table.
 *
 * The three write tools (`update_note`, `append_to_note`, `add_tag_to_note`)
 * are proposable: every edit to an existing note goes through the proposal
 * inbox first. `create_note` is also proposable via the shared-ai list.
 *
 * The read tool (`list_notes`) runs auto — safely lists decrypted note
 * metadata so the planner can decide which note to tag or edit.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { deriveUpdatedAt } from '$lib/data/sync';
import { notesStore } from './stores/notes.svelte';
import { noteTagOps } from './stores/tags.svelte';
import { db } from '$lib/data/database';
import { decryptRecords, VaultLockedError } from '$lib/data/crypto';
import { filterByScope } from '$lib/data/ai/scope-context';
import type { LocalNote } from './types';

const MAX_LIST_LIMIT = 100;
const DEFAULT_LIST_LIMIT = 30;

function excerptOf(content: string, max = 140): string {
	const flat = content.replace(/\s+/g, ' ').trim();
	return flat.length <= max ? flat : flat.slice(0, max - 1) + '…';
}

/** Read + decrypt a single note. Throws a descriptive error when the
 *  vault is locked instead of returning null (which callers can't
 *  distinguish from "note doesn't exist"). */
async function readLocalNote(id: string): Promise<LocalNote | null> {
	const local = await db.table<LocalNote>('notes').get(id);
	if (!local || local.deletedAt) return null;
	try {
		const [decrypted] = await decryptRecords('notes', [local]);
		return decrypted ?? null;
	} catch (err) {
		if (err instanceof VaultLockedError) {
			throw new Error(
				`Vault ist gesperrt — Notiz ${id} kann nicht entschlüsselt werden. Bitte Vault entsperren.`
			);
		}
		throw err;
	}
}

export const notesTools: ModuleTool[] = [
	{
		name: 'create_note',
		module: 'notes',
		description: 'Erstellt eine neue Notiz',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel', required: false },
			{ name: 'content', type: 'string', description: 'Inhalt', required: true },
		],
		async execute(params) {
			const note = await notesStore.createNote({
				title: params.title as string | undefined,
				content: params.content as string,
			});
			return {
				success: true,
				data: note,
				message: `Notiz "${note.title || 'Unbenannt'}" erstellt`,
			};
		},
	},
	{
		name: 'list_notes',
		module: 'notes',
		description:
			'Listet vorhandene Notizen (id, title, excerpt) damit du sie referenzieren kannst. Standardmäßig ohne archivierte.',
		parameters: [
			{
				name: 'limit',
				type: 'number',
				description: `Maximale Anzahl (Standard ${DEFAULT_LIST_LIMIT}, max ${MAX_LIST_LIMIT})`,
				required: false,
			},
			{
				name: 'query',
				type: 'string',
				description: 'Case-insensitive Substring-Filter auf Titel oder Inhalt',
				required: false,
			},
			{
				name: 'includeArchived',
				type: 'boolean',
				description: 'Auch archivierte Notizen einbeziehen (default false)',
				required: false,
			},
		],
		async execute(params) {
			const limit = Math.min(
				Math.max(Number(params.limit) || DEFAULT_LIST_LIMIT, 1),
				MAX_LIST_LIMIT
			);
			const query = typeof params.query === 'string' ? params.query.toLowerCase().trim() : '';
			const includeArchived = Boolean(params.includeArchived);

			const all = await db.table<LocalNote>('notes').toArray();
			const visible = all.filter((n) => !n.deletedAt && (includeArchived || !n.isArchived));
			const decrypted = await decryptRecords('notes', visible);

			// Agent scope filter: only return notes tagged with the agent's
			// scope tags (or untagged notes, which are globally visible).
			const scoped = await filterByScope(decrypted, async (n) => noteTagOps.getTagIds(n.id));

			const rows = scoped
				.filter((n) => {
					if (!query) return true;
					return (
						(n.title ?? '').toLowerCase().includes(query) ||
						(n.content ?? '').toLowerCase().includes(query)
					);
				})
				.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
				.slice(0, limit)
				.map((n) => ({
					id: n.id,
					title: n.title || '(ohne Titel)',
					excerpt: excerptOf(n.content ?? ''),
					isPinned: n.isPinned,
					isArchived: n.isArchived,
					updatedAt: deriveUpdatedAt(n),
				}));

			return {
				success: true,
				data: { notes: rows, total: rows.length },
				message: `${rows.length} Notiz(en) gelistet`,
			};
		},
	},
	{
		name: 'update_note',
		module: 'notes',
		description:
			'Überschreibt Titel und/oder Inhalt einer bestehenden Notiz. Destruktiv — bevorzuge append_to_note oder add_tag_to_note wenn du nur ergänzen willst.',
		parameters: [
			{ name: 'noteId', type: 'string', description: 'ID der Notiz', required: true },
			{ name: 'title', type: 'string', description: 'Neuer Titel', required: false },
			{
				name: 'content',
				type: 'string',
				description: 'Neuer Inhalt (überschreibt vollständig)',
				required: false,
			},
		],
		async execute(params) {
			const noteId = params.noteId as string;
			const diff: { title?: string; content?: string } = {};
			if (typeof params.title === 'string') diff.title = params.title;
			if (typeof params.content === 'string') diff.content = params.content;
			if (diff.title === undefined && diff.content === undefined) {
				return { success: false, message: 'Kein Feld zum Aktualisieren angegeben' };
			}

			const existing = await readLocalNote(noteId);
			if (!existing) return { success: false, message: `Notiz ${noteId} nicht gefunden` };

			await notesStore.updateNote(noteId, diff);
			return {
				success: true,
				data: { noteId },
				message: `Notiz "${existing.title || 'Unbenannt'}" aktualisiert`,
			};
		},
	},
	{
		name: 'append_to_note',
		module: 'notes',
		description:
			'Hängt Text ans Ende des Inhalts einer bestehenden Notiz an (neue Zeile getrennt). Nicht-destruktiv.',
		parameters: [
			{ name: 'noteId', type: 'string', description: 'ID der Notiz', required: true },
			{ name: 'content', type: 'string', description: 'Text zum Anhängen', required: true },
		],
		async execute(params) {
			const noteId = params.noteId as string;
			const addition = String(params.content ?? '').trim();
			if (!addition) return { success: false, message: 'content darf nicht leer sein' };

			const existing = await readLocalNote(noteId);
			if (!existing) return { success: false, message: `Notiz ${noteId} nicht gefunden` };

			const separator = existing.content && !existing.content.endsWith('\n') ? '\n' : '';
			const nextContent = `${existing.content ?? ''}${separator}${addition}`;

			await notesStore.updateNote(noteId, { content: nextContent });
			return {
				success: true,
				data: { noteId, addedChars: addition.length },
				message: `"${existing.title || 'Notiz'}" um ${addition.length} Zeichen erweitert`,
			};
		},
	},
	{
		name: 'add_tag_to_note',
		module: 'notes',
		description:
			'Fügt einen Hashtag (z.B. "#Natur") an eine bestehende Notiz an. Idempotent — wenn der Tag schon vorhanden ist, passiert nichts. Genau richtig um Notizen thematisch zu kategorisieren.',
		parameters: [
			{ name: 'noteId', type: 'string', description: 'ID der Notiz', required: true },
			{
				name: 'tag',
				type: 'string',
				description:
					'Tag-Name (ohne #; z.B. "Natur", "Arbeit"). Leerzeichen werden durch _ ersetzt.',
				required: true,
			},
		],
		async execute(params) {
			const noteId = params.noteId as string;
			const rawTag = String(params.tag ?? '')
				.replace(/^#+/, '')
				.trim();
			if (!rawTag) return { success: false, message: 'tag darf nicht leer sein' };

			const normalized = rawTag.replace(/\s+/g, '_');
			const tagToken = `#${normalized}`;
			const existing = await readLocalNote(noteId);
			if (!existing) return { success: false, message: `Notiz ${noteId} nicht gefunden` };

			const content = existing.content ?? '';
			// Case-insensitive idempotency so #Natur + #natur deduplicate.
			const escaped = tagToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const tagRegex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
			if (tagRegex.test(content)) {
				return {
					success: true,
					data: { noteId, already: true },
					message: `Tag ${tagToken} war schon vorhanden.`,
				};
			}

			const separator = content && !content.endsWith('\n') ? '\n\n' : '';
			const nextContent = `${content}${separator}${tagToken}`;

			await notesStore.updateNote(noteId, { content: nextContent });
			return {
				success: true,
				data: { noteId, tag: tagToken },
				message: `${tagToken} zu "${existing.title || 'Notiz'}" hinzugefügt`,
			};
		},
	},
];
