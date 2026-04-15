/**
 * Goals resolver — reads `companionGoals` rows (plaintext, not encrypted)
 * and formats them as Planner context.
 *
 * Mirrors the webapp's default `goalsResolver` shape so prompts look the
 * same regardless of which runtime resolved the input. Keep the string
 * format stable; the Planner learns to rely on the layout.
 */

import { replayRecord } from './record-replay';
import type { ServerInputResolver } from './types';

interface GoalRecord {
	id: string;
	title?: string;
	currentValue?: number;
	target?: { value?: number };
	period?: string;
	deletedAt?: string;
}

export const goalsResolver: ServerInputResolver = async (sql, ref, userId, _context) => {
	const record = (await replayRecord(
		sql,
		userId,
		'companion',
		ref.table,
		ref.id
	)) as GoalRecord | null;
	if (!record) return null;

	const current = record.currentValue ?? 0;
	const target = record.target?.value ?? '?';
	const period = record.period ?? 'unbekannt';
	return {
		id: ref.id,
		module: ref.module,
		table: ref.table,
		title: record.title ?? 'Goal',
		content: `Fortschritt: ${current} / ${target} (${period})`,
	};
};
