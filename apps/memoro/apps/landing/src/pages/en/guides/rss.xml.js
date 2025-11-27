import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const guides = await getCollection('guides');

	// Filter only English guides
	const englishGuides = guides
		.filter((guide) => guide.data.lang === 'en')
		.sort((a, b) => b.data.lastUpdated.valueOf() - a.data.lastUpdated.valueOf());

	return rss({
		title: 'Memoro Guides',
		description: 'Practical guides and tutorials for Memoro',
		site: context.site,
		items: englishGuides.map((guide) => ({
			title: guide.data.title,
			pubDate: guide.data.lastUpdated,
			description: guide.data.description,
			link: `/en/guides/${guide.slug}/`,
			categories: [guide.data.category, guide.data.difficulty],
		})),
		customData: `<language>en</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
