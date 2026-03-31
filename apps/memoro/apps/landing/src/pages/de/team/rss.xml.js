import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const teamMembers = await getCollection('team');

	// Filtere nur deutsche Team-Mitglieder
	const germanMembers = teamMembers
		.filter((member) => member.data.lang === 'de')
		.sort((a, b) => {
			// Sortiere nach categoryOrder und dann nach order
			if (a.data.categoryOrder !== b.data.categoryOrder) {
				return a.data.categoryOrder - b.data.categoryOrder;
			}
			return a.data.order - b.data.order;
		});

	return rss({
		title: 'Memoro Team',
		description: 'Lernen Sie das Team hinter Memoro kennen',
		site: context.site,
		items: germanMembers.map((member) => ({
			title: member.data.title,
			pubDate: member.data.lastUpdated || new Date(),
			description: `${member.data.role} - ${member.data.description}`,
			link: `/de/team/#${member.slug}`,
			categories: [member.data.category],
		})),
		customData: `<language>de</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
