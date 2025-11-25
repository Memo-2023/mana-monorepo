import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type Tutorial = CollectionEntry<'tutorials'>;
export type TutorialCategory = Tutorial['data']['category'];
export type TutorialDifficulty = Tutorial['data']['difficulty'];

/**
 * Get all tutorials for a specific language
 */
export async function getTutorials(language: string = 'en'): Promise<Tutorial[]> {
	const allTutorials = await getCollection('tutorials');
	return allTutorials
		.filter((tutorial) => tutorial.data.language === language)
		.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
}

/**
 * Get featured tutorials
 */
export async function getFeaturedTutorials(language: string = 'en'): Promise<Tutorial[]> {
	const allTutorials = await getTutorials(language);
	return allTutorials.filter((tutorial) => tutorial.data.featured);
}

/**
 * Get popular tutorials
 */
export async function getPopularTutorials(language: string = 'en'): Promise<Tutorial[]> {
	const allTutorials = await getTutorials(language);
	return allTutorials.filter((tutorial) => tutorial.data.popular);
}

/**
 * Get tutorials by category
 */
export async function getTutorialsByCategory(
	category: TutorialCategory,
	language: string = 'en'
): Promise<Tutorial[]> {
	const allTutorials = await getTutorials(language);
	return allTutorials.filter((tutorial) => tutorial.data.category === category);
}

/**
 * Get tutorials by difficulty
 */
export async function getTutorialsByDifficulty(
	difficulty: TutorialDifficulty,
	language: string = 'en'
): Promise<Tutorial[]> {
	const allTutorials = await getTutorials(language);
	return allTutorials.filter((tutorial) => tutorial.data.difficulty === difficulty);
}

/**
 * Get all unique categories
 */
export function getAllTutorialCategories(): TutorialCategory[] {
	return [
		'getting-started',
		'generation',
		'editing',
		'advanced',
		'workflows',
		'tips-tricks',
		'api',
	];
}

/**
 * Get all unique difficulties
 */
export function getAllTutorialDifficulties(): TutorialDifficulty[] {
	return ['beginner', 'intermediate', 'advanced'];
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: TutorialCategory): string {
	const names: Record<TutorialCategory, string> = {
		'getting-started': 'Getting Started',
		generation: 'Image Generation',
		editing: 'Image Editing',
		advanced: 'Advanced Techniques',
		workflows: 'Complete Workflows',
		'tips-tricks': 'Tips & Tricks',
		api: 'API & Integrations',
	};
	return names[category];
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: TutorialCategory): string {
	const icons: Record<TutorialCategory, string> = {
		'getting-started': '🚀',
		generation: '🎨',
		editing: '✂️',
		advanced: '🧪',
		workflows: '🔄',
		'tips-tricks': '💡',
		api: '🔌',
	};
	return icons[category];
}

/**
 * Get difficulty display name
 */
export function getDifficultyDisplayName(difficulty: TutorialDifficulty): string {
	const names: Record<TutorialDifficulty, string> = {
		beginner: 'Beginner',
		intermediate: 'Intermediate',
		advanced: 'Advanced',
	};
	return names[difficulty];
}

/**
 * Get difficulty icon
 */
export function getDifficultyIcon(difficulty: TutorialDifficulty): string {
	const icons: Record<TutorialDifficulty, string> = {
		beginner: '🟢',
		intermediate: '🟡',
		advanced: '🔴',
	};
	return icons[difficulty];
}

/**
 * Get difficulty color class
 */
export function getDifficultyColor(difficulty: TutorialDifficulty): string {
	const colors: Record<TutorialDifficulty, string> = {
		beginner: 'text-green-400',
		intermediate: 'text-yellow-400',
		advanced: 'text-red-400',
	};
	return colors[difficulty];
}

/**
 * Get tutorial stats
 */
export async function getTutorialStats(language: string = 'en') {
	const allTutorials = await getTutorials(language);
	const categories = getAllTutorialCategories();
	const difficulties = getAllTutorialDifficulties();

	const categoryCounts = categories.map((category) => ({
		category,
		displayName: getCategoryDisplayName(category),
		icon: getCategoryIcon(category),
		count: allTutorials.filter((t) => t.data.category === category).length,
	}));

	const difficultyCounts = difficulties.map((difficulty) => ({
		difficulty,
		displayName: getDifficultyDisplayName(difficulty),
		icon: getDifficultyIcon(difficulty),
		count: allTutorials.filter((t) => t.data.difficulty === difficulty).length,
	}));

	return {
		totalTutorials: allTutorials.length,
		featuredCount: allTutorials.filter((t) => t.data.featured).length,
		popularCount: allTutorials.filter((t) => t.data.popular).length,
		withVideoCount: allTutorials.filter((t) => t.data.hasVideo).length,
		categoryCounts,
		difficultyCounts,
	};
}

/**
 * Get related tutorials
 */
export async function getRelatedTutorials(
	tutorial: Tutorial,
	limit: number = 3
): Promise<Tutorial[]> {
	const allTutorials = await getTutorials(tutorial.data.language);

	// Filter out current tutorial
	const otherTutorials = allTutorials.filter((t) => t.slug !== tutorial.slug);

	// Get tutorials from related slugs
	const relatedSlugs = tutorial.data.relatedTutorials;
	const relatedBySlug = otherTutorials.filter((t) =>
		relatedSlugs.includes(t.data.slug)
	);

	// Get tutorials from same category
	const sameCategory = otherTutorials.filter(
		(t) => t.data.category === tutorial.data.category
	);

	// Get tutorials with similar difficulty
	const sameDifficulty = otherTutorials.filter(
		(t) => t.data.difficulty === tutorial.data.difficulty
	);

	// Combine and deduplicate
	const related = [
		...relatedBySlug,
		...sameCategory.filter((t) => !relatedBySlug.includes(t)),
		...sameDifficulty.filter(
			(t) => !relatedBySlug.includes(t) && !sameCategory.includes(t)
		),
	];

	return related.slice(0, limit);
}

/**
 * Estimate reading time (words per minute)
 */
export function estimateReadingTime(content: string, wordsPerMinute: number = 200): string {
	const words = content.split(/\s+/).length;
	const minutes = Math.ceil(words / wordsPerMinute);
	return `${minutes} min read`;
}

/**
 * Format step duration
 */
export function formatStepDuration(duration?: string): string {
	if (!duration) return '';
	return duration;
}

/**
 * Get total tutorial duration
 */
export function getTotalDuration(steps: { duration?: string }[]): string {
	// This is simplified - you might want to parse and sum actual durations
	return steps.length > 0 ? `${steps.length} steps` : '';
}
