/**
 * Ephemeral research-lab session — in-memory + sessionStorage.
 *
 * Each research run (search/extract/agent comparison) appends to the
 * current session; refresh-safe but doesn't touch Dexie or mana-sync.
 */

import * as api from '../api';
import type {
	CompareEntry,
	ExtractCompareResponse,
	ProvidersCatalog,
	ProvidersHealth,
	ResearchCategory,
	ResearchCompareResponse,
	RunSummary,
	SearchCompareResponse,
} from '../types';

const STORAGE_KEY = 'research-lab-session-v2';

export interface LabSession {
	id: string;
	mode: ResearchCategory;
	query: string;
	url: string;
	selected: { search: string[]; extract: string[]; agent: string[] };
	lastRun: {
		runId: string;
		category: ResearchCategory;
		query: string;
		entries: CompareEntry<unknown>[];
	} | null;
	createdAt: number;
}

function emptySession(): LabSession {
	return {
		id: crypto.randomUUID(),
		mode: 'search',
		query: '',
		url: '',
		selected: {
			search: ['searxng', 'brave', 'tavily'],
			extract: ['readability', 'jina-reader'],
			agent: ['perplexity-sonar', 'gemini-grounding'],
		},
		lastRun: null,
		createdAt: Date.now(),
	};
}

function loadInitial(): LabSession {
	if (typeof sessionStorage === 'undefined') return emptySession();
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return emptySession();
		return { ...emptySession(), ...(JSON.parse(raw) as Partial<LabSession>) };
	} catch {
		return emptySession();
	}
}

function persist(session: LabSession) {
	if (typeof sessionStorage === 'undefined') return;
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
	} catch {
		/* storage full / blocked — non-fatal */
	}
}

function createStore() {
	let session = $state<LabSession>(loadInitial());
	let isRunning = $state(false);
	let error = $state<string | null>(null);
	let catalog = $state<ProvidersCatalog | null>(null);
	let health = $state<ProvidersHealth | null>(null);
	let recentRuns = $state<RunSummary[]>([]);

	return {
		get session() {
			return session;
		},
		get isRunning() {
			return isRunning;
		},
		get error() {
			return error;
		},
		get catalog() {
			return catalog;
		},
		get health() {
			return health;
		},
		get recentRuns() {
			return recentRuns;
		},

		setMode(mode: ResearchCategory) {
			session = { ...session, mode };
			persist(session);
		},

		setQuery(query: string) {
			session = { ...session, query };
			persist(session);
		},

		setUrl(url: string) {
			session = { ...session, url };
			persist(session);
		},

		toggleProvider(category: ResearchCategory, providerId: string) {
			const list = session.selected[category];
			const next = list.includes(providerId)
				? list.filter((id) => id !== providerId)
				: [...list, providerId];
			session = { ...session, selected: { ...session.selected, [category]: next } };
			persist(session);
		},

		reset() {
			session = emptySession();
			error = null;
			persist(session);
		},

		async loadCatalog() {
			try {
				const [c, h] = await Promise.all([api.getProviders(), api.getProvidersHealth()]);
				catalog = c;
				health = h;
			} catch (err) {
				console.warn('[research-lab] catalog load failed:', err);
			}
		},

		async loadRecentRuns(limit = 25) {
			try {
				const { runs } = await api.listRuns(limit);
				recentRuns = runs;
			} catch (err) {
				console.warn('[research-lab] runs load failed:', err);
			}
		},

		async runSearchCompare() {
			if (!session.query.trim() || session.selected.search.length === 0) return;
			error = null;
			isRunning = true;
			try {
				const res: SearchCompareResponse = await api.compareSearch(
					session.query.trim(),
					session.selected.search,
					{ limit: 10 }
				);
				session = {
					...session,
					lastRun: {
						runId: res.runId,
						category: 'search',
						query: res.query,
						entries: res.results as CompareEntry<unknown>[],
					},
				};
				persist(session);
				this.loadRecentRuns().catch(() => {});
			} catch (err) {
				error = err instanceof Error ? err.message : 'Search-Vergleich fehlgeschlagen';
			} finally {
				isRunning = false;
			}
		},

		async runExtractCompare() {
			if (!session.url.trim() || session.selected.extract.length === 0) return;
			error = null;
			isRunning = true;
			try {
				const res: ExtractCompareResponse = await api.compareExtract(
					session.url.trim(),
					session.selected.extract
				);
				session = {
					...session,
					lastRun: {
						runId: res.runId,
						category: 'extract',
						query: res.url,
						entries: res.results as CompareEntry<unknown>[],
					},
				};
				persist(session);
				this.loadRecentRuns().catch(() => {});
			} catch (err) {
				error = err instanceof Error ? err.message : 'Extract-Vergleich fehlgeschlagen';
			} finally {
				isRunning = false;
			}
		},

		async runAgentCompare() {
			if (!session.query.trim() || session.selected.agent.length === 0) return;
			error = null;
			isRunning = true;
			try {
				const res: ResearchCompareResponse = await api.compareResearch(
					session.query.trim(),
					session.selected.agent
				);
				session = {
					...session,
					lastRun: {
						runId: res.runId,
						category: 'agent',
						query: res.query,
						entries: res.results as CompareEntry<unknown>[],
					},
				};
				persist(session);
				this.loadRecentRuns().catch(() => {});
			} catch (err) {
				error = err instanceof Error ? err.message : 'Agent-Vergleich fehlgeschlagen';
			} finally {
				isRunning = false;
			}
		},
	};
}

export const researchLabStore = createStore();
