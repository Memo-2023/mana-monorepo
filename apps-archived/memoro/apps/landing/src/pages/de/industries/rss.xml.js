import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const industries = await getCollection('industries');

	// Filtere nur deutsche Branchen
	const germanIndustries = industries
		.filter((industry) => industry.data.lang === 'de')
		.sort((a, b) => a.data.order - b.data.order);

	return rss({
		title: 'Memoro Branchen',
		description: 'Memoro Lösungen für verschiedene Branchen',
		site: context.site,
		items: germanIndustries.map((industry) => ({
			title: industry.data.title,
			pubDate: new Date(),
			description: industry.data.description,
			link: `/de/industries/${industry.slug}/`,
		})),
		customData: `<language>de</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
