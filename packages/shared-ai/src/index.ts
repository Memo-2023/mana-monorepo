/**
 * @mana/shared-ai
 *
 * AI Workbench code that both the webapp (SvelteKit/Vite) and the
 * server-side mana-ai service (Bun) import. Keep this package free of
 * runtime imports from storage layers (Dexie, Postgres) — the types +
 * pure functions here must work in both environments.
 */

export type {
	Actor,
	ActorKind,
	BaseActor,
	UserActor,
	AiActor,
	SystemActor,
	SystemSource,
} from './actor';
export {
	SYSTEM_PROJECTION,
	SYSTEM_RULE,
	SYSTEM_MIGRATION,
	SYSTEM_STREAM,
	SYSTEM_MISSION_RUNNER,
	LEGACY_USER_PRINCIPAL,
	LEGACY_AI_PRINCIPAL,
	LEGACY_SYSTEM_PRINCIPAL,
	LEGACY_DISPLAY_NAME,
	USER_ACTOR,
	makeUserActor,
	makeAgentActor,
	makeSystemActor,
	normalizeActor,
	isUserActor,
	isAiActor,
	isSystemActor,
	isFromMissionRunner,
} from './actor';

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
	type AiPolicy,
	type PolicyDecision,
} from './policy';

export type {
	Agent,
	AgentState,
	AgentTemplate,
	AgentTemplateAgentPart,
	AgentTemplateScenePart,
	AgentTemplateSceneApp,
	AgentTemplateMissionPart,
	WorkbenchTemplate,
	WorkbenchTemplateAgentPart,
	WorkbenchTemplateScenePart,
	WorkbenchTemplateSceneApp,
	WorkbenchTemplateMissionPart,
	WorkbenchTemplateSeedItem,
	WorkbenchTemplateCategory,
} from './agents';
export { DEFAULT_AGENT_ID, DEFAULT_AGENT_NAME, ALL_TEMPLATES, getTemplateById } from './agents';
