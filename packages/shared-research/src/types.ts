import { z } from 'zod';
import type { BillingMode, ProviderCategory, ProviderId } from './ids';

export interface ProviderMeta {
	provider: ProviderId;
	category: ProviderCategory;
	latencyMs: number;
	costCredits: number;
	cacheHit: boolean;
	billingMode: BillingMode;
	errorCode?: string;
}

export interface SearchHit {
	url: string;
	title: string;
	snippet: string;
	publishedAt?: string;
	author?: string;
	score?: number;
	content?: string;
	providerRaw?: unknown;
}

export interface ExtractedContent {
	url: string;
	title: string;
	content: string;
	excerpt?: string;
	author?: string;
	siteName?: string;
	publishedAt?: string;
	wordCount: number;
	providerRaw?: unknown;
}

export interface Citation {
	url: string;
	title: string;
	snippet?: string;
}

export interface AgentAnswer {
	query: string;
	answer: string;
	citations: Citation[];
	followUpQueries?: string[];
	tokenUsage?: { input: number; output: number };
	providerRaw?: unknown;
}

export interface SearchResponse {
	results: SearchHit[];
	meta: ProviderMeta;
}

export interface ExtractResponse {
	content: ExtractedContent;
	meta: ProviderMeta;
}

export interface AgentResponse {
	answer: AgentAnswer;
	meta: ProviderMeta;
}

export interface CompareResponse<T> {
	runId: string;
	query: string;
	results: Array<{
		provider: ProviderId;
		success: boolean;
		data?: T;
		meta: ProviderMeta;
	}>;
}

export const searchHitSchema = z.object({
	url: z.string().url(),
	title: z.string(),
	snippet: z.string(),
	publishedAt: z.string().optional(),
	author: z.string().optional(),
	score: z.number().optional(),
	content: z.string().optional(),
	providerRaw: z.unknown().optional(),
});

export const citationSchema = z.object({
	url: z.string().url(),
	title: z.string(),
	snippet: z.string().optional(),
});
