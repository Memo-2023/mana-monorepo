import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const changelog = await getCollection('changelog');

	// Filtere nur deutsche und veröffentlichte Changelog-Einträge
	const germanChangelog = changelog
		.filter((entry) => entry.data.lang === 'de' && !entry.data.draft)
		.sort((a, b) => b.data.releaseDate.valueOf() - a.data.releaseDate.valueOf());

	return rss({
		title: 'Memoro Changelog',
		description: 'Alle Änderungen und Updates zu Memoro',
		site: context.site,
		items: germanChangelog.map((entry) => ({
			title: `Version ${entry.data.version} - ${entry.data.type}`,
			pubDate: entry.data.releaseDate,
			description: entry.data.highlights
				? entry.data.highlights.join(' • ')
				: 'Neue Version verfügbar',
			link: `/de/changelog/#${entry.slug}`,
			categories: entry.data.category || [],
		})),
		customData: `<language>de</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
