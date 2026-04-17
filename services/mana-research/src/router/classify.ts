/**
 * Query classifier — maps a free-text query to a QueryType.
 *
 * Hybrid strategy:
 *   1. Regex fast-path (no network, ~0ms) catches the obvious cases
 *      (URLs, "paper"/"arxiv", "news"/"latest", "github"/"code", etc.)
 *   2. Optional mana-llm fallback for ambiguous queries. Off by default
 *      — callers opt-in via `useLlm: true` when latency is OK.
 */

import type { ManaLlmClient } from '../clients/mana-llm';

export type QueryType = 'news' | 'general' | 'semantic' | 'academic' | 'code' | 'conversational';

export interface ClassifyOptions {
	useLlm?: boolean;
	signal?: AbortSignal;
	llm?: ManaLlmClient;
}

const NEWS_PATTERNS = [
	/\b(latest|recent|news|heute|aktuell|today|yesterday|breaking|gerade|neueste|this week)\b/i,
];

const ACADEMIC_PATTERNS = [
	/\b(paper|arxiv|research|study|studie|journal|doi|citation|pubmed|nature|science)\b/i,
];

const CODE_PATTERNS = [
	/\b(github|code|function|library|framework|npm package|pip install|error:|exception:|stack trace)\b/i,
	/[a-z_]+\([^)]*\)/i,
];

const CONVERSATIONAL_PATTERNS = [
	/^(how|why|what|when|where|who|can you|could you|should i|is there|erklär|explain|zusammenfass)/i,
	/\?\s*$/,
];

const SEMANTIC_PATTERNS = [
	/\b(similar to|like this|related to|ähnlich|vergleichbar|find sites like)\b/i,
	/^https?:\/\//,
];

export function classifyRegex(query: string): { type: QueryType; confidence: number } {
	const q = query.trim();

	for (const p of SEMANTIC_PATTERNS) if (p.test(q)) return { type: 'semantic', confidence: 0.9 };
	for (const p of ACADEMIC_PATTERNS) if (p.test(q)) return { type: 'academic', confidence: 0.8 };
	for (const p of CODE_PATTERNS) if (p.test(q)) return { type: 'code', confidence: 0.8 };
	for (const p of NEWS_PATTERNS) if (p.test(q)) return { type: 'news', confidence: 0.7 };
	for (const p of CONVERSATIONAL_PATTERNS)
		if (p.test(q)) return { type: 'conversational', confidence: 0.6 };

	return { type: 'general', confidence: 0.4 };
}

const LLM_PROMPT = `You are a query classifier. Given a user search query, respond with exactly one word from this list: news, general, semantic, academic, code, conversational.

Guidelines:
- news: current events, latest updates, breaking stories
- academic: research papers, scientific literature, DOIs, arXiv
- code: programming questions, libraries, errors, GitHub
- semantic: "find similar to", URL-based, related-to queries
- conversational: open-ended questions, "how does X work"
- general: anything else

Respond with just the label, no punctuation.`;

export async function classify(
	query: string,
	opts: ClassifyOptions = {}
): Promise<{ type: QueryType; confidence: number; source: 'regex' | 'llm' }> {
	const regex = classifyRegex(query);

	if (!opts.useLlm || !opts.llm || regex.confidence >= 0.8) {
		return { ...regex, source: 'regex' };
	}

	try {
		const { content } = await opts.llm.chat(
			[
				{ role: 'system', content: LLM_PROMPT },
				{ role: 'user', content: query },
			],
			{ maxTokens: 10, temperature: 0, signal: opts.signal }
		);
		const raw = content
			.trim()
			.toLowerCase()
			.replace(/[^a-z]/g, '');
		const valid: QueryType[] = [
			'news',
			'general',
			'semantic',
			'academic',
			'code',
			'conversational',
		];
		if ((valid as string[]).includes(raw)) {
			return { type: raw as QueryType, confidence: 0.9, source: 'llm' };
		}
	} catch {
		/* fall through */
	}

	return { ...regex, source: 'regex' };
}
