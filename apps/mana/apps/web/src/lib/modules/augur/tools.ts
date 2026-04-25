/**
 * Augur tools — AI-accessible CRUD + Living-Oracle consultation.
 *
 * Propose:
 *   - capture_sign     — create a new omen / fortune / hunch
 *   - resolve_sign     — mark an open sign as fulfilled / partly / not-fulfilled
 *
 * Auto:
 *   - list_open_signs   — what's still waiting on resolution
 *   - consult_oracle    — the Living Oracle (deterministic, cold-start gated)
 *   - augur_year_recap  — structured year-in-review snapshot
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { augurStore } from './stores/entries.svelte';
import { db } from '$lib/data/database';
import { decryptRecords, VaultLockedError } from '$lib/data/crypto';
import { toAugurEntry } from './queries';
import {
	findMatches,
	fingerprint,
	makeReflection,
	shouldSpeak,
	LIVING_ORACLE_COLD_START_MIN,
	LIVING_ORACLE_MIN_MATCHES,
} from './lib/living-oracle';
import { buildYearRecap } from './lib/year-recap';
import type {
	AugurKind,
	AugurOutcome,
	AugurSourceCategory,
	AugurVibe,
	LocalAugurEntry,
} from './types';

const KINDS: readonly AugurKind[] = ['omen', 'fortune', 'hunch'];
const VIBES: readonly AugurVibe[] = ['good', 'bad', 'mysterious'];
const SOURCE_CATEGORIES: readonly AugurSourceCategory[] = [
	'gut',
	'tarot',
	'horoscope',
	'fortune-cookie',
	'iching',
	'dream',
	'person',
	'media',
	'natural',
	'other',
];
const RESOLVE_OUTCOMES: readonly Exclude<AugurOutcome, 'open'>[] = [
	'fulfilled',
	'partly',
	'not-fulfilled',
];

function splitList(raw: unknown): string[] | undefined {
	if (typeof raw !== 'string') return undefined;
	const parts = raw
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	return parts.length > 0 ? parts : undefined;
}

async function loadAllEntries() {
	const all = await db.table<LocalAugurEntry>('augurEntries').toArray();
	const visible = all.filter((e) => !e.deletedAt);
	const decrypted = await decryptRecords('augurEntries', visible);
	return decrypted.map(toAugurEntry);
}

export const augurTools: ModuleTool[] = [
	{
		name: 'capture_sign',
		module: 'augur',
		description: 'Erfasst ein Zeichen (Omen, Wahrsagung oder Bauchgefuehl)',
		parameters: [
			{ name: 'kind', type: 'string', description: 'Art', required: true },
			{ name: 'source', type: 'string', description: 'Quelle', required: true },
			{ name: 'claim', type: 'string', description: 'Aussage', required: true },
			{ name: 'sourceCategory', type: 'string', description: 'Quellenkategorie', required: false },
			{ name: 'vibe', type: 'string', description: 'Stimmung', required: false },
			{ name: 'feltMeaning', type: 'string', description: 'Eigene Deutung', required: false },
			{
				name: 'expectedOutcome',
				type: 'string',
				description: 'Konkrete Prognose',
				required: false,
			},
			{ name: 'expectedBy', type: 'string', description: 'Bis wann (YYYY-MM-DD)', required: false },
			{ name: 'probability', type: 'number', description: '0..1', required: false },
			{ name: 'tags', type: 'string', description: 'Tags CSV', required: false },
		],
		async execute(params) {
			const kind = params.kind as AugurKind;
			if (!KINDS.includes(kind)) return { success: false, message: `Unbekannte Art: ${kind}` };

			const source = String(params.source ?? '').trim();
			if (!source) return { success: false, message: 'source darf nicht leer sein' };

			const claim = String(params.claim ?? '').trim();
			if (!claim) return { success: false, message: 'claim darf nicht leer sein' };

			const vibe = (params.vibe as AugurVibe | undefined) ?? 'mysterious';
			if (!VIBES.includes(vibe)) return { success: false, message: `Unbekannte Stimmung: ${vibe}` };

			const sourceCategory = (params.sourceCategory as AugurSourceCategory | undefined) ?? 'other';
			if (!SOURCE_CATEGORIES.includes(sourceCategory)) {
				return { success: false, message: `Unbekannte Quellenkategorie: ${sourceCategory}` };
			}

			const probability = typeof params.probability === 'number' ? params.probability : null;
			if (probability !== null && (probability < 0 || probability > 1)) {
				return { success: false, message: 'probability muss zwischen 0 und 1 liegen' };
			}

			const entry = await augurStore.createEntry({
				kind,
				source,
				sourceCategory,
				claim,
				vibe,
				feltMeaning: typeof params.feltMeaning === 'string' ? params.feltMeaning : null,
				expectedOutcome: typeof params.expectedOutcome === 'string' ? params.expectedOutcome : null,
				expectedBy: typeof params.expectedBy === 'string' ? params.expectedBy : null,
				probability,
				tags: splitList(params.tags),
			});

			return {
				success: true,
				data: { entryId: entry.id, kind: entry.kind, source: entry.source },
				message: `${entry.kind} erfasst: "${entry.source}"`,
			};
		},
	},
	{
		name: 'resolve_sign',
		module: 'augur',
		description: 'Loest ein offenes Zeichen auf',
		parameters: [
			{ name: 'entryId', type: 'string', description: 'ID', required: true },
			{ name: 'outcome', type: 'string', description: 'Ergebnis', required: true },
			{ name: 'note', type: 'string', description: 'Optionale Notiz', required: false },
		],
		async execute(params) {
			const entryId = String(params.entryId ?? '');
			const outcome = params.outcome as AugurOutcome;
			if (!RESOLVE_OUTCOMES.includes(outcome as Exclude<AugurOutcome, 'open'>)) {
				return { success: false, message: `Unbekanntes Ergebnis: ${outcome}` };
			}
			const existing = await db.table<LocalAugurEntry>('augurEntries').get(entryId);
			if (!existing || existing.deletedAt) {
				return { success: false, message: `Eintrag ${entryId} nicht gefunden` };
			}
			await augurStore.resolveEntry(
				entryId,
				outcome,
				typeof params.note === 'string' ? params.note : null
			);
			return {
				success: true,
				data: { entryId, outcome },
				message: `Zeichen aufgeloest: ${outcome}`,
			};
		},
	},
	{
		name: 'list_open_signs',
		module: 'augur',
		description: 'Listet noch offene Zeichen',
		parameters: [
			{ name: 'kind', type: 'string', description: 'Filter nach Art', required: false },
			{ name: 'limit', type: 'number', description: 'Max (Standard 30)', required: false },
		],
		async execute(params) {
			const kindFilter = params.kind as AugurKind | undefined;
			if (kindFilter !== undefined && !KINDS.includes(kindFilter)) {
				return { success: false, message: `Unbekannte Art: ${kindFilter}` };
			}
			const limit = Math.min(Math.max(Number(params.limit) || 30, 1), 100);
			try {
				const entries = await loadAllEntries();
				const rows = entries
					.filter((e) => !e.isArchived && e.outcome === 'open')
					.filter((e) => (kindFilter ? e.kind === kindFilter : true))
					.sort((a, b) =>
						(a.expectedBy ?? a.encounteredAt).localeCompare(b.expectedBy ?? b.encounteredAt)
					)
					.slice(0, limit)
					.map((e) => ({
						id: e.id,
						kind: e.kind,
						source: e.source,
						claim: e.claim,
						vibe: e.vibe,
						encounteredAt: e.encounteredAt,
						expectedBy: e.expectedBy,
					}));
				return {
					success: true,
					data: { entries: rows, total: rows.length },
					message: `${rows.length} offene(s) Zeichen`,
				};
			} catch (err) {
				if (err instanceof VaultLockedError) {
					return {
						success: false,
						message: 'Vault ist gesperrt — Augur kann nicht entschluesselt werden',
					};
				}
				throw err;
			}
		},
	},
	{
		name: 'consult_oracle',
		module: 'augur',
		description: 'Befragt das Living Oracle',
		parameters: [
			{ name: 'kind', type: 'string', description: 'Art', required: true },
			{ name: 'sourceCategory', type: 'string', description: 'Kategorie', required: true },
			{ name: 'vibe', type: 'string', description: 'Stimmung', required: true },
			{ name: 'source', type: 'string', description: 'Quellen-Stichwort', required: false },
			{ name: 'claim', type: 'string', description: 'Aussage', required: false },
			{ name: 'tags', type: 'string', description: 'Tags CSV', required: false },
		],
		async execute(params) {
			const kind = params.kind as AugurKind;
			if (!KINDS.includes(kind)) return { success: false, message: `Unbekannte Art: ${kind}` };
			const sourceCategory = params.sourceCategory as AugurSourceCategory;
			if (!SOURCE_CATEGORIES.includes(sourceCategory)) {
				return { success: false, message: `Unbekannte Quellenkategorie: ${sourceCategory}` };
			}
			const vibe = params.vibe as AugurVibe;
			if (!VIBES.includes(vibe)) return { success: false, message: `Unbekannte Stimmung: ${vibe}` };

			try {
				const history = await loadAllEntries();
				const fp = fingerprint({
					kind,
					sourceCategory,
					vibe,
					tags: splitList(params.tags),
					source: typeof params.source === 'string' ? params.source : null,
					claim: typeof params.claim === 'string' ? params.claim : null,
				});
				if (!fp) return { success: false, message: 'Fingerprint konnte nicht gebildet werden' };

				const set = findMatches(fp, history);
				const speaks = shouldSpeak(history.length, set);
				const reflection = speaks ? makeReflection(set) : null;

				return {
					success: true,
					data: {
						speaks,
						reflection,
						matches: set.n,
						hitRate: set.hitRate,
						breakdown: {
							fulfilled: set.fulfilled,
							partly: set.partly,
							notFulfilled: set.notFulfilled,
						},
						thresholds: {
							coldStart: LIVING_ORACLE_COLD_START_MIN,
							minMatches: LIVING_ORACLE_MIN_MATCHES,
							historyTotal: history.length,
						},
					},
					message: reflection ?? 'Orakel schweigt — noch zu wenig aehnliche Daten.',
				};
			} catch (err) {
				if (err instanceof VaultLockedError) {
					return { success: false, message: 'Vault ist gesperrt' };
				}
				throw err;
			}
		},
	},
	{
		name: 'augur_year_recap',
		module: 'augur',
		description: 'Strukturierter Jahresrueckblick',
		parameters: [
			{
				name: 'year',
				type: 'number',
				description: 'YYYY (default: aktuelles Jahr)',
				required: false,
			},
		],
		async execute(params) {
			const year = Number(params.year) || new Date().getFullYear();
			try {
				const entries = await loadAllEntries();
				const recap = buildYearRecap(entries, year);
				return {
					success: true,
					data: recap,
					message: `Jahresrueckblick ${year}: ${recap.total} Zeichen, ${recap.resolved} aufgeloest`,
				};
			} catch (err) {
				if (err instanceof VaultLockedError) {
					return { success: false, message: 'Vault ist gesperrt' };
				}
				throw err;
			}
		},
	},
];
