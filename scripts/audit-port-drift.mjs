#!/usr/bin/env node
/**
 * Audit port declarations: each services/*\/CLAUDE.md declares `## Port:
 * NNNN`. Verify that the same port appears as a literal in the service's
 * source code, and that no two services claim the same port.
 *
 * docs/PORT_SCHEMA.md is explicitly "partially aspirational" as of
 * 2026-04-08, so the authoritative source is each service's own
 * CLAUDE.md. This audit catches drift where a service moves its port in
 * code but forgets to update its CLAUDE.md, or where two services
 * accidentally claim the same number.
 *
 * Checks:
 *   1. Parse `## Port: NNNN` from every `services/*\/CLAUDE.md`.
 *   2. Grep the service directory (ignoring node_modules / dist / build /
 *      .turbo / __pycache__) for the literal port number.
 *      - Pass  : declared port found in code.
 *      - Flag  : not found — either a doc typo or outdated doc.
 *   3. Cross-check: build a port → service map and flag collisions.
 *
 * Usage:
 *   node scripts/audit-port-drift.mjs
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const SERVICES_DIR = join(REPO_ROOT, 'services');

const SKIP_DIRS = new Set([
	'node_modules',
	'dist',
	'build',
	'.turbo',
	'.svelte-kit',
	'__pycache__',
	'.venv',
	'venv',
	'.next',
	'target', // rust
]);

function parseCLAUDEPort(mdPath) {
	const src = readFileSync(mdPath, 'utf8');
	const m = src.match(/^##\s+Port:\s+(\d{4,5})\s*$/m);
	return m ? Number(m[1]) : null;
}

/** True if any tracked source file under `dir` contains `port` as a
 *  digit-boundary match (avoids matching 3050 inside 30500, etc.). */
function portAppearsIn(dir, port) {
	const portStr = String(port);
	const re = new RegExp(`\\b${portStr}\\b`);
	function walk(d) {
		for (const ent of readdirSync(d, { withFileTypes: true })) {
			if (ent.name.startsWith('.') && ent.name !== '.env.example') continue;
			if (SKIP_DIRS.has(ent.name)) continue;
			const p = join(d, ent.name);
			if (ent.isDirectory()) {
				if (walk(p)) return true;
			} else if (ent.isFile()) {
				// Only scan source-ish files; skip binaries + lockfiles.
				if (/\.(ts|tsx|js|mjs|cjs|go|py|env|env\.example|yaml|yml|toml|json|md)$/.test(ent.name)) {
					try {
						const src = readFileSync(p, 'utf8');
						if (re.test(src)) return true;
					} catch {
						// Unreadable file — skip.
					}
				}
			}
		}
		return false;
	}
	return walk(dir);
}

function audit() {
	const entries = readdirSync(SERVICES_DIR, { withFileTypes: true }).filter((e) => e.isDirectory());

	const declared = []; // { service, port, mdPath }
	const missingCLAUDE = []; // service names

	for (const ent of entries) {
		const mdPath = join(SERVICES_DIR, ent.name, 'CLAUDE.md');
		if (!existsSync(mdPath)) {
			missingCLAUDE.push(ent.name);
			continue;
		}
		const port = parseCLAUDEPort(mdPath);
		if (port === null) continue; // service without a single-port concept (e.g. library service)
		declared.push({ service: ent.name, port, mdPath });
	}

	const drifts = [];
	for (const d of declared) {
		const serviceDir = join(SERVICES_DIR, d.service);
		const found = portAppearsIn(serviceDir, d.port);
		if (!found) drifts.push(d);
	}

	const byPort = new Map();
	for (const d of declared) {
		if (!byPort.has(d.port)) byPort.set(d.port, []);
		byPort.get(d.port).push(d.service);
	}
	const collisions = [...byPort.entries()].filter(([, list]) => list.length > 1);

	console.log(`\n── Port drift audit ───────────────────────────────────\n`);
	console.log(`Services with CLAUDE.md Port declaration: ${declared.length}`);
	console.log(`Services without CLAUDE.md: ${missingCLAUDE.length}`);
	console.log('');

	if (drifts.length === 0 && collisions.length === 0) {
		console.log(`✓ No drift: every declared port appears in its own service's source.`);
		console.log(`✓ No collisions: all ${declared.length} port assignments unique.`);
	}

	if (drifts.length > 0) {
		console.log(`✗ Drift: declared port not found in service source (${drifts.length}):\n`);
		for (const d of drifts) {
			console.log(
				`  ${d.service}  declared :${d.port}  — not found in ${d.mdPath.slice(REPO_ROOT.length + 1)}`
			);
		}
		console.log('');
	}

	if (collisions.length > 0) {
		console.log(`✗ Collisions: multiple services claim the same port (${collisions.length}):\n`);
		for (const [port, list] of collisions) {
			console.log(`  :${port}  ${list.join(', ')}`);
		}
		console.log('');
	}

	console.log(`Port map:\n`);
	for (const d of declared.slice().sort((a, b) => a.port - b.port)) {
		console.log(`  :${d.port}  ${d.service}`);
	}
	console.log('');

	if (missingCLAUDE.length > 0) {
		console.log(`Services without CLAUDE.md (no port declared):`);
		for (const name of missingCLAUDE) console.log(`  ${name}`);
		console.log('');
	}

	// Report-only: never exit non-zero. This is diagnostic, not a gate.
}

audit();
