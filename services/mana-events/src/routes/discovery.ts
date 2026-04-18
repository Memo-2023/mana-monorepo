/**
 * Discovery CRUD routes — JWT-authenticated.
 *
 * Manages regions, interests, and sources for a user's event discovery setup.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { discoveryRegions, discoveryInterests, discoverySources } from '../db/schema/discovery';
import { EVENT_CATEGORIES } from '../discovery/types';
import { crawlSourceNow } from '../discovery/crawl-scheduler';
import { discoverSourcesForRegion } from '../discovery/source-discoverer';
import { BadRequestError, ForbiddenError, NotFoundError } from '../lib/errors';
import type { AuthUser } from '../middleware/jwt-auth';
import type { Config } from '../config';

// ─── Validation schemas ─────────────────────────────────────────────

const regionCreateSchema = z.object({
	label: z.string().min(1).max(200),
	lat: z.number().min(-90).max(90),
	lon: z.number().min(-180).max(180),
	radiusKm: z.number().int().min(1).max(200).optional(),
});

const regionUpdateSchema = z.object({
	label: z.string().min(1).max(200).optional(),
	radiusKm: z.number().int().min(1).max(200).optional(),
	isActive: z.boolean().optional(),
});

const interestCreateSchema = z.object({
	category: z.string().min(1).max(50),
	freetext: z.string().max(200).nullable().optional(),
	weight: z.number().min(0.1).max(5).optional(),
});

const sourceCreateSchema = z.object({
	type: z.enum(['ical', 'website']),
	url: z.string().url().max(2000),
	name: z.string().min(1).max(200),
	regionId: z.string().uuid(),
	crawlIntervalHours: z.number().int().min(1).max(168).optional(), // max 7 days
});

// ─── Routes ─────────────────────────────────────────────────────────

export function createDiscoveryRoutes(db: Database, config?: Config) {
	const app = new Hono<{ Variables: { user: AuthUser } }>();

	// ── Regions ──────────────────────────────────────────────────

	app.get('/regions', async (c) => {
		const user = c.get('user');
		const regions = await db
			.select()
			.from(discoveryRegions)
			.where(eq(discoveryRegions.userId, user.userId));
		return c.json({ regions });
	});

	app.post('/regions', async (c) => {
		const user = c.get('user');
		const body = await c.req.json().catch(() => null);
		const parsed = regionCreateSchema.safeParse(body);
		if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid');

		const [region] = await db
			.insert(discoveryRegions)
			.values({
				userId: user.userId,
				label: parsed.data.label,
				lat: parsed.data.lat,
				lon: parsed.data.lon,
				radiusKm: parsed.data.radiusKm ?? 25,
			})
			.returning();
		return c.json({ region }, 201);
	});

	app.put('/regions/:id', async (c) => {
		const user = c.get('user');
		const id = c.req.param('id');
		const body = await c.req.json().catch(() => null);
		const parsed = regionUpdateSchema.safeParse(body);
		if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid');

		const existing = await db
			.select()
			.from(discoveryRegions)
			.where(and(eq(discoveryRegions.id, id), eq(discoveryRegions.userId, user.userId)))
			.limit(1);
		if (!existing[0]) throw new NotFoundError('Region not found');

		const updates: Partial<typeof discoveryRegions.$inferInsert> = {};
		if (parsed.data.label !== undefined) updates.label = parsed.data.label;
		if (parsed.data.radiusKm !== undefined) updates.radiusKm = parsed.data.radiusKm;
		if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;

		const [region] = await db
			.update(discoveryRegions)
			.set(updates)
			.where(eq(discoveryRegions.id, id))
			.returning();
		return c.json({ region });
	});

	app.delete('/regions/:id', async (c) => {
		const user = c.get('user');
		const id = c.req.param('id');
		const existing = await db
			.select()
			.from(discoveryRegions)
			.where(and(eq(discoveryRegions.id, id), eq(discoveryRegions.userId, user.userId)))
			.limit(1);
		if (!existing[0]) throw new NotFoundError('Region not found');

		await db.delete(discoveryRegions).where(eq(discoveryRegions.id, id));
		return c.json({ deleted: true });
	});

	// ── Interests ────────────────────────────────────────────────

	app.get('/interests', async (c) => {
		const user = c.get('user');
		const interests = await db
			.select()
			.from(discoveryInterests)
			.where(eq(discoveryInterests.userId, user.userId));
		return c.json({ interests });
	});

	app.post('/interests', async (c) => {
		const user = c.get('user');
		const body = await c.req.json().catch(() => null);
		const parsed = interestCreateSchema.safeParse(body);
		if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid');

		const [interest] = await db
			.insert(discoveryInterests)
			.values({
				userId: user.userId,
				category: parsed.data.category,
				freetext: parsed.data.freetext ?? null,
				weight: parsed.data.weight ?? 1.0,
			})
			.returning();
		return c.json({ interest }, 201);
	});

	app.delete('/interests/:id', async (c) => {
		const user = c.get('user');
		const id = c.req.param('id');
		const existing = await db
			.select()
			.from(discoveryInterests)
			.where(and(eq(discoveryInterests.id, id), eq(discoveryInterests.userId, user.userId)))
			.limit(1);
		if (!existing[0]) throw new NotFoundError('Interest not found');

		await db.delete(discoveryInterests).where(eq(discoveryInterests.id, id));
		return c.json({ deleted: true });
	});

	// ── Sources ──────────────────────────────────────────────────

	app.get('/sources', async (c) => {
		const user = c.get('user');
		const sources = await db
			.select()
			.from(discoverySources)
			.where(eq(discoverySources.userId, user.userId));
		return c.json({ sources });
	});

	app.post('/sources', async (c) => {
		const user = c.get('user');
		const body = await c.req.json().catch(() => null);
		const parsed = sourceCreateSchema.safeParse(body);
		if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid');

		// Verify the region belongs to this user
		const region = await db
			.select()
			.from(discoveryRegions)
			.where(
				and(eq(discoveryRegions.id, parsed.data.regionId), eq(discoveryRegions.userId, user.userId))
			)
			.limit(1);
		if (!region[0]) throw new BadRequestError('Region not found');

		const [source] = await db
			.insert(discoverySources)
			.values({
				userId: user.userId,
				type: parsed.data.type,
				url: parsed.data.url,
				name: parsed.data.name,
				regionId: parsed.data.regionId,
				crawlIntervalHours: parsed.data.crawlIntervalHours ?? 24,
			})
			.returning();
		return c.json({ source }, 201);
	});

	app.delete('/sources/:id', async (c) => {
		const user = c.get('user');
		const id = c.req.param('id');
		const existing = await db
			.select()
			.from(discoverySources)
			.where(and(eq(discoverySources.id, id), eq(discoverySources.userId, user.userId)))
			.limit(1);
		if (!existing[0]) throw new NotFoundError('Source not found');

		await db.delete(discoverySources).where(eq(discoverySources.id, id));
		return c.json({ deleted: true });
	});

	// Trigger an immediate crawl for a source
	app.post('/sources/:id/crawl', async (c) => {
		const user = c.get('user');
		const id = c.req.param('id');
		const existing = await db
			.select()
			.from(discoverySources)
			.where(and(eq(discoverySources.id, id), eq(discoverySources.userId, user.userId)))
			.limit(1);
		if (!existing[0]) throw new NotFoundError('Source not found');

		const crawlConfig = config
			? { manaResearchUrl: config.manaResearchUrl, manaLlmUrl: config.manaLlmUrl }
			: undefined;
		const result = await crawlSourceNow(db, id, crawlConfig);
		return c.json(result);
	});

	// ── Source Discovery (Phase 2) ───────────────────────────────

	// Auto-discover event sources for a region via web search
	app.post('/regions/:id/discover-sources', async (c) => {
		const user = c.get('user');
		const regionId = c.req.param('id');
		if (!config) throw new BadRequestError('Source discovery not configured');

		const result = await discoverSourcesForRegion(
			db,
			regionId,
			user.userId,
			config.manaResearchUrl
		);
		return c.json(result);
	});

	// Activate a suggested source
	app.put('/sources/:id/activate', async (c) => {
		const user = c.get('user');
		const id = c.req.param('id');
		const existing = await db
			.select()
			.from(discoverySources)
			.where(and(eq(discoverySources.id, id), eq(discoverySources.userId, user.userId)))
			.limit(1);
		if (!existing[0]) throw new NotFoundError('Source not found');

		const [source] = await db
			.update(discoverySources)
			.set({ isActive: true, updatedAt: new Date() })
			.where(eq(discoverySources.id, id))
			.returning();

		// Trigger immediate crawl for the newly activated source
		const crawlConfig = config
			? { manaResearchUrl: config.manaResearchUrl, manaLlmUrl: config.manaLlmUrl }
			: undefined;
		crawlSourceNow(db, id, crawlConfig).catch(() => {});

		return c.json({ source });
	});

	// Reject a suggested source
	app.delete('/sources/:id/reject', async (c) => {
		const user = c.get('user');
		const id = c.req.param('id');
		const existing = await db
			.select()
			.from(discoverySources)
			.where(and(eq(discoverySources.id, id), eq(discoverySources.userId, user.userId)))
			.limit(1);
		if (!existing[0]) throw new NotFoundError('Source not found');

		await db.delete(discoverySources).where(eq(discoverySources.id, id));
		return c.json({ deleted: true });
	});

	return app;
}
