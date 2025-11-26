import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import i18next from 'i18next';

export async function getFeatures(language?: string) {
	const lang = language || i18next.language || 'en';
	const allFeatures = await getCollection('features');

	return allFeatures
		.filter(feature => feature.data.language === lang)
		.sort((a, b) => a.data.order - b.data.order);
}

export async function getFeaturedFeatures(language?: string) {
	const features = await getFeatures(language);
	return features.filter(feature => feature.data.featured);
}

export async function getFeaturesByCategory(category: string, language?: string) {
	const features = await getFeatures(language);
	return features.filter(feature => feature.data.category === category);
}

export async function getAvailableFeatures(language?: string) {
	const features = await getFeatures(language);
	return features.filter(feature => feature.data.available);
}

export async function getComingSoonFeatures(language?: string) {
	const features = await getFeatures(language);
	return features.filter(feature => feature.data.comingSoon);
}

export function getAllFeatureCategories(): string[] {
	return ['generation', 'editing', 'organization', 'collaboration', 'api', 'models'];
}

export async function getRelatedFeatures(
	feature: CollectionEntry<'features'>,
	limit: number = 3
): Promise<CollectionEntry<'features'>[]> {
	const allFeatures = await getFeatures(feature.data.language);

	// Filter out current feature and same category
	const relatedFeatures = allFeatures
		.filter(f => f.id !== feature.id && f.data.category === feature.data.category)
		.slice(0, limit);

	// If not enough, add from other categories
	if (relatedFeatures.length < limit) {
		const remaining = allFeatures
			.filter(f => f.id !== feature.id && !relatedFeatures.includes(f))
			.slice(0, limit - relatedFeatures.length);
		relatedFeatures.push(...remaining);
	}

	return relatedFeatures;
}
