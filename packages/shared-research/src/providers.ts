import type { SearchProviderId, ExtractProviderId, AgentProviderId } from './ids';
import type { AgentOptions, ExtractOptions, SearchOptions } from './options';
import type { AgentResponse, ExtractResponse, SearchResponse } from './types';

export interface ProviderCapabilities {
	webSearch?: boolean;
	newsSearch?: boolean;
	scholarSearch?: boolean;
	semanticSearch?: boolean;
	contentInResults?: boolean;
	jsRendering?: boolean;
	pdfSupport?: boolean;
	markdownOutput?: boolean;
	multiStep?: boolean;
	async?: boolean;
	withCitations?: boolean;
}

export interface ProviderCallContext {
	apiKey: string | null;
	userId?: string;
	signal?: AbortSignal;
}

export interface SearchProvider {
	id: SearchProviderId;
	capabilities: ProviderCapabilities;
	requiresApiKey: boolean;
	search(
		query: string,
		options: SearchOptions,
		ctx: ProviderCallContext
	): Promise<Omit<SearchResponse, 'meta'> & { rawLatencyMs: number }>;
}

export interface ExtractProvider {
	id: ExtractProviderId;
	capabilities: ProviderCapabilities;
	requiresApiKey: boolean;
	extract(
		url: string,
		options: ExtractOptions,
		ctx: ProviderCallContext
	): Promise<Omit<ExtractResponse, 'meta'> & { rawLatencyMs: number }>;
}

export interface ResearchAgent {
	id: AgentProviderId;
	capabilities: ProviderCapabilities;
	requiresApiKey: boolean;
	research(
		query: string,
		options: AgentOptions,
		ctx: ProviderCallContext
	): Promise<
		Omit<AgentResponse, 'meta'> & {
			rawLatencyMs: number;
			tokenUsage?: { input: number; output: number };
		}
	>;
}
