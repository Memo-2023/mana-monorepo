#!/usr/bin/env node
/**
 * Audit i18n coverage across module UI files.
 *
 * Background: @mana/shared-i18n + svelte-i18n are fully wired. Per-module
 * translation files exist under `apps/mana/apps/web/src/lib/i18n/locales/
 * {module}/{de,en,it,fr,es}.json` for ~35 modules. Yet most module
 * `.svelte` templates hardcode German strings instead of calling `$_()`.
 *
 * This audit flags the gap without being a blocker: it prints a per-module
 * report of `.svelte` files that likely contain hardcoded German UI
 * strings AND don't yet import from `svelte-i18n` / `$_`. The stats guide
 * migration priorities without forcing a failing check.
 *
 * Detection heuristic: look for common German UI keywords inside Svelte
 * template text nodes (Abbrechen, Speichern, Löschen, Hinzufügen,
 * Erstellen, Bearbeiten, etc.). Not foolproof — can miss embedded
 * placeholder text and hit false positives — but good enough to prioritise.
 *
 * Usage:
 *   node scripts/audit-i18n-coverage.mjs            # full report
 *   node scripts/audit-i18n-coverage.mjs --summary  # one-line per module
 *   node scripts/audit-i18n-coverage.mjs --top 10   # top N offenders only
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const MODULES_DIR = join(REPO_ROOT, 'apps/mana/apps/web/src/lib/modules');
const LOCALES_DIR = join(REPO_ROOT, 'apps/mana/apps/web/src/lib/i18n/locales');

const args = process.argv.slice(2);
const SUMMARY = args.includes('--summary');
const TOP_IDX = args.indexOf('--top');
const TOP_N = TOP_IDX >= 0 ? Number(args[TOP_IDX + 1] || 10) : null;

// Common German UI keywords that indicate hardcoded strings. Not every hit
// is a real violation (e.g. code comments, type names) — we scan only
// Svelte template bodies (between <script> blocks) and classname-free
// contexts.
const GERMAN_KEYWORDS = [
	// Actions
	'Abbrechen',
	'Speichern',
	'Löschen',
	'Bearbeiten',
	'Hinzufügen',
	'Erstellen',
	'Anlegen',
	'Zurück',
	'Weiter',
	'Senden',
	'Laden',
	'Schließen',
	'Öffnen',
	// Empty / count
	'Keine',
	'Noch keine',
	'Noch kein',
	'Alle',
	'Neue',
	'Neuer',
	'Neues',
	'Neu',
	// Confirm
	'Bist du sicher',
	'wirklich löschen',
	'wirklich entfernen',
	// Labels
	'Einstellungen',
	'Übersicht',
	'Fortschritt',
	'Beschreibung',
	'Name',
	// Status
	'Offen',
	'Erledigt',
	'Fertig',
	'In Arbeit',
	'Archiviert',
	'Pausiert',
	'Aktiv',
];

const KEYWORD_RE = new RegExp(`\\b(${GERMAN_KEYWORDS.join('|')})\\b`, 'g');

function hasI18nImport(src) {
	return /from\s+['"]svelte-i18n['"]/.test(src) || /\$_\s*\(/.test(src);
}

/** Extract template bodies — roughly "everything outside <script>" but
 * including <style> text. Good enough for keyword-counting. */
function stripScriptBlocks(src) {
	return src.replace(/<script[\s\S]*?<\/script>/g, '');
}

function countKeywords(src) {
	KEYWORD_RE.lastIndex = 0;
	const matches = src.match(KEYWORD_RE);
	return matches ? matches.length : 0;
}

function listSvelteFiles(dir) {
	const out = [];
	function walk(d) {
		for (const ent of readdirSync(d, { withFileTypes: true })) {
			const p = join(d, ent.name);
			if (ent.isDirectory()) walk(p);
			else if (ent.isFile() && ent.name.endsWith('.svelte')) out.push(p);
		}
	}
	walk(dir);
	return out;
}

function localeBytes(moduleName) {
	const deJson = join(LOCALES_DIR, moduleName, 'de.json');
	if (!existsSync(deJson)) return 0;
	try {
		return readFileSync(deJson, 'utf8').length;
	} catch {
		return 0;
	}
}

function analyze() {
	const moduleNames = readdirSync(MODULES_DIR, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => e.name)
		.sort();

	const reports = [];

	for (const mod of moduleNames) {
		const modDir = join(MODULES_DIR, mod);
		const files = listSvelteFiles(modDir);
		if (files.length === 0) continue;

		let usesI18n = 0;
		let hardcodedFiles = 0;
		let totalKeywordHits = 0;
		const offenders = [];

		for (const file of files) {
			const src = readFileSync(file, 'utf8');
			const hasI18n = hasI18nImport(src);
			const template = stripScriptBlocks(src);
			const hits = countKeywords(template);

			if (hasI18n) usesI18n++;
			if (hits > 0 && !hasI18n) {
				hardcodedFiles++;
				totalKeywordHits += hits;
				offenders.push({ file: file.slice(REPO_ROOT.length + 1), hits });
			}
		}

		const localeExists = localeBytes(mod) > 0;
		reports.push({
			module: mod,
			totalFiles: files.length,
			usesI18n,
			hardcodedFiles,
			keywordHits: totalKeywordHits,
			localeExists,
			offenders: offenders.sort((a, b) => b.hits - a.hits),
		});
	}

	return reports;
}

function bucket(r) {
	if (r.keywordHits === 0 && r.usesI18n > 0) return 'FULL';
	if (r.usesI18n > 0) return 'PARTIAL';
	return 'NONE';
}

function format(reports) {
	// Prioritise by keyword hits × coverage gap.
	const ranked = [...reports]
		.filter((r) => r.keywordHits > 0)
		.sort((a, b) => b.keywordHits - a.keywordHits);

	const summary = {
		FULL: reports.filter((r) => bucket(r) === 'FULL').length,
		PARTIAL: reports.filter((r) => bucket(r) === 'PARTIAL').length,
		NONE: reports.filter((r) => bucket(r) === 'NONE').length,
	};

	console.log(`\n── i18n coverage audit ────────────────────────────────\n`);
	console.log(`Modules scanned: ${reports.length}`);
	console.log(`  FULL    ${String(summary.FULL).padStart(3)} (all .svelte files import $_())`);
	console.log(
		`  PARTIAL ${String(summary.PARTIAL).padStart(3)} (some use $_(), others hardcode German)`
	);
	console.log(`  NONE    ${String(summary.NONE).padStart(3)} (no $_(), German hardcoded)`);
	console.log(``);

	if (SUMMARY) {
		for (const r of ranked.slice(0, TOP_N ?? ranked.length)) {
			console.log(
				`  ${bucket(r).padEnd(8)} ${String(r.keywordHits).padStart(4)} hits  ` +
					`${r.usesI18n}/${r.totalFiles} files i18n  ${r.module}` +
					(r.localeExists ? '' : '  [no locale file]')
			);
		}
		return;
	}

	const shown = TOP_N ? ranked.slice(0, TOP_N) : ranked;
	console.log(`Top ${shown.length} offenders (hardcoded German hits):\n`);
	for (const r of shown) {
		const tag = bucket(r);
		const locale = r.localeExists ? 'locale ✓' : 'locale ✗';
		console.log(
			`  [${tag}] ${r.module}  —  ${r.keywordHits} hits across ${r.hardcodedFiles} file(s)  (${r.usesI18n}/${r.totalFiles} already use i18n, ${locale})`
		);
		for (const o of r.offenders.slice(0, 5)) {
			console.log(`    ${String(o.hits).padStart(3)}  ${o.file}`);
		}
		if (r.offenders.length > 5) {
			console.log(`    … +${r.offenders.length - 5} more file(s)`);
		}
		console.log('');
	}
}

format(analyze());
