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

function measureErrorBoundaries() {
	console.log('📊 Measuring Error Boundaries...');
	let appsWithErrorPage = 0;
	let appsWithOfflinePage = 0;
	const missing = { error: [], offline: [] };

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		const hasErrorPage = fileCount('+error.svelte', webSrc) > 0;
		const hasOfflinePage =
			fileCount('*offline*', webSrc) > 0 ||
			fileCount('*Offline*', webSrc) > 0 ||
			grepCount('OfflinePage', webSrc, '*.svelte') > 0;

		if (hasErrorPage) appsWithErrorPage++;
		else missing.error.push(app);
		if (hasOfflinePage) appsWithOfflinePage++;
		else missing.offline.push(app);
	}

	const errorAdoption = Math.round((appsWithErrorPage / WEB_APPS.length) * 100);
	const offlineAdoption = Math.round((appsWithOfflinePage / WEB_APPS.length) * 100);
	const adoption = Math.round((errorAdoption + offlineAdoption) / 2);

	console.log(`  +error.svelte: ${appsWithErrorPage}/${WEB_APPS.length} (${errorAdoption}%)`);
	console.log(`  Offline page: ${appsWithOfflinePage}/${WEB_APPS.length} (${offlineAdoption}%)`);
	if (missing.error.length > 0) console.log(`  Missing error page: ${missing.error.join(', ')}`);
	console.log(`  Combined: ${adoption}%\n`);

	return {
		adoption,
		errorAdoption,
		offlineAdoption,
		appsWithErrorPage,
		appsWithOfflinePage,
		missing,
	};
}

function measureTypeScriptStrictness() {
	console.log('📊 Measuring TypeScript Strictness...');
	let strictApps = 0;
	const nonStrict = [];

	for (const app of WEB_APPS) {
		const tsconfigPaths = [
			join(APPS_DIR, app, 'apps/web/tsconfig.json'),
			join(APPS_DIR, app, 'apps/web/.svelte-kit/tsconfig.json'),
		];

		let isStrict = false;
		for (const p of tsconfigPaths) {
			try {
				const content = readFileSync(p, 'utf-8');
				if (content.includes('"strict": true') || content.includes('"strict":true')) {
					isStrict = true;
					break;
				}
			} catch {}
		}

		// SvelteKit apps inherit strict from .svelte-kit/tsconfig.json which extends the user config
		// Check if svelte.config.js exists (indicates SvelteKit = inherits strict)
		if (!isStrict && existsSync(join(APPS_DIR, app, 'apps/web/svelte.config.js'))) {
			isStrict = true; // SvelteKit default is strict
		}

		if (isStrict) strictApps++;
		else nonStrict.push(app);
	}

	const adoption = Math.round((strictApps / WEB_APPS.length) * 100);
	console.log(`  Strict apps: ${strictApps}/${WEB_APPS.length} (${adoption}%)`);
	if (nonStrict.length > 0) console.log(`  Non-strict: ${nonStrict.join(', ')}`);
	console.log('');

	return { adoption, strictApps, nonStrict };
}

function measureTestCoverage() {
	console.log('📊 Measuring Test Coverage...');
	let appsWithTests = 0;
	let appsWithE2e = 0;
	let totalTestFiles = 0;
	const noTests = [];

	for (const app of WEB_APPS) {
		const appBase = join(APPS_DIR, app);

		const unitTests =
			fileCount('*.test.ts', appBase) +
			fileCount('*.spec.ts', appBase) +
			fileCount('*.test.js', appBase);
		const e2eTests =
			fileCount('*.spec.ts', join(appBase, 'apps/web/e2e')) +
			fileCount('*.spec.ts', join(appBase, 'apps/web/tests'));

		totalTestFiles += unitTests + e2eTests;

		if (unitTests > 0 || e2eTests > 0) appsWithTests++;
		else noTests.push(app);
		if (e2eTests > 0) appsWithE2e++;
	}

	const adoption = Math.round((appsWithTests / WEB_APPS.length) * 100);
	const e2eAdoption = Math.round((appsWithE2e / WEB_APPS.length) * 100);

	console.log(`  Apps with tests: ${appsWithTests}/${WEB_APPS.length} (${adoption}%)`);
	console.log(`  Apps with E2E: ${appsWithE2e}/${WEB_APPS.length} (${e2eAdoption}%)`);
	console.log(`  Total test files: ${totalTestFiles}`);
	if (noTests.length > 0 && noTests.length <= 10) console.log(`  No tests: ${noTests.join(', ')}`);
	console.log('');

	return { adoption, e2eAdoption, appsWithTests, appsWithE2e, totalTestFiles, noTests };
}

function measurePwaSupport() {
	console.log('📊 Measuring PWA Support...');
	let appsWithManifest = 0;
	let appsWithServiceWorker = 0;
	const noPwa = [];

	for (const app of WEB_APPS) {
		const webDir = join(APPS_DIR, app, 'apps/web');
		const webSrc = join(webDir, 'src');
		const staticDir = join(webDir, 'static');

		const hasManifest =
			existsSync(join(staticDir, 'manifest.json')) ||
			existsSync(join(staticDir, 'manifest.webmanifest')) ||
			grepCount('manifest', webSrc, '*.html') > 0 ||
			grepCount('manifest', join(webSrc, 'app.html'), '*') > 0;

		const hasSw =
			existsSync(join(staticDir, 'sw.js')) ||
			existsSync(join(staticDir, 'service-worker.js')) ||
			existsSync(join(webSrc, 'service-worker.ts')) ||
			existsSync(join(webSrc, 'service-worker.js')) ||
			grepCount('serviceWorker', webSrc, '*.ts') > 0;

		if (hasManifest) appsWithManifest++;
		if (hasSw) appsWithServiceWorker++;
		if (!hasManifest && !hasSw) noPwa.push(app);
	}

	const manifestAdoption = Math.round((appsWithManifest / WEB_APPS.length) * 100);
	const swAdoption = Math.round((appsWithServiceWorker / WEB_APPS.length) * 100);
	const adoption = Math.round((manifestAdoption + swAdoption) / 2);

	console.log(`  Manifest: ${appsWithManifest}/${WEB_APPS.length} (${manifestAdoption}%)`);
	console.log(`  Service Worker: ${appsWithServiceWorker}/${WEB_APPS.length} (${swAdoption}%)`);
	if (noPwa.length > 0 && noPwa.length <= 10) console.log(`  No PWA: ${noPwa.join(', ')}`);
	console.log('');

	return { adoption, manifestAdoption, swAdoption, appsWithManifest, appsWithServiceWorker, noPwa };
}

function measureFileSizes() {
	console.log('📊 Measuring File Sizes (Maintainability)...');
	let totalLargeFiles = 0;
	let largestFile = { path: '', lines: 0 };
	const largeFiles = [];

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		try {
			const result = execSync(
				`find ${webSrc} -name "*.svelte" -o -name "*.ts" | xargs wc -l 2>/dev/null | sort -rn | head -5`,
				{ encoding: 'utf-8' }
			);
			const lines = result.trim().split('\n');
			for (const line of lines) {
				const match = line.trim().match(/^(\d+)\s+(.+)$/);
				if (match && !match[2].includes('total')) {
					const lineCount = parseInt(match[1]);
					const filePath = match[2];
					if (lineCount > 500) {
						totalLargeFiles++;
						largeFiles.push({ app, file: filePath.replace(`${webSrc}/`, ''), lines: lineCount });
					}
					if (lineCount > largestFile.lines) {
						largestFile = {
							path: `${app}: ${filePath.replace(`${webSrc}/`, '')}`,
							lines: lineCount,
						};
					}
				}
			}
		} catch {}
	}

	// Score: fewer large files = better (100% = no files >500 lines, deduct per large file)
	const adoption = Math.max(0, 100 - totalLargeFiles * 3);

	console.log(`  Files > 500 lines: ${totalLargeFiles}`);
	console.log(`  Largest: ${largestFile.path} (${largestFile.lines} lines)`);
	if (largeFiles.length > 0) {
		console.log('  Top offenders:');
		largeFiles
			.sort((a, b) => b.lines - a.lines)
			.slice(0, 5)
			.forEach((f) => console.log(`    ${f.lines} lines — ${f.app}/${f.file}`));
	}
	console.log('');

	return {
		adoption,
		totalLargeFiles,
		largestFile,
		topOffenders: largeFiles.sort((a, b) => b.lines - a.lines).slice(0, 10),
	};
}

function measureTodoFixmeCount() {
	console.log('📊 Measuring TODO/FIXME Count...');
	let totalCount = 0;
	const perApp = {};

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		const count =
			grepOccurrences('TODO', webSrc, '*.svelte') +
			grepOccurrences('TODO', webSrc, '*.ts') +
			grepOccurrences('FIXME', webSrc, '*.svelte') +
			grepOccurrences('FIXME', webSrc, '*.ts') +
			grepOccurrences('HACK', webSrc, '*.svelte') +
			grepOccurrences('HACK', webSrc, '*.ts');

		if (count > 0) {
			perApp[app] = count;
			totalCount += count;
		}
	}

	const sorted = Object.entries(perApp).sort(([, a], [, b]) => b - a);
	console.log(`  Total TODO/FIXME/HACK: ${totalCount}`);
	if (sorted.length > 0) {
		sorted.slice(0, 5).forEach(([app, count]) => console.log(`    ${app}: ${count}`));
	}
	console.log('');

	return { totalCount, perApp: Object.fromEntries(sorted) };
}

function measureSecurityHeaders() {
	console.log('📊 Measuring Security Headers...');
	let appsWithHeaders = 0;
	const missing = [];

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		const hasHeaders =
			grepCount('setSecurityHeaders', webSrc, '*.ts') > 0 ||
			grepCount('Content-Security-Policy', webSrc, '*.ts') > 0 ||
			grepCount('X-Frame-Options', webSrc, '*.ts') > 0;

		if (hasHeaders) appsWithHeaders++;
		else missing.push(app);
	}

	const adoption = Math.round((appsWithHeaders / WEB_APPS.length) * 100);
	console.log(`  Apps with security headers: ${appsWithHeaders}/${WEB_APPS.length} (${adoption}%)`);
	if (missing.length > 0 && missing.length <= 10) console.log(`  Missing: ${missing.join(', ')}`);
	console.log('');

	return { adoption, appsWithHeaders, missing };
}

function measureSkeletonLoading() {
	console.log('📊 Measuring Skeleton Loading States...');
	let appsWithSkeletons = 0;
	const missing = [];

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		const hasSkeletons =
			fileCount('*Skeleton*', webSrc) > 0 ||
			fileCount('*skeleton*', webSrc) > 0 ||
			grepCount('Skeleton', webSrc, '*.svelte') > 0 ||
			grepCount('animate-pulse', webSrc, '*.svelte') > 0;

		if (hasSkeletons) appsWithSkeletons++;
		else missing.push(app);
	}

	const adoption = Math.round((appsWithSkeletons / WEB_APPS.length) * 100);
	console.log(
		`  Apps with skeleton loading: ${appsWithSkeletons}/${WEB_APPS.length} (${adoption}%)`
	);
	if (missing.length > 0 && missing.length <= 10) console.log(`  Missing: ${missing.join(', ')}`);
	console.log('');

	return { adoption, appsWithSkeletons, missing };
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
const errorBoundaries = measureErrorBoundaries();
const typescript = measureTypeScriptStrictness();
const tests = measureTestCoverage();
const pwa = measurePwaSupport();
const fileSizes = measureFileSizes();
const todos = measureTodoFixmeCount();
const securityHeaders = measureSecurityHeaders();
const skeletons = measureSkeletonLoading();

// Calculate overall scores
const scores = {
	sharedPackages: packages.coreAdoption,
	iconConsistency: icons.adoption,
	modalConsistency: modals.adoption,
	errorHandling: errors.adoption,
	i18nCoverage: i18n.adoption,
	localFirst: localFirst.adoption,
	styleConsistency: Math.round((styles.themeAdoption + styles.tailwindAdoption) / 2),
	errorBoundaries: errorBoundaries.adoption,
	typescriptStrict: typescript.adoption,
	testCoverage: tests.adoption,
	pwaSupport: pwa.adoption,
	maintainability: fileSizes.adoption,
	securityHeaders: securityHeaders.adoption,
	skeletonLoading: skeletons.adoption,
};

// Weighted overall score
const weights = {
	sharedPackages: 20,
	iconConsistency: 10,
	modalConsistency: 5,
	errorHandling: 5,
	i18nCoverage: 10,
	localFirst: 8,
	styleConsistency: 10,
	errorBoundaries: 8,
	typescriptStrict: 7,
	testCoverage: 7,
	pwaSupport: 4,
	maintainability: 4,
	securityHeaders: 5,
	skeletonLoading: 3,
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
const pad = (s, n) => s.padEnd(n);
for (const [key, weight] of Object.entries(weights)) {
	const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
	console.log(
		`  ${pad(label + ':', 28)} ${String(scores[key]).padStart(3)}%  (weight: ${weight}%)`
	);
}

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
		errorBoundaries,
		typescript,
		tests,
		pwa,
		fileSizes,
		todos,
		securityHeaders,
		skeletons,
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
