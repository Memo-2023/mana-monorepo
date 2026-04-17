/**
 * Research Lab — DTOs matching mana-research service responses.
 * Kept intentionally narrow: we only model what the UI consumes.
 */

export type ResearchCategory = 'search' | 'extract' | 'agent';

export type BillingMode = 'server-key' | 'byo-key' | 'free' | 'mixed';

export interface ProviderMeta {
	provider: string;
	category: ResearchCategory;
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
}

export type CompareEntry<T> = {
	provider: string;
	success: boolean;
	data?: T;
	meta: ProviderMeta;
};

export interface SearchCompareResponse {
	runId: string;
	query: string;
	results: CompareEntry<{ results: SearchHit[] }>[];
}

export interface ExtractCompareResponse {
	runId: string;
	url: string;
	results: CompareEntry<{ content: ExtractedContent }>[];
}

export interface ResearchCompareResponse {
	runId: string;
	query: string;
	results: CompareEntry<{ answer: AgentAnswer }>[];
}

export interface ProviderInfo {
	id: string;
	category: ResearchCategory;
	requiresApiKey: boolean;
	capabilities: Record<string, boolean>;
	pricing?: { search?: number; extract?: number; research?: number };
}

export interface ProvidersCatalog {
	search: ProviderInfo[];
	extract: ProviderInfo[];
	agent: ProviderInfo[];
}

export interface ProviderHealthEntry {
	id: string;
	category: ResearchCategory;
	requiresApiKey: boolean;
	serverKeyAvailable: boolean;
	status: 'ready' | 'free' | 'needs-key';
}

export interface ProvidersHealth {
	providers: ProviderHealthEntry[];
	summary: { ready: number; total: number };
}

export interface RunSummary {
	id: string;
	userId: string | null;
	query: string;
	queryType: string | null;
	mode: 'single' | 'compare' | 'auto';
	category: ResearchCategory;
	providersRequested: string[];
	billingMode: BillingMode;
	totalCostCredits: number;
	createdAt: string;
}
