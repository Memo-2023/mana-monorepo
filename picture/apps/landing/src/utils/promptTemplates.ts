import { getCollection, type CollectionEntry } from 'astro:content';

export type PromptTemplateEntry = CollectionEntry<'promptTemplates'>;

/**
 * Get all prompt templates
 */
export async function getAllPromptTemplates(): Promise<PromptTemplateEntry[]> {
	const templates = await getCollection('promptTemplates');
	return templates.sort((a, b) => b.data.uses - a.data.uses);
}

/**
 * Get featured prompt templates
 */
export async function getFeaturedTemplates(limit = 6): Promise<PromptTemplateEntry[]> {
	const templates = await getAllPromptTemplates();
	return templates.filter((t) => t.data.featured).slice(0, limit);
}

/**
 * Get popular prompt templates
 */
export async function getPopularTemplates(limit = 12): Promise<PromptTemplateEntry[]> {
	const templates = await getAllPromptTemplates();
	return templates.filter((t) => t.data.popular).slice(0, limit);
}

/**
 * Get trending prompt templates
 */
export async function getTrendingTemplates(limit = 8): Promise<PromptTemplateEntry[]> {
	const templates = await getAllPromptTemplates();
	return templates.filter((t) => t.data.trending).slice(0, limit);
}

/**
 * Get prompt templates by category
 */
export async function getTemplatesByCategory(
	category: string
): Promise<PromptTemplateEntry[]> {
	const templates = await getAllPromptTemplates();
	return templates.filter((t) => t.data.category === category);
}

/**
 * Get prompt templates by difficulty
 */
export async function getTemplatesByDifficulty(
	difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<PromptTemplateEntry[]> {
	const templates = await getAllPromptTemplates();
	return templates.filter((t) => t.data.difficulty === difficulty);
}

/**
 * Get prompt templates by tag
 */
export async function getTemplatesByTag(tag: string): Promise<PromptTemplateEntry[]> {
	const templates = await getAllPromptTemplates();
	return templates.filter((t) => t.data.tags.includes(tag));
}

/**
 * Get prompt template by slug
 */
export async function getTemplateBySlug(slug: string): Promise<PromptTemplateEntry | undefined> {
	const templates = await getAllPromptTemplates();
	return templates.find((t) => t.id.includes(slug));
}

/**
 * Get related prompt templates
 */
export async function getRelatedTemplates(
	currentTemplate: PromptTemplateEntry,
	limit = 3
): Promise<PromptTemplateEntry[]> {
	const templates = await getAllPromptTemplates();

	// First try to get explicitly related templates
	if (currentTemplate.data.relatedTemplates.length > 0) {
		const related = templates.filter((t) =>
			currentTemplate.data.relatedTemplates.some((slug) => t.id.includes(slug))
		);
		if (related.length >= limit) {
			return related.slice(0, limit);
		}
	}

	// Fall back to same category templates
	const sameCategory = templates.filter(
		(t) => t.data.category === currentTemplate.data.category && t.id !== currentTemplate.id
	);

	return sameCategory.slice(0, limit);
}

/**
 * Get all unique categories
 */
export async function getAllCategories(): Promise<
	Array<{ category: string; count: number; icon: string }>
> {
	const templates = await getAllPromptTemplates();
	const categoryMap = new Map<string, { count: number; icon: string }>();

	templates.forEach((template) => {
		const current = categoryMap.get(template.data.category) || { count: 0, icon: '📁' };
		categoryMap.set(template.data.category, {
			count: current.count + 1,
			icon: getCategoryIcon(template.data.category),
		});
	});

	return Array.from(categoryMap.entries())
		.map(([category, data]) => ({
			category,
			count: data.count,
			icon: data.icon,
		}))
		.sort((a, b) => b.count - a.count);
}

/**
 * Get all unique tags
 */
export async function getAllTags(): Promise<Array<{ tag: string; count: number }>> {
	const templates = await getAllPromptTemplates();
	const tagMap = new Map<string, number>();

	templates.forEach((template) => {
		template.data.tags.forEach((tag) => {
			tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
		});
	});

	return Array.from(tagMap.entries())
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count);
}

/**
 * Get template statistics
 */
export async function getTemplateStats() {
	const templates = await getAllPromptTemplates();

	return {
		total: templates.length,
		featured: templates.filter((t) => t.data.featured).length,
		popular: templates.filter((t) => t.data.popular).length,
		trending: templates.filter((t) => t.data.trending).length,
		premium: templates.filter((t) => t.data.premium).length,
		byCategory: await getAllCategories(),
		byDifficulty: {
			beginner: templates.filter((t) => t.data.difficulty === 'beginner').length,
			intermediate: templates.filter((t) => t.data.difficulty === 'intermediate').length,
			advanced: templates.filter((t) => t.data.difficulty === 'advanced').length,
		},
		totalUses: templates.reduce((sum, t) => sum + t.data.uses, 0),
		totalLikes: templates.reduce((sum, t) => sum + t.data.likes, 0),
		totalSaves: templates.reduce((sum, t) => sum + t.data.saves, 0),
		averageRating: (
			templates.reduce((sum, t) => sum + t.data.rating, 0) / templates.length
		).toFixed(1),
	};
}

/**
 * Search templates by query
 */
export async function searchTemplates(query: string): Promise<PromptTemplateEntry[]> {
	const templates = await getAllPromptTemplates();
	const lowerQuery = query.toLowerCase();

	return templates.filter(
		(t) =>
			t.data.title.toLowerCase().includes(lowerQuery) ||
			t.data.description.toLowerCase().includes(lowerQuery) ||
			t.data.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
			t.data.category.toLowerCase().includes(lowerQuery)
	);
}

/**
 * Get most used templates
 */
export async function getMostUsedTemplates(limit = 10): Promise<PromptTemplateEntry[]> {
	const templates = await getAllPromptTemplates();
	return templates.sort((a, b) => b.data.uses - a.data.uses).slice(0, limit);
}

/**
 * Get highest rated templates
 */
export async function getHighestRatedTemplates(limit = 10): Promise<PromptTemplateEntry[]> {
	const templates = await getAllPromptTemplates();
	return templates.sort((a, b) => b.data.rating - a.data.rating).slice(0, limit);
}

/**
 * Get most saved templates
 */
export async function getMostSavedTemplates(limit = 10): Promise<PromptTemplateEntry[]> {
	const templates = await getAllPromptTemplates();
	return templates.sort((a, b) => b.data.saves - a.data.saves).slice(0, limit);
}

/**
 * Get templates by model
 */
export async function getTemplatesByModel(model: string): Promise<PromptTemplateEntry[]> {
	const templates = await getAllPromptTemplates();
	return templates.filter(
		(t) =>
			t.data.recommendedModel === model || t.data.alternativeModels.includes(model)
	);
}

/**
 * Fill template with variables
 */
export function fillTemplate(
	template: string,
	variables: Record<string, string>
): string {
	let filled = template;

	Object.entries(variables).forEach(([key, value]) => {
		const regex = new RegExp(`\\{${key}\\}`, 'g');
		filled = filled.replace(regex, value);
	});

	return filled;
}

/**
 * Extract variables from template
 */
export function extractVariables(template: string): string[] {
	const regex = /\{([^}]+)\}/g;
	const variables: string[] = [];
	let match;

	while ((match = regex.exec(template)) !== null) {
		if (!variables.includes(match[1])) {
			variables.push(match[1]);
		}
	}

	return variables;
}

/**
 * Validate template variables
 */
export function validateTemplateVariables(
	template: PromptTemplateEntry,
	providedVariables: Record<string, string>
): { valid: boolean; missing: string[]; extra: string[] } {
	const requiredVars = template.data.variables.filter((v) => v.required).map((v) => v.name);
	const providedKeys = Object.keys(providedVariables);

	const missing = requiredVars.filter((v) => !providedKeys.includes(v));
	const extra = providedKeys.filter(
		(k) => !template.data.variables.some((v) => v.name === k)
	);

	return {
		valid: missing.length === 0,
		missing,
		extra,
	};
}

/**
 * Get category icon
 */
function getCategoryIcon(category: string): string {
	const icons: Record<string, string> = {
		'social-media': '📱',
		'product-photography': '📸',
		'marketing': '📊',
		'logo-design': '🎨',
		'character-design': '⚔️',
		'illustration': '✏️',
		'photography': '📷',
		'architecture': '🏛️',
		'abstract': '🌈',
		'portrait': '👤',
		'landscape': '🏔️',
		other: '📁',
	};

	return icons[category] || '📁';
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

/**
 * Get difficulty badge color
 */
export function getDifficultyColor(difficulty: string): string {
	const colors: Record<string, string> = {
		beginner: 'green',
		intermediate: 'yellow',
		advanced: 'red',
	};

	return colors[difficulty] || 'gray';
}

/**
 * Sort templates by criteria
 */
export function sortTemplates(
	templates: PromptTemplateEntry[],
	sortBy: 'popular' | 'recent' | 'rating' | 'uses'
): PromptTemplateEntry[] {
	switch (sortBy) {
		case 'popular':
			return [...templates].sort((a, b) => b.data.uses - a.data.uses);
		case 'recent':
			return [...templates].sort(
				(a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime()
			);
		case 'rating':
			return [...templates].sort((a, b) => b.data.rating - a.data.rating);
		case 'uses':
			return [...templates].sort((a, b) => b.data.uses - a.data.uses);
		default:
			return templates;
	}
}
