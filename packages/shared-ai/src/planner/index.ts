export { buildPlannerPrompt } from './prompt';
export type { PlannerMessages } from './prompt';
export { parsePlannerResponse } from './parser';
export type { ParseResult } from './parser';
export type { AiPlanInput, AiPlanOutput, AvailableTool, PlannedStep, ResolvedInput } from './types';

// New function-calling pipeline (replaces the text-JSON planner above
// in Commits 5/6). Additive for now so the old and new callers can
// coexist within the atomic PR.
export { buildSystemPrompt } from './system-prompt';
export type { SystemPromptInput, SystemPromptOutput } from './system-prompt';
export { runPlannerLoop } from './loop';
export type {
	ChatMessage,
	ChatRole,
	ExecutedCall,
	LlmClient,
	LlmCompletionRequest,
	LlmCompletionResponse,
	LlmFinishReason,
	LoopStopReason,
	PlannerLoopInput,
	PlannerLoopResult,
	ToolCallRequest,
	ToolResult,
} from './loop';
