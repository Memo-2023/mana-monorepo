#!/usr/bin/env node
/**
 * Audit the encryption-registry ↔ Dexie-schema contract.
 *
 * Why: without this script, adding a new sensitive table silently ships
 * in plaintext — the registry is the only thing that knows which fields
 * to encrypt, and forgetting to register a table leaves no footprint
 * anywhere. See docs/plans/crypto-audit-phase-c.md in the architecture
 * audit.
 *
 * Invariants enforced:
 *   1. Every table declared in Dexie (database.ts) is accounted for as
 *      either (a) an encryption-registry entry — fields will be encrypted —
 *      or (b) an explicit plaintext-allowlist entry — someone made a
 *      conscious call that nothing here needs encryption.
 *   2. Every encryption-registry entry refers to a table that still
 *      exists in Dexie — no dead entries drifting out of sync with the
 *      schema.
 *   3. A table never appears in both the registry AND the allowlist —
 *      one authoritative classification.
 *
 * Zero deps — runs as plain Node ESM.
 *
 * Usage:
 *   node scripts/audit-crypto-registry.mjs          # audit, exit 1 on violation
 *   node scripts/audit-crypto-registry.mjs --seed   # print an allowlist seeded from current state
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const DATABASE_TS = join(REPO_ROOT, 'apps/mana/apps/web/src/lib/data/database.ts');
const REGISTRY_TS = join(REPO_ROOT, 'apps/mana/apps/web/src/lib/data/crypto/registry.ts');
const ALLOWLIST_PATH = join(
	REPO_ROOT,
	'apps/mana/apps/web/src/lib/data/crypto/plaintext-allowlist.ts'
);

/**
 * Extracts all Dexie table names declared across every `.version(N).stores({...})`
 * block. A table is "live" if it appears at least once with a non-null schema
 * spec. Dexie uses `tableName: null` to drop a table in a later version — we
 * treat the latest mention as authoritative.
 *
 * We deliberately skip the internal sync-infrastructure tables (names starting
 * with `_`): they're not user data and are managed by the sync engine, not
 * the module stores.
 */
function extractDexieTables(source) {
	// Capture every `db.version(N).stores({ ... })` body. Using [\s\S] because
	// bodies span multiple lines; lazy match so consecutive blocks don't merge.
	const storesRegex = /db\.version\(\d+\)\.stores\(\{([\s\S]*?)\}\)/g;
	const seen = new Map(); // tableName → { version, isNull }
	let match;
	let blockIdx = 0;
	while ((match = storesRegex.exec(source)) !== null) {
		blockIdx++;
		const body = match[1];
		// Each entry is `tableName: 'spec'` or `tableName: null`.
		// Comments (// ...) in between are allowed; strip them first.
		const stripped = body.replace(/\/\/[^\n]*/g, '');
		const entryRegex = /(\w+)\s*:\s*(null\b|['"])/g;
		let e;
		while ((e = entryRegex.exec(stripped)) !== null) {
			const name = e[1];
			const isNull = e[2] === 'null';
			seen.set(name, { block: blockIdx, isNull });
		}
	}
	return [...seen.entries()]
		.filter(([name, meta]) => !meta.isNull && !name.startsWith('_'))
		.map(([name]) => name)
		.sort();
}

/**
 * Extracts the registered table names from ENCRYPTION_REGISTRY. Accepts both
 * shapes that can legally appear:
 *   messages: entry<LocalMessage>(['messageText']),
 *   conversations: { enabled: true, fields: ['title'] },
 * Handles block-comment prefixes and trailing comments.
 */
function extractRegistryKeys(source) {
	// Isolate the ENCRYPTION_REGISTRY literal body.
	const start = source.indexOf('ENCRYPTION_REGISTRY');
	if (start < 0) throw new Error('ENCRYPTION_REGISTRY not found in registry.ts');
	const braceOpen = source.indexOf('{', start);
	if (braceOpen < 0) throw new Error('Registry opening brace not found');
	// Walk to matching closing brace (ignoring braces in strings/comments is
	// overkill here — the registry content is well-behaved).
	let depth = 0;
	let braceClose = -1;
	for (let i = braceOpen; i < source.length; i++) {
		const c = source[i];
		if (c === '{') depth++;
		else if (c === '}') {
			depth--;
			if (depth === 0) {
				braceClose = i;
				break;
			}
		}
	}
	if (braceClose < 0) throw new Error('Registry closing brace not found');
	const body = source.slice(braceOpen + 1, braceClose);
	// Strip line and block comments.
	const stripped = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
	// Collect keys at depth 0 (direct children of the registry object).
	const keys = new Set();
	let depth2 = 0;
	let buf = '';
	for (let i = 0; i < stripped.length; i++) {
		const c = stripped[i];
		if (c === '{' || c === '[' || c === '(') {
			if (depth2 === 0) buf += c; // keep for parseTopLevel()
			depth2++;
		} else if (c === '}' || c === ']' || c === ')') {
			depth2--;
			if (depth2 === 0) buf += c;
		} else if (depth2 === 0) {
			buf += c;
		}
	}
	// Now `buf` has only depth-0 material. Split on commas and extract keys.
	for (const seg of buf.split(',')) {
		const m = seg.match(/^\s*([A-Za-z_$][\w$]*)\s*:/);
		if (m) keys.add(m[1]);
	}
	return [...keys].sort();
}

/**
 * Loads the plaintext allowlist. Returns an array of strings. If the file
 * doesn't exist yet, returns []. The file is a plain TS module exporting
 * `PLAINTEXT_ALLOWLIST` as a string-array literal — we parse it with a
 * coarse regex rather than importing it (this script is plain Node, not
 * TypeScript-aware).
 */
function loadAllowlist() {
	let source;
	try {
		source = readFileSync(ALLOWLIST_PATH, 'utf8');
	} catch (err) {
		if (err.code === 'ENOENT') return [];
		throw err;
	}
	// Strip comments so the match doesn't pick up commented-out entries.
	const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
	// Anchor on `= [` to avoid matching the `string[]` type annotation's `[]`.
	const m = stripped.match(/PLAINTEXT_ALLOWLIST[\s\S]*?=\s*\[([\s\S]*?)\]/);
	if (!m) return [];
	const out = new Set();
	const entryRe = /['"]([^'"]+)['"]/g;
	let e;
	while ((e = entryRe.exec(m[1])) !== null) out.add(e[1]);
	return [...out].sort();
}

function audit() {
	const dbSource = readFileSync(DATABASE_TS, 'utf8');
	const regSource = readFileSync(REGISTRY_TS, 'utf8');
	const dexieTables = extractDexieTables(dbSource);
	const registryKeys = new Set(extractRegistryKeys(regSource));
	const allowlist = new Set(loadAllowlist());

	const violations = [];

	// Invariant 1: every Dexie table is classified somewhere.
	for (const t of dexieTables) {
		const inRegistry = registryKeys.has(t);
		const inAllowlist = allowlist.has(t);
		if (!inRegistry && !inAllowlist) {
			violations.push(
				`UNCLASSIFIED: Dexie table '${t}' is neither encrypted (registry.ts) ` +
					`nor explicitly plaintext (plaintext-allowlist.ts). ` +
					`Pick one — if unsure, default to encrypting it.`
			);
		}
		if (inRegistry && inAllowlist) {
			violations.push(
				`DOUBLE-CLASSIFIED: table '${t}' is in both registry.ts AND ` +
					`plaintext-allowlist.ts. Remove it from one.`
			);
		}
	}

	// Invariant 2: every registry entry corresponds to a real Dexie table.
	const dexieSet = new Set(dexieTables);
	for (const k of registryKeys) {
		if (!dexieSet.has(k)) {
			violations.push(
				`DEAD REGISTRY ENTRY: '${k}' is registered for encryption but no longer ` +
					`exists in database.ts. Remove the registry entry or re-add the Dexie table.`
			);
		}
	}
	// Invariant 2b: same for allowlist.
	for (const a of allowlist) {
		if (!dexieSet.has(a)) {
			violations.push(
				`DEAD ALLOWLIST ENTRY: '${a}' is in plaintext-allowlist.ts but no longer ` +
					`exists in database.ts. Remove it.`
			);
		}
	}

	if (violations.length > 0) {
		console.error(`\n✗ Crypto registry audit FAILED (${violations.length} violation(s)):\n`);
		for (const v of violations) console.error(`  • ${v}`);
		console.error(
			`\nSummary: ${dexieTables.length} Dexie tables, ${registryKeys.size} registry entries, ` +
				`${allowlist.size} allowlist entries.\n`
		);
		process.exit(1);
	}

	console.log(
		`✓ Crypto registry audit passed: ${dexieTables.length} Dexie tables all classified ` +
			`(${registryKeys.size} encrypted, ${allowlist.size} allowlisted plaintext).`
	);
}

/**
 * Emit a starter allowlist based on the current gap between Dexie and the
 * registry. Writes to stdout — redirect into plaintext-allowlist.ts and
 * commit. Every entry gets a TODO marker so subsequent contributors know
 * these were auto-seeded, not audited.
 */
function seed() {
	const dbSource = readFileSync(DATABASE_TS, 'utf8');
	const regSource = readFileSync(REGISTRY_TS, 'utf8');
	const dexieTables = extractDexieTables(dbSource);
	const registryKeys = new Set(extractRegistryKeys(regSource));
	const unclassified = dexieTables.filter((t) => !registryKeys.has(t));

	const header = [
		'/**',
		' * Plaintext allowlist — Dexie tables that are intentionally NOT encrypted.',
		' *',
		' * Counterpart to ENCRYPTION_REGISTRY in crypto/registry.ts. The audit script',
		' * (`scripts/audit-crypto-registry.mjs`, wired as `pnpm run check:crypto`)',
		' * fails if a Dexie table is in neither list.',
		' *',
		' * Why a separate file: adding a table here is a conscious security decision',
		' * ("this genuinely holds no user-sensitive data") and should be reviewable',
		' * as its own diff, not buried inside database.ts.',
		' *',
		' * Auto-seeded from current state on 2026-04-20 — every entry below was',
		' * introduced before the audit script existed. The `// TODO: audit` markers',
		' * are an invitation to review each one: does this table really hold nothing',
		' * that would embarrass the user if it leaked? If not, move it to the',
		' * encryption registry.',
		' */',
		'',
		'export const PLAINTEXT_ALLOWLIST: readonly string[] = [',
	].join('\n');
	const body = unclassified.map((t) => `\t'${t}', // TODO: audit`).join('\n');
	const footer = '\n];\n';
	process.stdout.write(header + '\n' + body + footer);
}

const arg = process.argv[2];
if (arg === '--seed') {
	seed();
} else {
	audit();
}
