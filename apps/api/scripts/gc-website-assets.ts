#!/usr/bin/env bun
/**
 * Website orphan-asset scan.
 *
 * Reports (M7 first-pass: read-only, no deletion) mana-media assets
 * scoped to `app=website` that are not referenced by any currently-
 * published snapshot or any non-scrubbed form submission. Older-than-30d
 * orphans are candidates for eventual deletion.
 *
 * Run with:
 *   bun apps/api/scripts/gc-website-assets.ts
 *
 * Exit codes:
 *   0 — scan completed, report printed
 *   1 — scan failed (DB / HTTP error)
 *
 * Switching to delete-mode is a separate commit — after we have 2–3
 * weeks of read-only reports in production showing the count is
 * stable and the candidate list looks right.
 */

import { promises as fs } from 'node:fs';
import postgres from 'postgres';

const DATABASE_URL =
	process.env.DATABASE_URL ?? 'postgresql://mana:devpassword@localhost:5432/mana_platform';

const MEDIA_URL = process.env.PUBLIC_MANA_MEDIA_URL ?? 'http://localhost:3015';

/** Grace period — orphans younger than this are kept (recently
 *  uploaded, likely about to be linked). */
const GRACE_MS = 30 * 24 * 60 * 60 * 1000;

// ── 1. Load every URL + mediaId referenced by a live snapshot ──

async function collectReferencedIds(sql: ReturnType<typeof postgres>): Promise<Set<string>> {
	const rows = await sql<{ blob: unknown }[]>`
		SELECT blob
		FROM website.published_snapshots
		WHERE is_current = TRUE
	`;
	const refs = new Set<string>();

	for (const row of rows) {
		walkAny(row.blob, (value) => {
			if (typeof value !== 'string') return;
			// mana-media URLs look like .../api/v1/media/{id}/file/{variant}.
			// Pull the id out with a narrow regex so we don't accidentally
			// match user-typed URLs that happen to contain `/media/`.
			const match = value.match(/\/api\/v1\/media\/([0-9a-f-]{36})\//i);
			if (match) refs.add(match[1]!.toLowerCase());
		});
	}

	// Submissions payloads don't typically contain media URLs, but
	// include them for completeness (a form might accept a file upload
	// in the future).
	const subs = await sql<{ payload: unknown }[]>`
		SELECT payload FROM website.submissions WHERE payload IS NOT NULL
	`;
	for (const row of subs) {
		walkAny(row.payload, (value) => {
			if (typeof value !== 'string') return;
			const match = value.match(/\/api\/v1\/media\/([0-9a-f-]{36})\//i);
			if (match) refs.add(match[1]!.toLowerCase());
		});
	}

	return refs;
}

function walkAny(value: unknown, visit: (v: unknown) => void): void {
	visit(value);
	if (!value || typeof value !== 'object') return;
	if (Array.isArray(value)) {
		for (const child of value) walkAny(child, visit);
		return;
	}
	for (const key of Object.keys(value as Record<string, unknown>)) {
		walkAny((value as Record<string, unknown>)[key], visit);
	}
}

// ── 2. Ask mana-media for every asset scoped to app=website ────

interface MediaListEntry {
	id: string;
	createdAt: string;
	filename?: string;
	size?: number;
}

async function listWebsiteMedia(): Promise<MediaListEntry[]> {
	const token = process.env.MANA_SERVICE_KEY;
	if (!token) {
		console.warn(
			'[gc] MANA_SERVICE_KEY not set — skipping mana-media listing. Report shows references only.'
		);
		return [];
	}
	try {
		const res = await fetch(`${MEDIA_URL}/api/v1/internal/media/list?app=website`, {
			headers: { 'X-Service-Key': token },
		});
		if (!res.ok) {
			console.warn(`[gc] mana-media list failed: ${res.status}`);
			return [];
		}
		const body = (await res.json()) as { items?: MediaListEntry[] };
		return body.items ?? [];
	} catch (err) {
		console.warn('[gc] mana-media unreachable', err);
		return [];
	}
}

// ── 3. Report ────────────────────────────────────────────────

async function main(): Promise<void> {
	const sql = postgres(DATABASE_URL, { max: 2 });
	try {
		console.log('[gc] scanning published_snapshots + submissions for media references…');
		const referenced = await collectReferencedIds(sql);
		console.log(`[gc] referenced mediaIds: ${referenced.size}`);

		console.log('[gc] listing mana-media items for app=website…');
		const media = await listWebsiteMedia();
		console.log(`[gc] media items in scope: ${media.length}`);

		if (media.length === 0) {
			console.log('[gc] nothing to compare — exiting.');
			return;
		}

		const now = Date.now();
		const orphans = media
			.filter((m) => !referenced.has(m.id.toLowerCase()))
			.filter((m) => now - new Date(m.createdAt).getTime() > GRACE_MS);

		console.log(
			`[gc] orphans older than 30d: ${orphans.length} / ${media.length} (${referenced.size} referenced)`
		);

		const report = {
			scannedAt: new Date().toISOString(),
			referencedCount: referenced.size,
			mediaCount: media.length,
			orphanCount: orphans.length,
			orphans: orphans.map((m) => ({
				id: m.id,
				createdAt: m.createdAt,
				filename: m.filename,
				size: m.size,
			})),
		};

		const out = `/tmp/gc-website-assets-${report.scannedAt.replace(/[:.]/g, '-')}.json`;
		await fs.writeFile(out, JSON.stringify(report, null, 2));
		console.log(`[gc] report written to ${out}`);

		// Head of the orphan list so ops can sanity-check at a glance.
		for (const o of orphans.slice(0, 10)) {
			console.log(`  ${o.id}  ${o.createdAt}  ${o.filename ?? ''}`);
		}
		if (orphans.length > 10) {
			console.log(`  … and ${orphans.length - 10} more (see report file)`);
		}
	} finally {
		await sql.end({ timeout: 2 });
	}
}

main().catch((err) => {
	console.error('[gc] scan failed', err);
	process.exit(1);
});
