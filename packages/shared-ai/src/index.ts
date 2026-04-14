/**
 * @mana/shared-ai
 *
 * AI Workbench code that both the webapp (SvelteKit/Vite) and the
 * server-side mana-ai service (Bun) import. Keep this package free of
 * runtime imports from storage layers (Dexie, Postgres) — the types +
 * pure functions here must work in both environments.
 */

export type { Actor } from './actor';
export { USER_ACTOR, isAiActor, isSystemActor } from './actor';

export type {
	Mission,
	MissionCadence,
	MissionInputRef,
	MissionIteration,
	MissionState,
	PlanStep,
} from './missions';

export type {
	AiPlanInput,
	AiPlanOutput,
	AvailableTool,
	ParseResult,
	PlannedStep,
	PlannerMessages,
	ResolvedInput,
} from './planner';
export { buildPlannerPrompt, parsePlannerResponse } from './planner';
