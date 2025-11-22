import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const industries = await getCollection('industries');
  
  // Filter only English industries
  const englishIndustries = industries
    .filter(industry => industry.data.lang === 'en')
    .sort((a, b) => a.data.order - b.data.order);

  return rss({
    title: 'Memoro Industries',
    description: 'Memoro solutions for various industries',
    site: context.site,
    items: englishIndustries.map((industry) => ({
      title: industry.data.title,
      pubDate: new Date(),
      description: industry.data.description,
      link: `/en/industries/${industry.slug}/`,
    })),
    customData: `<language>en</language>`,
    stylesheet: '/rss/styles.xsl',
  });
}