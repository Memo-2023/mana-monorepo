import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const blueprints = await getCollection('blueprints');
  
  // Filtere nur deutsche und aktive Blueprints
  const germanBlueprints = blueprints
    .filter(blueprint => blueprint.data.lang === 'de' && blueprint.data.isActive)
    .sort((a, b) => a.data.order - b.data.order);

  return rss({
    title: 'Memoro Blueprints',
    description: 'Vorlagen und Baupläne für Memoro',
    site: context.site,
    items: germanBlueprints.map((blueprint) => ({
      title: blueprint.data.title,
      pubDate: blueprint.data.lastUpdated || new Date(),
      description: blueprint.data.description,
      link: `/de/blueprints/${blueprint.slug}/`,
    })),
    customData: `<language>de</language>`,
    stylesheet: '/rss/styles.xsl',
  });
}