import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const faqs = await getCollection('faqs');

	// Filter only English FAQs
	const englishFaqs = faqs
		.filter((faq) => faq.data.lang === 'en')
		.sort((a, b) => {
			// Featured first, then by order
			if (a.data.featured !== b.data.featured) {
				return b.data.featured ? 1 : -1;
			}
			return a.data.order - b.data.order;
		});

	return rss({
		title: 'Memoro FAQ',
		description: 'Frequently asked questions about Memoro',
		site: context.site,
		items: englishFaqs.map((faq) => ({
			title: faq.data.question,
			pubDate: new Date(),
			description: faq.data.answer,
			link: `/en/faq/#${faq.slug}`,
			categories: [faq.data.category],
		})),
		customData: `<language>en</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
