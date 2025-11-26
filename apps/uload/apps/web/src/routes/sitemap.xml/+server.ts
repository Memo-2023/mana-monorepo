import { getCollection } from '$lib/content';
import type { BlogPostWithMeta } from '../../content/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const posts = await getCollection<BlogPostWithMeta>('blog');
	const site = 'https://ulo.ad';
	
	// Static pages
	const staticPages = [
		'',
		'/features',
		'/pricing',
		'/about',
		'/blog',
		'/datenschutz',
		'/impressum',
		'/agb'
	];
	
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	${staticPages.map(page => `
	<url>
		<loc>${site}${page}</loc>
		<changefreq>weekly</changefreq>
		<priority>${page === '' ? '1.0' : '0.8'}</priority>
	</url>`).join('')}
	${posts.map(post => `
	<url>
		<loc>${site}/blog/${post.slug}</loc>
		<lastmod>${new Date(post.date).toISOString()}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.7</priority>
	</url>`).join('')}
</urlset>`;
	
	return new Response(xml.trim(), {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
};

export const prerender = false;