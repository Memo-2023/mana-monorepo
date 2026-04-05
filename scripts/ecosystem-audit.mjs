#!/usr/bin/env node
/**
 * Ecosystem Health Audit
 * Scans the monorepo and generates ecosystem-wide consistency metrics.
 *
 * Usage: node scripts/ecosystem-audit.mjs
 * Output: apps/mana/apps/landing/src/content/manascore/ecosystem.json
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

		sharedModalUsage += grepOccurrences("from '@mana/shared-ui'.*Modal", webSrc, '*.svelte');
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
		'@mana/shared-auth': { name: 'Auth', count: 0, apps: [] },
		'@mana/shared-ui': { name: 'UI', count: 0, apps: [] },
		'@mana/shared-theme': { name: 'Theme', count: 0, apps: [] },
		'@mana/shared-branding': { name: 'Branding', count: 0, apps: [] },
		'@mana/shared-i18n': { name: 'i18n', count: 0, apps: [] },
		'@mana/shared-error-tracking': { name: 'Error Tracking', count: 0, apps: [] },
		'@mana/shared-icons': { name: 'Icons', count: 0, apps: [] },
		'@mana/local-store': { name: 'Local Store', count: 0, apps: [] },
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
		'@mana/shared-auth',
		'@mana/shared-ui',
		'@mana/shared-theme',
		'@mana/shared-branding',
		'@mana/shared-i18n',
		'@mana/shared-error-tracking',
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
		if (checkPackageJson(app, '@mana/local-store')) {
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

function measureToastConsistency() {
	console.log('📊 Measuring Toast Consistency...');
	let sharedToast = 0;
	let customToast = 0;

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		const shared =
			grepOccurrences('toastStore', webSrc, '*.svelte') +
			grepOccurrences('toastStore', webSrc, '*.ts');
		const custom =
			grepOccurrences('window.alert', webSrc, '*.svelte') +
			grepOccurrences('window.alert', webSrc, '*.ts');

		sharedToast += shared;
		customToast += custom;
	}

	const total = sharedToast + customToast;
	const adoption = total > 0 ? Math.round((sharedToast / total) * 100) : 100;

	console.log(`  toastStore usage: ${sharedToast}`);
	console.log(`  window.alert usage: ${customToast}`);
	console.log(`  Adoption: ${adoption}%\n`);

	return { adoption, sharedToast, customToast };
}

function measureStorePattern() {
	console.log('📊 Measuring Store Pattern (Svelte 5 Runes)...');
	let appsWithRunesStores = 0;
	let appsWithOldStores = 0;
	let totalRunesStores = 0;
	let totalOldStores = 0;

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		const runesStores = fileCount('*.svelte.ts', join(webSrc, 'lib/stores'));
		const oldStores =
			grepCount('writable(', join(webSrc, 'lib/stores'), '*.ts') +
			grepCount('readable(', join(webSrc, 'lib/stores'), '*.ts');

		totalRunesStores += runesStores;
		totalOldStores += oldStores;

		if (runesStores > 0 && oldStores === 0) appsWithRunesStores++;
		else if (oldStores > 0) appsWithOldStores++;
	}

	const total = totalRunesStores + totalOldStores;
	const adoption = total > 0 ? Math.round((totalRunesStores / total) * 100) : 100;

	console.log(`  Runes stores (.svelte.ts): ${totalRunesStores}`);
	console.log(`  Old stores (writable/readable): ${totalOldStores}`);
	console.log(`  Adoption: ${adoption}%\n`);

	return { adoption, totalRunesStores, totalOldStores, appsWithRunesStores, appsWithOldStores };
}

function measureSharedTypeUsage() {
	console.log('📊 Measuring Shared Type Usage...');
	let sharedTypeImports = 0;
	let localTypeFiles = 0;

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		sharedTypeImports +=
			grepOccurrences('shared-types', webSrc, '*.ts') +
			grepOccurrences('shared-types', webSrc, '*.svelte');

		localTypeFiles += fileCount('*.types.ts', webSrc) + fileCount('types.ts', webSrc);
	}

	// Higher shared usage relative to local types = better
	const total = sharedTypeImports + localTypeFiles;
	const adoption = total > 0 ? Math.round((sharedTypeImports / total) * 100) : 50;

	console.log(`  shared-types imports: ${sharedTypeImports}`);
	console.log(`  Local type files: ${localTypeFiles}`);
	console.log(`  Adoption: ${adoption}%\n`);

	return { adoption, sharedTypeImports, localTypeFiles };
}

function measureDependencyFreshness() {
	console.log('📊 Measuring Dependency Freshness...');
	let totalDeps = 0;

	for (const app of WEB_APPS) {
		const pkgPath = join(APPS_DIR, app, 'apps/web/package.json');
		try {
			const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
			const deps = Object.keys(pkg.dependencies || {}).length;
			const devDeps = Object.keys(pkg.devDependencies || {}).length;
			totalDeps += deps + devDeps;
		} catch {}
	}

	// Use npm outdated on the workspace — too slow per-app, just count total deps
	// Simple heuristic: more deps = more risk of outdated
	// Real measurement would need `pnpm outdated` which is slow
	const avgDepsPerApp = Math.round(totalDeps / WEB_APPS.length);

	console.log(`  Total dependencies: ${totalDeps}`);
	console.log(`  Average per app: ${avgDepsPerApp}`);

	// Score based on average deps (fewer = better maintained)
	// <20 = 100%, 20-40 = 80%, 40-60 = 60%, >60 = 40%
	let adoption;
	if (avgDepsPerApp < 20) adoption = 100;
	else if (avgDepsPerApp < 40) adoption = 80;
	else if (avgDepsPerApp < 60) adoption = 60;
	else adoption = 40;

	console.log(`  Score: ${adoption}%\n`);

	return { adoption, totalDeps, avgDepsPerApp };
}

function measureBundleSize() {
	console.log('📊 Measuring Bundle Size Awareness...');
	// Check which apps have build output analysis tools or bundle size monitoring
	let appsWithBundleConfig = 0;

	for (const app of WEB_APPS) {
		const webDir = join(APPS_DIR, app, 'apps/web');

		// Check for bundle analysis indicators
		const hasAnalysis =
			grepCount('analyzeBundle', webDir, '*.config.*') > 0 ||
			grepCount('vite-plugin-inspect', webDir, '*.config.*') > 0 ||
			existsSync(join(webDir, '.svelte-kit/output')) ||
			// SvelteKit apps with adapter-node or adapter-auto are well-configured
			grepCount('adapter', webDir, 'svelte.config.js') > 0;

		if (hasAnalysis) appsWithBundleConfig++;
	}

	const adoption = Math.round((appsWithBundleConfig / WEB_APPS.length) * 100);

	console.log(
		`  Apps with build config: ${appsWithBundleConfig}/${WEB_APPS.length} (${adoption}%)\n`
	);

	return { adoption, appsWithBundleConfig };
}

function measureGitActivity() {
	console.log('📊 Measuring Git Activity (last 30 days)...');
	let activeApps = 0;
	const perApp = {};

	for (const app of WEB_APPS) {
		const appDir = join(APPS_DIR, app);
		try {
			const result = execSync(
				`git log --since="30 days ago" --oneline -- "${appDir}" 2>/dev/null | wc -l`,
				{ encoding: 'utf-8' }
			);
			const commits = parseInt(result.trim()) || 0;
			perApp[app] = commits;
			if (commits > 0) activeApps++;
		} catch {
			perApp[app] = 0;
		}
	}

	const adoption = Math.round((activeApps / WEB_APPS.length) * 100);
	const sorted = Object.entries(perApp).sort(([, a], [, b]) => b - a);
	console.log(`  Active apps (≥1 commit): ${activeApps}/${WEB_APPS.length} (${adoption}%)`);
	sorted.slice(0, 5).forEach(([a, c]) => console.log(`    ${a}: ${c} commits`));
	console.log('');

	return { adoption, activeApps, perApp: Object.fromEntries(sorted) };
}

function measureA11yIndicators() {
	console.log('📊 Measuring Accessibility Indicators...');
	let totalImgFiles = 0;
	let totalImgWithAlt = 0;
	let appsWithDialogRole = 0;
	let appsWithFocusTrap = 0;

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		// img tags with and without alt
		const imgWithAlt = grepOccurrences('<img[^>]*alt=', webSrc, '*.svelte');
		const imgWithoutAlt = grepOccurrences('<img(?![^>]*alt=)', webSrc, '*.svelte');
		totalImgWithAlt += imgWithAlt;
		totalImgFiles += imgWithAlt + imgWithoutAlt;

		if (grepCount('role="dialog"', webSrc, '*.svelte') > 0) appsWithDialogRole++;
		if (grepCount('use:focusTrap', webSrc, '*.svelte') > 0) appsWithFocusTrap++;
	}

	// Score: alt text coverage + dialog/focusTrap presence
	const altAdoption = totalImgFiles > 0 ? Math.round((totalImgWithAlt / totalImgFiles) * 100) : 100;
	const dialogAdoption = Math.round((appsWithDialogRole / WEB_APPS.length) * 100);
	const trapAdoption = Math.round((appsWithFocusTrap / WEB_APPS.length) * 100);
	const adoption = Math.round((altAdoption + dialogAdoption + trapAdoption) / 3);

	console.log(`  img with alt: ${totalImgWithAlt}/${totalImgFiles} (${altAdoption}%)`);
	console.log(
		`  Apps with role=dialog: ${appsWithDialogRole}/${WEB_APPS.length} (${dialogAdoption}%)`
	);
	console.log(`  Apps with focusTrap: ${appsWithFocusTrap}/${WEB_APPS.length} (${trapAdoption}%)`);
	console.log(`  Combined: ${adoption}%\n`);

	return { adoption, altAdoption, dialogAdoption, trapAdoption, totalImgFiles, totalImgWithAlt };
}

function measureAuthGuardCoverage() {
	console.log('📊 Measuring Auth Guard Coverage...');
	let appsWithAuthGuard = 0;
	const missing = [];

	for (const app of WEB_APPS) {
		const webSrc = join(APPS_DIR, app, 'apps/web/src');
		if (!existsSync(webSrc)) continue;

		const hasAuthGuard =
			grepCount('AuthGate', webSrc, '*.svelte') > 0 ||
			grepCount('authGuard', webSrc, '*.ts') > 0 ||
			grepCount('authGuard', webSrc, '*.server.ts') > 0 ||
			grepCount('requireAuth', webSrc, '*.ts') > 0;

		if (hasAuthGuard) appsWithAuthGuard++;
		else missing.push(app);
	}

	const adoption = Math.round((appsWithAuthGuard / WEB_APPS.length) * 100);
	console.log(`  Apps with auth guard: ${appsWithAuthGuard}/${WEB_APPS.length} (${adoption}%)`);
	if (missing.length > 0 && missing.length <= 10) console.log(`  Missing: ${missing.join(', ')}`);
	console.log('');

	return { adoption, appsWithAuthGuard, missing };
}

function measureDockerReadiness() {
	console.log('📊 Measuring Docker Readiness...');
	let appsWithDockerfile = 0;
	const missing = [];

	for (const app of WEB_APPS) {
		const appDir = join(APPS_DIR, app);
		const hasDockerfile =
			existsSync(join(appDir, 'apps/web/Dockerfile')) ||
			existsSync(join(appDir, 'Dockerfile')) ||
			fileCount('Dockerfile', appDir) > 0;

		if (hasDockerfile) appsWithDockerfile++;
		else missing.push(app);
	}

	const adoption = Math.round((appsWithDockerfile / WEB_APPS.length) * 100);
	console.log(`  Apps with Dockerfile: ${appsWithDockerfile}/${WEB_APPS.length} (${adoption}%)`);
	if (missing.length > 0 && missing.length <= 10) console.log(`  Missing: ${missing.join(', ')}`);
	console.log('');

	return { adoption, appsWithDockerfile, missing };
}

// ============================================================
// Main
// ============================================================

console.log('🔍 Mana Ecosystem Health Audit\n');
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
const toasts = measureToastConsistency();
const storePattern = measureStorePattern();
const sharedTypes = measureSharedTypeUsage();
const depFreshness = measureDependencyFreshness();
const bundleSize = measureBundleSize();
const gitActivity = measureGitActivity();
const a11y = measureA11yIndicators();
const authGuard = measureAuthGuardCoverage();
const docker = measureDockerReadiness();

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
	toastConsistency: toasts.adoption,
	storePattern: storePattern.adoption,
	sharedTypes: sharedTypes.adoption,
	depFreshness: depFreshness.adoption,
	bundleConfig: bundleSize.adoption,
	gitActivity: gitActivity.adoption,
	a11yIndicators: a11y.adoption,
	authGuardCoverage: authGuard.adoption,
	dockerReadiness: docker.adoption,
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
	toastConsistency: 3,
	storePattern: 4,
	sharedTypes: 3,
	depFreshness: 2,
	bundleConfig: 2,
	gitActivity: 3,
	a11yIndicators: 4,
	authGuardCoverage: 5,
	dockerReadiness: 3,
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
		toasts,
		storePattern,
		sharedTypes,
		depFreshness,
		bundleSize,
		gitActivity,
		a11y,
		authGuard,
		docker,
	},
	apps: WEB_APPS,
};

const outputPath = 'apps/mana/apps/landing/src/data/ecosystem-health.json';
const outputDir = 'apps/mana/apps/landing/src/data';
try {
	execSync(`mkdir -p ${outputDir}`);
} catch {}
writeFileSync(outputPath, JSON.stringify(output, null, '\t'));
console.log(`\n📄 Report saved to ${outputPath}`);
