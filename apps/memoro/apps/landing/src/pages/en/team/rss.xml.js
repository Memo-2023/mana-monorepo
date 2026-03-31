import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const teamMembers = await getCollection('team');

	// Filter only English team members
	const englishMembers = teamMembers
		.filter((member) => member.data.lang === 'en')
		.sort((a, b) => {
			// Sort by categoryOrder and then by order
			if (a.data.categoryOrder !== b.data.categoryOrder) {
				return a.data.categoryOrder - b.data.categoryOrder;
			}
			return a.data.order - b.data.order;
		});

	return rss({
		title: 'Memoro Team',
		description: 'Meet the team behind Memoro',
		site: context.site,
		items: englishMembers.map((member) => ({
			title: member.data.title,
			pubDate: member.data.lastUpdated || new Date(),
			description: `${member.data.role} - ${member.data.description}`,
			link: `/en/team/#${member.slug}`,
			categories: [member.data.category],
		})),
		customData: `<language>en</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
