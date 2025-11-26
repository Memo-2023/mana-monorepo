import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type GalleryEntry = CollectionEntry<'gallery'>;

/**
 * Get all gallery images
 */
export async function getAllGalleryImages(): Promise<GalleryEntry[]> {
	const images = await getCollection('gallery');
	return images.filter((img) => img.data.published);
}

/**
 * Get gallery images by language
 */
export async function getGalleryImagesByLanguage(
	language: 'en' | 'de' | 'fr' | 'it' | 'es'
): Promise<GalleryEntry[]> {
	const images = await getAllGalleryImages();
	return images.filter((img) => img.data.language === language);
}

/**
 * Get featured gallery images
 */
export async function getFeaturedGalleryImages(): Promise<GalleryEntry[]> {
	const images = await getAllGalleryImages();
	return images
		.filter((img) => img.data.featured)
		.sort((a, b) => b.data.likes - a.data.likes)
		.slice(0, 12);
}

/**
 * Get trending gallery images
 */
export async function getTrendingGalleryImages(): Promise<GalleryEntry[]> {
	const images = await getAllGalleryImages();
	return images
		.filter((img) => img.data.trending)
		.sort((a, b) => b.data.views - a.data.views)
		.slice(0, 12);
}

/**
 * Get staff pick gallery images
 */
export async function getStaffPickGalleryImages(): Promise<GalleryEntry[]> {
	const images = await getAllGalleryImages();
	return images
		.filter((img) => img.data.staffPick)
		.sort((a, b) => b.data.qualityScore! - a.data.qualityScore!)
		.slice(0, 12);
}

/**
 * Get gallery images by category
 */
export async function getGalleryImagesByCategory(
	category: GalleryEntry['data']['category']
): Promise<GalleryEntry[]> {
	const images = await getAllGalleryImages();
	return images
		.filter((img) => img.data.category === category)
		.sort((a, b) => b.data.likes - a.data.likes);
}

/**
 * Get gallery images by model
 */
export async function getGalleryImagesByModel(modelSlug: string): Promise<GalleryEntry[]> {
	const images = await getAllGalleryImages();
	return images
		.filter((img) => img.data.model === modelSlug)
		.sort((a, b) => b.data.likes - a.data.likes);
}

/**
 * Get gallery images by style tags
 */
export async function getGalleryImagesByStyle(styleTag: string): Promise<GalleryEntry[]> {
	const images = await getAllGalleryImages();
	return images
		.filter((img) => img.data.style.includes(styleTag))
		.sort((a, b) => b.data.likes - a.data.likes);
}

/**
 * Get gallery images by tags
 */
export async function getGalleryImagesByTag(tag: string): Promise<GalleryEntry[]> {
	const images = await getAllGalleryImages();
	return images
		.filter((img) => img.data.tags.includes(tag))
		.sort((a, b) => b.data.likes - a.data.likes);
}

/**
 * Get most liked gallery images
 */
export async function getMostLikedGalleryImages(limit: number = 12): Promise<GalleryEntry[]> {
	const images = await getAllGalleryImages();
	return images.sort((a, b) => b.data.likes - a.data.likes).slice(0, limit);
}

/**
 * Get most downloaded gallery images
 */
export async function getMostDownloadedGalleryImages(limit: number = 12): Promise<GalleryEntry[]> {
	const images = await getAllGalleryImages();
	return images.sort((a, b) => b.data.downloads - a.data.downloads).slice(0, limit);
}

/**
 * Get most viewed gallery images
 */
export async function getMostViewedGalleryImages(limit: number = 12): Promise<GalleryEntry[]> {
	const images = await getAllGalleryImages();
	return images.sort((a, b) => b.data.views - a.data.views).slice(0, limit);
}

/**
 * Get recent gallery images
 */
export async function getRecentGalleryImages(limit: number = 12): Promise<GalleryEntry[]> {
	const images = await getAllGalleryImages();
	return images
		.sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime())
		.slice(0, limit);
}

/**
 * Get related gallery images based on category, style, and tags
 */
export async function getRelatedGalleryImages(
	currentImage: GalleryEntry,
	limit: number = 6
): Promise<GalleryEntry[]> {
	const images = await getAllGalleryImages();

	// Filter out current image
	const otherImages = images.filter((img) => img.data.slug !== currentImage.data.slug);

	// Score images based on similarity
	const scoredImages = otherImages.map((img) => {
		let score = 0;

		// Same category = +5 points
		if (img.data.category === currentImage.data.category) {
			score += 5;
		}

		// Same model = +3 points
		if (img.data.model === currentImage.data.model) {
			score += 3;
		}

		// Shared style tags = +2 points each
		const sharedStyles = img.data.style.filter((style) =>
			currentImage.data.style.includes(style)
		);
		score += sharedStyles.length * 2;

		// Shared tags = +1 point each
		const sharedTags = img.data.tags.filter((tag) => currentImage.data.tags.includes(tag));
		score += sharedTags.length;

		// Explicit related images = +10 points
		if (currentImage.data.relatedImages.includes(img.data.slug)) {
			score += 10;
		}

		return { image: img, score };
	});

	// Sort by score and return top N
	return scoredImages
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((item) => item.image);
}

/**
 * Get all unique categories with counts
 */
export async function getGalleryCategories(): Promise<
	{ category: GalleryEntry['data']['category']; count: number }[]
> {
	const images = await getAllGalleryImages();
	const categoryCounts = new Map<GalleryEntry['data']['category'], number>();

	images.forEach((img) => {
		const current = categoryCounts.get(img.data.category) || 0;
		categoryCounts.set(img.data.category, current + 1);
	});

	return Array.from(categoryCounts.entries())
		.map(([category, count]) => ({ category, count }))
		.sort((a, b) => b.count - a.count);
}

/**
 * Get all unique style tags with counts
 */
export async function getGalleryStyles(): Promise<{ style: string; count: number }[]> {
	const images = await getAllGalleryImages();
	const styleCounts = new Map<string, number>();

	images.forEach((img) => {
		img.data.style.forEach((style) => {
			const current = styleCounts.get(style) || 0;
			styleCounts.set(style, current + 1);
		});
	});

	return Array.from(styleCounts.entries())
		.map(([style, count]) => ({ style, count }))
		.sort((a, b) => b.count - a.count);
}

/**
 * Get all unique tags with counts
 */
export async function getGalleryTags(): Promise<{ tag: string; count: number }[]> {
	const images = await getAllGalleryImages();
	const tagCounts = new Map<string, number>();

	images.forEach((img) => {
		img.data.tags.forEach((tag) => {
			const current = tagCounts.get(tag) || 0;
			tagCounts.set(tag, current + 1);
		});
	});

	return Array.from(tagCounts.entries())
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count);
}

/**
 * Get gallery statistics
 */
export async function getGalleryStats() {
	const images = await getAllGalleryImages();

	const totalLikes = images.reduce((sum, img) => sum + img.data.likes, 0);
	const totalDownloads = images.reduce((sum, img) => sum + img.data.downloads, 0);
	const totalViews = images.reduce((sum, img) => sum + img.data.views, 0);

	const categories = await getGalleryCategories();
	const featuredCount = images.filter((img) => img.data.featured).length;
	const trendingCount = images.filter((img) => img.data.trending).length;
	const staffPickCount = images.filter((img) => img.data.staffPick).length;

	return {
		totalImages: images.length,
		totalLikes,
		totalDownloads,
		totalViews,
		averageLikes: Math.round(totalLikes / images.length),
		averageDownloads: Math.round(totalDownloads / images.length),
		averageViews: Math.round(totalViews / images.length),
		featuredCount,
		trendingCount,
		staffPickCount,
		categoriesCount: categories.length,
		topCategory: categories[0],
	};
}

/**
 * Search gallery images by query (searches in title, prompt, tags, style)
 */
export async function searchGalleryImages(query: string): Promise<GalleryEntry[]> {
	const images = await getAllGalleryImages();
	const lowerQuery = query.toLowerCase();

	return images.filter((img) => {
		return (
			img.data.title.toLowerCase().includes(lowerQuery) ||
			img.data.prompt.toLowerCase().includes(lowerQuery) ||
			img.data.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
			img.data.style.some((style) => style.toLowerCase().includes(lowerQuery)) ||
			(img.data.description && img.data.description.toLowerCase().includes(lowerQuery))
		);
	});
}

/**
 * Get gallery image by slug
 */
export async function getGalleryImageBySlug(slug: string): Promise<GalleryEntry | undefined> {
	const images = await getAllGalleryImages();
	return images.find((img) => img.data.slug === slug);
}

/**
 * Format file size to human-readable format
 */
export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return bytes + ' B';
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
	return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Get aspect ratio display string
 */
export function getAspectRatioDisplay(aspectRatio: string): string {
	const ratioMap: Record<string, string> = {
		'1:1': 'Square',
		'16:9': 'Landscape',
		'9:16': 'Portrait',
		'4:3': 'Standard',
		'3:4': 'Portrait',
		'3:2': 'Classic',
		'2:3': 'Portrait',
		'5:7': 'Portrait',
		'7:5': 'Landscape',
	};
	return ratioMap[aspectRatio] || aspectRatio;
}
