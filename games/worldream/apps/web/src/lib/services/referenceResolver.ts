import type { ContentNode } from '$lib/types/content';

export interface ReferenceData {
	slug: string;
	title: string;
	kind: 'character' | 'place' | 'object';
	image_url?: string;
}

// Cache für geladene Referenzen (Client-side)
const referenceCache = new Map<string, ReferenceData>();
const pendingRequests = new Map<string, Promise<ReferenceData | null>>();

/**
 * Lädt Referenzdaten für einen Slug
 */
async function fetchReference(slug: string): Promise<ReferenceData | null> {
	console.log('🔍 Fetching reference for slug:', slug);

	// Check cache first
	if (referenceCache.has(slug)) {
		console.log('✅ Found in cache:', slug);
		return referenceCache.get(slug)!;
	}

	// Check if request is already pending
	if (pendingRequests.has(slug)) {
		console.log('⏳ Request already pending for:', slug);
		return pendingRequests.get(slug)!;
	}

	// Create new request
	console.log('🌐 Making API request for:', slug);
	const request = fetch(`/api/nodes/${slug}`)
		.then(async (response) => {
			console.log(`📡 API response for ${slug}:`, response.status);
			if (!response.ok) {
				console.error(`❌ Failed to fetch ${slug}:`, response.status);
				return null;
			}

			const node: ContentNode = await response.json();
			console.log(`✨ Got node data for ${slug}:`, node.title);
			const reference: ReferenceData = {
				slug: node.slug,
				title: node.title,
				kind: node.kind as 'character' | 'place' | 'object',
				image_url: node.image_url,
			};

			// Cache the result
			referenceCache.set(slug, reference);
			return reference;
		})
		.catch((error) => {
			console.error(`❌ Error fetching ${slug}:`, error);
			return null;
		})
		.finally(() => {
			pendingRequests.delete(slug);
		});

	pendingRequests.set(slug, request);
	return request;
}

/**
 * Lädt mehrere Referenzen parallel
 */
export async function fetchReferences(slugs: string[]): Promise<Map<string, ReferenceData>> {
	const uniqueSlugs = [...new Set(slugs)];
	const results = await Promise.all(uniqueSlugs.map((slug) => fetchReference(slug)));

	const referenceMap = new Map<string, ReferenceData>();
	results.forEach((data, index) => {
		if (data) {
			referenceMap.set(uniqueSlugs[index], data);
		}
	});

	return referenceMap;
}

/**
 * Extrahiert alle @-Referenzen aus einem Text
 */
export function extractReferences(text: string): string[] {
	const matches = text.matchAll(/@([\w-]+)/g);
	return [...new Set([...matches].map((m) => m[1]))];
}

/**
 * Ersetzt @-Referenzen mit formatierten Links
 */
export function replaceReferences(
	text: string,
	references: Map<string, ReferenceData>,
	options: {
		showAvatar?: boolean;
		linkClass?: string;
	} = {}
): string {
	const { showAvatar = false, linkClass = 'character-link' } = options;

	// Replace each @reference with formatted link
	let result = text;

	for (const [slug, data] of references) {
		const pattern = new RegExp(`@${slug}(?![-\\w])`, 'g');

		let replacement = `<a href="/${slug}" class="${linkClass}" data-kind="${data.kind}">`;

		if (showAvatar && data.image_url) {
			replacement += `<img src="${data.image_url}" alt="${data.title}" class="inline-avatar" />`;
		}

		replacement += `${data.title}</a>`;

		result = result.replace(pattern, replacement);
	}

	// Handle any remaining @references that weren't found
	result = result.replace(/@([\w-]+)/g, (match, slug) => {
		// Fallback: Zeige formatierten Slug
		const displayName = slug
			.split('-')
			.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');

		return `<a href="/${slug}" class="${linkClass} reference-unknown">${displayName}</a>`;
	});

	return result;
}

/**
 * Clear cache (z.B. nach Updates)
 */
export function clearReferenceCache(slug?: string) {
	if (slug) {
		referenceCache.delete(slug);
	} else {
		referenceCache.clear();
	}
}
