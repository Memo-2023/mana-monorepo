#!/usr/bin/env node

// Generate COPY statements in web app Dockerfiles from package.json workspace dependencies.
//
// For each apps/{name}/apps/web/Dockerfile, reads the corresponding package.json,
// resolves workspace dependencies to their directory paths, and updates the
// COPY block between marker comments.
//
// Usage:
//   node scripts/generate-dockerfiles.mjs          # Update all Dockerfiles
//   node scripts/generate-dockerfiles.mjs --check   # Check only, exit 1 if changes needed

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const START_MARKER = '# --- AUTO-GENERATED COPY STATEMENTS (do not edit manually) ---';
const END_MARKER = '# --- END AUTO-GENERATED ---';

const isCheck = process.argv.includes('--check');

// ---------------------------------------------------------------------------
// Package map: package name -> directory path relative to repo root
// Reuses the same logic from validate-dockerfiles.mjs
// ---------------------------------------------------------------------------
function buildPackageMap() {
	const map = new Map();

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

	return map;
}

// ---------------------------------------------------------------------------
// Extract workspace deps from package.json
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Generate the COPY block content (lines between the markers)
// ---------------------------------------------------------------------------
function generateCopyBlock(workspaceDeps, packageMap) {
	const copyLines = [];

	// Always include patches
	copyLines.push('COPY patches/ ./patches/');

	const depPaths = [];
	const unknownDeps = [];

	for (const dep of workspaceDeps) {
		const dirPath = packageMap.get(dep);
		if (!dirPath) {
			unknownDeps.push(dep);
			continue;
		}
		depPaths.push(dirPath);
	}

	depPaths.sort();

	// Root packages first, then app-specific packages
	const rootPackages = depPaths.filter((p) => p.startsWith('packages/'));
	const appPackages = depPaths.filter((p) => p.startsWith('apps/'));

	for (const p of rootPackages) {
		copyLines.push(`COPY ${p} ./${p}`);
	}
	for (const p of appPackages) {
		copyLines.push(`COPY ${p} ./${p}`);
	}

	if (unknownDeps.length > 0) {
		copyLines.push('');
		copyLines.push(
			`# WARNING: Unknown workspace deps (not found in workspace): ${unknownDeps.join(', ')}`
		);
	}

	return copyLines;
}

// ---------------------------------------------------------------------------
// Process a Dockerfile: insert/update markers and generated COPY block.
// Returns the updated content string.
// ---------------------------------------------------------------------------
function processDockerfile(content, appName, copyLines) {
	const lines = content.split('\n');

	// Collect all generated COPY paths for dedup detection
	const generatedPaths = new Set();
	for (const line of copyLines) {
		const m = line.match(/^COPY\s+(\S+)/);
		if (m) generatedPaths.add(m[1]);
	}

	// If markers already exist, replace the block between them and clean up duplicates after
	if (content.includes(START_MARKER)) {
		return updateExistingMarkers(lines, copyLines, generatedPaths);
	}

	// Otherwise, find the right place to insert markers
	return insertMarkersAndBlock(lines, copyLines, generatedPaths, appName);
}

// ---------------------------------------------------------------------------
// Update content that already has markers
// ---------------------------------------------------------------------------
function updateExistingMarkers(lines, copyLines, generatedPaths) {
	const result = [];
	let i = 0;

	// Copy lines up to and including the start marker
	while (i < lines.length) {
		result.push(lines[i]);
		if (lines[i].trim() === START_MARKER) {
			i++;
			break;
		}
		i++;
	}

	// Skip old content until end marker
	while (i < lines.length) {
		if (lines[i].trim() === END_MARKER) break;
		i++;
	}

	// Insert new copy lines
	for (const line of copyLines) {
		result.push(line);
	}

	// Add end marker
	if (i < lines.length && lines[i].trim() === END_MARKER) {
		result.push(lines[i]);
		i++;
	}

	// Now process remaining lines, removing duplicates of what we generated
	// and cleaning up orphaned comments about shared packages/patches
	while (i < lines.length) {
		const trimmed = lines[i].trim();

		// Remove duplicate COPY lines that are already in the generated block
		const copyMatch = trimmed.match(/^COPY\s+(\S+)/);
		if (copyMatch) {
			const srcPath = copyMatch[1];
			const normalized = srcPath.replace(/\/$/, '');
			// Exact match
			if (
				generatedPaths.has(srcPath) ||
				generatedPaths.has(normalized) ||
				generatedPaths.has(normalized + '/')
			) {
				i++;
				continue;
			}
			// Broader COPY (e.g., apps/todo/packages) where specific sub-paths are generated
			// Remove if ANY generated path starts with this broader path
			const isBroaderCovered = [...generatedPaths].some((gp) => gp.startsWith(normalized + '/'));
			if (isBroaderCovered) {
				i++;
				continue;
			}
		}

		// Remove orphaned comments that referred to the old manual copy section
		if (trimmed.startsWith('#')) {
			const isOrphanedComment =
				trimmed.match(/^#\s*Copy\s+(shared\s+)?packages\s+needed\s+by/i) ||
				trimmed.match(/^#\s*Copy\s+patches/i) ||
				trimmed.match(/^#\s*Copy\s+\w+\s+(content\s+)?package$/i) ||
				trimmed.match(/^#\s*Copy\s+\w+\s+shared\s+package$/i) ||
				trimmed.match(/^#\s*Copy\s+\w+\s+packages(\s+and\s+web)?$/i);
			if (isOrphanedComment) {
				// Check if the next non-empty line is a COPY that was removed or will be removed
				let j = i + 1;
				while (j < lines.length && lines[j].trim() === '') j++;
				const nextTrimmed = j < lines.length ? lines[j].trim() : '';
				const nextCopy = nextTrimmed.match(/^COPY\s+(\S+)/);
				let nextIsRemoved = false;
				if (nextCopy) {
					const np = nextCopy[1].replace(/\/$/, '');
					nextIsRemoved =
						generatedPaths.has(nextCopy[1]) ||
						generatedPaths.has(np) ||
						generatedPaths.has(np + '/') ||
						[...generatedPaths].some((gp) => gp.startsWith(np + '/'));
				}
				// Remove if the associated COPY is removed, or if the comment
				// is about something now handled by the generated block
				if (nextIsRemoved || !nextCopy) {
					i++;
					continue;
				}
			}
		}

		result.push(lines[i]);
		i++;
	}

	// Ensure blank line after END_MARKER
	const cleaned = cleanBlankLines(result);
	for (let k = 0; k < cleaned.length - 1; k++) {
		if (cleaned[k].trim() === END_MARKER && cleaned[k + 1].trim() !== '') {
			cleaned.splice(k + 1, 0, '');
		}
	}
	return cleaned.join('\n');
}

// ---------------------------------------------------------------------------
// Insert markers into a Dockerfile that doesn't have them yet
// ---------------------------------------------------------------------------
function insertMarkersAndBlock(lines, copyLines, generatedPaths, appName) {
	const result = [];
	let i = 0;

	// Pass through until we find COPY pnpm-lock.yaml
	let foundLockfile = false;
	while (i < lines.length) {
		result.push(lines[i]);
		if (lines[i].trim().match(/^COPY\s+pnpm-lock\.yaml/)) {
			foundLockfile = true;
			i++;
			break;
		}
		i++;
	}

	if (!foundLockfile) {
		// Can't find the pattern, return unchanged
		return lines.join('\n');
	}

	// Now skip all lines that are part of the old manual copy block:
	// - blank lines
	// - comments about shared packages / patches
	// - COPY statements for packages/* or patches
	// - COPY statements for apps/{appName}/packages/*
	// Stop when we hit the COPY for apps/{appName}/apps/web or RUN install
	while (i < lines.length) {
		const trimmed = lines[i].trim();

		if (trimmed === '') {
			i++;
			continue;
		}

		// Comments about shared packages, patches, or app packages
		if (
			trimmed.startsWith('#') &&
			(trimmed.match(/copy\s+(shared\s+)?packages/i) ||
				trimmed.match(/copy\s+patches/i) ||
				trimmed.match(/copy\s+\w+\s+(content\s+)?package/i))
		) {
			i++;
			continue;
		}

		// COPY for packages/* or patches
		if (trimmed.match(/^COPY\s+(packages|patches)[/\s]/)) {
			i++;
			continue;
		}

		// COPY for apps/{appName}/packages (app-specific workspace packages)
		if (trimmed.match(new RegExp(`^COPY\\s+apps/${appName}/packages`))) {
			i++;
			continue;
		}

		// End of the block we want to replace
		break;
	}

	// Insert the marker block
	result.push('');
	result.push(START_MARKER);
	for (const line of copyLines) {
		result.push(line);
	}
	result.push(END_MARKER);

	// Ensure a blank line before the next section
	if (i < lines.length && lines[i].trim() !== '') {
		result.push('');
	}

	// Add remaining lines, removing any further duplicates
	while (i < lines.length) {
		const trimmed = lines[i].trim();
		const copyMatch = trimmed.match(/^COPY\s+(\S+)/);
		if (copyMatch) {
			const srcPath = copyMatch[1].replace(/\/$/, '');
			if (
				generatedPaths.has(copyMatch[1]) ||
				generatedPaths.has(srcPath) ||
				generatedPaths.has(srcPath + '/')
			) {
				i++;
				continue;
			}
		}
		result.push(lines[i]);
		i++;
	}

	return cleanBlankLines(result).join('\n');
}

// ---------------------------------------------------------------------------
// Remove runs of 3+ consecutive blank lines, keep at most 1
// ---------------------------------------------------------------------------
function cleanBlankLines(lines) {
	const result = [];
	let blankCount = 0;
	for (const line of lines) {
		if (line.trim() === '') {
			blankCount++;
			if (blankCount <= 1) {
				result.push(line);
			}
		} else {
			blankCount = 0;
			result.push(line);
		}
	}
	return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
	const packageMap = buildPackageMap();
	const appsDir = join(ROOT, 'apps');
	let changed = 0;
	let unchanged = 0;
	let errors = 0;

	const appDirs = readdirSync(appsDir, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => e.name)
		.sort();

	for (const appName of appDirs) {
		const dockerfilePath = join(appsDir, appName, 'apps', 'web', 'Dockerfile');
		if (!existsSync(dockerfilePath)) continue;

		const pkgJsonPath = join(appsDir, appName, 'apps', 'web', 'package.json');
		if (!existsSync(pkgJsonPath)) {
			console.error(`  ERROR: ${appName} - package.json not found`);
			errors++;
			continue;
		}

		const relPath = `apps/${appName}/apps/web/Dockerfile`;
		const original = readFileSync(dockerfilePath, 'utf8');

		const workspaceDeps = getWorkspaceDeps(pkgJsonPath);
		const copyLines = generateCopyBlock(workspaceDeps, packageMap);
		const updated = processDockerfile(original, appName, copyLines);

		if (updated !== original) {
			if (isCheck) {
				console.log(`  NEEDS UPDATE: ${relPath}`);
				changed++;
			} else {
				writeFileSync(dockerfilePath, updated, 'utf8');
				console.log(`  UPDATED: ${relPath} (${workspaceDeps.length} deps)`);
				changed++;
			}
		} else {
			console.log(`  OK: ${relPath} (${workspaceDeps.length} deps)`);
			unchanged++;
		}
	}

	console.log('');
	console.log(
		`Processed ${changed + unchanged + errors} Dockerfiles: ${changed} ${isCheck ? 'need updates' : 'updated'}, ${unchanged} unchanged, ${errors} errors`
	);

	if (isCheck && changed > 0) {
		console.log('\nRun `pnpm generate:dockerfiles` to fix.');
		process.exit(1);
	}
	if (errors > 0) {
		process.exit(1);
	}
}

main();
