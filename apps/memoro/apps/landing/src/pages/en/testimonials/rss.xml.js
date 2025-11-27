import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const testimonials = await getCollection('testimonials');

	// Filter only English testimonials
	const englishTestimonials = testimonials
		.filter((testimonial) => testimonial.data.lang === 'en')
		.sort((a, b) => a.data.order - b.data.order);

	return rss({
		title: 'Memoro Testimonials',
		description: 'What our customers say about Memoro',
		site: context.site,
		items: englishTestimonials.map((testimonial) => ({
			title: `${testimonial.data.name} - ${testimonial.data.company}`,
			pubDate: testimonial.data.lastUpdated || new Date(),
			description: testimonial.data.text,
			link: `/en/testimonials/#${testimonial.slug}`,
			author: `${testimonial.data.name}, ${testimonial.data.role}`,
			categories: [testimonial.data.type],
		})),
		customData: `<language>en</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
