import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const blogPosts = await getCollection('blog');

	// Filtere nur deutsche Blog-Posts
	const germanPosts = blogPosts
		.filter((post) => post.data.lang === 'de' && !post.data.draft)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

	const feedUrl = new URL('/de/blog/rss.xml', context.site).href;

	return rss({
		title: 'Memoro Blog',
		description:
			'Die neuesten Artikel über KI-gestützte Gesprächsdokumentation und intelligente Notizen',
		site: context.site,
		items: germanPosts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.pubDate,
			description: post.data.description,
			link: `/de/blog/${post.slug}/`,
			author: `${post.data.author} <till.schneider@memoro.ai>`,
			categories: post.data.tags,
			customData: `<blogCategory>${post.data.category}</blogCategory>`,
		})),
		customData: `<language>de</language>
<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom" />`,
		stylesheet: '/rss/styles.xsl',
	});
}
