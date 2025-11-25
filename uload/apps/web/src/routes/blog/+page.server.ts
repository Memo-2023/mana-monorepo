import { getCollection, getFeaturedPosts, getAllCategories } from '$lib/content';
import type { BlogPostWithMeta, BlogCategory } from '../../content/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const posts = await getCollection<BlogPostWithMeta>('blog');
	const featuredPosts = await getFeaturedPosts();
	const categories = await getAllCategories();
	
	return {
		posts,
		featuredPosts,
		categories,
		user: locals.user
	};
};