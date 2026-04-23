/**
 * Public form-submit endpoint — UNAUTHENTICATED.
 *
 * Flow:
 *   1. Look up the current published snapshot for this site
 *   2. Walk the snapshot blob to find the block, extract its form schema
 *   3. Validate incoming payload against declared fields (type + length
 *      + required)
 *   4. Honeypot check (the block renderer adds a hidden `_trap` field —
 *      if present and non-empty, silently 202 without recording)
 *   5. Rate-limit per IP (10 submissions / 5 minutes / site)
 *   6. Insert into website.submissions with status='received'
 *
 * M4 first-pass: target delivery is not wired. The owner sees
 * submissions in /website/[id]/submissions. Contacts / notify
 * forwarding is M4.x once server-side tool handlers exist.
 *
 * Security: this route runs BEFORE authMiddleware so anonymous visitors
 * can submit. Every bit of user-controlled input (site slug, block id,
 * payload) is treated as untrusted.
 */

import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { db, publishedSnapshots, submissions } from './schema';
import { websiteSubmissionsTotal } from '../../lib/metrics';

const routes = new Hono();

// Simple in-memory rate limit (per-IP, per-site, sliding window).
// Replace with Redis when the service scales horizontally (M7).
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 10;
const rateLimits = new Map<string, { count: number; windowStart: number }>();

function rateLimitHit(key: string): boolean {
	const now = Date.now();
	const bucket = rateLimits.get(key);
	if (!bucket || now - bucket.windowStart > RATE_WINDOW_MS) {
		rateLimits.set(key, { count: 1, windowStart: now });
		return false;
	}
	bucket.count += 1;
	return bucket.count > RATE_MAX;
}

interface SnapshotBlob {
	version: string;
	pages?: Array<{
		blocks?: SnapshotBlock[];
	}>;
}

interface SnapshotBlock {
	id: string;
	type: string;
	props: unknown;
	children?: SnapshotBlock[];
}

interface FormBlockProps {
	fields: Array<{
		name: string;
		label: string;
		type: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'number';
		required: boolean;
		maxLength: number;
	}>;
	target: 'inbox';
}

function findFormBlock(blob: SnapshotBlob, blockId: string): SnapshotBlock | null {
	const pages = blob.pages ?? [];
	for (const page of pages) {
		const hit = walk(page.blocks ?? [], blockId);
		if (hit) return hit;
	}
	return null;
}

function walk(blocks: SnapshotBlock[], blockId: string): SnapshotBlock | null {
	for (const block of blocks) {
		if (block.id === blockId) return block;
		if (block.children) {
			const hit = walk(block.children, blockId);
			if (hit) return hit;
		}
	}
	return null;
}

function isFormBlock(block: SnapshotBlock): block is SnapshotBlock & { props: FormBlockProps } {
	if (block.type !== 'form') return false;
	const props = block.props as Partial<FormBlockProps>;
	return Array.isArray(props?.fields);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(
	field: FormBlockProps['fields'][number],
	raw: unknown
): { ok: true; value: string } | { ok: false; error: string } {
	if (typeof raw !== 'string') {
		return { ok: false, error: `Feld "${field.name}" muss Text sein` };
	}
	const trimmed = raw.trim();
	if (field.required && trimmed.length === 0) {
		return { ok: false, error: `Pflichtfeld "${field.label}" fehlt` };
	}
	if (trimmed.length > field.maxLength) {
		return { ok: false, error: `Feld "${field.label}" ist zu lang` };
	}
	if (trimmed.length === 0) return { ok: true, value: '' };

	if (field.type === 'email' && !EMAIL_RE.test(trimmed)) {
		return { ok: false, error: `"${field.label}" ist keine gültige E-Mail` };
	}
	if (field.type === 'url') {
		try {
			new URL(trimmed);
		} catch {
			return { ok: false, error: `"${field.label}" ist keine gültige URL` };
		}
	}
	if (field.type === 'number' && !/^-?\d+(\.\d+)?$/.test(trimmed)) {
		return { ok: false, error: `"${field.label}" muss eine Zahl sein` };
	}
	return { ok: true, value: trimmed };
}

routes.post('/submit/:siteSlug/:blockId', async (c) => {
	const { siteSlug, blockId } = c.req.param();
	if (!siteSlug || !blockId) {
		return c.json({ error: 'siteSlug + blockId required' }, 400);
	}

	// Rate-limit. `cf-connecting-ip` + `x-forwarded-for` for proxied
	// deployments, fall back to a generic bucket if we can't find
	// anything (better than letting the bucket be "nothing").
	const ip =
		c.req.header('cf-connecting-ip') ??
		c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
		'unknown';
	if (rateLimitHit(`${siteSlug}:${ip}`)) {
		websiteSubmissionsTotal.inc({ result: 'rate_limit' });
		return c.json({ error: 'Rate limit überschritten — bitte später erneut versuchen' }, 429);
	}

	// Load current published snapshot to find the block schema. The
	// block definition lives IN the snapshot blob, not in a separate
	// table — this keeps the source of truth in one place and prevents
	// a block-edit race (site gets unpublished while a form is in the
	// middle of being submitted).
	const snapshotRow = await db
		.select({ blob: publishedSnapshots.blob, siteId: publishedSnapshots.siteId })
		.from(publishedSnapshots)
		.where(and(eq(publishedSnapshots.slug, siteSlug), eq(publishedSnapshots.isCurrent, true)))
		.limit(1);

	if (!snapshotRow[0]) {
		websiteSubmissionsTotal.inc({ result: 'not_found' });
		return c.json({ error: 'Website nicht gefunden oder offline' }, 404);
	}

	const block = findFormBlock(snapshotRow[0].blob as SnapshotBlob, blockId);
	if (!block) {
		websiteSubmissionsTotal.inc({ result: 'not_found' });
		return c.json({ error: 'Block nicht gefunden' }, 404);
	}
	if (!isFormBlock(block)) {
		websiteSubmissionsTotal.inc({ result: 'invalid' });
		return c.json({ error: 'Block ist kein Formular' }, 400);
	}

	const rawBody = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
	if (!rawBody || typeof rawBody !== 'object') {
		websiteSubmissionsTotal.inc({ result: 'invalid' });
		return c.json({ error: 'Payload fehlt oder ungültig' }, 400);
	}

	// Honeypot — the renderer names the trap input whatever value is in
	// `_trap`. For M4 it's the public `honeypot` field bound in the
	// Form renderer. We also look for a generic "_trap" key.
	const trap = rawBody.honeypot ?? rawBody._trap;
	if (typeof trap === 'string' && trap.trim().length > 0) {
		websiteSubmissionsTotal.inc({ result: 'spam' });
		// Act as success to the bot, store nothing.
		return c.json({ ok: true, spam: true }, 202);
	}

	// Validate every declared field. Ignore unknown keys the client
	// tried to sneak in.
	const cleaned: Record<string, string> = {};
	for (const field of block.props.fields) {
		const result = validateField(field, rawBody[field.name]);
		if (!result.ok) {
			websiteSubmissionsTotal.inc({ result: 'invalid' });
			return c.json({ error: result.error, field: field.name }, 400);
		}
		cleaned[field.name] = result.value;
	}

	const userAgent = c.req.header('user-agent') ?? null;

	const [row] = await db
		.insert(submissions)
		.values({
			siteId: snapshotRow[0].siteId,
			blockId,
			payload: cleaned,
			targetModule: 'inbox',
			targetAction: 'inbox',
			status: 'received',
			ip: ip === 'unknown' ? null : ip,
			userAgent: userAgent && userAgent.length > 500 ? userAgent.slice(0, 500) : userAgent,
		})
		.returning({ id: submissions.id });

	websiteSubmissionsTotal.inc({ result: 'received' });
	return c.json({ ok: true, submissionId: row?.id ?? null }, 201);
});

export const websiteSubmitRoutes = routes;
