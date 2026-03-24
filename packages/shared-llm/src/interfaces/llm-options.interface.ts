import type { ModuleMetadata, Type } from '@nestjs/common';
import type { MetricsCallback } from '../utils/metrics';

export interface LlmModuleOptions {
	/** mana-llm service URL (default: http://localhost:3025) */
	manaLlmUrl?: string;
	/** Default text model (default: ollama/gemma3:4b) */
	defaultModel?: string;
	/** Default vision model (default: ollama/llava:7b) */
	defaultVisionModel?: string;
	/** Request timeout in ms (default: 120000) */
	timeout?: number;
	/** Max retries on transient failures (default: 2) */
	maxRetries?: number;
	/** Enable debug logging (default: false) */
	debug?: boolean;
	/** Optional callback invoked after every LLM request with metrics */
	onMetrics?: MetricsCallback;
}

export interface LlmModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	useExisting?: Type<LlmOptionsFactory>;
	useClass?: Type<LlmOptionsFactory>;
	useFactory?: (...args: any[]) => Promise<LlmModuleOptions> | LlmModuleOptions;
	inject?: any[];
}

export interface LlmOptionsFactory {
	createLlmOptions(): Promise<LlmModuleOptions> | LlmModuleOptions;
}

export interface ResolvedLlmOptions {
	manaLlmUrl: string;
	defaultModel: string;
	defaultVisionModel: string;
	timeout: number;
	maxRetries: number;
	debug: boolean;
	onMetrics?: MetricsCallback;
}

export function resolveOptions(options: LlmModuleOptions): ResolvedLlmOptions {
	return {
		manaLlmUrl: options.manaLlmUrl ?? 'http://localhost:3025',
		defaultModel: options.defaultModel ?? 'ollama/gemma3:4b',
		defaultVisionModel: options.defaultVisionModel ?? 'ollama/llava:7b',
		timeout: options.timeout ?? 120_000,
		maxRetries: options.maxRetries ?? 2,
		debug: options.debug ?? false,
		onMetrics: options.onMetrics,
	};
}
