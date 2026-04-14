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
import type { InputResolver } from './input-resolvers';

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

let registered = false;

/** Register the default resolvers once. Idempotent. */
export function registerDefaultInputResolvers(): void {
	if (registered) return;
	registerInputResolver('notes', notesResolver);
	registerInputResolver('kontext', kontextResolver);
	registerInputResolver('goals', goalsResolver);
	registered = true;
}
