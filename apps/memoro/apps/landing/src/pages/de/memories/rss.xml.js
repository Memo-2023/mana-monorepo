import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const memories = await getCollection('memories');

	// Filtere nur deutsche und aktive Memories
	const germanMemories = memories
		.filter((memory) => memory.data.lang === 'de' && memory.data.isActive)
		.sort((a, b) => a.data.order - b.data.order);

	return rss({
		title: 'Memoro Memories',
		description: 'Erinnerungen und Geschichten mit Memoro',
		site: context.site,
		items: germanMemories.map((memory) => ({
			title: memory.data.title,
			pubDate: memory.data.lastUpdated || new Date(),
			description: memory.data.description,
			link: `/de/memories/${memory.slug}/`,
			categories: [memory.data.category],
		})),
		customData: `<language>de</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
