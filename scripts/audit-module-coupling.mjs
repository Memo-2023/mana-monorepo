#!/usr/bin/env node
// Cross-module coupling audit. For each frontend module, count how many OTHER
// modules import from it (fan-in) and how many other modules it imports (fan-out).
// Writes docs/module-coupling.md.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const MODULES_ROOT = join(ROOT, 'apps/mana/apps/web/src/lib/modules');
const CODE_EXT = new Set(['.ts', '.svelte']);
const IGNORE_DIRS = new Set(['node_modules', '.svelte-kit', 'dist']);

function walk(dir) {
	const out = [];
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		if (IGNORE_DIRS.has(e.name)) continue;
		const p = join(dir, e.name);
		if (e.isDirectory()) out.push(...walk(p));
		else if (e.isFile() && CODE_EXT.has(extname(e.name))) out.push(p);
	}
	return out;
}

const modules = readdirSync(MODULES_ROOT, { withFileTypes: true })
	.filter((e) => e.isDirectory())
	.map((e) => e.name);

// Build: module -> set of files
const filesByModule = new Map();
for (const m of modules) {
	filesByModule.set(m, walk(join(MODULES_ROOT, m)));
}

// For each file, scan imports; detect cross-module imports (paths containing `/modules/<other>/`)
const importRe = /(?:from\s+['"]|import\(['"])([^'"]+)['"]/g;

const fanIn = Object.fromEntries(modules.map((m) => [m, new Set()])); // who imports me
const fanOut = Object.fromEntries(modules.map((m) => [m, new Set()])); // who do I import

for (const [mod, files] of filesByModule.entries()) {
	for (const f of files) {
		let src;
		try {
			src = readFileSync(f, 'utf8');
		} catch {
			continue;
		}
		let m;
		importRe.lastIndex = 0;
		while ((m = importRe.exec(src)) !== null) {
			const spec = m[1];
			const match = spec.match(/modules\/([a-z0-9_-]+)\//i);
			if (!match) continue;
			const other = match[1];
			if (other === mod || !modules.includes(other)) continue;
			fanOut[mod].add(other);
			fanIn[other].add(mod);
		}
	}
}

const rows = modules.map((m) => ({
	module: m,
	fanIn: fanIn[m].size,
	fanOut: fanOut[m].size,
	inList: [...fanIn[m]].sort(),
	outList: [...fanOut[m]].sort(),
}));

const md = [
	'# Module Coupling Report',
	'',
	`_Generated ${new Date().toISOString().slice(0, 10)}_`,
	'',
	'- **fan-in** = how many other modules import from this module (high = shared / core)',
	'- **fan-out** = how many other modules this module imports from (high = tightly coupled / leaky)',
	'',
	'Ideal: most modules have fan-in ≤ 2 and fan-out ≤ 2. Outliers are refactor candidates.',
	'',
	'## Ranked by fan-in (shared modules)',
	'',
	'| Module | fan-in | fan-out | Imported by |',
	'|---|---:|---:|---|',
	...[...rows]
		.sort((a, b) => b.fanIn - a.fanIn)
		.map(
			(r) =>
				`| \`${r.module}\` | ${r.fanIn} | ${r.fanOut} | ${r.inList.map((x) => `\`${x}\``).join(', ') || '—'} |`
		),
	'',
	'## Ranked by fan-out (leaky modules)',
	'',
	'| Module | fan-out | fan-in | Imports from |',
	'|---|---:|---:|---|',
	...[...rows]
		.sort((a, b) => b.fanOut - a.fanOut)
		.map(
			(r) =>
				`| \`${r.module}\` | ${r.fanOut} | ${r.fanIn} | ${r.outList.map((x) => `\`${x}\``).join(', ') || '—'} |`
		),
	'',
].join('\n');

const outDir = join(ROOT, 'docs');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'module-coupling.md');
writeFileSync(outPath, md);
console.log(`Wrote ${relative(ROOT, outPath)} — ${rows.length} modules`);
