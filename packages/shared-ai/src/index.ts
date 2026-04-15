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
	IterationPhase,
	Mission,
	MissionCadence,
	MissionInputRef,
	MissionIteration,
	MissionState,
	PlanStep,
	GrantDerivation,
	GrantDerivationVersion,
	MissionGrant,
} from './missions';
export {
	GRANT_DERIVATION_VERSION,
	canonicalInfoString,
	deriveMissionDataKey,
	deriveMissionDataKeyRaw,
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

export {
	AI_PROPOSABLE_TOOL_NAMES,
	AI_PROPOSABLE_TOOL_SET,
	type AiProposableToolName,
} from './policy';
