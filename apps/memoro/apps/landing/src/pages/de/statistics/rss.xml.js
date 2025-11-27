import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const statistics = await getCollection('statistics');

	// Filtere nur deutsche und veröffentlichte Statistiken
	const germanStatistics = statistics
		.filter((stat) => stat.data.lang === 'de' && !stat.data.draft)
		.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());

	return rss({
		title: 'Memoro Statistiken',
		description: 'Nutzungsstatistiken und Berichte von Memoro',
		site: context.site,
		items: germanStatistics.map((stat) => {
			let title = `${stat.data.reportType} Bericht`;
			if (stat.data.weekNumber) {
				title = `Woche ${stat.data.weekNumber} - ${stat.data.year}`;
			} else if (stat.data.month) {
				title = `${stat.data.month}/${stat.data.year}`;
			} else if (stat.data.year) {
				title = `Jahr ${stat.data.year}`;
			}

			return {
				title,
				pubDate: stat.data.publishDate,
				description: `Bericht vom ${stat.data.period.start.toLocaleDateString('de-DE')} bis ${stat.data.period.end.toLocaleDateString('de-DE')}`,
				link: `/de/statistics/${stat.slug}/`,
				categories: [stat.data.reportType],
			};
		}),
		customData: `<language>de</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
