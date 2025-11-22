import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const guides = await getCollection('guides');
  
  // Filtere nur deutsche Guides
  const germanGuides = guides
    .filter(guide => guide.data.lang === 'de')
    .sort((a, b) => b.data.lastUpdated.valueOf() - a.data.lastUpdated.valueOf());

  return rss({
    title: 'Memoro Anleitungen',
    description: 'Praktische Anleitungen und Tutorials für Memoro',
    site: context.site,
    items: germanGuides.map((guide) => ({
      title: guide.data.title,
      pubDate: guide.data.lastUpdated,
      description: guide.data.description,
      link: `/de/guides/${guide.slug}/`,
      categories: [guide.data.category, guide.data.difficulty],
    })),
    customData: `<language>de</language>`,
    stylesheet: '/rss/styles.xsl',
  });
}