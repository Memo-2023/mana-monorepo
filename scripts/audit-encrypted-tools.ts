#!/usr/bin/env bun
/**
 * Audit the encryption-fields contract between the web-app
 * `ENCRYPTION_REGISTRY` (Dexie hook) and each `ToolSpec.encryptedFields`
 * declaration in `@mana/tool-registry`.
 *
 * Why: when a server-side tool encrypts fewer fields than the web app,
 * records written by the persona-runner look "encrypted enough" on the
 * wire but arrive plaintext in the columns the web app expected to
 * encrypt — silent data leak into sync rows. When the tool encrypts
 * MORE than the web app, the web app can't decrypt its own reads.
 *
 * Invariants:
 *   1. For every ToolSpec with `encryptedFields: {table, fields}`, the
 *      web-app registry has an entry for `table`.
 *   2. The set of fields declared on the spec matches exactly — same
 *      names, same cardinality. Extra / missing fields on either side
 *      fail the audit.
 *   3. (Advisory) If the web-app registry marks a table as
 *      `enabled: false`, encrypted tool handlers are pointless — flag
 *      but don't fail (opt-in rollout may intentionally stage these).
 *
 * Usage:
 *   bun run scripts/audit-encrypted-tools.ts            # exit 1 on drift
 *   pnpm run audit:encrypted-tools                      # same
 *
 * Wired into `pnpm run validate:all`.
 */

import {
	registerAllModules,
	getRegistry,
	__resetRegistryForTests,
} from '../packages/mana-tool-registry/src/index.ts';
import { ENCRYPTION_REGISTRY } from '../apps/mana/apps/web/src/lib/data/crypto/registry.ts';

interface Violation {
	tool: string;
	kind: 'missing-table' | 'field-drift' | 'disabled';
	detail: string;
}

function auditEncryptedTools(): Violation[] {
	__resetRegistryForTests();
	registerAllModules();

	const violations: Violation[] = [];

	for (const tool of getRegistry()) {
		if (!tool.encryptedFields) continue;

		const { table, fields } = tool.encryptedFields;
		const webAppEntry = ENCRYPTION_REGISTRY[table];

		if (!webAppEntry) {
			violations.push({
				tool: tool.name,
				kind: 'missing-table',
				detail: `table "${table}" has no entry in apps/mana/.../crypto/registry.ts`,
			});
			continue;
		}

		const actual = [...fields].sort().join(',');
		const expected = [...webAppEntry.fields].sort().join(',');

		if (actual !== expected) {
			violations.push({
				tool: tool.name,
				kind: 'field-drift',
				detail:
					`tool encrypts [${actual}], web-app encrypts [${expected}] — ` +
					`both sides must agree or the record is half-encrypted`,
			});
			continue;
		}

		if (webAppEntry.enabled === false) {
			violations.push({
				tool: tool.name,
				kind: 'disabled',
				detail:
					`web-app registry has enabled:false for "${table}" — ` +
					`tool will encrypt but app will write/read plaintext, wire records will mix`,
			});
		}
	}

	return violations;
}

const violations = auditEncryptedTools();

if (violations.length === 0) {
	const total = getRegistry().filter((t) => t.encryptedFields).length;
	console.log(`✓ encrypted-tools audit: ${total} tool(s) match the web-app registry.`);
	process.exit(0);
}

// Split by kind for readability
const fatals = violations.filter((v) => v.kind !== 'disabled');
const warnings = violations.filter((v) => v.kind === 'disabled');

if (warnings.length > 0) {
	console.warn(`⚠ ${warnings.length} advisory warning(s):`);
	for (const w of warnings) console.warn(`   · ${w.tool}: ${w.detail}`);
	console.warn('');
}

if (fatals.length === 0) {
	console.log('✓ no hard violations.');
	process.exit(0);
}

console.error(`✗ encrypted-tools audit found ${fatals.length} violation(s):`);
for (const v of fatals) {
	console.error(`   · ${v.tool}  [${v.kind}]`);
	console.error(`       ${v.detail}`);
}
console.error('');
console.error(
	'Fix: either update the ToolSpec.encryptedFields or the web-app registry — both must agree.'
);
process.exit(1);
