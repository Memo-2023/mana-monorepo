import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const blueprints = await getCollection('blueprints');

	// Filter only English and active blueprints
	const englishBlueprints = blueprints
		.filter((blueprint) => blueprint.data.lang === 'en' && blueprint.data.isActive)
		.sort((a, b) => a.data.order - b.data.order);

	return rss({
		title: 'Memoro Blueprints',
		description: 'Templates and blueprints for Memoro',
		site: context.site,
		items: englishBlueprints.map((blueprint) => ({
			title: blueprint.data.title,
			pubDate: blueprint.data.lastUpdated || new Date(),
			description: blueprint.data.description,
			link: `/en/blueprints/${blueprint.slug}/`,
		})),
		customData: `<language>en</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
