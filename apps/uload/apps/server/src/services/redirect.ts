import { eq, sql } from 'drizzle-orm';
import { links, clicks } from '@manacore/uload-database';
import type { Database } from '../db/connection';

export class RedirectService {
	constructor(private db: Database) {}

	async resolve(shortCode: string) {
		const [link] = await this.db
			.select({
				id: links.id,
				originalUrl: links.originalUrl,
				isActive: links.isActive,
				password: links.password,
				maxClicks: links.maxClicks,
				clickCount: links.clickCount,
				expiresAt: links.expiresAt,
			})
			.from(links)
			.where(eq(links.shortCode, shortCode))
			.limit(1);

		if (!link) return null;
		if (!link.isActive) return null;
		if (link.expiresAt && new Date(link.expiresAt) < new Date()) return null;
		if (link.maxClicks && link.clickCount && link.clickCount >= link.maxClicks) return null;

		return link;
	}

	async trackClick(
		linkId: string,
		meta: {
			ipHash?: string;
			userAgent?: string;
			referer?: string;
			browser?: string;
			deviceType?: string;
			os?: string;
			country?: string;
		}
	) {
		await Promise.all([
			this.db.insert(clicks).values({
				linkId,
				ipHash: meta.ipHash,
				userAgent: meta.userAgent,
				referer: meta.referer,
				browser: meta.browser,
				deviceType: meta.deviceType,
				os: meta.os,
				country: meta.country,
			}),
			this.db
				.update(links)
				.set({ clickCount: sql`${links.clickCount} + 1` })
				.where(eq(links.id, linkId)),
		]);
	}
}
