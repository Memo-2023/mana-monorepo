import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type ComparisonEntry = CollectionEntry<'comparisons'>;

/**
 * Get all comparisons, optionally filtered by language
 */
export async function getComparisons(language?: string): Promise<ComparisonEntry[]> {
	const allComparisons = await getCollection('comparisons');

	const filtered = language
		? allComparisons.filter((c) => c.data.language === language)
		: allComparisons;

	return filtered.sort((a, b) => {
		// Sort by: featured first, then trending, then by date
		if (a.data.featured && !b.data.featured) return -1;
		if (!a.data.featured && b.data.featured) return 1;
		if (a.data.trending && !b.data.trending) return -1;
		if (!a.data.trending && b.data.trending) return 1;
		return b.data.publishDate.getTime() - a.data.publishDate.getTime();
	});
}

/**
 * Get featured comparisons
 */
export async function getFeaturedComparisons(language?: string): Promise<ComparisonEntry[]> {
	const allComparisons = await getComparisons(language);
	return allComparisons.filter((c) => c.data.featured);
}

/**
 * Get trending comparisons
 */
export async function getTrendingComparisons(language?: string): Promise<ComparisonEntry[]> {
	const allComparisons = await getComparisons(language);
	return allComparisons.filter((c) => c.data.trending);
}

/**
 * Get comparisons by type
 */
export async function getComparisonsByType(
	type: 'versus' | 'roundup' | 'alternative',
	language?: string
): Promise<ComparisonEntry[]> {
	const allComparisons = await getComparisons(language);
	return allComparisons.filter((c) => c.data.type === type);
}

/**
 * Get comparisons by competitor
 */
export async function getComparisonsByCompetitor(
	competitor: string,
	language?: string
): Promise<ComparisonEntry[]> {
	const allComparisons = await getComparisons(language);
	return allComparisons.filter((c) => c.data.competitor.toLowerCase() === competitor.toLowerCase());
}

/**
 * Search comparisons by query
 */
export async function searchComparisons(
	query: string,
	language?: string
): Promise<ComparisonEntry[]> {
	const allComparisons = await getComparisons(language);
	const lowerQuery = query.toLowerCase();

	return allComparisons.filter((c) => {
		const searchableText = [
			c.data.title,
			c.data.description,
			c.data.competitor,
			c.data.verdict,
			...c.data.seoKeywords,
		]
			.join(' ')
			.toLowerCase();

		return searchableText.includes(lowerQuery);
	});
}

/**
 * Get comparison statistics
 */
export async function getComparisonStats(language?: string) {
	const allComparisons = await getComparisons(language);

	const competitorCounts = allComparisons.reduce(
		(acc, c) => {
			const competitor = c.data.competitor;
			acc[competitor] = (acc[competitor] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);

	const typeCounts = allComparisons.reduce(
		(acc, c) => {
			const type = c.data.type;
			acc[type] = (acc[type] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);

	return {
		totalComparisons: allComparisons.length,
		featuredCount: allComparisons.filter((c) => c.data.featured).length,
		trendingCount: allComparisons.filter((c) => c.data.trending).length,
		competitorCounts,
		typeCounts,
		competitors: Object.keys(competitorCounts).sort(),
	};
}

/**
 * Get type display name
 */
export function getTypeDisplayName(type: string): string {
	const names: Record<string, string> = {
		versus: 'Head-to-Head',
		roundup: 'Best Of',
		alternative: 'Alternatives',
	};
	return names[type] || type;
}

/**
 * Get type icon
 */
export function getTypeIcon(type: string): string {
	const icons: Record<string, string> = {
		versus: '⚔️',
		roundup: '🏆',
		alternative: '🔄',
	};
	return icons[type] || '📊';
}

/**
 * Get winner badge color
 */
export function getWinnerBadgeColor(winner?: string): string {
	if (!winner) return 'text-gray-400';
	if (winner === 'picture') return 'text-green-500';
	if (winner === 'competitor') return 'text-blue-500';
	return 'text-yellow-500'; // tie
}

/**
 * Get winner badge text
 */
export function getWinnerBadgeText(winner?: string): string {
	if (!winner) return '';
	if (winner === 'picture') return '✓ Picture Wins';
	if (winner === 'competitor') return 'Competitor Wins';
	return '= Tie';
}

/**
 * Calculate overall winner from comparison table
 */
export function calculateOverallWinner(
	comparisonTable: ComparisonEntry['data']['comparisonTable']
): 'picture' | 'competitor' | 'tie' {
	let pictureScore = 0;
	let competitorScore = 0;

	Object.values(comparisonTable).forEach((item) => {
		if (item.winner === 'picture') pictureScore++;
		else if (item.winner === 'competitor') competitorScore++;
	});

	if (pictureScore > competitorScore) return 'picture';
	if (competitorScore > pictureScore) return 'competitor';
	return 'tie';
}
