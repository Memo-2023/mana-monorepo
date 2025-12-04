import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type UseCaseEntry = CollectionEntry<'useCases'>;

/**
 * Get all use cases, optionally filtered by language
 */
export async function getUseCases(language?: string): Promise<UseCaseEntry[]> {
	const allUseCases = await getCollection('useCases');

	if (language) {
		return allUseCases
			.filter((uc) => uc.data.language === language)
			.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
	}

	return allUseCases.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
}

/**
 * Get featured use cases for homepage
 */
export async function getFeaturedUseCases(language?: string): Promise<UseCaseEntry[]> {
	const allUseCases = await getUseCases(language);
	return allUseCases.filter((uc) => uc.data.featured);
}

/**
 * Get popular use cases
 */
export async function getPopularUseCases(language?: string): Promise<UseCaseEntry[]> {
	const allUseCases = await getUseCases(language);
	return allUseCases.filter((uc) => uc.data.popular);
}

/**
 * Get use cases by category
 */
export async function getUseCasesByCategory(
	category: string,
	language?: string
): Promise<UseCaseEntry[]> {
	const allUseCases = await getUseCases(language);
	return allUseCases.filter((uc) => uc.data.category === category);
}

/**
 * Get use cases by difficulty
 */
export async function getUseCasesByDifficulty(
	difficulty: string,
	language?: string
): Promise<UseCaseEntry[]> {
	const allUseCases = await getUseCases(language);
	return allUseCases.filter((uc) => uc.data.difficulty === difficulty);
}

/**
 * Get all use case categories
 */
export function getAllUseCaseCategories(): string[] {
	return [
		'social-media',
		'marketing',
		'design',
		'ecommerce',
		'education',
		'entertainment',
		'business',
		'personal',
	];
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string): string {
	const categoryNames: Record<string, string> = {
		'social-media': 'Social Media',
		marketing: 'Marketing & Advertising',
		design: 'Design & Creative',
		ecommerce: 'E-commerce & Retail',
		education: 'Education & Learning',
		entertainment: 'Entertainment & Gaming',
		business: 'Business & Corporate',
		personal: 'Personal Projects',
	};

	return categoryNames[category] || category;
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: string): string {
	const categoryIcons: Record<string, string> = {
		'social-media': '📱',
		marketing: '📢',
		design: '🎨',
		ecommerce: '🛍️',
		education: '📚',
		entertainment: '🎮',
		business: '💼',
		personal: '✨',
	};

	return categoryIcons[category] || '📄';
}

/**
 * Get difficulty display name
 */
export function getDifficultyDisplayName(difficulty: string): string {
	const difficultyNames: Record<string, string> = {
		beginner: 'Beginner',
		intermediate: 'Intermediate',
		advanced: 'Advanced',
	};

	return difficultyNames[difficulty] || difficulty;
}

/**
 * Get difficulty color class
 */
export function getDifficultyColor(difficulty: string): string {
	const difficultyColors: Record<string, string> = {
		beginner: 'text-green-400',
		intermediate: 'text-yellow-400',
		advanced: 'text-red-400',
	};

	return difficultyColors[difficulty] || 'text-gray-400';
}

/**
 * Search use cases by query string
 */
export async function searchUseCases(query: string, language?: string): Promise<UseCaseEntry[]> {
	const allUseCases = await getUseCases(language);
	const lowerQuery = query.toLowerCase();

	return allUseCases.filter(
		(uc) =>
			uc.data.title.toLowerCase().includes(lowerQuery) ||
			uc.data.description.toLowerCase().includes(lowerQuery) ||
			uc.body.toLowerCase().includes(lowerQuery) ||
			uc.data.seoKeywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery)) ||
			(uc.data.industry && uc.data.industry.toLowerCase().includes(lowerQuery))
	);
}

/**
 * Get use case statistics
 */
export async function getUseCaseStats(language?: string) {
	const allUseCases = await getUseCases(language);
	const categories = getAllUseCaseCategories();

	return {
		totalUseCases: allUseCases.length,
		featuredUseCases: allUseCases.filter((uc) => uc.data.featured).length,
		popularUseCases: allUseCases.filter((uc) => uc.data.popular).length,
		categoryCounts: categories.map((category) => ({
			category,
			displayName: getCategoryDisplayName(category),
			icon: getCategoryIcon(category),
			count: allUseCases.filter((uc) => uc.data.category === category).length,
		})),
		difficultyCounts: {
			beginner: allUseCases.filter((uc) => uc.data.difficulty === 'beginner').length,
			intermediate: allUseCases.filter((uc) => uc.data.difficulty === 'intermediate').length,
			advanced: allUseCases.filter((uc) => uc.data.difficulty === 'advanced').length,
		},
	};
}
