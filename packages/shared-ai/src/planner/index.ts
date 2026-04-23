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
export { runPlannerLoop, LOOP_STATE_RECENT_CALLS_WINDOW, PARALLEL_TOOL_BATCH_SIZE } from './loop';
export {
	COMPACT_SYSTEM_PROMPT,
	DEFAULT_COMPACT_KEEP_RECENT,
	DEFAULT_COMPACT_MODEL,
	DEFAULT_COMPACT_THRESHOLD,
	compactHistory,
	parseCompactSummary,
	renderCompactSummary,
	shouldCompact,
} from './compact';
export type { CompactHistoryOptions, CompactHistoryResult, CompactSummary } from './compact';
export { MAX_SUB_AGENT_DEPTH, SubAgentRecursionError, runSubAgent } from './sub-agent';
export type { RunSubAgentInput, SubAgentResult, SubAgentType } from './sub-agent';
export { MockLlmClient } from './mock-llm';
export type { MockLlmTurn } from './mock-llm';
export type {
	ChatMessage,
	ChatRole,
	ExecutedCall,
	LlmClient,
	LlmCompletionRequest,
	LlmCompletionResponse,
	LlmFinishReason,
	LoopState,
	LoopStopReason,
	PlannerLoopInput,
	PlannerLoopResult,
	ReminderChannel,
	TokenUsage,
	ToolCallRequest,
	ToolResult,
} from './loop';
