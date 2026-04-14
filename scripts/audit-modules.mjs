#!/usr/bin/env node
// Module complexity audit. Writes docs/module-health.md.
// Usage: node scripts/audit-modules.mjs [--since=6.months]

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const SINCE = (process.argv.find((a) => a.startsWith('--since=')) || '--since=6.months').split(
	'='
)[1];

const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.svelte', '.go', '.py']);
const IGNORE_DIRS = new Set([
	'node_modules',
	'.turbo',
	'.svelte-kit',
	'dist',
	'build',
	'.next',
	'coverage',
	'__snapshots__',
]);

const TARGETS = [
	{ label: 'web', root: 'apps/mana/apps/web/src/lib/modules' },
	{ label: 'api', root: 'apps/api/src/modules' },
	{ label: 'service', root: 'services' },
];

function walk(dir) {
	const out = [];
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return out;
	}
	for (const e of entries) {
		if (IGNORE_DIRS.has(e.name)) continue;
		const p = join(dir, e.name);
		if (e.isDirectory()) out.push(...walk(p));
		else if (e.isFile() && CODE_EXT.has(extname(e.name))) out.push(p);
	}
	return out;
}

function countLines(path) {
	try {
		return readFileSync(path, 'utf8').split('\n').length;
	} catch {
		return 0;
	}
}

function gitChangeCount(path) {
	try {
		const out = execSync(
			`git log --since=${SINCE} --pretty=format:%H -- "${path}" 2>/dev/null | wc -l`,
			{ cwd: ROOT }
		)
			.toString()
			.trim();
		return Number(out) || 0;
	} catch {
		return 0;
	}
}

function gitLastChanged(path) {
	try {
		const out = execSync(`git log -1 --format=%ar -- "${path}" 2>/dev/null`, { cwd: ROOT })
			.toString()
			.trim();
		return out || '—';
	} catch {
		return '—';
	}
}

function auditModule(absPath, label) {
	const files = walk(absPath);
	if (files.length === 0) return null;
	let loc = 0;
	let maxFile = { path: '', loc: 0 };
	for (const f of files) {
		const l = countLines(f);
		loc += l;
		if (l > maxFile.loc) maxFile = { path: relative(ROOT, f), loc: l };
	}
	const changes = gitChangeCount(relative(ROOT, absPath));
	const lastChanged = gitLastChanged(relative(ROOT, absPath));
	// score: LOC * log(changes+1) — hotspot heuristic
	const score = Math.round(loc * Math.log2(changes + 2));
	return {
		label,
		name: absPath.split('/').pop(),
		loc,
		files: files.length,
		maxFile: maxFile.path.replace(/^.*\/modules\//, '').replace(/^.*\/services\//, ''),
		maxFileLoc: maxFile.loc,
		changes,
		lastChanged,
		score,
	};
}

function collect() {
	const rows = [];
	for (const t of TARGETS) {
		const rootAbs = join(ROOT, t.root);
		let entries;
		try {
			entries = readdirSync(rootAbs, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const e of entries) {
			if (!e.isDirectory()) continue;
			if (IGNORE_DIRS.has(e.name)) continue;
			const r = auditModule(join(rootAbs, e.name), t.label);
			if (r) rows.push(r);
		}
	}
	return rows;
}

function fmt(n) {
	return n.toLocaleString('en-US');
}

function renderMarkdown(rows) {
	const byLabel = (l) => rows.filter((r) => r.label === l);
	const section = (title, list) => {
		const sorted = [...list].sort((a, b) => b.score - a.score);
		const lines = [
			`## ${title}`,
			'',
			'| Module | LOC | Files | Largest file (LOC) | Changes (6mo) | Last changed | Score |',
			'|---|---:|---:|---|---:|---|---:|',
			...sorted.map(
				(r) =>
					`| \`${r.name}\` | ${fmt(r.loc)} | ${r.files} | \`${r.maxFile}\` (${r.maxFileLoc}) | ${r.changes} | ${r.lastChanged} | ${fmt(r.score)} |`
			),
			'',
		];
		return lines.join('\n');
	};

	const totals = {
		web: byLabel('web').reduce((s, r) => s + r.loc, 0),
		api: byLabel('api').reduce((s, r) => s + r.loc, 0),
		service: byLabel('service').reduce((s, r) => s + r.loc, 0),
	};

	return [
		'# Module Health Report',
		'',
		`_Generated ${new Date().toISOString().slice(0, 10)} — git window: ${SINCE}_`,
		'',
		'**Score** = `LOC × log₂(changes + 2)`. High score = big *and* churny = refactor candidate.',
		'',
		`**Totals:** web \`${fmt(totals.web)}\` · api \`${fmt(totals.api)}\` · services \`${fmt(totals.service)}\` LOC`,
		'',
		section('Frontend modules (`apps/mana/apps/web/src/lib/modules`)', byLabel('web')),
		section('API modules (`apps/api/src/modules`)', byLabel('api')),
		section('Services (`services/`)', byLabel('service')),
	].join('\n');
}

const rows = collect();
const md = renderMarkdown(rows);
const outDir = join(ROOT, 'docs');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'module-health.md');
writeFileSync(outPath, md);
console.log(`Wrote ${relative(ROOT, outPath)} — ${rows.length} modules`);
