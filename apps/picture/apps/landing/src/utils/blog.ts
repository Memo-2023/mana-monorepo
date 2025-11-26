import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import i18next from 'i18next';

export async function getBlogPosts(language?: string) {
	const lang = language || i18next.language || 'en';
	const allPosts = await getCollection('blog');

	return allPosts
		.filter(post => post.data.language === lang && !post.data.draft)
		.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

export async function getPostsByCategory(category: string, language?: string) {
	const posts = await getBlogPosts(language);
	return posts.filter(post => post.data.category === category);
}

export async function getPostsByTag(tag: string, language?: string) {
	const posts = await getBlogPosts(language);
	return posts.filter(post => post.data.tags.includes(tag));
}

export function calculateReadingTime(content: string): number {
	const wordsPerMinute = 200;
	const words = content.trim().split(/\s+/).length;
	return Math.ceil(words / wordsPerMinute);
}

export function formatDate(date: Date, language: string = 'en'): string {
	return new Intl.DateTimeFormat(language, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(date);
}

export async function getRelatedPosts(
	post: CollectionEntry<'blog'>,
	limit: number = 3
): Promise<CollectionEntry<'blog'>[]> {
	const allPosts = await getBlogPosts(post.data.language);

	// Filter out current post
	const otherPosts = allPosts.filter(p => p.id !== post.id);

	// Score posts by relevance (same category, shared tags)
	const scoredPosts = otherPosts.map(p => {
		let score = 0;
		if (p.data.category === post.data.category) score += 3;
		const sharedTags = p.data.tags.filter(tag => post.data.tags.includes(tag));
		score += sharedTags.length;
		return { post: p, score };
	});

	// Sort by score and return top posts
	return scoredPosts
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map(item => item.post);
}

export function getAllTags(posts: CollectionEntry<'blog'>[]): string[] {
	const tags = new Set<string>();
	posts.forEach(post => {
		post.data.tags.forEach(tag => tags.add(tag));
	});
	return Array.from(tags).sort();
}

export function getAllCategories(): string[] {
	return ['tutorial', 'tips', 'updates', 'use-case', 'news'];
}
