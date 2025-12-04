import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type FAQEntry = CollectionEntry<'faq'>;

/**
 * Get all FAQs, optionally filtered by language
 */
export async function getFAQs(language?: string): Promise<FAQEntry[]> {
	const allFAQs = await getCollection('faq');

	if (language) {
		return allFAQs
			.filter((faq) => faq.data.language === language)
			.sort((a, b) => {
				// Sort by category first, then by order within category
				if (a.data.category !== b.data.category) {
					return a.data.category.localeCompare(b.data.category);
				}
				return a.data.order - b.data.order;
			});
	}

	return allFAQs.sort((a, b) => {
		if (a.data.category !== b.data.category) {
			return a.data.category.localeCompare(b.data.category);
		}
		return a.data.order - b.data.order;
	});
}

/**
 * Get featured FAQs for homepage
 */
export async function getFeaturedFAQs(language?: string): Promise<FAQEntry[]> {
	const allFAQs = await getFAQs(language);
	return allFAQs.filter((faq) => faq.data.featured).sort((a, b) => a.data.order - b.data.order);
}

/**
 * Get FAQs by category
 */
export async function getFAQsByCategory(category: string, language?: string): Promise<FAQEntry[]> {
	const allFAQs = await getFAQs(language);
	return allFAQs
		.filter((faq) => faq.data.category === category)
		.sort((a, b) => a.data.order - b.data.order);
}

/**
 * Get all FAQ categories (unique list)
 */
export function getAllFAQCategories(): string[] {
	return [
		'general',
		'pricing',
		'features',
		'technical',
		'legal',
		'account',
		'generation',
		'models',
	];
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string): string {
	const categoryNames: Record<string, string> = {
		general: 'General',
		pricing: 'Pricing & Billing',
		features: 'Features',
		technical: 'Technical',
		legal: 'Legal & Privacy',
		account: 'Account Management',
		generation: 'Image Generation',
		models: 'AI Models',
	};

	return categoryNames[category] || category;
}

/**
 * Get category emoji icon
 */
export function getCategoryIcon(category: string): string {
	const categoryIcons: Record<string, string> = {
		general: '📚',
		pricing: '💳',
		features: '✨',
		technical: '🔧',
		legal: '⚖️',
		account: '👤',
		generation: '🎨',
		models: '🤖',
	};

	return categoryIcons[category] || '📄';
}

/**
 * Search FAQs by query string
 */
export async function searchFAQs(query: string, language?: string): Promise<FAQEntry[]> {
	const allFAQs = await getFAQs(language);
	const lowerQuery = query.toLowerCase();

	return allFAQs.filter(
		(faq) =>
			faq.data.question.toLowerCase().includes(lowerQuery) ||
			faq.body.toLowerCase().includes(lowerQuery) ||
			faq.data.seoKeywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery))
	);
}

/**
 * Get FAQ statistics
 */
export async function getFAQStats(language?: string) {
	const allFAQs = await getFAQs(language);
	const categories = getAllFAQCategories();

	return {
		totalFAQs: allFAQs.length,
		featuredFAQs: allFAQs.filter((faq) => faq.data.featured).length,
		categoryCounts: categories.map((category) => ({
			category,
			count: allFAQs.filter((faq) => faq.data.category === category).length,
		})),
	};
}
