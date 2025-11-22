import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const testimonials = await getCollection('testimonials');
  
  // Filtere nur deutsche Testimonials
  const germanTestimonials = testimonials
    .filter(testimonial => testimonial.data.lang === 'de')
    .sort((a, b) => a.data.order - b.data.order);

  return rss({
    title: 'Memoro Kundenstimmen',
    description: 'Was unsere Kunden über Memoro sagen',
    site: context.site,
    items: germanTestimonials.map((testimonial) => ({
      title: `${testimonial.data.name} - ${testimonial.data.company}`,
      pubDate: testimonial.data.lastUpdated || new Date(),
      description: testimonial.data.text,
      link: `/de/testimonials/#${testimonial.slug}`,
      author: `${testimonial.data.name}, ${testimonial.data.role}`,
      categories: [testimonial.data.type],
    })),
    customData: `<language>de</language>`,
    stylesheet: '/rss/styles.xsl',
  });
}