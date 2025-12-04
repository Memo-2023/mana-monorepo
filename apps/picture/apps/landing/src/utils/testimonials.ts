import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import i18next from '../i18n';

export type TestimonialEntry = CollectionEntry<'testimonials'>;

/**
 * Get all testimonials, optionally filtered by language
 */
export async function getTestimonials(language?: string): Promise<TestimonialEntry[]> {
	const currentLanguage = language || i18next.language || 'en';
	const allTestimonials = await getCollection('testimonials');

	return allTestimonials
		.filter((testimonial) => testimonial.data.language === currentLanguage)
		.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/**
 * Get featured testimonials for homepage
 */
export async function getFeaturedTestimonials(language?: string): Promise<TestimonialEntry[]> {
	const testimonials = await getTestimonials(language);
	return testimonials.filter((t) => t.data.featured);
}

/**
 * Get testimonials by category
 */
export async function getTestimonialsByCategory(
	category: string,
	language?: string
): Promise<TestimonialEntry[]> {
	const testimonials = await getTestimonials(language);
	return testimonials.filter((t) => t.data.category === category);
}

/**
 * Get testimonials by rating
 */
export async function getTestimonialsByRating(
	minRating: number,
	language?: string
): Promise<TestimonialEntry[]> {
	const testimonials = await getTestimonials(language);
	return testimonials.filter((t) => t.data.rating >= minRating);
}

/**
 * Get all unique categories
 */
export function getAllTestimonialCategories(): string[] {
	return [
		'content-creator',
		'designer',
		'marketer',
		'photographer',
		'business',
		'developer',
		'general',
	];
}

/**
 * Get average rating from testimonials
 */
export async function getAverageRating(language?: string): Promise<number> {
	const testimonials = await getTestimonials(language);
	if (testimonials.length === 0) return 0;

	const totalRating = testimonials.reduce((sum, t) => sum + t.data.rating, 0);
	return totalRating / testimonials.length;
}

/**
 * Get testimonial statistics
 */
export async function getTestimonialStats(language?: string) {
	const testimonials = await getTestimonials(language);

	return {
		total: testimonials.length,
		featured: testimonials.filter((t) => t.data.featured).length,
		verified: testimonials.filter((t) => t.data.verified).length,
		averageRating: await getAverageRating(language),
		byCategory: getAllTestimonialCategories().reduce(
			(acc, category) => {
				acc[category] = testimonials.filter((t) => t.data.category === category).length;
				return acc;
			},
			{} as Record<string, number>
		),
		ratingDistribution: {
			5: testimonials.filter((t) => t.data.rating === 5).length,
			4: testimonials.filter((t) => t.data.rating === 4).length,
			3: testimonials.filter((t) => t.data.rating === 3).length,
			2: testimonials.filter((t) => t.data.rating === 2).length,
			1: testimonials.filter((t) => t.data.rating === 1).length,
		},
	};
}

/**
 * Format category name for display
 */
export function formatCategoryName(category: string): string {
	return category
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}
