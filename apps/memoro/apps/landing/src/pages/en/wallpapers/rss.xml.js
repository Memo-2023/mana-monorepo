import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const wallpapers = await getCollection('wallpapers');

	// Filter only English and active wallpapers
	const englishWallpapers = wallpapers
		.filter((wallpaper) => wallpaper.data.lang === 'en' && wallpaper.data.isActive)
		.sort((a, b) => {
			// Featured first, then by order
			if (a.data.isFeatured !== b.data.isFeatured) {
				return b.data.isFeatured ? 1 : -1;
			}
			return a.data.order - b.data.order;
		});

	return rss({
		title: 'Memoro Wallpapers',
		description: 'Wallpapers for Memoro',
		site: context.site,
		items: englishWallpapers.map((wallpaper) => ({
			title: wallpaper.data.title,
			pubDate: wallpaper.data.lastUpdated || new Date(),
			description: wallpaper.data.description,
			link: `/en/wallpapers/#${wallpaper.slug}`,
			categories: [wallpaper.data.category],
		})),
		customData: `<language>en</language>`,
		stylesheet: '/rss/styles.xsl',
	});
}
