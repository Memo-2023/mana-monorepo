import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  try {
    const features = await getCollection('features');
    
    // Filtere nur deutsche Features und stelle sicher, dass sie Titel und Beschreibung haben
    const germanFeatures = features
      .filter(feature => 
        feature.data.lang === 'de' && 
        feature.data.title && 
        feature.data.description
      )
      .sort((a, b) => (a.data.order || 999) - (b.data.order || 999));

    // Falls keine Features gefunden wurden, gib ein leeres RSS zurück
    if (germanFeatures.length === 0) {
      return rss({
        title: 'Memoro Features',
        description: 'Alle Funktionen von Memoro im Überblick',
        site: context.site,
        items: [],
        customData: `<language>de</language>`,
        stylesheet: '/rss/styles.xsl',
      });
    }

    return rss({
      title: 'Memoro Features',
      description: 'Alle Funktionen von Memoro im Überblick',
      site: context.site,
      items: germanFeatures.map((feature) => ({
        title: feature.data.title,
        pubDate: new Date(),
        description: feature.data.description,
        link: `/de/features/${feature.slug}/`,
        categories: feature.data.category ? [feature.data.category] : [],
      })),
      customData: `<language>de</language>`,
      stylesheet: '/rss/styles.xsl',
    });
  } catch (error) {
    console.error('Error generating features RSS:', error);
    // Return empty RSS on error
    return rss({
      title: 'Memoro Features',
      description: 'Alle Funktionen von Memoro im Überblick',
      site: context.site,
      items: [],
      customData: `<language>de</language>`,
      stylesheet: '/rss/styles.xsl',
    });
  }
}