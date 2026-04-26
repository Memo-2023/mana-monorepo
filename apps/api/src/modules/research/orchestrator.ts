/**
 * Research orchestrator — three linear phases:
 *
 *   1. Plan        — mana-llm produces N sub-queries (JSON)
 *   2. Retrieve    — mana-search runs each sub-query in parallel,
 *                    deduplicates, optionally extracts full text
 *   3. Synthesise  — mana-llm streams a structured answer (summary,
 *                    key points, follow-ups) over the source corpus
 *
 * Each phase persists its progress to research_results/sources so a
 * caller can either await the whole thing (sync mode) or subscribe to
 * progress events (will land in routes.ts via a small in-process pubsub).
 *
 * Errors flip status='error' and surface errorMessage; they never throw
 * past runPipeline() so background invocations don't crash the worker.
 */

import { eq } from 'drizzle-orm';
import { db, researchResults, sources, type ResearchDepth } from './schema';
import { llmJson, llmStream, LlmError } from '../../lib/llm';
import { MANA_LLM } from '@mana/shared-ai';
import { webSearch, bulkExtract, type SearchHit, SearchError } from '../../lib/search';

// ─── Depth configuration ────────────────────────────────────
//
// `planModel` is always `STRUCTURED` (the planner emits JSON).
// `synthModel` varies by depth: `quick` runs through `FAST_TEXT` for a
// terse summary, `standard`/`deep` use `LONG_FORM` for richer prose.
// Concrete provider/model selection lives in services/mana-llm/aliases.yaml.

interface DepthConfig {
	subQueryCount: number;
	hitsPerQuery: number;
	maxSources: number;
	extract: boolean;
	categories: string[];
	planModel: string;
	synthModel: string;
}

const DEPTH_CONFIG: Record<ResearchDepth, DepthConfig> = {
	quick: {
		subQueryCount: 1,
		hitsPerQuery: 5,
		maxSources: 5,
		extract: false,
		categories: ['general'],
		planModel: MANA_LLM.STRUCTURED,
		synthModel: MANA_LLM.FAST_TEXT,
	},
	standard: {
		subQueryCount: 3,
		hitsPerQuery: 8,
		maxSources: 15,
		extract: true,
		categories: ['general', 'news'],
		planModel: MANA_LLM.STRUCTURED,
		synthModel: MANA_LLM.LONG_FORM,
	},
	deep: {
		subQueryCount: 6,
		hitsPerQuery: 8,
		maxSources: 30,
		extract: true,
		categories: ['general', 'news', 'science', 'it'],
		planModel: MANA_LLM.STRUCTURED,
		synthModel: MANA_LLM.LONG_FORM,
	},
};

// ─── Progress events (consumed by routes.ts pubsub later) ───

export type ProgressEvent =
	| { type: 'status'; status: 'planning' | 'searching' | 'extracting' | 'synthesizing' }
	| { type: 'plan'; subQueries: string[] }
	| { type: 'sources'; count: number }
	| { type: 'token'; delta: string }
	| { type: 'done'; researchResultId: string }
	| { type: 'error'; message: string };

export type ProgressEmitter = (event: ProgressEvent) => void;

const noop: ProgressEmitter = () => {};

// ─── Pipeline input ─────────────────────────────────────────

export interface PipelineInput {
	researchResultId: string;
	questionTitle: string;
	questionDescription?: string;
	depth: ResearchDepth;
}

// ─── Synthesis JSON shape ───────────────────────────────────

interface SynthesisPayload {
	summary: string;
	keyPoints: string[];
	followUps: string[];
}

// ─── Public entrypoint ──────────────────────────────────────

/**
 * Run the full pipeline. Resolves once the row is in `done` or `error`
 * state. Never throws — all failures are caught and persisted.
 */
export async function runPipeline(
	input: PipelineInput,
	emit: ProgressEmitter = noop
): Promise<void> {
	const cfg = DEPTH_CONFIG[input.depth];
	const id = input.researchResultId;

	try {
		// ─── Phase 1: Plan ─────────────────────────────────
		await setStatus(id, 'planning');
		emit({ type: 'status', status: 'planning' });

		const subQueries = await planSubQueries(input, cfg);
		await db.update(researchResults).set({ subQueries }).where(eq(researchResults.id, id));
		emit({ type: 'plan', subQueries });

		// ─── Phase 2: Retrieve ─────────────────────────────
		await setStatus(id, 'searching');
		emit({ type: 'status', status: 'searching' });

		const hits = await runSearches(subQueries, cfg);
		const ranked = dedupeAndRank(hits).slice(0, cfg.maxSources);

		let enriched = ranked.map((h) => ({
			hit: h,
			extractedText: undefined as string | undefined,
		}));

		if (cfg.extract && ranked.length > 0) {
			await setStatus(id, 'extracting');
			emit({ type: 'status', status: 'extracting' });

			const extracts = await bulkExtract(
				ranked.map((h) => h.url),
				{ maxLength: 8000 }
			);
			const byUrl = new Map(extracts.map((e) => [e.url, e]));
			enriched = ranked.map((h) => ({
				hit: h,
				extractedText: byUrl.get(h.url)?.content?.text,
			}));
		}

		// Persist sources with stable rank order so citations [n] map to sources[n-1].
		// Drizzle's .values([]) throws — only insert when we actually have hits.
		if (enriched.length > 0) {
			await db.insert(sources).values(
				enriched.map((e, idx) => ({
					researchResultId: id,
					url: e.hit.url,
					title: e.hit.title,
					snippet: e.hit.snippet,
					extractedContent: e.extractedText,
					category: e.hit.category,
					rank: idx + 1,
				}))
			);
		}
		emit({ type: 'sources', count: enriched.length });

		// If retrieval found nothing (all sub-queries failed or genuinely
		// no hits), skip synthesis and surface an explicit "no sources"
		// summary instead of asking the LLM to fabricate one.
		if (enriched.length === 0) {
			await db
				.update(researchResults)
				.set({
					status: 'done',
					summary:
						'Keine Quellen gefunden. Die Web-Suche hat keine Treffer geliefert — entweder ist die Frage zu spezifisch oder die Suchdienste sind aktuell nicht erreichbar.',
					keyPoints: [],
					followUpQuestions: [],
					finishedAt: new Date(),
				})
				.where(eq(researchResults.id, id));
			emit({ type: 'done', researchResultId: id });
			return;
		}

		// ─── Phase 3: Synthesise ───────────────────────────
		await setStatus(id, 'synthesizing');
		emit({ type: 'status', status: 'synthesizing' });

		const synthesis = await synthesise(input, enriched, cfg, emit);

		await db
			.update(researchResults)
			.set({
				status: 'done',
				summary: synthesis.summary,
				keyPoints: synthesis.keyPoints,
				followUpQuestions: synthesis.followUps,
				finishedAt: new Date(),
			})
			.where(eq(researchResults.id, id));

		emit({ type: 'done', researchResultId: id });
	} catch (err) {
		const message = formatError(err);
		console.error(`[research:${id}] pipeline failed:`, err);
		await db
			.update(researchResults)
			.set({ status: 'error', errorMessage: message, finishedAt: new Date() })
			.where(eq(researchResults.id, id))
			.catch(() => {});
		emit({ type: 'error', message });
	}
}

// ─── Phase 1: Plan ──────────────────────────────────────────

async function planSubQueries(input: PipelineInput, cfg: DepthConfig): Promise<string[]> {
	if (cfg.subQueryCount === 1) {
		// Cheap path: skip the LLM round-trip, just use the question itself.
		return [input.questionTitle];
	}

	const system =
		'Du planst eine Web-Recherche. Antworte ausschließlich als JSON-Objekt mit dem Schlüssel "subQueries" (Array aus Strings). Kein Fließtext, kein Markdown.';

	const user = [
		`Frage: ${input.questionTitle}`,
		input.questionDescription ? `Kontext: ${input.questionDescription}` : null,
		'',
		`Erzeuge genau ${cfg.subQueryCount} präzise, sich gegenseitig ergänzende Web-Suchanfragen.`,
		'Mische deutsche und englische Anfragen, wenn das die Trefferqualität verbessert.',
		'Jede Anfrage soll einen anderen Aspekt der Frage abdecken.',
	]
		.filter(Boolean)
		.join('\n');

	const result = await llmJson<{ subQueries?: unknown }>({
		model: cfg.planModel,
		system,
		user,
		temperature: 0.3,
		maxTokens: 400,
	});

	const queries = Array.isArray(result.subQueries)
		? result.subQueries.filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
		: [];

	if (queries.length === 0) {
		// Fallback: don't fail the whole run because the planner produced garbage.
		return [input.questionTitle];
	}

	return queries.slice(0, cfg.subQueryCount);
}

// ─── Phase 2: Retrieve ──────────────────────────────────────

async function runSearches(queries: string[], cfg: DepthConfig): Promise<SearchHit[]> {
	const results = await Promise.allSettled(
		queries.map((q) =>
			webSearch({
				query: q,
				limit: cfg.hitsPerQuery,
				categories: cfg.categories,
			})
		)
	);

	const hits: SearchHit[] = [];
	for (const r of results) {
		if (r.status === 'fulfilled') hits.push(...r.value);
		else console.warn('[research] sub-query failed:', r.reason);
	}
	return hits;
}

/**
 * Deduplicate by URL, keeping the highest-scored hit per URL.
 * Sort by score descending so the best sources land at the top of the prompt.
 */
function dedupeAndRank(hits: SearchHit[]): SearchHit[] {
	const byUrl = new Map<string, SearchHit>();
	for (const h of hits) {
		const existing = byUrl.get(h.url);
		if (!existing || h.score > existing.score) byUrl.set(h.url, h);
	}
	return [...byUrl.values()].sort((a, b) => b.score - a.score);
}

// ─── Phase 3: Synthesise ────────────────────────────────────

async function synthesise(
	input: PipelineInput,
	enriched: Array<{ hit: SearchHit; extractedText?: string }>,
	cfg: DepthConfig,
	emit: ProgressEmitter
): Promise<SynthesisPayload> {
	const context = enriched
		.map((e, i) => {
			const body = e.extractedText ?? e.hit.snippet ?? '';
			return `[${i + 1}] ${e.hit.title}\n${e.hit.url}\n${truncate(body, 2000)}`;
		})
		.join('\n\n---\n\n');

	const system = [
		'Du bist ein gründlicher Research-Assistent.',
		'Antworte ausschließlich als JSON-Objekt mit dieser exakten Form:',
		'{ "summary": string, "keyPoints": string[], "followUps": string[] }',
		'',
		'Regeln:',
		'- summary: 2–4 Absätze auf Deutsch, jeder belegbare Claim bekommt eine Citation [n], die auf die Quellen-Nummer verweist.',
		'- keyPoints: 3–6 Stichpunkte, jeweils mit mindestens einer [n]-Citation.',
		'- followUps: 2–4 weiterführende Fragen, ohne Citations.',
		'- Verwende ausschließlich Informationen aus den bereitgestellten Quellen. Wenn die Quellen die Frage nicht beantworten, sag das im summary.',
		'- Kein Markdown, keine Code-Fences, nur reines JSON.',
	].join('\n');

	const user = [
		`Frage: ${input.questionTitle}`,
		input.questionDescription ? `Kontext: ${input.questionDescription}` : null,
		'',
		'Quellen:',
		context,
	]
		.filter(Boolean)
		.join('\n');

	// We stream tokens to the client for live UI feedback, then parse the
	// fully-collected text as JSON. The final structured payload is what
	// gets persisted; the live tokens are just visual progress.
	const fullText = await llmStream({
		model: cfg.synthModel,
		system,
		user,
		temperature: 0.4,
		maxTokens: 2000,
		onToken: (delta) => emit({ type: 'token', delta }),
	});

	return parseSynthesis(fullText);
}

function parseSynthesis(raw: string): SynthesisPayload {
	const trimmed = stripCodeFence(raw.trim());
	let parsed: unknown;
	try {
		parsed = JSON.parse(trimmed);
	} catch {
		// Last-ditch fallback: surface the raw text as the summary so the
		// user at least sees what the model produced.
		return { summary: raw.trim(), keyPoints: [], followUps: [] };
	}

	const obj = (parsed ?? {}) as Record<string, unknown>;
	return {
		summary: typeof obj.summary === 'string' ? obj.summary : '',
		keyPoints: Array.isArray(obj.keyPoints)
			? obj.keyPoints.filter((k): k is string => typeof k === 'string')
			: [],
		followUps: Array.isArray(obj.followUps)
			? obj.followUps.filter((k): k is string => typeof k === 'string')
			: [],
	};
}

// ─── Helpers ────────────────────────────────────────────────

async function setStatus(
	id: string,
	status: 'planning' | 'searching' | 'extracting' | 'synthesizing'
): Promise<void> {
	await db.update(researchResults).set({ status }).where(eq(researchResults.id, id));
}

function truncate(s: string, max: number): string {
	if (s.length <= max) return s;
	return s.slice(0, max) + '…';
}

function stripCodeFence(text: string): string {
	if (!text.startsWith('```')) return text;
	const withoutOpen = text.replace(/^```(?:json)?\s*\n?/, '');
	return withoutOpen.replace(/\n?```\s*$/, '');
}

function formatError(err: unknown): string {
	if (err instanceof LlmError) return `LLM: ${err.message}`;
	if (err instanceof SearchError) return `Search: ${err.message}`;
	if (err instanceof Error) return err.message;
	return String(err);
}
