import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const features = await getCollection('features');

	// Filter only English features
	const englishFeatures = features
		.filter((feature) => feature.data.lang === 'en')
		.sort((a, b) => a.data.order - b.data.order);

	return rss({
		title: 'Memoro Features',
		description: 'All Memoro features at a glance',
		site: context.site,
		items: englishFeatures.map((feature) => ({
			title: feature.data.title,
			pubDate: new Date(),
			description: feature.data.description,
			link: `/en/features/${feature.slug}/`,
			categories: [feature.data.category],
		})),
		customData: `<language>en</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
