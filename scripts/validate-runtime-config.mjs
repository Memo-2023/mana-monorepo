#!/usr/bin/env node
/**
 * Runtime Configuration Validator
 *
 * Validates that all web apps follow the runtime configuration pattern correctly.
 * This prevents bugs where apps use build-time env vars or window injection instead
 * of the proper runtime config loader.
 *
 * Usage:
 *   node scripts/validate-runtime-config.mjs
 *   pnpm validate:runtime-config
 *
 * What it checks:
 * 1. Required files exist (runtime.ts, docker-entrypoint.sh, Dockerfile)
 * 2. No window injection patterns (window.__PUBLIC_*)
 * 3. No direct build-time env imports in stores/api (import.meta.env.PUBLIC_*)
 * 4. Correct async patterns (no missing await on getAuthUrl(), etc.)
 * 5. Docker entrypoint generates config.json correctly
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const monorepoRoot = join(__dirname, '..');

// Colors for terminal output
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	bold: '\x1b[1m',
};

const { reset, red, green, yellow, blue, bold } = colors;

// Validation results
const results = {
	passed: [],
	failed: [],
	warnings: [],
};

/**
 * Find all web apps in the monorepo
 */
async function findWebApps() {
	const webApps = [];
	const appsDirs = [join(monorepoRoot, 'apps'), join(monorepoRoot, 'games')];

	for (const appsDir of appsDirs) {
		try {
			const projects = await readdir(appsDir);
			for (const project of projects) {
				const webAppPath = join(appsDir, project, 'apps', 'web');
				try {
					const stats = await stat(webAppPath);
					if (stats.isDirectory()) {
						webApps.push({
							path: webAppPath,
							name: `${relative(monorepoRoot, appsDir)}/${project}/apps/web`,
						});
					}
				} catch {
					// No web app in this project, skip
				}
			}
		} catch {
			// Apps directory doesn't exist, skip
		}
	}

	return webApps;
}

/**
 * Check if a file exists
 */
async function fileExists(filePath) {
	try {
		await stat(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Read file content safely
 */
async function readFileSafe(filePath) {
	try {
		return await readFile(filePath, 'utf-8');
	} catch {
		return null;
	}
}

/**
 * Validate required files exist
 */
async function validateRequiredFiles(webApp) {
	const errors = [];
	const warnings = [];

	// Check for runtime.ts
	const runtimeTsPath = join(webApp.path, 'src/lib/config/runtime.ts');
	if (!(await fileExists(runtimeTsPath))) {
		errors.push('Missing src/lib/config/runtime.ts');
	}

	// Check for docker-entrypoint.sh
	const entrypointPath = join(webApp.path, 'docker-entrypoint.sh');
	if (!(await fileExists(entrypointPath))) {
		warnings.push('Missing docker-entrypoint.sh (required for Docker deployment)');
	}

	// Check for Dockerfile
	const dockerfilePath = join(webApp.path, 'Dockerfile');
	if (!(await fileExists(dockerfilePath))) {
		warnings.push('Missing Dockerfile (required for Docker deployment)');
	}

	// Check for static/config.json (dev fallback)
	const configJsonPath = join(webApp.path, 'static/config.json');
	if (!(await fileExists(configJsonPath))) {
		warnings.push('Missing static/config.json (dev fallback)');
	}

	return { errors, warnings };
}

/**
 * Check for window injection anti-pattern
 */
async function validateNoWindowInjection(webApp) {
	const errors = [];
	const srcPath = join(webApp.path, 'src');

	async function scanDirectory(dir) {
		try {
			const entries = await readdir(dir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = join(dir, entry.name);

				if (entry.isDirectory()) {
					// Skip node_modules, build artifacts
					if (!['node_modules', 'build', '.svelte-kit', 'dist'].includes(entry.name)) {
						await scanDirectory(fullPath);
					}
				} else if (entry.name.match(/\.(ts|js|svelte)$/)) {
					const content = await readFileSafe(fullPath);
					if (!content) continue;

					// Check for window.__PUBLIC_* pattern
					const windowInjectionPattern = /window\.__PUBLIC_[A-Z_]+__/g;
					const matches = content.match(windowInjectionPattern);

					if (matches) {
						const relativePath = relative(webApp.path, fullPath);
						errors.push(
							`${relativePath}: Found window injection pattern (${matches.join(', ')}). Use runtime config instead.`
						);
					}

					// Check for (window as any).__PUBLIC_* pattern
					const windowAsAnyPattern = /\(window as (?:any|unknown)\)\.__PUBLIC_[A-Z_]+__/g;
					const asAnyMatches = content.match(windowAsAnyPattern);

					if (asAnyMatches) {
						const relativePath = relative(webApp.path, fullPath);
						errors.push(
							`${relativePath}: Found window injection with type assertion (${asAnyMatches.join(', ')}). Use runtime config instead.`
						);
					}
				}
			}
		} catch {
			// Directory doesn't exist or can't be read
		}
	}

	await scanDirectory(srcPath);
	return { errors, warnings: [] };
}

/**
 * Check for direct build-time env usage in stores/api files
 */
async function validateNoBuildTimeEnv(webApp) {
	const errors = [];
	const warnings = [];

	const criticalPaths = [
		join(webApp.path, 'src/lib/stores'),
		join(webApp.path, 'src/lib/api'),
		join(webApp.path, 'src/lib/config'),
	];

	for (const criticalPath of criticalPaths) {
		if (!(await fileExists(criticalPath))) continue;

		async function scanDirectory(dir) {
			try {
				const entries = await readdir(dir, { withFileTypes: true });

				for (const entry of entries) {
					const fullPath = join(dir, entry.name);

					if (entry.isDirectory()) {
						await scanDirectory(fullPath);
					} else if (entry.name.match(/\.(ts|js)$/)) {
						const content = await readFileSafe(fullPath);
						if (!content) continue;

						// Check for import.meta.env.PUBLIC_* in stores/api
						const envPattern = /import\.meta\.env\.PUBLIC_[A-Z_]+/g;
						const matches = content.match(envPattern);

						if (matches) {
							const relativePath = relative(webApp.path, fullPath);
							// Allow in config files if they have backward compat exports
							if (
								relativePath.includes('config/api.ts') ||
								relativePath.includes('config/env.ts')
							) {
								warnings.push(
									`${relativePath}: Uses build-time env vars (${matches.join(', ')}). Consider migrating to runtime config.`
								);
							} else {
								errors.push(
									`${relativePath}: Uses build-time env vars (${matches.join(', ')}). Use runtime config instead.`
								);
							}
						}
					}
				}
			} catch {
				// Directory doesn't exist or can't be read
			}
		}

		await scanDirectory(criticalPath);
	}

	return { errors, warnings };
}

/**
 * Check for missing await on async config functions
 */
async function validateAsyncUsage(webApp) {
	const errors = [];
	const srcPath = join(webApp.path, 'src');

	async function scanDirectory(dir) {
		try {
			const entries = await readdir(dir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = join(dir, entry.name);

				if (entry.isDirectory()) {
					if (!['node_modules', 'build', '.svelte-kit', 'dist'].includes(entry.name)) {
						await scanDirectory(fullPath);
					}
				} else if (entry.name.match(/\.(ts|js|svelte)$/)) {
					const content = await readFileSafe(fullPath);
					if (!content) continue;

					// Check for common async config functions called without await
					const asyncFunctions = [
						'getAuthUrl',
						'getBackendUrl',
						'getApiBaseUrl',
						'getTodoApiUrl',
						'getCalendarApiUrl',
						'getClockApiUrl',
						'getContactsApiUrl',
						'getConfig',
					];

					for (const funcName of asyncFunctions) {
						// Pattern: using function in template literal without await
						// e.g., `${getAuthUrl()}/api` instead of `${await getAuthUrl()}/api`
						const templateLiteralPattern = new RegExp(`\\$\\{\\s*${funcName}\\(\\)\\s*\\}`, 'g');
						const matches = content.match(templateLiteralPattern);

						if (matches) {
							// Check if there's await before it
							const fullPattern = new RegExp(`await\\s+${funcName}\\(\\)`, 'g');
							const awaitMatches = content.match(fullPattern);

							// If we found calls without await
							if (!awaitMatches || matches.length > awaitMatches.length) {
								const relativePath = relative(webApp.path, fullPath);
								errors.push(
									`${relativePath}: Missing 'await' on async function ${funcName}(). This causes "[object Promise]" in URLs.`
								);
							}
						}
					}
				}
			}
		} catch {
			// Directory doesn't exist or can't be read
		}
	}

	await scanDirectory(srcPath);
	return { errors, warnings: [] };
}

/**
 * Validate Docker entrypoint generates config.json correctly
 */
async function validateDockerEntrypoint(webApp) {
	const errors = [];
	const warnings = [];

	const entrypointPath = join(webApp.path, 'docker-entrypoint.sh');
	const content = await readFileSafe(entrypointPath);

	if (!content) {
		// Already caught in validateRequiredFiles
		return { errors, warnings };
	}

	// Check that it generates config.json
	if (!content.includes('config.json')) {
		errors.push('docker-entrypoint.sh does not generate config.json');
	}

	// Check that it uses relative paths (not absolute like /app/build/client/config.json)
	if (content.includes('> /app/build/client/config.json')) {
		errors.push(
			'docker-entrypoint.sh uses absolute path for config.json. Use relative path (build/client/config.json) instead.'
		);
	}

	// Check that it has mkdir -p for config directory
	if (!content.includes('mkdir -p')) {
		warnings.push('docker-entrypoint.sh should include "mkdir -p build/client" for safety');
	}

	// Check that it executes the CMD with exec "$@"
	if (!content.includes('exec "$@"')) {
		warnings.push('docker-entrypoint.sh should end with: exec "$@"');
	}

	return { errors, warnings };
}

/**
 * Validate a single web app
 */
async function validateWebApp(webApp) {
	console.log(`\n${blue}${bold}Checking:${reset} ${webApp.name}`);

	const checks = [
		{ name: 'Required files', fn: validateRequiredFiles },
		{ name: 'No window injection', fn: validateNoWindowInjection },
		{ name: 'No build-time env in stores/api', fn: validateNoBuildTimeEnv },
		{ name: 'Async function usage', fn: validateAsyncUsage },
		{ name: 'Docker entrypoint', fn: validateDockerEntrypoint },
	];

	const allErrors = [];
	const allWarnings = [];

	for (const check of checks) {
		const { errors, warnings } = await check.fn(webApp);
		if (errors.length > 0) {
			allErrors.push(...errors);
		}
		if (warnings.length > 0) {
			allWarnings.push(...warnings);
		}
	}

	// Print results
	if (allErrors.length === 0 && allWarnings.length === 0) {
		console.log(`${green}✓${reset} All checks passed`);
		results.passed.push(webApp.name);
	} else {
		if (allErrors.length > 0) {
			console.log(`${red}✗${reset} ${allErrors.length} error(s):`);
			allErrors.forEach((error) => console.log(`  ${red}•${reset} ${error}`));
			results.failed.push({ name: webApp.name, errors: allErrors });
		}

		if (allWarnings.length > 0) {
			console.log(`${yellow}⚠${reset} ${allWarnings.length} warning(s):`);
			allWarnings.forEach((warning) => console.log(`  ${yellow}•${reset} ${warning}`));
			results.warnings.push({ name: webApp.name, warnings: allWarnings });
		}
	}
}

/**
 * Main validation function
 */
async function main() {
	console.log(`${bold}Runtime Configuration Validator${reset}\n`);
	console.log('Scanning for web apps...\n');

	const webApps = await findWebApps();

	if (webApps.length === 0) {
		console.log(`${yellow}No web apps found${reset}`);
		return;
	}

	console.log(`Found ${webApps.length} web app(s)\n`);

	// Validate each web app
	for (const webApp of webApps) {
		await validateWebApp(webApp);
	}

	// Print summary
	console.log(`\n${bold}═══════════════════════════════════════${reset}`);
	console.log(`${bold}Summary${reset}\n`);
	console.log(`${green}✓${reset} Passed: ${results.passed.length}`);
	console.log(`${yellow}⚠${reset} Warnings: ${results.warnings.length}`);
	console.log(`${red}✗${reset} Failed: ${results.failed.length}`);

	if (results.failed.length > 0) {
		console.log(`\n${red}${bold}Failed apps:${reset}`);
		results.failed.forEach(({ name }) => console.log(`  ${red}•${reset} ${name}`));
	}

	// Exit with error if any validations failed
	if (results.failed.length > 0) {
		console.log(`\n${red}${bold}Validation failed!${reset}`);
		console.log('\nFix the errors above to ensure runtime configuration is implemented correctly.');
		console.log('See docs/RUNTIME_CONFIG.md for implementation guide.\n');
		process.exit(1);
	}

	console.log(`\n${green}${bold}All validations passed!${reset}\n`);
}

main().catch((error) => {
	console.error(`${red}${bold}Validation script error:${reset}`, error);
	process.exit(1);
});
