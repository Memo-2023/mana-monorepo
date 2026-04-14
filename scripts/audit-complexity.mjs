#!/usr/bin/env node
// Lightweight per-function complexity audit. No deps.
// Heuristic: counts decision points (if / else if / for / while / switch case / catch / ternary / && / ||) per function body.
// Not as rigorous as SonarJS cognitive complexity, but finds the same outliers.
// Output: docs/complexity-hotspots.md — top 50 functions.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const SCAN_ROOTS = ['apps/mana/apps/web/src', 'apps/api/src', 'services', 'packages'];
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.svelte']);
const IGNORE = new Set(['node_modules', '.svelte-kit', 'dist', 'build', 'coverage', '.turbo']);

function walk(dir) {
	const out = [];
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return out;
	}
	for (const e of entries) {
		if (IGNORE.has(e.name)) continue;
		const p = join(dir, e.name);
		if (e.isDirectory()) out.push(...walk(p));
		else if (e.isFile() && CODE_EXT.has(extname(e.name))) out.push(p);
	}
	return out;
}

// Strip /* */ and // comments and string contents to avoid false matches.
function sanitize(src) {
	return src
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/\/\/[^\n]*/g, '')
		.replace(/`[^`\\]*(?:\\.[^`\\]*)*`/g, '``')
		.replace(/'[^'\\\n]*(?:\\.[^'\\\n]*)*'/g, "''")
		.replace(/"[^"\\\n]*(?:\\.[^"\\\n]*)*"/g, '""');
}

// For .svelte: extract <script> block(s) for function scanning, but also scan whole file for inline event handlers.
function extractJS(path, src) {
	if (extname(path) !== '.svelte') return src;
	const blocks = [];
	const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
	let m;
	while ((m = re.exec(src)) !== null) blocks.push(m[1]);
	return blocks.join('\n');
}

// Find function starts and their body (best-effort brace matching).
function findFunctions(src) {
	const out = [];
	// Simpler approach: regex-based function heads, then count decision tokens in next ~200 lines or until matching brace.
	const headRe =
		/(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][\w$]*)\s*\([^)]*\)\s*\{|(?:const|let)\s+([a-zA-Z_$][\w$]*)\s*[:=][^={\n]*?=>\s*\{|([a-zA-Z_$][\w$]*)\s*\([^)]*\)\s*\{(?=\s*(?:\/\/|\n|\/\*|[a-z]))/g;
	let m;
	while ((m = headRe.exec(src)) !== null) {
		const name = m[1] || m[2] || m[3];
		if (
			!name ||
			name === 'if' ||
			name === 'for' ||
			name === 'while' ||
			name === 'switch' ||
			name === 'catch' ||
			name === 'return'
		)
			continue;
		// Find matching closing brace
		let depth = 0;
		const start = src.indexOf('{', m.index);
		if (start < 0) continue;
		let end = start;
		for (let i = start; i < src.length; i++) {
			const c = src[i];
			if (c === '{') depth++;
			else if (c === '}') {
				depth--;
				if (depth === 0) {
					end = i;
					break;
				}
			}
		}
		if (end <= start) continue;
		const body = src.slice(start, end + 1);
		const lines = body.split('\n').length;
		out.push({ name, body, lines, offset: start });
	}
	return out;
}

function complexity(body) {
	// Count decision points. Each adds 1.
	const counts = {
		if: (body.match(/\bif\s*\(/g) || []).length,
		elseIf: (body.match(/\belse\s+if\s*\(/g) || []).length, // already counted by `if`; don't double
		for: (body.match(/\bfor\s*\(/g) || []).length,
		while: (body.match(/\bwhile\s*\(/g) || []).length,
		case: (body.match(/\bcase\s+[^:]+:/g) || []).length,
		catch: (body.match(/\bcatch\s*\(/g) || []).length,
		ternary: (body.match(/\?[^?:]*:/g) || []).length,
		and: (body.match(/&&/g) || []).length,
		or: (body.match(/\|\|/g) || []).length,
		coalesce: (body.match(/\?\?/g) || []).length,
	};
	const total =
		counts.if +
		counts.for +
		counts.while +
		counts.case +
		counts.catch +
		counts.ternary +
		counts.and +
		counts.or +
		counts.coalesce;
	return total;
}

const results = [];

for (const r of SCAN_ROOTS) {
	const abs = join(ROOT, r);
	const files = walk(abs);
	for (const f of files) {
		let src;
		try {
			src = readFileSync(f, 'utf8');
		} catch {
			continue;
		}
		const js = sanitize(extractJS(f, src));
		if (!js.trim()) continue;
		const funcs = findFunctions(js);
		for (const fn of funcs) {
			const c = complexity(fn.body);
			if (c >= 10) {
				results.push({
					file: relative(ROOT, f),
					name: fn.name,
					complexity: c,
					lines: fn.lines,
				});
			}
		}
	}
}

results.sort((a, b) => b.complexity - a.complexity);
const top = results.slice(0, 100);

const md = [
	'# Cognitive Complexity Hotspots',
	'',
	`_Generated ${new Date().toISOString().slice(0, 10)} — heuristic scan (no ESLint deps)_`,
	'',
	'Complexity = sum of decision points per function (`if`, `for`, `while`, `case`, `catch`, ternary, `&&`, `||`, `??`). Threshold ≥ 10.',
	'',
	`**${results.length} functions** exceed threshold across the scanned tree. Showing top ${top.length}.`,
	'',
	'| # | Complexity | Lines | Function | File |',
	'|---:|---:|---:|---|---|',
	...top.map(
		(r, i) => `| ${i + 1} | ${r.complexity} | ${r.lines} | \`${r.name}\` | \`${r.file}\` |`
	),
	'',
].join('\n');

const outDir = join(ROOT, 'docs');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'complexity-hotspots.md');
writeFileSync(outPath, md);
console.log(`Wrote ${relative(ROOT, outPath)} — ${results.length} hotspots (≥10)`);
