import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const faqs = await getCollection('faqs');

	// Filtere nur deutsche FAQs
	const germanFaqs = faqs
		.filter((faq) => faq.data.lang === 'de')
		.sort((a, b) => {
			// Featured zuerst, dann nach order
			if (a.data.featured !== b.data.featured) {
				return b.data.featured ? 1 : -1;
			}
			return a.data.order - b.data.order;
		});

	return rss({
		title: 'Memoro FAQ',
		description: 'Häufig gestellte Fragen zu Memoro',
		site: context.site,
		items: germanFaqs.map((faq) => ({
			title: faq.data.question,
			pubDate: new Date(),
			description: faq.data.answer,
			link: `/de/faq/#${faq.slug}`,
			categories: [faq.data.category],
		})),
		customData: `<language>de</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
