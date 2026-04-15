import { JSDOM, VirtualConsole } from 'jsdom';
import { DEFAULT_USER_AGENT, type DiscoveredFeed } from './types';

const silentConsole = new VirtualConsole();

const FEED_TYPES: Record<string, DiscoveredFeed['type']> = {
	'application/rss+xml': 'rss',
	'application/atom+xml': 'atom',
	'application/feed+json': 'unknown',
	'application/json': 'unknown',
};

const COMMON_FEED_PATHS = [
	'/feed',
	'/feed/',
	'/rss',
	'/rss.xml',
	'/atom.xml',
	'/index.xml',
	'/feed.xml',
];

function absolutize(href: string, base: string): string | null {
	try {
		return new URL(href, base).toString();
	} catch {
		return null;
	}
}

/**
 * Discover RSS/Atom feeds linked from a site URL.
 *
 * Strategy: fetch HTML, look for <link rel="alternate"> tags with a
 * feed mime type. That covers ~90% of well-behaved sites. For the rest,
 * the caller can fall back to `probeCommonPaths`.
 */
export async function discoverFeedsFromSite(siteUrl: string): Promise<DiscoveredFeed[]> {
	let html: string;
	try {
		const response = await fetch(siteUrl, {
			headers: { 'User-Agent': DEFAULT_USER_AGENT },
			signal: AbortSignal.timeout(15_000),
			redirect: 'follow',
		});
		if (!response.ok) return [];
		html = await response.text();
	} catch {
		return [];
	}

	const dom = new JSDOM(html, { url: siteUrl, virtualConsole: silentConsole });
	const links = dom.window.document.querySelectorAll(
		'link[rel="alternate"], link[rel~="alternate"]'
	);

	const found = new Map<string, DiscoveredFeed>();
	for (const link of Array.from(links)) {
		const type = (link.getAttribute('type') || '').toLowerCase();
		const href = link.getAttribute('href');
		if (!href || !(type in FEED_TYPES)) continue;

		const abs = absolutize(href, siteUrl);
		if (!abs) continue;

		if (!found.has(abs)) {
			found.set(abs, {
				url: abs,
				title: link.getAttribute('title'),
				type: FEED_TYPES[type] ?? 'unknown',
				siteUrl,
			});
		}
	}

	return Array.from(found.values());
}

/**
 * Probe a handful of common feed paths on a domain. Cheap fallback when
 * discoverFeedsFromSite returns nothing.
 */
export async function probeCommonPaths(siteUrl: string): Promise<DiscoveredFeed[]> {
	const base = (() => {
		try {
			return new URL(siteUrl).origin;
		} catch {
			return null;
		}
	})();
	if (!base) return [];

	const probes = await Promise.all(
		COMMON_FEED_PATHS.map(async (path) => {
			const url = base + path;
			try {
				const res = await fetch(url, {
					method: 'GET',
					headers: {
						'User-Agent': DEFAULT_USER_AGENT,
						Accept: 'application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.1',
					},
					signal: AbortSignal.timeout(8_000),
					redirect: 'follow',
				});
				if (!res.ok) return null;
				const ct = res.headers.get('content-type') || '';
				if (!/xml|rss|atom/i.test(ct)) return null;
				return {
					url,
					title: null,
					type: ct.includes('atom') ? 'atom' : 'rss',
					siteUrl: base,
				} as DiscoveredFeed;
			} catch {
				return null;
			}
		})
	);

	return probes.filter((p): p is DiscoveredFeed => p !== null);
}

export async function discoverFeeds(siteUrl: string): Promise<DiscoveredFeed[]> {
	const viaLinks = await discoverFeedsFromSite(siteUrl);
	if (viaLinks.length > 0) return viaLinks;
	return probeCommonPaths(siteUrl);
}
