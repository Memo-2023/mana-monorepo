import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const memories = await getCollection('memories');
  
  // Filter only English and active memories
  const englishMemories = memories
    .filter(memory => memory.data.lang === 'en' && memory.data.isActive)
    .sort((a, b) => a.data.order - b.data.order);

  return rss({
    title: 'Memoro Memories',
    description: 'Memories and stories with Memoro',
    site: context.site,
    items: englishMemories.map((memory) => ({
      title: memory.data.title,
      pubDate: memory.data.lastUpdated || new Date(),
      description: memory.data.description,
      link: `/en/memories/${memory.slug}/`,
      categories: [memory.data.category],
    })),
    customData: `<language>en</language>`,
    stylesheet: '/rss/styles.xsl',
  });
}