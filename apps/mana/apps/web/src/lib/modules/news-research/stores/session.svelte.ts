/**
 * Ephemeral research session. Lives in memory + sessionStorage so the
 * tab survives refreshes; nothing touches Dexie or mana-sync.
 *
 * One active session at a time. UI calls the store's actions to run
 * discovery / search; results stream into `session`.
 */

import * as api from '../api';
import type { DiscoveredFeedDto, ResearchSession, ScoredArticleDto } from '../types';

const STORAGE_KEY = 'news-research-session-v1';

function emptySession(): ResearchSession {
	return {
		id: crypto.randomUUID(),
		query: '',
		siteUrl: null,
		discoveredFeeds: [],
		selectedFeeds: [],
		results: [],
		createdAt: Date.now(),
		hasDiscovered: false,
		hasSearched: false,
	};
}

function loadInitial(): ResearchSession {
	if (typeof sessionStorage === 'undefined') return emptySession();
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return emptySession();
		return JSON.parse(raw) as ResearchSession;
	} catch {
		return emptySession();
	}
}

function persist(session: ResearchSession) {
	if (typeof sessionStorage === 'undefined') return;
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
	} catch {
		// sessionStorage full or blocked — non-fatal.
	}
}

function createStore() {
	let session = $state<ResearchSession>(loadInitial());
	let discovering = $state(false);
	let searching = $state(false);
	let error = $state<string | null>(null);

	return {
		get session() {
			return session;
		},
		get discovering() {
			return discovering;
		},
		get searching() {
			return searching;
		},
		get error() {
			return error;
		},

		reset() {
			session = emptySession();
			error = null;
			persist(session);
		},

		async discoverByQuery(query: string, language?: string) {
			error = null;
			discovering = true;
			try {
				const res = await api.discoverByQuery(query, language);
				session = {
					...session,
					query,
					siteUrl: null,
					discoveredFeeds: res.feeds,
					selectedFeeds: res.feeds.slice(0, 5).map((f) => f.url),
					results: [],
					hasDiscovered: true,
					hasSearched: false,
				};
				persist(session);
			} catch (e) {
				error = e instanceof Error ? e.message : 'discovery failed';
				session = { ...session, hasDiscovered: true };
				persist(session);
			} finally {
				discovering = false;
			}
		},

		async discoverBySite(siteUrl: string) {
			error = null;
			discovering = true;
			try {
				const res = await api.discoverBySite(siteUrl);
				session = {
					...session,
					siteUrl,
					discoveredFeeds: res.feeds,
					selectedFeeds: res.feeds.map((f) => f.url),
					results: [],
					hasDiscovered: true,
					hasSearched: false,
				};
				persist(session);
			} catch (e) {
				error = e instanceof Error ? e.message : 'discovery failed';
				session = { ...session, hasDiscovered: true };
				persist(session);
			} finally {
				discovering = false;
			}
		},

		toggleFeed(url: string) {
			const selected = new Set(session.selectedFeeds);
			if (selected.has(url)) selected.delete(url);
			else selected.add(url);
			session = { ...session, selectedFeeds: Array.from(selected) };
			persist(session);
		},

		addDiscoveredFeed(feed: DiscoveredFeedDto) {
			if (session.discoveredFeeds.some((f) => f.url === feed.url)) return;
			session = {
				...session,
				discoveredFeeds: [...session.discoveredFeeds, feed],
				selectedFeeds: [...session.selectedFeeds, feed.url],
			};
			persist(session);
		},

		async runSearch(query: string, sinceIso?: string) {
			if (session.selectedFeeds.length === 0) {
				error = 'No feeds selected';
				return;
			}
			error = null;
			searching = true;
			try {
				const res = await api.searchFeeds(session.selectedFeeds, query, { sinceIso });
				session = { ...session, query, results: res.articles, hasSearched: true };
				persist(session);
			} catch (e) {
				error = e instanceof Error ? e.message : 'search failed';
				session = { ...session, hasSearched: true };
				persist(session);
			} finally {
				searching = false;
			}
		},

		buildAiContext(): string {
			const lines = [
				`# News Research — Query: ${session.query || '(none)'}`,
				`Feeds: ${session.selectedFeeds.length}`,
				'',
			];
			for (const a of session.results.slice(0, 20)) {
				lines.push(
					`## ${a.title}`,
					`Source: ${a.feedUrl}`,
					`Published: ${a.publishedAt ?? 'unknown'}`,
					`URL: ${a.url}`,
					a.excerpt ? `\n${a.excerpt}` : '',
					''
				);
			}
			return lines.join('\n');
		},

		pickTopResults(limit = 10): ScoredArticleDto[] {
			return session.results.slice(0, limit);
		},
	};
}

export const researchSessionStore = createStore();
