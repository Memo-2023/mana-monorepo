import { getCollection } from '$lib/content';
import type { BlogPostWithMeta } from '../../../content/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const posts = await getCollection<BlogPostWithMeta>('blog');
	const site = 'https://ulo.ad';
	
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>uload Blog</title>
		<link>${site}/blog</link>
		<description>Insights über URLs, Marketing und Psychologie</description>
		<language>de-DE</language>
		<atom:link href="${site}/blog/rss.xml" rel="self" type="application/rss+xml" />
		${posts.slice(0, 20).map(post => `
		<item>
			<title><![CDATA[${post.title}]]></title>
			<link>${site}/blog/${post.slug}</link>
			<guid isPermaLink="true">${site}/blog/${post.slug}</guid>
			<description><![CDATA[${post.excerpt}]]></description>
			<pubDate>${new Date(post.date).toUTCString()}</pubDate>
			<category>${post.category}</category>
			${post.tags.map(tag => `<category>${tag}</category>`).join('\n\t\t\t')}
		</item>`).join('')}
	</channel>
</rss>`;
	
	return new Response(xml.trim(), {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
};

export const prerender = false;