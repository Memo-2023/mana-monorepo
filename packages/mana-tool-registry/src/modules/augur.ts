/**
 * Augur — sign capture (omens, fortunes, hunches), resolution, and the
 * deterministic Living-Oracle / year-recap reflections.
 *
 * Five tools:
 *   - augur.captureSign     (write) — log a new sign
 *   - augur.resolveSign     (write) — mark an open sign as fulfilled / partly /
 *                                     not-fulfilled
 *   - augur.listOpenSigns   (read)  — what the user is still waiting on
 *   - augur.consultOracle   (read)  — Living Oracle reflection from history
 *   - augur.yearRecap       (read)  — structured year-in-review snapshot
 *
 * Encrypted fields mirror the web-app registry:
 *   source / claim / feltMeaning / expectedOutcome / outcomeNote / tags /
 *   livingOracleSnapshot
 *
 * The pure-math engines (calibration, living-oracle, year-recap) are
 * **mirrored from** apps/mana/apps/web/src/lib/modules/augur/lib/. Both
 * sides must drift together — the web app has 65 unit tests covering
 * the same contract; if you change one side, sync the other or extract
 * a shared package.
 */

import { z } from 'zod';
import { decryptRecordFields, encryptRecordFields } from '@mana/shared-crypto';
import { pullAll, push, pushInsert } from '../sync-client.ts';
import { registerTool } from '../registry.ts';
import type { ToolContext, ToolSpec } from '../types.ts';

const APP_ID = 'augur';
const TABLE = 'augurEntries';
const ENCRYPTED_FIELDS = [
	'source',
	'claim',
	'feltMeaning',
	'expectedOutcome',
	'outcomeNote',
	'tags',
	'livingOracleSnapshot',
] as const;

const SYNC_URL = () => process.env.MANA_SYNC_URL ?? 'http://localhost:3050';
const CLIENT_ID = () => process.env.MANA_MCP_CLIENT_ID ?? 'mana-mcp';

function syncCfg(ctx: ToolContext) {
	return { baseUrl: SYNC_URL(), jwt: ctx.jwt, clientId: CLIENT_ID() };
}

// ─── Domain shapes (zod) ──────────────────────────────────────────

const KIND = z.enum(['omen', 'fortune', 'hunch']);
type Kind = z.infer<typeof KIND>;

const VIBE = z.enum(['good', 'bad', 'mysterious']);
type Vibe = z.infer<typeof VIBE>;

type Outcome = 'open' | 'fulfilled' | 'partly' | 'not-fulfilled';

const SOURCE_CATEGORY = z.enum([
	'gut',
	'tarot',
	'horoscope',
	'fortune-cookie',
	'iching',
	'dream',
	'person',
	'media',
	'natural',
	'other',
]);
type SourceCategory = z.infer<typeof SOURCE_CATEGORY>;

interface RawEntry {
	id?: string;
	kind?: string;
	source?: string;
	sourceCategory?: string;
	claim?: string;
	vibe?: string;
	feltMeaning?: string | null;
	expectedOutcome?: string | null;
	expectedBy?: string | null;
	probability?: number | null;
	outcome?: string;
	outcomeNote?: string | null;
	resolvedAt?: string | null;
	encounteredAt?: string;
	tags?: string[];
	livingOracleSnapshot?: string | null;
	isArchived?: boolean;
	deletedAt?: string | null;
	spaceId?: string | null;
	updatedAt?: string;
	visibility?: string;
}

interface Entry {
	id: string;
	kind: Kind;
	source: string;
	sourceCategory: SourceCategory;
	claim: string;
	vibe: Vibe;
	feltMeaning: string | null;
	expectedOutcome: string | null;
	expectedBy: string | null;
	probability: number | null;
	outcome: Outcome;
	outcomeNote: string | null;
	resolvedAt: string | null;
	encounteredAt: string;
	tags: string[];
	livingOracleSnapshot: string | null;
}

function fromRaw(row: RawEntry): Entry | null {
	if (!row.id || !row.kind || !row.source || !row.claim) return null;
	if (!row.encounteredAt) return null;
	return {
		id: row.id,
		kind: row.kind as Kind,
		source: row.source,
		sourceCategory: (row.sourceCategory as SourceCategory) ?? 'other',
		claim: row.claim,
		vibe: (row.vibe as Vibe) ?? 'mysterious',
		feltMeaning: row.feltMeaning ?? null,
		expectedOutcome: row.expectedOutcome ?? null,
		expectedBy: row.expectedBy ?? null,
		probability: row.probability ?? null,
		outcome: (row.outcome as Outcome) ?? 'open',
		outcomeNote: row.outcomeNote ?? null,
		resolvedAt: row.resolvedAt ?? null,
		encounteredAt: row.encounteredAt,
		tags: row.tags ?? [],
		livingOracleSnapshot: row.livingOracleSnapshot ?? null,
	};
}

async function loadAllEntries(ctx: ToolContext): Promise<Entry[]> {
	const key = await ctx.getMasterKey();
	const res = await pullAll<RawEntry>(syncCfg(ctx), APP_ID, TABLE);
	const alive = res.changes
		.filter((c) => c.op !== 'delete' && c.data)
		.map((c) => c.data as RawEntry)
		.filter((row) => !row.deletedAt && !row.isArchived)
		.filter((row) => row.spaceId === ctx.spaceId);
	const decrypted = (await Promise.all(
		alive.map((row) =>
			decryptRecordFields(row as unknown as Record<string, unknown>, ENCRYPTED_FIELDS, key)
		)
	)) as unknown as RawEntry[];
	return decrypted.map(fromRaw).filter((e): e is Entry => e !== null);
}

// ─── Pure-math engines (MIRROR of web-app lib/) ──────────────────
//
// Mirror these with apps/mana/apps/web/src/lib/modules/augur/lib/. Both
// sides have unit tests. Any edit here needs the same edit there.

const LIVING_ORACLE_COLD_START_MIN = 50;
const LIVING_ORACLE_MIN_MATCHES = 3;
const LIVING_ORACLE_MIN_SCORE = 2;

const STOP_WORDS = new Set([
	'oder',
	'aber',
	'doch',
	'eine',
	'einer',
	'einen',
	'eines',
	'einem',
	'wenn',
	'dann',
	'noch',
	'sehr',
	'mehr',
	'auch',
	'durch',
	'ueber',
	'unter',
	'gegen',
	'sich',
	'haben',
	'hatte',
	'sein',
	'sind',
	'wird',
	'wurde',
	'kann',
	'koennen',
	'wie',
	'was',
	'warum',
	'wann',
	'wer',
	'this',
	'that',
	'have',
	'with',
	'from',
	'they',
	'will',
	'been',
	'were',
	'when',
	'what',
	'just',
]);

function extractKeywords(text: string): Set<string> {
	return new Set(
		text
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[^a-z0-9\säöüß]/g, ' ')
			.split(/\s+/)
			.filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
	);
}

interface Fingerprint {
	kind: Kind;
	sourceCategory: SourceCategory;
	vibe: Vibe;
	tags: Set<string>;
	keywords: Set<string>;
}

function fingerprint(input: {
	kind?: Kind | null;
	sourceCategory?: SourceCategory | null;
	vibe?: Vibe | null;
	tags?: string[] | null;
	source?: string | null;
	claim?: string | null;
}): Fingerprint | null {
	if (!input.kind || !input.sourceCategory || !input.vibe) return null;
	return {
		kind: input.kind,
		sourceCategory: input.sourceCategory,
		vibe: input.vibe,
		tags: new Set((input.tags ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean)),
		keywords: extractKeywords([input.source, input.claim].filter(Boolean).join(' ')),
	};
}

function intersects<T>(a: Set<T>, b: Set<T>): boolean {
	if (a.size === 0 || b.size === 0) return false;
	const [small, big] = a.size <= b.size ? [a, b] : [b, a];
	for (const x of small) if (big.has(x)) return true;
	return false;
}

function matchScore(a: Fingerprint, b: Fingerprint): number {
	let s = 0;
	if (a.kind === b.kind) s++;
	if (a.sourceCategory === b.sourceCategory) s++;
	if (a.vibe === b.vibe) s++;
	if (intersects(a.tags, b.tags)) s++;
	if (intersects(a.keywords, b.keywords)) s++;
	return s;
}

function outcomeValue(o: Outcome): number | null {
	if (o === 'fulfilled') return 1;
	if (o === 'partly') return 0.5;
	if (o === 'not-fulfilled') return 0;
	return null;
}

function isScored(e: Entry): boolean {
	return outcomeValue(e.outcome) != null;
}

interface OracleMatchSet {
	n: number;
	hitRate: number;
	fulfilled: number;
	partly: number;
	notFulfilled: number;
}

function findMatches(input: Fingerprint, history: Entry[]): OracleMatchSet {
	const matches: Entry[] = [];
	for (const e of history) {
		if (!isScored(e)) continue;
		const fp = fingerprint(e);
		if (!fp) continue;
		if (matchScore(input, fp) >= LIVING_ORACLE_MIN_SCORE) matches.push(e);
	}
	let weighted = 0;
	let fulfilled = 0;
	let partly = 0;
	let notFulfilled = 0;
	for (const m of matches) {
		const v = outcomeValue(m.outcome) ?? 0;
		weighted += v;
		if (m.outcome === 'fulfilled') fulfilled++;
		else if (m.outcome === 'partly') partly++;
		else if (m.outcome === 'not-fulfilled') notFulfilled++;
	}
	return {
		n: matches.length,
		hitRate: matches.length > 0 ? weighted / matches.length : 0,
		fulfilled,
		partly,
		notFulfilled,
	};
}

function shouldSpeak(historyTotal: number, set: OracleMatchSet): boolean {
	if (historyTotal < LIVING_ORACLE_COLD_START_MIN) return false;
	return set.n >= LIVING_ORACLE_MIN_MATCHES;
}

function makeReflection(set: OracleMatchSet): string | null {
	if (set.n < LIVING_ORACLE_MIN_MATCHES) return null;
	const pct = Math.round(set.hitRate * 100);
	const parts: string[] = [];
	parts.push(`Du hast ${set.n} aehnliche Zeichen schon einmal protokolliert.`);
	const breakdown: string[] = [];
	if (set.fulfilled) breakdown.push(`${set.fulfilled} eingetreten`);
	if (set.partly) breakdown.push(`${set.partly} teilweise`);
	if (set.notFulfilled) breakdown.push(`${set.notFulfilled} nicht eingetreten`);
	if (breakdown.length > 0) parts.push(`Davon: ${breakdown.join(', ')}.`);
	parts.push(`Trefferquote bei aehnlichen Mustern: ${pct}%.`);
	return parts.join(' ');
}

// ─── augur.captureSign ─────────────────────────────────────────────

const captureInput = z.object({
	kind: KIND,
	source: z.string().min(1).max(500),
	claim: z.string().min(1).max(2000),
	sourceCategory: SOURCE_CATEGORY.default('other'),
	vibe: VIBE.default('mysterious'),
	feltMeaning: z.string().max(2000).nullable().default(null),
	expectedOutcome: z.string().max(2000).nullable().default(null),
	expectedBy: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.nullable()
		.default(null),
	probability: z.number().min(0).max(1).nullable().default(null),
	tags: z.array(z.string()).default([]),
	encounteredAt: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
});

const captureOutput = z.object({
	entryId: z.string(),
	kind: KIND,
	source: z.string(),
});

export const augurCaptureSign: ToolSpec<typeof captureInput, typeof captureOutput> = {
	name: 'augur.captureSign',
	module: 'augur',
	scope: 'user-space',
	policyHint: 'write',
	description:
		'Log a new sign in the Augur module — an omen (external sign), fortune (read/cast aussage), or hunch (gut feeling). Defaults: vibe = "mysterious", encounteredAt = today, outcome starts "open" so the user can resolve it later. Source/claim/feltMeaning/expectedOutcome/tags travel encrypted.',
	input: captureInput,
	output: captureOutput,
	encryptedFields: { table: TABLE, fields: ENCRYPTED_FIELDS },
	async handler(input, ctx) {
		const key = await ctx.getMasterKey();
		const id = crypto.randomUUID();
		const now = new Date();
		const today = now.toISOString().slice(0, 10);
		const plaintext: Record<string, unknown> = {
			id,
			kind: input.kind,
			source: input.source,
			sourceCategory: input.sourceCategory,
			claim: input.claim,
			vibe: input.vibe,
			feltMeaning: input.feltMeaning,
			expectedOutcome: input.expectedOutcome,
			expectedBy: input.expectedBy,
			probability: input.probability,
			outcome: 'open',
			outcomeNote: null,
			resolvedAt: null,
			encounteredAt: input.encounteredAt ?? today,
			tags: input.tags,
			relatedDreamId: null,
			relatedDecisionId: null,
			livingOracleSnapshot: null,
			isPrivate: true,
			isArchived: false,
			visibility: 'private',
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
		};
		const encrypted = await encryptRecordFields(plaintext, ENCRYPTED_FIELDS, key);
		await pushInsert(syncCfg(ctx), APP_ID, {
			table: TABLE,
			id,
			spaceId: ctx.spaceId,
			data: encrypted,
		});
		ctx.logger.info('augur.captureSign', { entryId: id, kind: input.kind });
		return { entryId: id, kind: input.kind, source: input.source };
	},
};

// ─── augur.resolveSign ─────────────────────────────────────────────

const resolveInput = z.object({
	entryId: z.string(),
	outcome: z.enum(['fulfilled', 'partly', 'not-fulfilled']),
	note: z.string().max(2000).nullable().default(null),
});

const resolveOutput = z.object({
	entryId: z.string(),
	outcome: z.enum(['fulfilled', 'partly', 'not-fulfilled']),
});

export const augurResolveSign: ToolSpec<typeof resolveInput, typeof resolveOutput> = {
	name: 'augur.resolveSign',
	module: 'augur',
	scope: 'user-space',
	policyHint: 'write',
	description:
		"Resolve an open augur entry — mark whether it came true (fulfilled / partly / not-fulfilled). Optional note carries the user's own write-up of how it actually went; encrypted at rest.",
	input: resolveInput,
	output: resolveOutput,
	encryptedFields: { table: TABLE, fields: ENCRYPTED_FIELDS },
	async handler(input, ctx) {
		const key = await ctx.getMasterKey();
		const now = new Date().toISOString();
		const patch = (await encryptRecordFields(
			{ outcomeNote: input.note } as Record<string, unknown>,
			['outcomeNote'] as const,
			key
		)) as Record<string, unknown>;

		await push(syncCfg(ctx), APP_ID, [
			{
				table: TABLE,
				id: input.entryId,
				op: 'update',
				spaceId: ctx.spaceId,
				fields: {
					outcome: { value: input.outcome, updatedAt: now },
					outcomeNote: { value: patch.outcomeNote, updatedAt: now },
					resolvedAt: { value: now, updatedAt: now },
					updatedAt: { value: now, updatedAt: now },
				},
			},
		]);
		ctx.logger.info('augur.resolveSign', { entryId: input.entryId, outcome: input.outcome });
		return { entryId: input.entryId, outcome: input.outcome };
	},
};

// ─── augur.listOpenSigns ───────────────────────────────────────────

const listInput = z.object({
	kind: KIND.optional(),
	limit: z.number().int().positive().max(100).default(30),
});

const listOutput = z.object({
	entries: z.array(
		z.object({
			id: z.string(),
			kind: KIND,
			source: z.string(),
			claim: z.string(),
			vibe: VIBE,
			encounteredAt: z.string(),
			expectedBy: z.string().nullable(),
		})
	),
});

export const augurListOpenSigns: ToolSpec<typeof listInput, typeof listOutput> = {
	name: 'augur.listOpenSigns',
	module: 'augur',
	scope: 'user-space',
	policyHint: 'read',
	description:
		'List augur entries still waiting on resolution (outcome = open). Sorted by reminder date (expectedBy if set, else encounteredAt + 30 days). Filter by `kind` to focus on omens/fortunes/hunches.',
	input: listInput,
	output: listOutput,
	encryptedFields: { table: TABLE, fields: ENCRYPTED_FIELDS },
	async handler(input, ctx) {
		const all = await loadAllEntries(ctx);
		const open = all
			.filter((e) => e.outcome === 'open')
			.filter((e) => (input.kind ? e.kind === input.kind : true))
			.sort((a, b) =>
				(a.expectedBy ?? a.encounteredAt).localeCompare(b.expectedBy ?? b.encounteredAt)
			)
			.slice(0, input.limit);
		ctx.logger.info('augur.listOpenSigns', { count: open.length });
		return {
			entries: open.map((e) => ({
				id: e.id,
				kind: e.kind,
				source: e.source,
				claim: e.claim,
				vibe: e.vibe,
				encounteredAt: e.encounteredAt,
				expectedBy: e.expectedBy,
			})),
		};
	},
};

// ─── augur.consultOracle ───────────────────────────────────────────

const consultInput = z.object({
	kind: KIND,
	sourceCategory: SOURCE_CATEGORY,
	vibe: VIBE,
	source: z.string().max(500).optional(),
	claim: z.string().max(2000).optional(),
	tags: z.array(z.string()).default([]),
});

const consultOutput = z.object({
	speaks: z.boolean(),
	reflection: z.string().nullable(),
	matches: z.number().int().nonnegative(),
	hitRate: z.number(),
	breakdown: z.object({
		fulfilled: z.number().int().nonnegative(),
		partly: z.number().int().nonnegative(),
		notFulfilled: z.number().int().nonnegative(),
	}),
	thresholds: z.object({
		coldStart: z.number().int().nonnegative(),
		minMatches: z.number().int().nonnegative(),
		historyTotal: z.number().int().nonnegative(),
	}),
});

export const augurConsultOracle: ToolSpec<typeof consultInput, typeof consultOutput> = {
	name: 'augur.consultOracle',
	module: 'augur',
	scope: 'user-space',
	policyHint: 'read',
	description:
		"Consult the deterministic Living Oracle: given a hypothetical sign's shape (kind/sourceCategory/vibe + optional source/claim/tags for keyword matching), return what happened to similar resolved signs in the user's own history. Stays silent below 50 resolved entries (cold-start) or below 3 matches.",
	input: consultInput,
	output: consultOutput,
	encryptedFields: { table: TABLE, fields: ENCRYPTED_FIELDS },
	async handler(input, ctx) {
		const history = await loadAllEntries(ctx);
		const fp = fingerprint({
			kind: input.kind,
			sourceCategory: input.sourceCategory,
			vibe: input.vibe,
			tags: input.tags,
			source: input.source ?? null,
			claim: input.claim ?? null,
		});
		if (!fp) {
			throw new Error('Could not build fingerprint from input');
		}
		const set = findMatches(fp, history);
		const speaks = shouldSpeak(history.length, set);
		const reflection = speaks ? makeReflection(set) : null;
		ctx.logger.info('augur.consultOracle', {
			matches: set.n,
			speaks,
			historyTotal: history.length,
		});
		return {
			speaks,
			reflection,
			matches: set.n,
			hitRate: set.hitRate,
			breakdown: {
				fulfilled: set.fulfilled,
				partly: set.partly,
				notFulfilled: set.notFulfilled,
			},
			thresholds: {
				coldStart: LIVING_ORACLE_COLD_START_MIN,
				minMatches: LIVING_ORACLE_MIN_MATCHES,
				historyTotal: history.length,
			},
		};
	},
};

// ─── augur.yearRecap ───────────────────────────────────────────────

const recapInput = z.object({
	year: z.number().int().min(2000).max(2100).optional(),
});

const recapOutput = z.object({
	year: z.number().int(),
	total: z.number().int().nonnegative(),
	resolved: z.number().int().nonnegative(),
	open: z.number().int().nonnegative(),
	hitRate: z.number().nullable(),
	byKind: z.object({
		omen: z.number().int().nonnegative(),
		fortune: z.number().int().nonnegative(),
		hunch: z.number().int().nonnegative(),
	}),
	byVibe: z.object({
		good: z.number().int().nonnegative(),
		bad: z.number().int().nonnegative(),
		mysterious: z.number().int().nonnegative(),
	}),
	byOutcome: z.object({
		open: z.number().int().nonnegative(),
		fulfilled: z.number().int().nonnegative(),
		partly: z.number().int().nonnegative(),
		'not-fulfilled': z.number().int().nonnegative(),
	}),
	topCategories: z.array(
		z.object({
			category: SOURCE_CATEGORY,
			n: z.number().int().nonnegative(),
			hitRate: z.number(),
		})
	),
	bestSource: z
		.object({ category: SOURCE_CATEGORY, n: z.number().int().nonnegative(), hitRate: z.number() })
		.nullable(),
	worstSource: z
		.object({ category: SOURCE_CATEGORY, n: z.number().int().nonnegative(), hitRate: z.number() })
		.nullable(),
});

export const augurYearRecap: ToolSpec<typeof recapInput, typeof recapOutput> = {
	name: 'augur.yearRecap',
	module: 'augur',
	scope: 'user-space',
	policyHint: 'read',
	description:
		'Structured year-in-review: total, resolved/open counts, weighted hit-rate, by-kind / by-vibe / by-outcome breakdowns, top source-categories and best/worst forecaster (categories with n>=3 only). Year defaults to the current calendar year.',
	input: recapInput,
	output: recapOutput,
	encryptedFields: { table: TABLE, fields: ENCRYPTED_FIELDS },
	async handler(input, ctx) {
		const year = input.year ?? new Date().getFullYear();
		const all = await loadAllEntries(ctx);
		const inYear = all.filter((e) => e.encounteredAt.startsWith(`${year}-`));

		const byKind = { omen: 0, fortune: 0, hunch: 0 };
		const byVibe = { good: 0, bad: 0, mysterious: 0 };
		const byOutcome = { open: 0, fulfilled: 0, partly: 0, 'not-fulfilled': 0 };
		const sourceBuckets = new Map<
			SourceCategory,
			{ fulfilled: number; partly: number; notFulfilled: number; weighted: number; n: number }
		>();

		let resolved = 0;
		let open = 0;
		let weighted = 0;
		for (const e of inYear) {
			byKind[e.kind]++;
			byVibe[e.vibe]++;
			byOutcome[e.outcome]++;
			if (e.outcome === 'open') {
				open++;
				continue;
			}
			const v = outcomeValue(e.outcome);
			if (v == null) continue;
			resolved++;
			weighted += v;
			const bucket = sourceBuckets.get(e.sourceCategory) ?? {
				fulfilled: 0,
				partly: 0,
				notFulfilled: 0,
				weighted: 0,
				n: 0,
			};
			if (e.outcome === 'fulfilled') bucket.fulfilled++;
			else if (e.outcome === 'partly') bucket.partly++;
			else if (e.outcome === 'not-fulfilled') bucket.notFulfilled++;
			bucket.weighted += v;
			bucket.n++;
			sourceBuckets.set(e.sourceCategory, bucket);
		}

		const sourceRows = Array.from(sourceBuckets.entries())
			.map(([category, b]) => ({
				category,
				n: b.n,
				hitRate: b.n > 0 ? b.weighted / b.n : 0,
			}))
			.sort((a, b) => b.n - a.n);

		const eligible = sourceRows.filter((r) => r.n >= 3);
		const sortedByHitDesc = [...eligible].sort((a, b) => b.hitRate - a.hitRate);
		const sortedByHitAsc = [...eligible].sort((a, b) => a.hitRate - b.hitRate);
		const bestSource = sortedByHitDesc[0] ?? null;
		const worstSource = sortedByHitAsc[0] ?? null;

		ctx.logger.info('augur.yearRecap', { year, total: inYear.length, resolved });

		return {
			year,
			total: inYear.length,
			resolved,
			open,
			hitRate: resolved > 0 ? weighted / resolved : null,
			byKind,
			byVibe,
			byOutcome,
			topCategories: sourceRows.slice(0, 5),
			bestSource,
			worstSource,
		};
	},
};

// ─── Registration barrel ──────────────────────────────────────────

export function registerAugurTools(): void {
	registerTool(augurCaptureSign);
	registerTool(augurResolveSign);
	registerTool(augurListOpenSigns);
	registerTool(augurConsultOracle);
	registerTool(augurYearRecap);
}
