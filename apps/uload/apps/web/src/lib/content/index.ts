import {
	blogSchema,
	authorSchema,
	type BlogPost,
	type Author,
	type BlogPostWithMeta,
} from '../../content/config';
import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';

// Cache für Performance
const contentCache = new Map<string, any>();
const CACHE_DURATION = dev ? 0 : 1000 * 60 * 5; // 5 Min in Production

export async function getCollection<T>(collection: 'blog' | 'authors'): Promise<T[]> {
	const cacheKey = `collection-${collection}`;
	const cached = contentCache.get(cacheKey);

	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		return cached.data;
	}

	let items: T[] = [];

	if (collection === 'blog') {
		items = (await getBlogPosts()) as T[];
	} else if (collection === 'authors') {
		items = (await getAuthors()) as T[];
	}

	contentCache.set(cacheKey, {
		data: items,
		timestamp: Date.now(),
	});

	return items;
}

async function getBlogPosts(): Promise<BlogPostWithMeta[]> {
	const postModules = import.meta.glob('/src/content/blog/**/*.md');
	const posts: BlogPostWithMeta[] = [];

	for (const [path, resolver] of Object.entries(postModules)) {
		// Skip drafts in production
		if (!dev && path.includes('_drafts')) continue;

		try {
			const module = (await resolver()) as any;
			const { metadata } = module;

			// Validiere mit Zod Schema
			const validatedPost = blogSchema.parse(metadata);

			// Skip drafts based on frontmatter
			if (!dev && validatedPost.draft) continue;

			// Füge zusätzliche Metadaten hinzu
			const slug = path
				.split('/')
				.pop()
				?.replace('.md', '')
				.replace(/^\d{4}-\d{2}-\d{2}-/, ''); // Datum aus Filename entfernen

			if (!slug) continue;

			posts.push({
				...validatedPost,
				slug,
				readingTime: calculateReadingTime(module.default?.default || module.default || ''),
				path,
			});
		} catch (err) {
			console.error(`Error loading ${path}:`, err);
			if (dev) throw err; // In Dev Fehler werfen
		}
	}

	// Sortiere nach Datum (neueste zuerst)
	return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function getAuthors(): Promise<Author[]> {
	const authorModules = import.meta.glob('/src/content/authors/*.json', {
		import: 'default',
	});

	const authors: Author[] = [];

	for (const [path, resolver] of Object.entries(authorModules)) {
		try {
			const data = (await resolver()) as any;
			const validated = authorSchema.parse(data);
			authors.push(validated);
		} catch (err) {
			console.error(`Error loading author ${path}:`, err);
		}
	}

	return authors;
}

export async function getEntry<T>(collection: 'blog' | 'authors', slug: string): Promise<T | null> {
	const items = await getCollection<T>(collection);

	if (collection === 'blog') {
		return (items as any[]).find((item) => item.slug === slug) || null;
	}

	return (items as any[]).find((item) => item.id === slug) || null;
}

// Helper Functions
function calculateReadingTime(content: string): number {
	const wordsPerMinute = 200;
	const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
	const words = text.split(/\s+/).length;
	return Math.ceil(words / wordsPerMinute);
}

// Blog-spezifische Helpers
export async function getBlogPostsByTag(tag: string): Promise<BlogPostWithMeta[]> {
	const posts = await getCollection<BlogPostWithMeta>('blog');
	return posts.filter((post) => post.tags.includes(tag));
}

export async function getBlogPostsByCategory(category: string): Promise<BlogPostWithMeta[]> {
	const posts = await getCollection<BlogPostWithMeta>('blog');
	return posts.filter((post) => post.category === category);
}

export async function getFeaturedPosts(): Promise<BlogPostWithMeta[]> {
	const posts = await getCollection<BlogPostWithMeta>('blog');
	return posts.filter((post) => post.featured);
}

export async function getRelatedPosts(currentSlug: string, limit = 3): Promise<BlogPostWithMeta[]> {
	const posts = await getCollection<BlogPostWithMeta>('blog');
	const current = posts.find((p) => p.slug === currentSlug);

	if (!current) return [];

	// Finde Posts mit ähnlichen Tags
	const related = posts
		.filter((p) => p.slug !== currentSlug)
		.map((post) => ({
			post,
			score: post.tags.filter((tag) => current.tags.includes(tag)).length,
		}))
		.filter((item) => item.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((item) => item.post);

	return related;
}

// Categories und Tags
export async function getAllCategories() {
	const posts = await getCollection<BlogPostWithMeta>('blog');
	const categories = new Map<string, number>();

	posts.forEach((post) => {
		categories.set(post.category, (categories.get(post.category) || 0) + 1);
	});

	return Array.from(categories.entries()).map(([name, count]) => ({
		name,
		slug: name.toLowerCase(),
		count,
	}));
}

export async function getAllTags() {
	const posts = await getCollection<BlogPostWithMeta>('blog');
	const tags = new Map<string, number>();

	posts.forEach((post) => {
		post.tags.forEach((tag) => {
			tags.set(tag, (tags.get(tag) || 0) + 1);
		});
	});

	return Array.from(tags.entries())
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
}
