#!/usr/bin/env node
/**
 * Ecosystem Health Audit
 * Scans the monorepo and generates ecosystem-wide consistency metrics.
 *
 * Usage: node scripts/ecosystem-audit.mjs
 * Output: apps/manacore/apps/landing/src/content/manascore/ecosystem.json
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// ============================================================
// Config
// ============================================================

const APPS_DIR = 'apps';
// Apps with web frontends (SvelteKit)
const WEB_APPS = [];
const appDirs = readdirSync(APPS_DIR).filter((d) => {
	const webPath = join(APPS_DIR, d, 'apps/web/src');
	return existsSync(webPath) && statSync(webPath).isDirectory();
});
appDirs.forEach((d) => WEB_APPS.push(d));

console.log(`Found ${WEB_APPS.length} web apps: ${WEB_APPS.join(', ')}\n`);

// ============================================================
// Helpers
// ============================================================

function grepCount(pattern, path, glob = '*.svelte') {
	try {
		const cmd = `grep -rl "${pattern}" --include="${glob}" ${path} 2>/dev/null | wc -l`;
		const result = execSync(cmd, { encoding: 'utf-8' });
		return parseInt(result.trim()) || 0;
	} catch {
		return 0;
	}
}

function grepOccurrences(pattern, path, glob = '*.svelte') {
	try {
		const cmd = `grep -rc "${pattern}" --include="${glob}" ${path} 2>/dev/null | awk -F: '{s+=$NF}END{print s}'`;
		const result = execSync(cmd, { encoding: 'utf-8' });
		return parseInt(result.trim()) || 0;
	} catch {
		return 0;
	}
}

function fileCount(pattern, path) {
	try {
		const result = execSync(
			`find ${path} -name '${pattern}' -not -path '*/node_modules/*' 2>/dev/null | wc -l`,
			{ encoding: 'utf-8' }
		);
		return parseInt(result.trim()) || 0;
	} catch {
		return 0;
	}
}

function checkPackageJson(appDir, pkg) {
	const paths = [
		join(APPS_DIR, appDir, 'apps/web/package.json'),
		join(APPS_DIR, appDir, 'apps/backend/package.json'),
		join(APPS_DIR, appDir, 'package.json'),
	];
	for (const p of paths) {
		try {
			const content = readFileSync(p, 'utf-8');
			if (content.includes(`"${pkg}"`)) return true;
		} catch {}
	}
	return false;
}

// ============================================================
// Metrics
// ============================================================

function measureIconConsistency() {
	console.log('📊 Measuring Icon Consistency...');
	let totalPhosphorFiles = 0;
	let totalInlineSvgFiles = 0;
	const perApp = {};

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		const phosphor = grepCount('shared-icons', webSrc);
		const inlineSvg = grepCount('<svg', webSrc);

		// Subtract known exceptions (logos, charts, spinners)
		const logos = grepCount('Logo.svelte', webSrc) + grepCount('CircularProgress', webSrc);

		const adjustedSvg = Math.max(0, inlineSvg - logos);
		totalPhosphorFiles += phosphor;
		totalInlineSvgFiles += adjustedSvg;
		perApp[app] = { phosphor, inlineSvg: adjustedSvg };
	}

	const total = totalPhosphorFiles + totalInlineSvgFiles;
	const adoption = total > 0 ? Math.round((totalPhosphorFiles / total) * 100) : 100;

	console.log(`  Phosphor imports: ${totalPhosphorFiles} files`);
	console.log(`  Remaining inline SVGs: ${totalInlineSvgFiles} files`);
	console.log(`  Adoption: ${adoption}%\n`);

	return {
		adoption,
		phosphorFiles: totalPhosphorFiles,
		inlineSvgFiles: totalInlineSvgFiles,
		perApp,
	};
}

function measureModalConsistency() {
	console.log('📊 Measuring Modal Consistency...');
	let sharedModalUsage = 0;
	let focusTrapUsage = 0;
	let totalModals = 0;

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		sharedModalUsage += grepOccurrences("from '@manacore/shared-ui'.*Modal", webSrc, '*.svelte');
		sharedModalUsage += grepOccurrences("from '.*shared-ui.*Modal", webSrc, '*.svelte');
		focusTrapUsage += grepOccurrences('use:focusTrap', webSrc, '*.svelte');
	}

	// Count modal files
	totalModals = fileCount('*Modal*.svelte', `${APPS_DIR}`);
	totalModals += fileCount('*Dialog*.svelte', `${APPS_DIR}`);

	// Count shared modal imports more precisely
	sharedModalUsage = grepCount('Modal.*from.*shared-ui', `${APPS_DIR}`, '*.svelte');

	const adoption = totalModals > 0 ? Math.round((sharedModalUsage / totalModals) * 100) : 0;

	console.log(`  Total modals/dialogs: ${totalModals}`);
	console.log(`  Using shared-ui Modal: ${sharedModalUsage}`);
	console.log(`  Using focusTrap: ${focusTrapUsage}`);
	console.log(`  Adoption: ${adoption}%\n`);

	return { adoption, total: totalModals, sharedUsage: sharedModalUsage, focusTrapUsage };
}

function measureSharedPackageAdoption() {
	console.log('📊 Measuring Shared Package Adoption...');
	const packages = {
		'@manacore/shared-auth': { name: 'Auth', count: 0, apps: [] },
		'@manacore/shared-ui': { name: 'UI', count: 0, apps: [] },
		'@manacore/shared-theme': { name: 'Theme', count: 0, apps: [] },
		'@manacore/shared-branding': { name: 'Branding', count: 0, apps: [] },
		'@manacore/shared-i18n': { name: 'i18n', count: 0, apps: [] },
		'@manacore/shared-error-tracking': { name: 'Error Tracking', count: 0, apps: [] },
		'@manacore/shared-icons': { name: 'Icons', count: 0, apps: [] },
		'@manacore/local-store': { name: 'Local Store', count: 0, apps: [] },
	};

	for (const app of WEB_APPS) {
		for (const [pkg, info] of Object.entries(packages)) {
			if (checkPackageJson(app, pkg)) {
				info.count++;
				info.apps.push(app);
			}
		}
	}

	const corePackages = [
		'@manacore/shared-auth',
		'@manacore/shared-ui',
		'@manacore/shared-theme',
		'@manacore/shared-branding',
		'@manacore/shared-i18n',
		'@manacore/shared-error-tracking',
	];

	let totalCoreAdoption = 0;
	for (const pkg of corePackages) {
		totalCoreAdoption += packages[pkg].count;
	}
	const maxCoreAdoption = corePackages.length * WEB_APPS.length;
	const coreAdoption = Math.round((totalCoreAdoption / maxCoreAdoption) * 100);

	for (const [, info] of Object.entries(packages)) {
		const pct = Math.round((info.count / WEB_APPS.length) * 100);
		console.log(`  ${info.name}: ${info.count}/${WEB_APPS.length} (${pct}%)`);
	}
	console.log(`  Core adoption: ${coreAdoption}%\n`);

	return { coreAdoption, packages, totalApps: WEB_APPS.length };
}

function measureErrorHandling() {
	console.log('📊 Measuring Error Handling Patterns...');
	let inlineInstanceof = 0;
	let sharedHelper = 0;

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		inlineInstanceof += grepOccurrences('instanceof Error', webSrc, '*.svelte');
		inlineInstanceof += grepOccurrences('instanceof Error', webSrc, '*.ts');
		sharedHelper += grepOccurrences('getErrorMessage', webSrc, '*.svelte');
		sharedHelper += grepOccurrences('getErrorMessage', webSrc, '*.ts');
		sharedHelper += grepOccurrences('withErrorHandling', webSrc, '*.ts');
	}

	const total = inlineInstanceof + sharedHelper;
	const adoption = total > 0 ? Math.round((sharedHelper / total) * 100) : 100;

	console.log(`  Inline instanceof: ${inlineInstanceof}`);
	console.log(`  Shared helpers: ${sharedHelper}`);
	console.log(`  Adoption: ${adoption}%\n`);

	return { adoption, inline: inlineInstanceof, shared: sharedHelper };
}

function measureI18nConsistency() {
	console.log('📊 Measuring i18n Consistency...');
	let appsWithI18n = 0;
	let appsWithHardcoded = 0;

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		const hasI18n =
			grepCount('svelte-i18n', webSrc, '*.svelte') > 0 ||
			grepCount('\\$lib/i18n', webSrc, '*.ts') > 0 ||
			existsSync(join(webSrc, 'lib/i18n'));

		if (hasI18n) appsWithI18n++;
		else appsWithHardcoded++;
	}

	const adoption = Math.round((appsWithI18n / WEB_APPS.length) * 100);

	console.log(`  Apps with i18n: ${appsWithI18n}/${WEB_APPS.length}`);
	console.log(`  Apps without: ${appsWithHardcoded}`);
	console.log(`  Adoption: ${adoption}%\n`);

	return { adoption, withI18n: appsWithI18n, without: appsWithHardcoded };
}

function measureLocalFirstAdoption() {
	console.log('📊 Measuring Local-First Adoption...');
	let appsWithLocalStore = 0;

	for (const app of WEB_APPS) {
		if (checkPackageJson(app, '@manacore/local-store')) {
			appsWithLocalStore++;
		}
	}

	const adoption = Math.round((appsWithLocalStore / WEB_APPS.length) * 100);

	console.log(`  Apps with local-store: ${appsWithLocalStore}/${WEB_APPS.length}`);
	console.log(`  Adoption: ${adoption}%\n`);

	return { adoption, count: appsWithLocalStore };
}

function measureStyleConsistency() {
	console.log('📊 Measuring Style Consistency...');
	let appsWithThemeVars = 0;
	let appsWithTailwind = 0;

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		const hasThemeVars =
			grepCount('hsl(var(--', webSrc, '*.svelte') > 0 || grepCount('var(--', webSrc, '*.css') > 0;
		const hasTailwind =
			grepCount('tailwind', join(APPS_DIR, app, 'apps/web'), '*.config.*') > 0 ||
			existsSync(join(APPS_DIR, app, 'apps/web/tailwind.config.ts')) ||
			existsSync(join(APPS_DIR, app, 'apps/web/tailwind.config.js'));

		if (hasThemeVars) appsWithThemeVars++;
		if (hasTailwind) appsWithTailwind++;
	}

	const themeAdoption = Math.round((appsWithThemeVars / WEB_APPS.length) * 100);
	const tailwindAdoption = Math.round((appsWithTailwind / WEB_APPS.length) * 100);

	console.log(`  Theme variables: ${appsWithThemeVars}/${WEB_APPS.length} (${themeAdoption}%)`);
	console.log(`  Tailwind CSS: ${appsWithTailwind}/${WEB_APPS.length} (${tailwindAdoption}%)\n`);

	return { themeAdoption, tailwindAdoption };
}

// ============================================================
// Main
// ============================================================

console.log('🔍 ManaCore Ecosystem Health Audit\n');
console.log('='.repeat(50));

const icons = measureIconConsistency();
const modals = measureModalConsistency();
const packages = measureSharedPackageAdoption();
const errors = measureErrorHandling();
const i18n = measureI18nConsistency();
const localFirst = measureLocalFirstAdoption();
const styles = measureStyleConsistency();

// Calculate overall scores
const scores = {
	sharedPackages: packages.coreAdoption,
	iconConsistency: icons.adoption,
	modalConsistency: modals.adoption,
	errorHandling: errors.adoption,
	i18nCoverage: i18n.adoption,
	localFirst: localFirst.adoption,
	styleConsistency: Math.round((styles.themeAdoption + styles.tailwindAdoption) / 2),
};

// Weighted overall score
const weights = {
	sharedPackages: 25,
	iconConsistency: 15,
	modalConsistency: 10,
	errorHandling: 10,
	i18nCoverage: 15,
	localFirst: 10,
	styleConsistency: 15,
};

let totalWeight = 0;
let weightedSum = 0;
for (const [key, weight] of Object.entries(weights)) {
	weightedSum += scores[key] * weight;
	totalWeight += weight;
}
const overallScore = Math.round(weightedSum / totalWeight);

console.log('='.repeat(50));
console.log('\n🏆 ECOSYSTEM HEALTH SCORE\n');
console.log(`  Overall: ${overallScore}/100\n`);
console.log(
	`  Shared Package Adoption:  ${scores.sharedPackages}%  (weight: ${weights.sharedPackages}%)`
);
console.log(
	`  Icon Consistency:         ${scores.iconConsistency}%  (weight: ${weights.iconConsistency}%)`
);
console.log(
	`  Modal Consistency:        ${scores.modalConsistency}%  (weight: ${weights.modalConsistency}%)`
);
console.log(
	`  Error Handling:           ${scores.errorHandling}%  (weight: ${weights.errorHandling}%)`
);
console.log(
	`  i18n Coverage:            ${scores.i18nCoverage}%  (weight: ${weights.i18nCoverage}%)`
);
console.log(`  Local-First:              ${scores.localFirst}%  (weight: ${weights.localFirst}%)`);
console.log(
	`  Style Consistency:        ${scores.styleConsistency}%  (weight: ${weights.styleConsistency}%)`
);

// Generate output JSON
const output = {
	generatedAt: new Date().toISOString(),
	overallScore,
	scores,
	weights,
	details: {
		icons,
		modals,
		packages: {
			coreAdoption: packages.coreAdoption,
			totalApps: packages.totalApps,
			perPackage: Object.fromEntries(
				Object.entries(packages.packages).map(([, info]) => [
					info.name,
					{
						count: info.count,
						total: packages.totalApps,
						adoption: Math.round((info.count / packages.totalApps) * 100),
					},
				])
			),
		},
		errors,
		i18n,
		localFirst,
		styles,
	},
	apps: WEB_APPS,
};

const outputPath = 'apps/manacore/apps/landing/src/data/ecosystem-health.json';
const outputDir = 'apps/manacore/apps/landing/src/data';
try {
	execSync(`mkdir -p ${outputDir}`);
} catch {}
writeFileSync(outputPath, JSON.stringify(output, null, '\t'));
console.log(`\n📄 Report saved to ${outputPath}`);
