/**
 * Standalone exports for non-NestJS consumers (e.g. bot-services).
 *
 * Usage:
 *   import { LlmClient } from '@mana/shared-llm/standalone';
 *   const llm = new LlmClient({ manaLlmUrl: 'http://localhost:3025' });
 */

export { LlmClient } from './llm-client';
export { resolveOptions } from './interfaces/llm-options.interface';
export type { LlmModuleOptions, ResolvedLlmOptions } from './interfaces/llm-options.interface';

// Types
export type {
	ChatMessage,
	ContentPart,
	TextContentPart,
	ImageContentPart,
	ChatOptions,
	JsonOptions,
	VisionOptions,
	TokenUsage,
	ChatResult,
	JsonResult,
	ModelInfo,
	HealthStatus,
} from './types';

// Utilities
export { extractJson } from './utils';
