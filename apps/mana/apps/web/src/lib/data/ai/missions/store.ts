/**
 * Mission store — CRUD + lifecycle operations.
 *
 * Missions go through the unified Dexie write path, which means the Dexie
 * hooks stamp `userId`, `__lastActor`, `__fieldTimestamps`, `__fieldActors`
 * and track the row into `_pendingChanges`. Callers never touch those
 * fields directly.
 *
 * Iterations are intentionally stored inline (`Mission.iterations`) rather
 * than in a child table. They are append-only, each Mission stays small
 * (tens of iterations at most), and keeping them together lets the Planner
 * load the full history with a single `get(id)` — which it does every run.
 */

import { db } from '../../database';
import { nextRunForCadence } from './cadence';
import type {
	Mission,
	MissionCadence,
	MissionInputRef,
	MissionIteration,
	MissionState,
	PlanStep,
} from './types';
import { MISSIONS_TABLE } from './types';

const table = () => db.table<Mission>(MISSIONS_TABLE);

// ── Create ─────────────────────────────────────────────────

export interface CreateMissionInput {
	title: string;
	conceptMarkdown: string;
	objective: string;
	inputs?: MissionInputRef[];
	cadence: MissionCadence;
}

export async function createMission(input: CreateMissionInput): Promise<Mission> {
	const now = new Date().toISOString();
	const mission: Mission = {
		id: crypto.randomUUID(),
		createdAt: now,
		updatedAt: now,
		title: input.title,
		conceptMarkdown: input.conceptMarkdown,
		objective: input.objective,
		inputs: input.inputs ?? [],
		cadence: input.cadence,
		state: 'active',
		nextRunAt: nextRunForCadence(input.cadence, new Date()),
		iterations: [],
	};
	await table().add(mission);
	return mission;
}

// ── Read ───────────────────────────────────────────────────

export async function getMission(id: string): Promise<Mission | undefined> {
	return table().get(id);
}

export interface ListMissionsFilter {
	state?: MissionState;
	/** Only Missions whose `nextRunAt` has passed — used by the Runner. */
	dueBefore?: string;
}

export async function listMissions(filter: ListMissionsFilter = {}): Promise<Mission[]> {
	let coll = table().orderBy('createdAt').reverse();
	if (filter.state) coll = coll.filter((m) => m.state === filter.state);
	if (filter.dueBefore) {
		const cutoff = filter.dueBefore;
		coll = coll.filter(
			(m) => m.state === 'active' && typeof m.nextRunAt === 'string' && m.nextRunAt <= cutoff
		);
	}
	const all = await coll.toArray();
	return all.filter((m) => !m.deletedAt);
}

// ── Update ─────────────────────────────────────────────────

export interface MissionPatch {
	title?: string;
	conceptMarkdown?: string;
	objective?: string;
	inputs?: MissionInputRef[];
	cadence?: MissionCadence;
}

export async function updateMission(id: string, patch: MissionPatch): Promise<void> {
	const mods: Partial<Mission> = {
		...patch,
		updatedAt: new Date().toISOString(),
	};
	if (patch.cadence) {
		mods.nextRunAt = nextRunForCadence(patch.cadence, new Date());
	}
	await table().update(id, mods);
}

// ── Lifecycle ──────────────────────────────────────────────

export async function pauseMission(id: string): Promise<void> {
	await table().update(id, { state: 'paused', updatedAt: new Date().toISOString() });
}

export async function resumeMission(id: string): Promise<void> {
	const mission = await getMission(id);
	if (!mission) throw new Error(`Mission not found: ${id}`);
	await table().update(id, {
		state: 'active',
		nextRunAt: nextRunForCadence(mission.cadence, new Date()),
		updatedAt: new Date().toISOString(),
	});
}

export async function completeMission(id: string): Promise<void> {
	await table().update(id, {
		state: 'done',
		nextRunAt: undefined,
		updatedAt: new Date().toISOString(),
	});
}

export async function archiveMission(id: string): Promise<void> {
	await table().update(id, { state: 'archived', updatedAt: new Date().toISOString() });
}

export async function deleteMission(id: string): Promise<void> {
	await table().update(id, { deletedAt: new Date().toISOString() });
}

// ── Iterations ─────────────────────────────────────────────

export interface StartIterationInput {
	plan: PlanStep[];
}

/** Begin a new iteration — appends it with status `running`. */
export async function startIteration(
	missionId: string,
	input: StartIterationInput
): Promise<MissionIteration> {
	const mission = await getMission(missionId);
	if (!mission) throw new Error(`Mission not found: ${missionId}`);
	const iteration: MissionIteration = {
		id: crypto.randomUUID(),
		startedAt: new Date().toISOString(),
		plan: input.plan,
		overallStatus: 'running',
	};
	await table().update(missionId, {
		iterations: [...mission.iterations, iteration],
		updatedAt: new Date().toISOString(),
	});
	return iteration;
}

export interface FinishIterationInput {
	summary?: string;
	overallStatus: MissionIteration['overallStatus'];
	/** Replace the plan with the post-run state (steps with proposal ids / final statuses). */
	plan?: PlanStep[];
}

export async function finishIteration(
	missionId: string,
	iterationId: string,
	input: FinishIterationInput
): Promise<void> {
	const mission = await getMission(missionId);
	if (!mission) throw new Error(`Mission not found: ${missionId}`);

	const updatedIterations = mission.iterations.map((it) =>
		it.id === iterationId
			? {
					...it,
					finishedAt: new Date().toISOString(),
					overallStatus: input.overallStatus,
					...(input.summary !== undefined ? { summary: input.summary } : {}),
					...(input.plan !== undefined ? { plan: input.plan } : {}),
				}
			: it
	);
	await table().update(missionId, {
		iterations: updatedIterations,
		// Advance nextRunAt now that this iteration is done
		nextRunAt: nextRunForCadence(mission.cadence, new Date()),
		updatedAt: new Date().toISOString(),
	});
}

/** Attach free-text user feedback to the most recent iteration. */
export async function addIterationFeedback(
	missionId: string,
	iterationId: string,
	userFeedback: string
): Promise<void> {
	const mission = await getMission(missionId);
	if (!mission) throw new Error(`Mission not found: ${missionId}`);
	const updatedIterations = mission.iterations.map((it) =>
		it.id === iterationId ? { ...it, userFeedback } : it
	);
	await table().update(missionId, {
		iterations: updatedIterations,
		updatedAt: new Date().toISOString(),
	});
}
