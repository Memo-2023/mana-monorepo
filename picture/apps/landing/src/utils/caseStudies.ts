import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type CaseStudyEntry = CollectionEntry<'caseStudies'>;

/**
 * Get all case studies
 */
export async function getAllCaseStudies(): Promise<CaseStudyEntry[]> {
	return await getCollection('caseStudies');
}

/**
 * Get case studies by language
 */
export async function getCaseStudiesByLanguage(
	language: 'en' | 'de' | 'fr' | 'it' | 'es'
): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();
	return caseStudies.filter((cs) => cs.data.language === language);
}

/**
 * Get featured case studies
 */
export async function getFeaturedCaseStudies(): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();
	return caseStudies
		.filter((cs) => cs.data.featured)
		.sort((a, b) => b.data.views - a.data.views)
		.slice(0, 6);
}

/**
 * Get trending case studies
 */
export async function getTrendingCaseStudies(): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();
	return caseStudies
		.filter((cs) => cs.data.trending)
		.sort((a, b) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime())
		.slice(0, 6);
}

/**
 * Get case studies by category
 */
export async function getCaseStudiesByCategory(
	category: CaseStudyEntry['data']['category']
): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();
	return caseStudies
		.filter((cs) => cs.data.category === category)
		.sort((a, b) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime());
}

/**
 * Get case studies by industry
 */
export async function getCaseStudiesByIndustry(industry: string): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();
	return caseStudies
		.filter((cs) => cs.data.company.industry.toLowerCase().includes(industry.toLowerCase()))
		.sort((a, b) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime());
}

/**
 * Get case studies by company size
 */
export async function getCaseStudiesByCompanySize(
	size: 'startup' | 'small' | 'medium' | 'enterprise'
): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();
	return caseStudies
		.filter((cs) => cs.data.company.size === size)
		.sort((a, b) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime());
}

/**
 * Get case studies by tag
 */
export async function getCaseStudiesByTag(tag: string): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();
	return caseStudies
		.filter((cs) => cs.data.tags.includes(tag))
		.sort((a, b) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime());
}

/**
 * Get case studies by feature used
 */
export async function getCaseStudiesByFeature(featureSlug: string): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();
	return caseStudies.filter((cs) => cs.data.featuresUsed.includes(featureSlug));
}

/**
 * Get case studies by model used
 */
export async function getCaseStudiesByModel(modelSlug: string): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();
	return caseStudies.filter((cs) => cs.data.modelsUsed.includes(modelSlug));
}

/**
 * Get recent case studies
 */
export async function getRecentCaseStudies(limit: number = 6): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();
	return caseStudies
		.sort((a, b) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime())
		.slice(0, limit);
}

/**
 * Get most viewed case studies
 */
export async function getMostViewedCaseStudies(limit: number = 6): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();
	return caseStudies.sort((a, b) => b.data.views - a.data.views).slice(0, limit);
}

/**
 * Get most liked case studies
 */
export async function getMostLikedCaseStudies(limit: number = 6): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();
	return caseStudies.sort((a, b) => b.data.likes - a.data.likes).slice(0, limit);
}

/**
 * Get related case studies based on category, industry, and tags
 */
export async function getRelatedCaseStudies(
	currentCaseStudy: CaseStudyEntry,
	limit: number = 3
): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();

	// Filter out current case study
	const others = caseStudies.filter((cs) => cs.id !== currentCaseStudy.id);

	// Score based on similarity
	const scored = others.map((cs) => {
		let score = 0;

		// Same category = +10 points
		if (cs.data.category === currentCaseStudy.data.category) {
			score += 10;
		}

		// Same industry = +5 points
		if (cs.data.company.industry === currentCaseStudy.data.company.industry) {
			score += 5;
		}

		// Same company size = +3 points
		if (cs.data.company.size === currentCaseStudy.data.company.size) {
			score += 3;
		}

		// Shared tags = +2 points each
		const sharedTags = cs.data.tags.filter((tag) => currentCaseStudy.data.tags.includes(tag));
		score += sharedTags.length * 2;

		// Shared features = +1 point each
		const sharedFeatures = cs.data.featuresUsed.filter((feature) =>
			currentCaseStudy.data.featuresUsed.includes(feature)
		);
		score += sharedFeatures.length;

		// Shared models = +1 point each
		const sharedModels = cs.data.modelsUsed.filter((model) =>
			currentCaseStudy.data.modelsUsed.includes(model)
		);
		score += sharedModels.length;

		// Explicit related case studies = +20 points
		if (currentCaseStudy.data.relatedCaseStudies.includes(cs.id)) {
			score += 20;
		}

		return { caseStudy: cs, score };
	});

	// Sort by score and return top N
	return scored
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((item) => item.caseStudy);
}

/**
 * Search case studies
 */
export async function searchCaseStudies(query: string): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();
	const lowerQuery = query.toLowerCase();

	return caseStudies.filter((cs) => {
		return (
			cs.data.title.toLowerCase().includes(lowerQuery) ||
			cs.data.description.toLowerCase().includes(lowerQuery) ||
			cs.data.company.name.toLowerCase().includes(lowerQuery) ||
			cs.data.company.industry.toLowerCase().includes(lowerQuery) ||
			cs.data.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
			cs.data.challenge.toLowerCase().includes(lowerQuery) ||
			cs.data.solution.toLowerCase().includes(lowerQuery)
		);
	});
}

/**
 * Get case study by slug
 */
export async function getCaseStudyBySlug(slug: string): Promise<CaseStudyEntry | undefined> {
	const caseStudies = await getAllCaseStudies();
	return caseStudies.find((cs) => cs.id === slug || cs.id.replace('en/', '') === slug);
}

/**
 * Get all unique categories with counts
 */
export async function getCaseStudyCategories(): Promise<
	{ category: CaseStudyEntry['data']['category']; count: number }[]
> {
	const caseStudies = await getAllCaseStudies();
	const categoryCounts = new Map<CaseStudyEntry['data']['category'], number>();

	caseStudies.forEach((cs) => {
		const current = categoryCounts.get(cs.data.category) || 0;
		categoryCounts.set(cs.data.category, current + 1);
	});

	return Array.from(categoryCounts.entries())
		.map(([category, count]) => ({ category, count }))
		.sort((a, b) => b.count - a.count);
}

/**
 * Get all unique industries with counts
 */
export async function getCaseStudyIndustries(): Promise<{ industry: string; count: number }[]> {
	const caseStudies = await getAllCaseStudies();
	const industryCounts = new Map<string, number>();

	caseStudies.forEach((cs) => {
		const industry = cs.data.company.industry;
		const current = industryCounts.get(industry) || 0;
		industryCounts.set(industry, current + 1);
	});

	return Array.from(industryCounts.entries())
		.map(([industry, count]) => ({ industry, count }))
		.sort((a, b) => b.count - a.count);
}

/**
 * Get all unique tags with counts
 */
export async function getCaseStudyTags(): Promise<{ tag: string; count: number }[]> {
	const caseStudies = await getAllCaseStudies();
	const tagCounts = new Map<string, number>();

	caseStudies.forEach((cs) => {
		cs.data.tags.forEach((tag) => {
			const current = tagCounts.get(tag) || 0;
			tagCounts.set(tag, current + 1);
		});
	});

	return Array.from(tagCounts.entries())
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count);
}

/**
 * Get case study statistics
 */
export async function getCaseStudyStats() {
	const caseStudies = await getAllCaseStudies();

	const totalViews = caseStudies.reduce((sum, cs) => sum + cs.data.views, 0);
	const totalLikes = caseStudies.reduce((sum, cs) => sum + cs.data.likes, 0);

	const categories = await getCaseStudyCategories();
	const industries = await getCaseStudyIndustries();

	const featuredCount = caseStudies.filter((cs) => cs.data.featured).length;
	const trendingCount = caseStudies.filter((cs) => cs.data.trending).length;

	return {
		totalCaseStudies: caseStudies.length,
		totalViews,
		totalLikes,
		averageViews: Math.round(totalViews / caseStudies.length),
		averageLikes: Math.round(totalLikes / caseStudies.length),
		featuredCount,
		trendingCount,
		categoriesCount: categories.length,
		industriesCount: industries.length,
		topCategory: categories[0],
		topIndustry: industries[0],
	};
}

/**
 * Group case studies by category
 */
export async function groupCaseStudiesByCategory(): Promise<
	Record<string, CaseStudyEntry[]>
> {
	const caseStudies = await getAllCaseStudies();
	const grouped: Record<string, CaseStudyEntry[]> = {};

	caseStudies.forEach((cs) => {
		const category = cs.data.category;
		if (!grouped[category]) {
			grouped[category] = [];
		}
		grouped[category].push(cs);
	});

	// Sort each category by publish date
	Object.keys(grouped).forEach((category) => {
		grouped[category].sort(
			(a, b) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime()
		);
	});

	return grouped;
}

/**
 * Get case studies with metrics
 * Returns case studies sorted by strongest metric
 */
export async function getCaseStudiesWithStrongestMetrics(
	limit: number = 6
): Promise<CaseStudyEntry[]> {
	const caseStudies = await getAllCaseStudies();

	// Score based on metric values (extract numbers from metric values)
	const scored = caseStudies.map((cs) => {
		let maxValue = 0;

		cs.data.metrics.forEach((metric) => {
			// Extract number from value (e.g., "80%" -> 80, "5x" -> 5, "+67%" -> 67)
			const numMatch = metric.value.match(/[\d.]+/);
			if (numMatch) {
				const num = parseFloat(numMatch[0]);
				if (num > maxValue) maxValue = num;
			}
		});

		return { caseStudy: cs, maxMetric: maxValue };
	});

	return scored
		.sort((a, b) => b.maxMetric - a.maxMetric)
		.slice(0, limit)
		.map((item) => item.caseStudy);
}

/**
 * Format company size for display
 */
export function formatCompanySize(size: string): string {
	const sizeMap: Record<string, string> = {
		startup: 'Startup',
		small: 'Small Business',
		medium: 'Mid-Market',
		enterprise: 'Enterprise',
	};
	return sizeMap[size] || size;
}

/**
 * Format category for display
 */
export function formatCategory(category: string): string {
	const categoryMap: Record<string, string> = {
		ecommerce: 'E-Commerce',
		marketing: 'Marketing Agency',
		design: 'Design Studio',
		'content-creation': 'Content Creation',
		saas: 'SaaS',
		education: 'Education',
		enterprise: 'Enterprise',
		startup: 'Startup',
		other: 'Other',
	};
	return categoryMap[category] || category;
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: string): string {
	const iconMap: Record<string, string> = {
		ecommerce: '🛍️',
		marketing: '📢',
		design: '🎨',
		'content-creation': '📝',
		saas: '💻',
		education: '🎓',
		enterprise: '🏢',
		startup: '🚀',
		other: '🌟',
	};
	return iconMap[category] || '📄';
}
