// Module
export { LlmModule } from './llm.module';
export { LlmClientService } from './llm-client.service';
export { LLM_MODULE_OPTIONS } from './llm.constants';

// Core client (for advanced use cases)
export { LlmClient } from './llm-client';

// Interfaces
export type {
	LlmModuleOptions,
	LlmModuleAsyncOptions,
	LlmOptionsFactory,
	ResolvedLlmOptions,
} from './interfaces';
export { resolveOptions } from './interfaces';

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
