import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const blogPosts = await getCollection('blog');

	// Filter only English blog posts
	const englishPosts = blogPosts
		.filter((post) => post.data.lang === 'en' && !post.data.draft)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

	const feedUrl = new URL('/en/blog/rss.xml', context.site).href;

	return rss({
		title: 'Memoro Blog',
		description:
			'Latest articles about AI-powered conversation documentation and intelligent notes',
		site: context.site,
		items: englishPosts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.pubDate,
			description: post.data.description,
			link: `/en/blog/${post.slug}/`,
			author: `${post.data.author} <till.schneider@memoro.ai>`,
			categories: post.data.tags,
			customData: `<blogCategory>${post.data.category}</blogCategory>`,
		})),
		customData: `<language>en</language>
<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom" />`,
		stylesheet: '/rss/styles.xsl',
	});
}
