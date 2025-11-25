import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type ChangelogEntry = CollectionEntry<'changelog'>;
export type ReleaseType = ChangelogEntry['data']['type'];
export type Platform = 'web' | 'mobile-ios' | 'mobile-android' | 'api' | 'all';

/**
 * Get all changelog entries for a specific language
 */
export async function getChangelog(language: string = 'en'): Promise<ChangelogEntry[]> {
	const allEntries = await getCollection('changelog');
	return allEntries
		.filter((entry) => entry.data.language === language && !entry.data.draft)
		.sort((a, b) => b.data.releaseDate.getTime() - a.data.releaseDate.getTime());
}

/**
 * Get featured changelog entries
 */
export async function getFeaturedChangelog(language: string = 'en'): Promise<ChangelogEntry[]> {
	const allEntries = await getChangelog(language);
	return allEntries.filter((entry) => entry.data.featured);
}

/**
 * Get highlighted changelog entries
 */
export async function getHighlightedChangelog(language: string = 'en'): Promise<ChangelogEntry[]> {
	const allEntries = await getChangelog(language);
	return allEntries.filter((entry) => entry.data.highlighted);
}

/**
 * Get changelog entries by release type
 */
export async function getChangelogByType(
	type: ReleaseType,
	language: string = 'en'
): Promise<ChangelogEntry[]> {
	const allEntries = await getChangelog(language);
	return allEntries.filter((entry) => entry.data.type === type);
}

/**
 * Get changelog entries by platform
 */
export async function getChangelogByPlatform(
	platform: Platform,
	language: string = 'en'
): Promise<ChangelogEntry[]> {
	const allEntries = await getChangelog(language);
	return allEntries.filter(
		(entry) => entry.data.platforms.includes(platform) || entry.data.platforms.includes('all')
	);
}

/**
 * Get latest changelog entry
 */
export async function getLatestRelease(language: string = 'en'): Promise<ChangelogEntry | null> {
	const allEntries = await getChangelog(language);
	return allEntries[0] || null;
}

/**
 * Get changelog entries by year
 */
export async function getChangelogByYear(
	year: number,
	language: string = 'en'
): Promise<ChangelogEntry[]> {
	const allEntries = await getChangelog(language);
	return allEntries.filter((entry) => entry.data.releaseDate.getFullYear() === year);
}

/**
 * Get all unique years with releases
 */
export async function getAllReleaseYears(language: string = 'en'): Promise<number[]> {
	const allEntries = await getChangelog(language);
	const years = allEntries.map((entry) => entry.data.releaseDate.getFullYear());
	return [...new Set(years)].sort((a, b) => b - a);
}

/**
 * Get release type display name
 */
export function getReleaseTypeDisplayName(type: ReleaseType): string {
	const names: Record<ReleaseType, string> = {
		major: 'Major Release',
		minor: 'Minor Release',
		patch: 'Patch',
		beta: 'Beta',
		alpha: 'Alpha',
	};
	return names[type];
}

/**
 * Get release type icon
 */
export function getReleaseTypeIcon(type: ReleaseType): string {
	const icons: Record<ReleaseType, string> = {
		major: '🚀',
		minor: '✨',
		patch: '🔧',
		beta: '🧪',
		alpha: '⚡',
	};
	return icons[type];
}

/**
 * Get release type color class
 */
export function getReleaseTypeColor(type: ReleaseType): string {
	const colors: Record<ReleaseType, string> = {
		major: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
		minor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
		patch: 'text-green-400 bg-green-500/10 border-green-500/20',
		beta: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
		alpha: 'text-red-400 bg-red-500/10 border-red-500/20',
	};
	return colors[type];
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: Platform): string {
	const names: Record<Platform, string> = {
		web: 'Web',
		'mobile-ios': 'iOS',
		'mobile-android': 'Android',
		api: 'API',
		all: 'All Platforms',
	};
	return names[platform];
}

/**
 * Get platform icon
 */
export function getPlatformIcon(platform: Platform): string {
	const icons: Record<Platform, string> = {
		web: '🌐',
		'mobile-ios': '📱',
		'mobile-android': '🤖',
		api: '🔌',
		all: '🌍',
	};
	return icons[platform];
}

/**
 * Get changelog stats
 */
export async function getChangelogStats(language: string = 'en') {
	const allEntries = await getChangelog(language);
	const years = await getAllReleaseYears(language);

	const typeCounts = {
		major: allEntries.filter((e) => e.data.type === 'major').length,
		minor: allEntries.filter((e) => e.data.type === 'minor').length,
		patch: allEntries.filter((e) => e.data.type === 'patch').length,
		beta: allEntries.filter((e) => e.data.type === 'beta').length,
		alpha: allEntries.filter((e) => e.data.type === 'alpha').length,
	};

	const yearCounts = years.map((year) => ({
		year,
		count: allEntries.filter((e) => e.data.releaseDate.getFullYear() === year).length,
	}));

	return {
		totalReleases: allEntries.length,
		featuredCount: allEntries.filter((e) => e.data.featured).length,
		highlightedCount: allEntries.filter((e) => e.data.highlighted).length,
		typeCounts,
		yearCounts,
		latestVersion: allEntries[0]?.data.version || 'N/A',
	};
}

/**
 * Count total changes in a release
 */
export function countTotalChanges(entry: ChangelogEntry): number {
	const { changes } = entry.data;
	return (
		changes.features.length +
		changes.improvements.length +
		changes.bugfixes.length +
		changes.breaking.length
	);
}

/**
 * Get change category display name
 */
export function getChangeCategoryDisplayName(category: string): string {
	const names: Record<string, string> = {
		generation: 'Generation',
		editing: 'Editing',
		organization: 'Organization',
		api: 'API',
		mobile: 'Mobile',
		web: 'Web',
		performance: 'Performance',
		ui: 'UI',
		ux: 'UX',
		accessibility: 'Accessibility',
		security: 'Security',
		other: 'Other',
	};
	return names[category] || category;
}

/**
 * Get severity color class
 */
export function getSeverityColor(severity?: 'critical' | 'major' | 'minor'): string {
	if (!severity) return 'text-gray-400';

	const colors = {
		critical: 'text-red-400',
		major: 'text-orange-400',
		minor: 'text-yellow-400',
	};
	return colors[severity];
}

/**
 * Get severity icon
 */
export function getSeverityIcon(severity?: 'critical' | 'major' | 'minor'): string {
	if (!severity) return '🔧';

	const icons = {
		critical: '🔴',
		major: '🟠',
		minor: '🟡',
	};
	return icons[severity];
}

/**
 * Format version number
 */
export function formatVersion(version: string): string {
	// Remove 'v' prefix if present
	const cleaned = version.replace(/^v/, '');
	return `v${cleaned}`;
}

/**
 * Parse semantic version
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number; suffix?: string } | null {
	const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)(-(.+))?$/);
	if (!match) return null;

	return {
		major: parseInt(match[1], 10),
		minor: parseInt(match[2], 10),
		patch: parseInt(match[3], 10),
		suffix: match[5],
	};
}

/**
 * Compare versions
 */
export function compareVersions(a: string, b: string): number {
	const versionA = parseVersion(a);
	const versionB = parseVersion(b);

	if (!versionA || !versionB) return 0;

	if (versionA.major !== versionB.major) return versionB.major - versionA.major;
	if (versionA.minor !== versionB.minor) return versionB.minor - versionA.minor;
	if (versionA.patch !== versionB.patch) return versionB.patch - versionA.patch;

	return 0;
}

/**
 * Format date for display
 */
export function formatReleaseDate(date: Date, format: 'short' | 'long' = 'long'): string {
	if (format === 'short') {
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Get time ago string
 */
export function getTimeAgo(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days === 0) return 'Today';
	if (days === 1) return 'Yesterday';
	if (days < 7) return `${days} days ago`;
	if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
	if (days < 365) return `${Math.floor(days / 30)} months ago`;
	return `${Math.floor(days / 365)} years ago`;
}

/**
 * Check if release is recent (within last 30 days)
 */
export function isRecentRelease(date: Date): boolean {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	return days <= 30;
}

/**
 * Group changelog entries by year and month
 */
export async function getChangelogGroupedByYearMonth(language: string = 'en') {
	const allEntries = await getChangelog(language);

	const grouped: Record<string, Record<string, ChangelogEntry[]>> = {};

	allEntries.forEach((entry) => {
		const year = entry.data.releaseDate.getFullYear().toString();
		const month = entry.data.releaseDate.toLocaleString('en-US', { month: 'long' });

		if (!grouped[year]) grouped[year] = {};
		if (!grouped[year][month]) grouped[year][month] = [];

		grouped[year][month].push(entry);
	});

	return grouped;
}
