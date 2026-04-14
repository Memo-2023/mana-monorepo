/**
 * Input-index registry — "what can the user link to a Mission?"
 *
 * Pairs with `input-resolvers.ts`. The resolver turns a
 * {@link MissionInputRef} into text content the Planner can prompt on;
 * this index lists the *available* records the user picks from in the
 * Missions UI. Separate registry so modules stay decoupled from the AI
 * subsystem — each module can register its own candidate list.
 */

import type { MissionInputRef } from './types';

export interface InputCandidate extends MissionInputRef {
	/** Human label for the picker UI. */
	label: string;
	/** Optional secondary text (e.g. "last edited 2d ago"). */
	hint?: string;
}

export type InputIndexer = () => Promise<InputCandidate[]>;

const indexers = new Map<string, InputIndexer>();

/** Register (or replace) the indexer for a module. */
export function registerInputIndexer(moduleName: string, indexer: InputIndexer): void {
	indexers.set(moduleName, indexer);
}

export function unregisterInputIndexer(moduleName: string): void {
	indexers.delete(moduleName);
}

/** Names of all modules that have registered an indexer. */
export function listIndexedModules(): string[] {
	return [...indexers.keys()].sort();
}

/** Fetch candidates for a single module. Empty array when nothing's registered. */
export async function getInputCandidates(moduleName: string): Promise<InputCandidate[]> {
	const indexer = indexers.get(moduleName);
	if (!indexer) return [];
	try {
		return await indexer();
	} catch (err) {
		console.error(`[MissionInputPicker] indexer for ${moduleName} threw:`, err);
		return [];
	}
}
