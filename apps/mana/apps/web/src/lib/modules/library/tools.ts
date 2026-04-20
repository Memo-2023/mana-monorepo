/**
 * Library tools — AI-accessible CRUD over the encrypted library table.
 *
 * Propose:
 *   - create_library_entry         — new book/movie/series/comic
 *   - update_library_entry_status  — planned → active → completed …
 *   - rate_library_entry           — 1-5 stars
 *
 * Auto:
 *   - list_library_entries         — filtered by kind + status
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { libraryEntriesStore } from './stores/entries.svelte';
import { db } from '$lib/data/database';
import { decryptRecords, VaultLockedError } from '$lib/data/crypto';
import { toLibraryEntry } from './queries';
import type { LocalLibraryEntry, LibraryKind, LibraryStatus } from './types';

const KINDS = ['book', 'movie', 'series', 'comic'] as const;
const STATUSES = ['planned', 'active', 'completed', 'paused', 'dropped'] as const;

function splitList(raw: unknown): string[] | undefined {
	if (typeof raw !== 'string') return undefined;
	const parts = raw
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	return parts.length > 0 ? parts : undefined;
}

function nowIso(): string {
	return new Date().toISOString();
}

export const libraryTools: ModuleTool[] = [
	{
		name: 'create_library_entry',
		module: 'library',
		description: 'Erstellt einen neuen Bibliotheks-Eintrag',
		parameters: [
			{ name: 'kind', type: 'string', description: 'Art', required: true },
			{ name: 'title', type: 'string', description: 'Titel', required: true },
			{ name: 'creators', type: 'string', description: 'Autor/Regie, CSV', required: false },
			{ name: 'year', type: 'number', description: 'Jahr', required: false },
			{ name: 'status', type: 'string', description: 'Status', required: false },
			{ name: 'rating', type: 'number', description: 'Bewertung 1-5', required: false },
			{ name: 'tags', type: 'string', description: 'Tags CSV', required: false },
			{ name: 'genres', type: 'string', description: 'Genres CSV', required: false },
		],
		async execute(params) {
			const kind = params.kind as LibraryKind;
			if (!KINDS.includes(kind)) {
				return { success: false, message: `Unbekannte Art: ${kind}` };
			}
			const status = (params.status as LibraryStatus | undefined) ?? 'planned';
			if (!STATUSES.includes(status)) {
				return { success: false, message: `Unbekannter Status: ${status}` };
			}

			const title = String(params.title ?? '').trim();
			if (!title) return { success: false, message: 'title darf nicht leer sein' };

			const ratingNum = typeof params.rating === 'number' ? params.rating : null;
			if (ratingNum !== null && (ratingNum < 1 || ratingNum > 5)) {
				return { success: false, message: 'rating muss zwischen 1 und 5 liegen' };
			}

			const entry = await libraryEntriesStore.createEntry({
				kind,
				title,
				creators: splitList(params.creators),
				year: typeof params.year === 'number' ? params.year : null,
				status,
				rating: ratingNum,
				tags: splitList(params.tags),
				genres: splitList(params.genres),
			});

			return {
				success: true,
				data: { entryId: entry.id, kind: entry.kind, title: entry.title },
				message: `${entry.kind} "${entry.title}" angelegt`,
			};
		},
	},
	{
		name: 'update_library_entry_status',
		module: 'library',
		description:
			'Aendert den Status eines Eintrags. Setzt bei active / completed automatisch die passenden Zeitstempel.',
		parameters: [
			{ name: 'entryId', type: 'string', description: 'ID des Eintrags', required: true },
			{ name: 'status', type: 'string', description: 'Neuer Status', required: true },
		],
		async execute(params) {
			const entryId = String(params.entryId ?? '');
			const status = params.status as LibraryStatus;
			if (!STATUSES.includes(status)) {
				return { success: false, message: `Unbekannter Status: ${status}` };
			}

			const existing = await db.table<LocalLibraryEntry>('libraryEntries').get(entryId);
			if (!existing || existing.deletedAt) {
				return { success: false, message: `Eintrag ${entryId} nicht gefunden` };
			}

			const patch: Partial<LocalLibraryEntry> = { status };
			if (status === 'active' && !existing.startedAt) patch.startedAt = nowIso();
			if (status === 'completed' && !existing.completedAt) patch.completedAt = nowIso();

			await libraryEntriesStore.updateEntry(entryId, patch);
			return {
				success: true,
				data: { entryId, status },
				message: `Status auf "${status}" gesetzt`,
			};
		},
	},
	{
		name: 'rate_library_entry',
		module: 'library',
		description: 'Setzt die Bewertung (1-5) eines Eintrags',
		parameters: [
			{ name: 'entryId', type: 'string', description: 'ID des Eintrags', required: true },
			{ name: 'rating', type: 'number', description: 'Bewertung 1-5', required: true },
		],
		async execute(params) {
			const entryId = String(params.entryId ?? '');
			const rating = params.rating as number;
			if (typeof rating !== 'number' || rating < 1 || rating > 5) {
				return { success: false, message: 'rating muss zwischen 1 und 5 liegen' };
			}

			await libraryEntriesStore.rate(entryId, rating);
			return {
				success: true,
				data: { entryId, rating },
				message: `Bewertung ${rating}/5 gesetzt`,
			};
		},
	},
	{
		name: 'list_library_entries',
		module: 'library',
		description:
			'Listet Bibliotheks-Eintraege (id, kind, title, status, rating). Filterbar nach kind und status.',
		parameters: [
			{ name: 'kind', type: 'string', description: 'Nur eine Art', required: false },
			{ name: 'status', type: 'string', description: 'Nur einen Status', required: false },
			{ name: 'limit', type: 'number', description: 'Max (Standard 30)', required: false },
		],
		async execute(params) {
			const kindFilter = params.kind as LibraryKind | undefined;
			const statusFilter = params.status as LibraryStatus | undefined;
			const limit = Math.min(Math.max(Number(params.limit) || 30, 1), 100);

			try {
				const all = await db.table<LocalLibraryEntry>('libraryEntries').toArray();
				const visible = all.filter((e) => !e.deletedAt);
				const decrypted = await decryptRecords('libraryEntries', visible);
				const rows = decrypted
					.map(toLibraryEntry)
					.filter((e) => (kindFilter ? e.kind === kindFilter : true))
					.filter((e) => (statusFilter ? e.status === statusFilter : true))
					.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
					.slice(0, limit)
					.map((e) => ({
						id: e.id,
						kind: e.kind,
						title: e.title,
						status: e.status,
						rating: e.rating,
						year: e.year,
					}));

				return {
					success: true,
					data: { entries: rows, total: rows.length },
					message: `${rows.length} Eintrag(e) gelistet`,
				};
			} catch (err) {
				if (err instanceof VaultLockedError) {
					return {
						success: false,
						message: 'Vault ist gesperrt — Bibliothek kann nicht entschlüsselt werden',
					};
				}
				throw err;
			}
		},
	},
];
