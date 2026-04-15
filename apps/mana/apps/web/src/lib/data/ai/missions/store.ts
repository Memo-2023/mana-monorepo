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

/**
 * Strip Svelte 5 `$state` Proxies (and any other non-cloneable wrapper)
 * by JSON-roundtripping. Mission payloads are plain JSON values
 * (strings/numbers/booleans/arrays/objects) so this is lossless and
 * faster than coordinating `$state.snapshot()` calls in every caller.
 *
 * `structuredClone` itself can't traverse Svelte's Proxy in browsers
 * — it throws DataCloneError on the wrapped array.
 */
function deepClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

const table = () => db.table<Mission>(MISSIONS_TABLE);

// ── Create ─────────────────────────────────────────────────

export interface CreateMissionInput {
	title: string;
	conceptMarkdown: string;
	objective: string;
	inputs?: MissionInputRef[];
	cadence: MissionCadence;
	/** Owning agent id. Optional — when omitted, the mission inherits
	 *  the legacy default agent via the bootstrap migration. Pass an id
	 *  explicitly from the create UI so new missions land on the right
	 *  agent from the first write. */
	agentId?: string;
}

export async function createMission(input: CreateMissionInput): Promise<Mission> {
	const now = new Date().toISOString();
	// `deepClone` strips Svelte 5 $state Proxies before the record
	// hits IndexedDB — without it, Dexie throws DataCloneError on the
	// proxied `inputs` array / `cadence` object that callers pass in
	// from `$state` bindings (e.g. the MissionInputPicker).
	const inputsPlain = deepClone(input.inputs ?? []);
	const cadencePlain = deepClone(input.cadence);
	const mission: Mission = {
		id: crypto.randomUUID(),
		createdAt: now,
		updatedAt: now,
		title: input.title,
		conceptMarkdown: input.conceptMarkdown,
		objective: input.objective,
		inputs: inputsPlain,
		cadence: cadencePlain,
		state: 'active',
		nextRunAt: nextRunForCadence(cadencePlain, new Date()),
		iterations: [],
		agentId: input.agentId,
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
	agentId?: string;
}

export async function updateMission(id: string, patch: MissionPatch): Promise<void> {
	// Same Proxy-stripping reason as createMission.
	const mods: Partial<Mission> = {
		...deepClone(patch),
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

// ── Key-Grant (server-side execution opt-in) ──────────────

/** Attach a freshly-minted grant to a mission so `mana-ai` can decrypt
 *  its encrypted inputs server-side. Overwrites any existing grant. The
 *  blob is produced by `grant-client.requestMissionGrant()` and must NOT
 *  be constructed client-side — only mana-auth knows the wrap key. */
export async function setMissionGrant(
	id: string,
	grant: import('@mana/shared-ai').MissionGrant
): Promise<void> {
	// deepClone strips Svelte Proxy wrappers the caller might have
	// attached — matches the pattern used in createMission / updateMission.
	await table().update(id, {
		grant: deepClone(grant),
		updatedAt: new Date().toISOString(),
	});
}

/** Revoke server-side execution. Leaves the mission otherwise intact —
 *  the foreground runner still works. Use when the user clicks the 🔒
 *  icon in the Workbench. */
export async function revokeMissionGrant(id: string): Promise<void> {
	await table().update(id, {
		grant: undefined,
		updatedAt: new Date().toISOString(),
	});
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
	const now = new Date().toISOString();
	const iteration: MissionIteration = {
		id: crypto.randomUUID(),
		startedAt: now,
		// Strip $state Proxies from the plan array so structured-clone
		// doesn't fail when Dexie serialises the row.
		plan: deepClone(input.plan),
		overallStatus: 'running',
		currentPhase: 'resolving-inputs',
		phaseStartedAt: now,
	};
	await table().update(missionId, {
		iterations: [...mission.iterations, iteration],
		updatedAt: now,
	});
	return iteration;
}

/**
 * Update the running iteration's sub-phase. Best-effort; failures swallowed
 * so a transient Dexie hiccup doesn't kill the run mid-flight.
 */
export async function setIterationPhase(
	missionId: string,
	iterationId: string,
	phase: import('@mana/shared-ai').IterationPhase,
	detail?: string
): Promise<void> {
	try {
		const mission = await getMission(missionId);
		if (!mission) return;
		const now = new Date().toISOString();
		const updated = mission.iterations.map((it) =>
			it.id === iterationId
				? {
						...it,
						currentPhase: phase,
						phaseStartedAt: now,
						phaseDetail: detail,
					}
				: it
		);
		await table().update(missionId, { iterations: updated, updatedAt: now });
	} catch (err) {
		console.warn('[mission-store] setIterationPhase failed:', err);
	}
}

/**
 * Mark an iteration for cancellation. The runner polls between phases
 * and exits early as `failed` with summary `'cancelled'`.
 */
export async function requestIterationCancel(
	missionId: string,
	iterationId: string
): Promise<void> {
	const mission = await getMission(missionId);
	if (!mission) return;
	const updated = mission.iterations.map((it) =>
		it.id === iterationId ? { ...it, cancelRequested: true } : it
	);
	await table().update(missionId, {
		iterations: updated,
		updatedAt: new Date().toISOString(),
	});
}

/**
 * True if the user has clicked Cancel on this still-running iteration.
 * The runner reads this after each await point.
 */
export async function isCancelRequested(missionId: string, iterationId: string): Promise<boolean> {
	const mission = await getMission(missionId);
	const it = mission?.iterations.find((x) => x.id === iterationId);
	return Boolean(it?.cancelRequested);
}

export interface FinishIterationInput {
	summary?: string;
	overallStatus: MissionIteration['overallStatus'];
	/** Replace the plan with the post-run state (steps with proposal ids / final statuses). */
	plan?: PlanStep[];
	/** Diagnostic detail for failed iterations — surfaced in the UI. */
	errorDetails?: MissionIteration['errorDetails'];
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
					// Clear in-flight phase markers — the iteration has finalised.
					currentPhase: undefined,
					phaseStartedAt: undefined,
					phaseDetail: undefined,
					cancelRequested: undefined,
					...(input.summary !== undefined ? { summary: input.summary } : {}),
					...(input.plan !== undefined ? { plan: deepClone(input.plan) } : {}),
					...(input.errorDetails !== undefined
						? { errorDetails: deepClone(input.errorDetails) }
						: {}),
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
