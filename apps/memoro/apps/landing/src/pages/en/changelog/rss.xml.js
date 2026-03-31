import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const changelog = await getCollection('changelog');

	// Filter only English and published changelog entries
	const englishChangelog = changelog
		.filter((entry) => entry.data.lang === 'en' && !entry.data.draft)
		.sort((a, b) => b.data.releaseDate.valueOf() - a.data.releaseDate.valueOf());

	return rss({
		title: 'Memoro Changelog',
		description: 'All changes and updates to Memoro',
		site: context.site,
		items: englishChangelog.map((entry) => ({
			title: `Version ${entry.data.version} - ${entry.data.type}`,
			pubDate: entry.data.releaseDate,
			description: entry.data.highlights
				? entry.data.highlights.join(' • ')
				: 'New version available',
			link: `/en/changelog/#${entry.slug}`,
			categories: entry.data.category || [],
		})),
		customData: `<language>en</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
