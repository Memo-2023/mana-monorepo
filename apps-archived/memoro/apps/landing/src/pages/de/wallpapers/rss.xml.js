import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const wallpapers = await getCollection('wallpapers');

	// Filtere nur deutsche und aktive Wallpapers
	const germanWallpapers = wallpapers
		.filter((wallpaper) => wallpaper.data.lang === 'de' && wallpaper.data.isActive)
		.sort((a, b) => {
			// Featured zuerst, dann nach order
			if (a.data.isFeatured !== b.data.isFeatured) {
				return b.data.isFeatured ? 1 : -1;
			}
			return a.data.order - b.data.order;
		});

	return rss({
		title: 'Memoro Wallpapers',
		description: 'Hintergrundbilder für Memoro',
		site: context.site,
		items: germanWallpapers.map((wallpaper) => ({
			title: wallpaper.data.title,
			pubDate: wallpaper.data.lastUpdated || new Date(),
			description: wallpaper.data.description,
			link: `/de/wallpapers/#${wallpaper.slug}`,
			categories: [wallpaper.data.category],
		})),
		customData: `<language>de</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
