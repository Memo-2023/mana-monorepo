import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const statistics = await getCollection('statistics');

	// Filter only English and published statistics
	const englishStatistics = statistics
		.filter((stat) => stat.data.lang === 'en' && !stat.data.draft)
		.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());

	return rss({
		title: 'Memoro Statistics',
		description: 'Usage statistics and reports from Memoro',
		site: context.site,
		items: englishStatistics.map((stat) => {
			let title = `${stat.data.reportType} Report`;
			if (stat.data.weekNumber) {
				title = `Week ${stat.data.weekNumber} - ${stat.data.year}`;
			} else if (stat.data.month) {
				title = `${stat.data.month}/${stat.data.year}`;
			} else if (stat.data.year) {
				title = `Year ${stat.data.year}`;
			}

			return {
				title,
				pubDate: stat.data.publishDate,
				description: `Report from ${stat.data.period.start.toLocaleDateString('en-US')} to ${stat.data.period.end.toLocaleDateString('en-US')}`,
				link: `/en/statistics/${stat.slug}/`,
				categories: [stat.data.reportType],
			};
		}),
		customData: `<language>en</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
