#!/usr/bin/env node

/**
 * Audit Workspace Dependencies
 *
 * Finds SvelteKit web apps that import workspace packages (@manacore/*, @project/shared, etc.)
 * without declaring them in package.json. This works locally due to pnpm hoisting but breaks
 * in Docker builds.
 *
 * Usage:
 *   node scripts/audit-workspace-deps.mjs          # Report missing deps
 *   node scripts/audit-workspace-deps.mjs --fix    # Auto-add missing deps and run pnpm install
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MONOREPO_ROOT = join(__dirname, '..');

const FIX_MODE = process.argv.includes('--fix');

// Colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// Directories to skip when scanning source files
const SKIP_DIRS = new Set(['node_modules', 'dist', '.svelte-kit', 'build', '.turbo', '.vercel']);

// File extensions to scan
const SCAN_EXTENSIONS = new Set(['.ts', '.svelte', '.js']);

// Regex to match workspace package imports
// Matches: @manacore/*, @calendar/shared, @todo/shared, @zitare/content, etc.
const IMPORT_REGEX =
	/(?:import\s+(?:[\s\S]*?\s+from\s+)?|import\s*\()\s*['"](@[a-z-]+\/[a-z-]+)(?:\/[^'"]*)?['"]/g;

// Known workspace scopes (to distinguish from npm packages like @sveltejs/kit)
const WORKSPACE_SCOPES = new Set([
	'@manacore',
	'@calendar',
	'@chat',
	'@clock',
	'@contacts',
	'@context',
	'@matrix',
	'@music',
	'@nutriphi',
	'@photos',
	'@picture',
	'@planta',
	'@presi',
	'@storage',
	'@todo',
	'@traces',
	'@zitare',
	'@mana-core',
]);

/**
 * Build a set of all workspace package names by scanning the monorepo.
 */
function buildWorkspacePackageSet() {
	const names = new Set();
	const patterns = [
		'packages/*/package.json',
		'apps/*/packages/*/package.json',
		'services/*/package.json',
	];

	for (const pattern of patterns) {
		const parts = pattern.split('/');
		let dirs = [MONOREPO_ROOT];

		for (const part of parts) {
			const nextDirs = [];
			for (const dir of dirs) {
				if (part === '*') {
					try {
						const entries = readdirSync(dir);
						for (const entry of entries) {
							const full = join(dir, entry);
							try {
								if (statSync(full).isDirectory()) {
									nextDirs.push(full);
								}
							} catch {}
						}
					} catch {}
				} else {
					nextDirs.push(join(dir, part));
				}
			}
			dirs = nextDirs;
		}

		for (const pkgPath of dirs) {
			try {
				const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
				if (pkg.name) names.add(pkg.name);
			} catch {}
		}
	}

	return names;
}

/**
 * Recursively collect source files from a directory.
 */
function collectSourceFiles(dir, files = []) {
	let entries;
	try {
		entries = readdirSync(dir);
	} catch {
		return files;
	}

	for (const entry of entries) {
		if (SKIP_DIRS.has(entry)) continue;
		const full = join(dir, entry);
		try {
			const stat = statSync(full);
			if (stat.isDirectory()) {
				collectSourceFiles(full, files);
			} else if (stat.isFile()) {
				const ext = entry.slice(entry.lastIndexOf('.'));
				if (SCAN_EXTENSIONS.has(ext)) {
					files.push(full);
				}
			}
		} catch {}
	}

	return files;
}

/**
 * Extract workspace package imports from a source file.
 */
function extractImports(filePath, workspacePackages) {
	const content = readFileSync(filePath, 'utf-8');
	const imports = new Set();

	let match;
	// Reset regex lastIndex
	IMPORT_REGEX.lastIndex = 0;

	while ((match = IMPORT_REGEX.exec(content)) !== null) {
		const pkg = match[1]; // e.g. @manacore/shared-utils
		const scope = pkg.split('/')[0]; // e.g. @manacore

		if (WORKSPACE_SCOPES.has(scope) && workspacePackages.has(pkg)) {
			imports.add(pkg);
		}
	}

	return imports;
}

/**
 * Get declared dependencies from package.json (both deps and devDeps).
 */
function getDeclaredDeps(pkgJsonPath) {
	const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
	const deps = new Set();

	for (const name of Object.keys(pkg.dependencies || {})) {
		deps.add(name);
	}
	for (const name of Object.keys(pkg.devDependencies || {})) {
		deps.add(name);
	}

	return { deps, pkg };
}

/**
 * Find all SvelteKit web app directories.
 */
function findWebApps() {
	const appsDir = join(MONOREPO_ROOT, 'apps');
	const webApps = [];

	try {
		const projects = readdirSync(appsDir);
		for (const project of projects) {
			// Try the correct path structure: apps/{project}/apps/web
			const correctWebDir = join(appsDir, project, 'apps', 'web');
			if (existsSync(join(correctWebDir, 'package.json'))) {
				webApps.push(correctWebDir);
			}
		}
	} catch {}

	return webApps.sort();
}

// --- Main ---

console.log(`${BOLD}Workspace Dependency Audit${RESET}`);
console.log(`Scanning SvelteKit web apps for undeclared workspace imports...\n`);

const workspacePackages = buildWorkspacePackageSet();
console.log(`${DIM}Found ${workspacePackages.size} workspace packages${RESET}\n`);

const webApps = findWebApps();
let totalMissing = 0;
const fixes = []; // { webDir, filterName, missingPkgs }

for (const webDir of webApps) {
	const relPath = relative(MONOREPO_ROOT, webDir);
	const pkgJsonPath = join(webDir, 'package.json');
	const srcDir = join(webDir, 'src');

	if (!existsSync(srcDir)) {
		console.log(`${DIM}- ${relPath} - no src/ directory, skipping${RESET}`);
		continue;
	}

	const { deps, pkg } = getDeclaredDeps(pkgJsonPath);
	const sourceFiles = collectSourceFiles(srcDir);

	// Map: packageName -> Set of files that import it
	const importedPackages = new Map();

	for (const file of sourceFiles) {
		const fileImports = extractImports(file, workspacePackages);
		for (const imp of fileImports) {
			if (!importedPackages.has(imp)) {
				importedPackages.set(imp, new Set());
			}
			importedPackages.get(imp).add(relative(webDir, file));
		}
	}

	// Find missing: imported but not declared
	const missing = new Map();
	for (const [pkgName, files] of importedPackages) {
		if (!deps.has(pkgName)) {
			missing.set(pkgName, files);
		}
	}

	if (missing.size === 0) {
		console.log(`${GREEN}\u2713${RESET} ${relPath} - all imports covered`);
	} else {
		totalMissing += missing.size;
		const filterName = pkg.name || relPath;
		console.log(
			`${RED}\u2717${RESET} ${relPath} - ${BOLD}${missing.size}${RESET} missing dep${missing.size > 1 ? 's' : ''}:`
		);

		const missingPkgs = [];
		for (const [pkgName, files] of missing) {
			const fileList = [...files].sort().join(', ');
			console.log(`  ${YELLOW}${pkgName}${RESET} ${DIM}(imported in ${fileList})${RESET}`);
			missingPkgs.push(pkgName);
		}
		console.log(`  ${DIM}\u2192 pnpm add ${missingPkgs.join(' ')} --filter ${filterName}${RESET}`);

		fixes.push({ webDir, pkgJsonPath, filterName, missingPkgs });
	}
}

console.log('');

if (totalMissing === 0) {
	console.log(`${GREEN}${BOLD}All workspace imports are properly declared!${RESET}`);
	process.exit(0);
}

console.log(
	`${RED}${BOLD}Found ${totalMissing} missing dependency declaration${totalMissing > 1 ? 's' : ''} across ${fixes.length} app${fixes.length > 1 ? 's' : ''}.${RESET}`
);

if (!FIX_MODE) {
	console.log(`\n${DIM}Run with --fix to automatically add missing dependencies.${RESET}`);
	process.exit(1);
}

// --- Fix mode ---
console.log(`\n${BOLD}Applying fixes...${RESET}\n`);

for (const { pkgJsonPath, missingPkgs } of fixes) {
	const relPkgPath = relative(MONOREPO_ROOT, pkgJsonPath);
	const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));

	if (!pkg.dependencies) {
		pkg.dependencies = {};
	}

	for (const pkgName of missingPkgs) {
		pkg.dependencies[pkgName] = 'workspace:*';
		console.log(`  ${GREEN}+${RESET} Added ${pkgName} to ${relPkgPath}`);
	}

	// Sort dependencies alphabetically
	const sorted = {};
	for (const key of Object.keys(pkg.dependencies).sort()) {
		sorted[key] = pkg.dependencies[key];
	}
	pkg.dependencies = sorted;

	writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, '\t') + '\n');
}

console.log(`\n${BOLD}Running pnpm install to update lockfile...${RESET}\n`);

try {
	execSync('pnpm install', {
		cwd: MONOREPO_ROOT,
		stdio: 'inherit',
	});
	console.log(`\n${GREEN}${BOLD}All fixes applied successfully!${RESET}`);
} catch {
	console.error(`\n${RED}pnpm install failed. You may need to run it manually.${RESET}`);
	process.exit(1);
}
