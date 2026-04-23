/**
 * Publish + unpublish endpoints.
 *
 * Scoped to *authenticated* users who can publish their own site. The
 * public read path lives in `public-routes.ts` and is mounted outside
 * the auth gate.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import type { AuthVariables } from '@mana/shared-hono';
import { errorResponse, validationError } from '../../lib/responses';
import { db, publishedSnapshots, submissions } from './schema';
import { isValidSlug } from './reserved-slugs';

const routes = new Hono<{ Variables: AuthVariables }>();

// Permissive schema — block props are client-trusted in M2; server-side
// Zod validation per block spec arrives in a later phase (see plan D8).
const SnapshotBlockSchema: z.ZodType<unknown> = z.lazy(() =>
	z.object({
		id: z.string().uuid(),
		type: z.string().min(1).max(64),
		schemaVersion: z.number().int().min(1),
		slotKey: z.string().max(64).nullable(),
		props: z.unknown(),
		children: z.array(SnapshotBlockSchema),
	})
);

const SnapshotPageSchema = z.object({
	id: z.string().uuid(),
	path: z.string().min(1).max(256),
	title: z.string().min(1).max(256),
	seo: z
		.object({
			title: z.string().max(256).optional(),
			description: z.string().max(1024).optional(),
			ogImage: z.string().max(1024).optional(),
			noindex: z.boolean().optional(),
		})
		.passthrough(),
	blocks: z.array(SnapshotBlockSchema),
});

const SnapshotSiteSchema = z.object({
	id: z.string().uuid(),
	slug: z.string().min(2).max(40),
	name: z.string().min(1).max(128),
	theme: z.unknown(),
	navConfig: z.unknown(),
	footerConfig: z.unknown(),
	settings: z.unknown(),
});

const DraftSnapshotSchema = z.object({
	version: z.literal('1'),
	site: SnapshotSiteSchema,
	pages: z.array(SnapshotPageSchema).min(1),
});

// ─── POST /sites/:id/publish ────────────────────────────

routes.post('/sites/:id/publish', async (c) => {
	const userId = c.get('userId');
	// Space id flows in via an explicit header (mana-auth doesn't yet
	// embed the active space in JWT claims). Nullable — full membership
	// check lands in M6; M2 stores whatever the client declares.
	const spaceIdHeader = c.req.header('X-Mana-Space');
	const spaceId = spaceIdHeader && /^[0-9a-f-]{36}$/i.test(spaceIdHeader) ? spaceIdHeader : null;
	const siteId = c.req.param('id');

	if (!siteId) return errorResponse(c, 'siteId required', 400);

	const parsed = DraftSnapshotSchema.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success) return validationError(c, parsed.error.issues);

	const draft = parsed.data;
	if (draft.site.id !== siteId) {
		return errorResponse(c, 'Site id mismatch between path and body', 400, {
			code: 'SITE_ID_MISMATCH',
		});
	}
	if (!isValidSlug(draft.site.slug)) {
		return errorResponse(c, `Slug "${draft.site.slug}" is invalid or reserved`, 400, {
			code: 'INVALID_SLUG',
		});
	}

	// Check slug conflict: is another site currently published with this slug?
	const conflicting = await db
		.select({ id: publishedSnapshots.id, siteId: publishedSnapshots.siteId })
		.from(publishedSnapshots)
		.where(
			and(eq(publishedSnapshots.slug, draft.site.slug), eq(publishedSnapshots.isCurrent, true))
		)
		.limit(1);
	if (conflicting[0] && conflicting[0].siteId !== siteId) {
		return errorResponse(
			c,
			`Slug "${draft.site.slug}" is already taken by another published site`,
			409,
			{ code: 'SLUG_TAKEN' }
		);
	}

	// Atomic flip: old→false, new→true. The partial unique index on
	// (slug WHERE is_current=true) catches any concurrent publishers
	// racing for the same slug.
	const now = new Date().toISOString();
	const blob = {
		...draft,
		publishedAt: now,
		publishedBy: userId,
	};

	try {
		const result = await db.transaction(async (tx) => {
			await tx
				.update(publishedSnapshots)
				.set({ isCurrent: false })
				.where(and(eq(publishedSnapshots.siteId, siteId), eq(publishedSnapshots.isCurrent, true)));

			const [row] = await tx
				.insert(publishedSnapshots)
				.values({
					siteId,
					slug: draft.site.slug,
					blob,
					isCurrent: true,
					publishedBy: userId,
					spaceId,
				})
				.returning({ id: publishedSnapshots.id, publishedAt: publishedSnapshots.publishedAt });

			return row;
		});

		if (!result) throw new Error('Insert returned no row');

		return c.json(
			{
				snapshotId: result.id,
				publishedAt: result.publishedAt.toISOString(),
				publicUrl: `/s/${draft.site.slug}`,
			},
			201
		);
	} catch (err) {
		// Postgres unique-constraint violation → slug conflict we didn't
		// catch in the pre-check (classic race).
		if (err instanceof Error && /unique/i.test(err.message)) {
			return errorResponse(c, `Slug "${draft.site.slug}" was taken by a concurrent publish`, 409, {
				code: 'SLUG_TAKEN',
			});
		}
		throw err;
	}
});

// ─── POST /sites/:id/unpublish ──────────────────────────

routes.post('/sites/:id/unpublish', async (c) => {
	const siteId = c.req.param('id');
	if (!siteId) return errorResponse(c, 'siteId required', 400);

	const updated = await db
		.update(publishedSnapshots)
		.set({ isCurrent: false })
		.where(and(eq(publishedSnapshots.siteId, siteId), eq(publishedSnapshots.isCurrent, true)))
		.returning({ id: publishedSnapshots.id });

	if (updated.length === 0) {
		return errorResponse(c, 'No current snapshot to unpublish', 404, {
			code: 'NOT_PUBLISHED',
		});
	}

	return c.json({ unpublished: updated.length });
});

// ─── GET /sites/:id/snapshots ───────────────────────────
// Rollback-list: the last 10 snapshots of this site, newest first.

routes.get('/sites/:id/snapshots', async (c) => {
	const siteId = c.req.param('id');
	if (!siteId) return errorResponse(c, 'siteId required', 400);

	const rows = await db
		.select({
			id: publishedSnapshots.id,
			publishedAt: publishedSnapshots.publishedAt,
			publishedBy: publishedSnapshots.publishedBy,
			isCurrent: publishedSnapshots.isCurrent,
			slug: publishedSnapshots.slug,
		})
		.from(publishedSnapshots)
		.where(eq(publishedSnapshots.siteId, siteId))
		.orderBy(desc(publishedSnapshots.publishedAt))
		.limit(10);

	return c.json({
		snapshots: rows.map((r) => ({
			id: r.id,
			publishedAt: r.publishedAt.toISOString(),
			publishedBy: r.publishedBy,
			isCurrent: r.isCurrent,
			slug: r.slug,
		})),
	});
});

// ─── POST /sites/:id/rollback/:snapshotId ──────────────
// Flip is_current to point at a historical snapshot.

routes.post('/sites/:id/rollback/:snapshotId', async (c) => {
	const siteId = c.req.param('id');
	const snapshotId = c.req.param('snapshotId');
	if (!siteId || !snapshotId) return errorResponse(c, 'siteId and snapshotId required', 400);

	// Verify the snapshot belongs to this site.
	const target = await db
		.select({ id: publishedSnapshots.id, slug: publishedSnapshots.slug })
		.from(publishedSnapshots)
		.where(and(eq(publishedSnapshots.id, snapshotId), eq(publishedSnapshots.siteId, siteId)))
		.limit(1);
	if (!target[0]) {
		return errorResponse(c, 'Snapshot not found for this site', 404, { code: 'NOT_FOUND' });
	}

	await db.transaction(async (tx) => {
		await tx
			.update(publishedSnapshots)
			.set({ isCurrent: false })
			.where(and(eq(publishedSnapshots.siteId, siteId), eq(publishedSnapshots.isCurrent, true)));
		await tx
			.update(publishedSnapshots)
			.set({ isCurrent: true })
			.where(eq(publishedSnapshots.id, snapshotId));
	});

	return c.json({ rolledBack: true, slug: target[0].slug });
});

// ─── GET /sites/:id/submissions ─────────────────────────
// Owner-only list of inbox submissions for a site.

routes.get('/sites/:id/submissions', async (c) => {
	const siteId = c.req.param('id');
	if (!siteId) return errorResponse(c, 'siteId required', 400);

	const rows = await db
		.select({
			id: submissions.id,
			siteId: submissions.siteId,
			blockId: submissions.blockId,
			payload: submissions.payload,
			targetModule: submissions.targetModule,
			status: submissions.status,
			errorMessage: submissions.errorMessage,
			createdAt: submissions.createdAt,
		})
		.from(submissions)
		.where(eq(submissions.siteId, siteId))
		.orderBy(desc(submissions.createdAt))
		.limit(200);

	return c.json({
		submissions: rows.map((r) => ({
			id: r.id,
			blockId: r.blockId,
			payload: r.payload,
			targetModule: r.targetModule,
			status: r.status,
			errorMessage: r.errorMessage,
			createdAt: r.createdAt.toISOString(),
		})),
	});
});

// ─── DELETE /sites/:id/submissions/:submissionId ───────

routes.delete('/sites/:id/submissions/:submissionId', async (c) => {
	const siteId = c.req.param('id');
	const submissionId = c.req.param('submissionId');
	if (!siteId || !submissionId) {
		return errorResponse(c, 'siteId + submissionId required', 400);
	}

	const deleted = await db
		.delete(submissions)
		.where(and(eq(submissions.id, submissionId), eq(submissions.siteId, siteId)))
		.returning({ id: submissions.id });

	if (deleted.length === 0) {
		return errorResponse(c, 'Submission not found', 404, { code: 'NOT_FOUND' });
	}

	return c.json({ deleted: true });
});

export const websitePublishRoutes = routes;
