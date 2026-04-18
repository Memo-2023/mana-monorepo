/**
 * Discovery store — reactive state for regions, interests, sources, and feed.
 *
 * Server-authoritative: all reads fetch from mana-events, no Dexie.
 * State is held in Svelte 5 runes ($state) and refreshed on mount / mutation.
 */

import * as api from './api';
import type { DiscoveryRegion, DiscoveryInterest, DiscoverySource, DiscoveredEvent } from './types';
import { eventsStore } from '../stores/events.svelte';

// ─── State ──────────────────────────────────────────────────────────

let regions = $state<DiscoveryRegion[]>([]);
let interests = $state<DiscoveryInterest[]>([]);
let sources = $state<DiscoverySource[]>([]);
let feed = $state<DiscoveredEvent[]>([]);
let feedHasMore = $state(false);
let loading = $state(false);
let error = $state<string | null>(null);

// ─── Loaders ────────────────────────────────────────────��───────────

async function loadRegions() {
	try {
		regions = await api.getRegions();
	} catch (e) {
		console.error('[discovery] failed to load regions:', e);
	}
}

async function loadInterests() {
	try {
		interests = await api.getInterests();
	} catch (e) {
		console.error('[discovery] failed to load interests:', e);
	}
}

async function loadSources() {
	try {
		sources = await api.getSources();
	} catch (e) {
		console.error('[discovery] failed to load sources:', e);
	}
}

async function loadFeed(params: api.FeedParams = {}) {
	loading = true;
	error = null;
	try {
		const result = await api.getFeed({ hideDismissed: true, ...params });
		feed = result.events;
		feedHasMore = result.hasMore;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Fehler beim Laden';
		console.error('[discovery] failed to load feed:', e);
	} finally {
		loading = false;
	}
}

// ─── Exported store ─────────────────────────────────────────────────

export const discoveryStore = {
	// Reactive getters
	get regions() {
		return regions;
	},
	get interests() {
		return interests;
	},
	get sources() {
		return sources;
	},
	get feed() {
		return feed;
	},
	get feedHasMore() {
		return feedHasMore;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get isSetUp() {
		return regions.length > 0;
	},

	// ── Init ─────────────────────────────────────────────────────
	async init() {
		await Promise.all([loadRegions(), loadInterests(), loadSources()]);
		if (regions.length > 0) {
			await loadFeed();
		}
	},

	async refreshFeed(params?: api.FeedParams) {
		await loadFeed(params);
	},

	// ── Regions ──────────────────────────────────────────────────
	async addRegion(input: { label: string; lat: number; lon: number; radiusKm?: number }) {
		const region = await api.createRegion(input);
		regions = [...regions, region];
		return region;
	},

	async updateRegion(id: string, input: { label?: string; radiusKm?: number; isActive?: boolean }) {
		const region = await api.updateRegion(id, input);
		regions = regions.map((r) => (r.id === id ? region : r));
		return region;
	},

	async removeRegion(id: string) {
		await api.deleteRegion(id);
		regions = regions.filter((r) => r.id !== id);
	},

	// ── Interests ────────────────────────────────────────────────
	async addInterest(input: { category: string; freetext?: string | null; weight?: number }) {
		const interest = await api.createInterest(input);
		interests = [...interests, interest];
		return interest;
	},

	async removeInterest(id: string) {
		await api.deleteInterest(id);
		interests = interests.filter((i) => i.id !== id);
	},

	// ── Sources ���─────────────────────────────────────────────────
	async addSource(input: {
		type: 'ical' | 'website';
		url: string;
		name: string;
		regionId: string;
		crawlIntervalHours?: number;
	}) {
		const source = await api.createSource(input);
		sources = [...sources, source];
		// Trigger immediate crawl
		api
			.crawlSourceNow(source.id)
			.then(() => loadFeed())
			.catch(() => {});
		return source;
	},

	async removeSource(id: string) {
		await api.deleteSource(id);
		sources = sources.filter((s) => s.id !== id);
	},

	async crawlSource(id: string) {
		const result = await api.crawlSourceNow(id);
		await loadSources();
		await loadFeed();
		return result;
	},

	async activateSource(id: string) {
		const source = await api.activateSource(id);
		sources = sources.map((s) => (s.id === id ? source : s));
	},

	async rejectSource(id: string) {
		await api.rejectSource(id);
		sources = sources.filter((s) => s.id !== id);
	},

	async discoverSources(regionId: string) {
		const result = await api.discoverSources(regionId);
		await loadSources(); // refresh to include new suggestions
		return result;
	},

	// ── Feed Actions ─────────────────────────────────────────────
	async saveEvent(eventId: string) {
		const event = feed.find((e) => e.id === eventId);
		if (!event) return;

		await api.setEventAction(eventId, 'save');
		feed = feed.map((e) => (e.id === eventId ? { ...e, userAction: 'save' as const } : e));

		// Create a local socialEvent from the discovered event
		const startMs = new Date(event.startAt).getTime();
		const fallbackEnd = new Date(startMs + 2 * 60 * 60 * 1000).toISOString();
		await eventsStore.createEvent({
			title: event.title,
			startTime: event.startAt,
			endTime: event.endAt ?? fallbackEnd,
			location: event.location ?? undefined,
			description: event.description
				? `${event.description}\n\nQuelle: ${event.sourceUrl}`
				: `Quelle: ${event.sourceUrl}`,
		});
	},

	async dismissEvent(eventId: string) {
		await api.setEventAction(eventId, 'dismiss');
		feed = feed.filter((e) => e.id !== eventId);
	},
};
