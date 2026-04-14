#!/usr/bin/env node

/**
 * Validate that Dockerfiles include COPY statements
 * for every workspace dependency listed in package.json.
 *
 * Checks:
 *   - apps/star/apps/web/Dockerfile       -- web apps
 *   - apps/star/apps/backend/Dockerfile   -- app backends
 *   - services/star/Dockerfile            -- standalone services
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

// Build a map of package name -> directory path (relative to repo root)
// for packages/*, apps/*/packages/*, and services/*/packages/*
function buildPackageMap() {
	const map = new Map();

	// packages/*
	const packagesDir = join(ROOT, 'packages');
	if (existsSync(packagesDir)) {
		for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const pkgJsonPath = join(packagesDir, entry.name, 'package.json');
			if (!existsSync(pkgJsonPath)) continue;
			try {
				const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
				map.set(pkg.name, `packages/${entry.name}`);
			} catch {}
		}
	}

	// apps/*/packages/*
	const appsDir = join(ROOT, 'apps');
	if (existsSync(appsDir)) {
		for (const appEntry of readdirSync(appsDir, { withFileTypes: true })) {
			if (!appEntry.isDirectory()) continue;
			const appPkgsDir = join(appsDir, appEntry.name, 'packages');
			if (!existsSync(appPkgsDir)) continue;
			for (const pkgEntry of readdirSync(appPkgsDir, { withFileTypes: true })) {
				if (!pkgEntry.isDirectory()) continue;
				const pkgJsonPath = join(appPkgsDir, pkgEntry.name, 'package.json');
				if (!existsSync(pkgJsonPath)) continue;
				try {
					const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
					map.set(pkg.name, `apps/${appEntry.name}/packages/${pkgEntry.name}`);
				} catch {}
			}
		}
	}

	// services/*/packages/*
	const servicesDir = join(ROOT, 'services');
	if (existsSync(servicesDir)) {
		for (const svcEntry of readdirSync(servicesDir, { withFileTypes: true })) {
			if (!svcEntry.isDirectory()) continue;
			const svcPkgsDir = join(servicesDir, svcEntry.name, 'packages');
			if (!existsSync(svcPkgsDir)) continue;
			for (const pkgEntry of readdirSync(svcPkgsDir, { withFileTypes: true })) {
				if (!pkgEntry.isDirectory()) continue;
				const pkgJsonPath = join(svcPkgsDir, pkgEntry.name, 'package.json');
				if (!existsSync(pkgJsonPath)) continue;
				try {
					const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
					map.set(pkg.name, `services/${svcEntry.name}/packages/${pkgEntry.name}`);
				} catch {}
			}
		}
	}

	return map;
}

// Extract workspace deps from package.json
function getWorkspaceDeps(pkgJsonPath) {
	const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
	const deps = [];
	for (const section of ['dependencies', 'devDependencies']) {
		if (!pkg[section]) continue;
		for (const [name, version] of Object.entries(pkg[section])) {
			if (typeof version === 'string' && version.startsWith('workspace:')) {
				deps.push(name);
			}
		}
	}
	return deps;
}

// Check if a Dockerfile is a non-monorepo build (standalone, no workspace COPY needed)
function isStandaloneBuild(dockerfilePath) {
	const content = readFileSync(dockerfilePath, 'utf8');
	// If Dockerfile uses npm (not pnpm) or doesn't copy pnpm-workspace.yaml, it's standalone
	// Also skip Python-based services
	return (
		(!content.includes('pnpm-workspace.yaml') && !content.includes('pnpm-lock.yaml')) ||
		content.includes('FROM python:') ||
		content.includes('pip install')
	);
}

// Extract COPY paths from Dockerfile
function getDockerfileCopyPaths(dockerfilePath) {
	const content = readFileSync(dockerfilePath, 'utf8');
	const lines = content.split('\n');
	const copyPaths = new Set();
	let hasPatchesCopy = false;

	for (const line of lines) {
		const trimmed = line.trim();
		// Match COPY statements like: COPY packages/shared-utils ./packages/shared-utils
		// or COPY apps/quotes/packages/content ./apps/quotes/packages/content
		// or COPY services/mana-auth ./services/mana-auth
		const copyMatch = trimmed.match(/^COPY\s+((?:packages|apps|services)\/\S+)/);
		if (copyMatch) {
			copyPaths.add(copyMatch[1]);
		}
		// Check for patches copy
		if (trimmed.match(/^COPY\s+patches[\s/]/)) {
			hasPatchesCopy = true;
		}
	}

	return { copyPaths, hasPatchesCopy };
}

// Extract @scope/package imports from a source file
function extractImports(filePath) {
	if (!existsSync(filePath)) return [];
	const content = readFileSync(filePath, 'utf8');
	const imports = new Set();
	// Match import ... from '@scope/package' and import '@scope/package'
	// Also match dynamic imports and require
	const patterns = [
		new RegExp('from\\s+[\'"](@[^\'"/]+/[^\'"/]+)', 'g'),
		new RegExp('import\\s*\\(\\s*[\'"](@[^\'"/]+/[^\'"/]+)', 'g'),
		new RegExp('import\\s+[\'"](@[^\'"/]+/[^\'"/]+)', 'g'),
		new RegExp('require\\s*\\(\\s*[\'"](@[^\'"/]+/[^\'"/]+)', 'g'),
	];
	for (const pattern of patterns) {
		let match;
		while ((match = pattern.exec(content)) !== null) {
			imports.add(match[1]);
		}
	}
	return [...imports];
}

// Validate a single Dockerfile and return result
function validateDockerfile(dockerfilePath, pkgJsonPath, relPath, packageMap, opts = {}) {
	const { checkImports = false, appDir = null, checkPatches = false } = opts;

	if (!existsSync(pkgJsonPath)) {
		return {
			path: relPath,
			errors: ['package.json not found in same directory'],
			warnings: [],
			depCount: 0,
		};
	}

	const workspaceDeps = getWorkspaceDeps(pkgJsonPath);
	const { copyPaths, hasPatchesCopy } = getDockerfileCopyPaths(dockerfilePath);
	const errors = [];
	const warnings = [];

	// Check each workspace dep has a corresponding COPY
	for (const dep of workspaceDeps) {
		const dirPath = packageMap.get(dep);
		if (!dirPath) {
			warnings.push(`UNKNOWN PACKAGE: ${dep} (not found in workspace)`);
			continue;
		}

		// Check if any COPY path matches or is a parent directory of this package
		const found = [...copyPaths].some(
			(cp) => cp === dirPath || dirPath.startsWith(cp + '/') || cp.startsWith(dirPath)
		);
		if (!found) {
			errors.push(`MISSING: ${dep} → add: COPY ${dirPath} ./${dirPath}`);
		}
	}

	// Check patches (only for web apps that need them)
	if (checkPatches && !hasPatchesCopy) {
		errors.push('MISSING: patches/ directory → add: COPY patches/ ./patches/');
	}

	// Check for imports in hooks.server.ts and vite.config.ts not in package.json (web apps only)
	if (checkImports && appDir) {
		const hooksPath = join(appDir, 'src', 'hooks.server.ts');
		const vitePath = join(appDir, 'vite.config.ts');

		for (const filePath of [hooksPath, vitePath]) {
			const imports = extractImports(filePath);
			const fileName = filePath.includes('hooks.server') ? 'hooks.server.ts' : 'vite.config.ts';
			for (const imp of imports) {
				if (packageMap.has(imp) && !workspaceDeps.includes(imp)) {
					warnings.push(`NOT IN package.json: ${imp} (imported in ${fileName})`);
				}
			}
		}
	}

	return {
		path: relPath,
		errors,
		warnings,
		depCount: workspaceDeps.length,
	};
}

function printResult(result) {
	const totalIssues = result.errors.length + result.warnings.length;
	if (totalIssues === 0) {
		console.log(`\u2713 ${result.path} - all ${result.depCount} deps covered`);
	} else {
		if (result.errors.length > 0) {
			console.log(
				`\u2717 ${result.path} - ${result.errors.length} issue${result.errors.length !== 1 ? 's' : ''}:`
			);
			for (const err of result.errors) {
				console.log(`  ${err}`);
			}
		}
		if (result.warnings.length > 0) {
			if (result.errors.length === 0) {
				console.log(
					`\u26A0 ${result.path} - ${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''}:`
				);
			}
			for (const warn of result.warnings) {
				console.log(`  \u26A0 ${warn}`);
			}
		}
	}
}

function main() {
	const packageMap = buildPackageMap();
	const appsDir = join(ROOT, 'apps');
	const servicesDir = join(ROOT, 'services');
	let hasErrors = false;
	const results = [];

	// Find all app directories
	const appDirs = readdirSync(appsDir, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => e.name)
		.sort();

	// --- Web app Dockerfiles ---
	console.log('=== Web App Dockerfiles ===');
	for (const appName of appDirs) {
		const dockerfilePath = join(appsDir, appName, 'apps', 'web', 'Dockerfile');
		if (!existsSync(dockerfilePath)) continue;

		const pkgJsonPath = join(appsDir, appName, 'apps', 'web', 'package.json');
		const relPath = `apps/${appName}/apps/web/Dockerfile`;
		const appDir = join(appsDir, appName, 'apps', 'web');

		const result = validateDockerfile(dockerfilePath, pkgJsonPath, relPath, packageMap, {
			checkImports: true,
			checkPatches: true,
			appDir,
		});
		if (result.errors.length > 0) hasErrors = true;
		results.push(result);
		printResult(result);
	}

	// --- Backend app Dockerfiles ---
	console.log('\n=== Backend App Dockerfiles ===');
	for (const appName of appDirs) {
		const dockerfilePath = join(appsDir, appName, 'apps', 'backend', 'Dockerfile');
		if (!existsSync(dockerfilePath)) continue;

		const pkgJsonPath = join(appsDir, appName, 'apps', 'backend', 'package.json');
		const relPath = `apps/${appName}/apps/backend/Dockerfile`;

		const result = validateDockerfile(dockerfilePath, pkgJsonPath, relPath, packageMap);
		if (result.errors.length > 0) hasErrors = true;
		results.push(result);
		printResult(result);
	}

	// --- Service Dockerfiles ---
	console.log('\n=== Service Dockerfiles ===');
	if (existsSync(servicesDir)) {
		const svcDirs = readdirSync(servicesDir, { withFileTypes: true })
			.filter((e) => e.isDirectory())
			.map((e) => e.name)
			.sort();

		for (const svcName of svcDirs) {
			const dockerfilePath = join(servicesDir, svcName, 'Dockerfile');
			if (!existsSync(dockerfilePath)) continue;

			// Skip standalone (non-monorepo) builds
			if (isStandaloneBuild(dockerfilePath)) continue;

			const pkgJsonPath = join(servicesDir, svcName, 'package.json');
			const relPath = `services/${svcName}/Dockerfile`;

			const result = validateDockerfile(dockerfilePath, pkgJsonPath, relPath, packageMap);
			if (result.errors.length > 0) hasErrors = true;
			results.push(result);
			printResult(result);
		}
	}

	// Summary
	const webCount = results.filter((r) => r.path.includes('/web/')).length;
	const backendCount = results.filter((r) => r.path.includes('/backend/')).length;
	const serviceCount = results.filter((r) => r.path.startsWith('services/')).length;
	const errorCount = results.reduce((sum, r) => sum + r.errors.length, 0);
	const warnCount = results.reduce((sum, r) => sum + r.warnings.length, 0);
	console.log('');
	console.log(
		`Checked ${results.length} Dockerfiles (${webCount} web, ${backendCount} backend, ${serviceCount} service): ${errorCount} error${errorCount !== 1 ? 's' : ''}, ${warnCount} warning${warnCount !== 1 ? 's' : ''}`
	);

	if (hasErrors) {
		process.exit(1);
	}
}

main();
