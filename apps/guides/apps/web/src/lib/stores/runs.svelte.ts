/**
 * Runs store — create, update, and complete guide runs.
 */

import { runCollection, type LocalRun, type StepState } from '$lib/data/local-store.js';

let error = $state<string | null>(null);

async function withErrorHandling<T>(fn: () => Promise<T>, msg: string): Promise<T | null> {
	try {
		return await fn();
	} catch (e) {
		error = msg;
		console.error(msg, e);
		return null;
	}
}

export const runsStore = {
	get error() {
		return error;
	},
	clearError() {
		error = null;
	},

	async startRun(guideId: string, mode: LocalRun['mode'] = 'scroll'): Promise<LocalRun | null> {
		return withErrorHandling(
			() =>
				runCollection.insert({
					id: crypto.randomUUID(),
					guideId,
					startedAt: new Date().toISOString(),
					mode,
					stepStates: {},
				}),
			'Run konnte nicht gestartet werden'
		);
	},

	async setStepState(runId: string, stepId: string, state: Partial<StepState>): Promise<void> {
		await withErrorHandling(async () => {
			const run = await runCollection.get(runId);
			if (!run) return;
			const existing = run.stepStates[stepId] ?? { done: false };
			const updated: Record<string, StepState> = {
				...run.stepStates,
				[stepId]: { ...existing, ...state },
			};
			await runCollection.update(runId, { stepStates: updated });
		}, 'Schritt-Status konnte nicht aktualisiert werden');
	},

	async completeRun(runId: string): Promise<void> {
		await withErrorHandling(
			() => runCollection.update(runId, { completedAt: new Date().toISOString() }),
			'Run konnte nicht abgeschlossen werden'
		);
	},

	async deleteRun(runId: string): Promise<void> {
		await withErrorHandling(
			() => runCollection.delete(runId),
			'Run konnte nicht gelöscht werden'
		);
	},

	/** Returns the most recent incomplete run for a guide, or null */
	async getActiveRun(guideId: string): Promise<LocalRun | null> {
		try {
			const runs = await runCollection.getAll({ guideId });
			return runs.find((r) => !r.completedAt) ?? null;
		} catch {
			return null;
		}
	},

	/** Count completed runs for a guide */
	async getRunCount(guideId: string): Promise<number> {
		try {
			const runs = await runCollection.getAll({ guideId });
			return runs.filter((r) => r.completedAt).length;
		} catch {
			return 0;
		}
	},
};
