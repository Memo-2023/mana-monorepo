/**
 * Default input resolvers.
 *
 * Registered from `setup.ts` so the production MissionRunner can load
 * notes / kontext / goals without every module having to know about the
 * AI subsystem. Modules that need special projection logic register their
 * own resolver on init and override these defaults.
 */

import { db } from '../../database';
import { decryptRecords } from '../../crypto';
import { registerInputResolver } from './input-resolvers';
import { registerInputIndexer } from './input-index';
import type { InputResolver } from './input-resolvers';
import type { InputCandidate, InputIndexer } from './input-index';

interface NoteLike {
	id: string;
	title?: string;
	content?: string;
	deletedAt?: string;
}

const notesResolver: InputResolver = async (ref) => {
	const local = await db.table<NoteLike>(ref.table).get(ref.id);
	if (!local || local.deletedAt) return null;
	const [decrypted] = await decryptRecords(ref.table, [local]);
	return {
		id: ref.id,
		module: ref.module,
		table: ref.table,
		title: decrypted.title,
		content: decrypted.content ?? '',
	};
};

interface KontextDocLike {
	id: string;
	content?: string;
}

const kontextResolver: InputResolver = async (ref) => {
	const doc = await db.table<KontextDocLike>('kontextDoc').get(ref.id);
	if (!doc) return null;
	const [decrypted] = await decryptRecords('kontextDoc', [doc]);
	return {
		id: ref.id,
		module: ref.module,
		table: ref.table,
		title: 'Kontext',
		content: decrypted.content ?? '',
	};
};

interface GoalLike {
	id: string;
	title?: string;
	currentValue?: number;
	target?: { value: number };
	period?: string;
	deletedAt?: string;
}

const goalsResolver: InputResolver = async (ref) => {
	const goal = await db.table<GoalLike>(ref.table).get(ref.id);
	if (!goal || goal.deletedAt) return null;
	const current = goal.currentValue ?? 0;
	const target = goal.target?.value ?? '?';
	return {
		id: ref.id,
		module: ref.module,
		table: ref.table,
		title: goal.title ?? 'Goal',
		content: `Fortschritt: ${current} / ${target} (${goal.period ?? 'unbekannt'})`,
	};
};

// ── Indexers: list candidates for the picker UI ────────────

const notesIndexer: InputIndexer = async () => {
	const all = await db.table<NoteLike>('notes').toArray();
	const visible = all.filter((n) => !n.deletedAt);
	const decrypted = await decryptRecords('notes', visible);
	return decrypted
		.map<InputCandidate>((n) => ({
			module: 'notes',
			table: 'notes',
			id: n.id,
			label: (n.title && n.title.trim()) || '(ohne Titel)',
			hint: n.content ? `${n.content.slice(0, 60).replace(/\s+/g, ' ')}…` : undefined,
		}))
		.slice(0, 200); // cap — Mission picker isn't meant to list thousands
};

const kontextIndexer: InputIndexer = async () => {
	const doc = await db.table<KontextDocLike>('kontextDoc').get('singleton');
	if (!doc) return [];
	return [
		{
			module: 'kontext',
			table: 'kontextDoc',
			id: 'singleton',
			label: 'Kontext-Dokument',
			hint: 'Dein zentrales Markdown-Dokument',
		},
	];
};

const goalsIndexer: InputIndexer = async () => {
	const all = await db.table<GoalLike>('companionGoals').toArray();
	const visible = all.filter((g) => !g.deletedAt);
	return visible.map<InputCandidate>((g) => ({
		module: 'goals',
		table: 'companionGoals',
		id: g.id,
		label: g.title ?? 'Goal',
		hint: `${g.currentValue ?? 0} / ${g.target?.value ?? '?'} (${g.period ?? '—'})`,
	}));
};

let registered = false;

/** Register the default resolvers + indexers once. Idempotent. */
export function registerDefaultInputResolvers(): void {
	if (registered) return;
	registerInputResolver('notes', notesResolver);
	registerInputResolver('kontext', kontextResolver);
	registerInputResolver('goals', goalsResolver);
	registerInputIndexer('notes', notesIndexer);
	registerInputIndexer('kontext', kontextIndexer);
	registerInputIndexer('goals', goalsIndexer);
	registered = true;
}
