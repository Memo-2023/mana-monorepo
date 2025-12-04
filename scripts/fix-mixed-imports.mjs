#!/usr/bin/env node
/**
 * Script to fix mixed value + type imports
 *
 * Transforms:
 *   import { foo, type Bar } from 'module';
 * Into:
 *   import { foo } from 'module';
 *   import type { Bar } from 'module';
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Find all files with mixed imports using grep (excluding node_modules, dist, build)
const grepOutput = execSync(
	`grep -rl --include="*.ts" --include="*.tsx" --include="*.svelte" --include="*.astro" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=.next --exclude-dir=.svelte-kit "import {[^}]*,\\s*type\\s" . 2>/dev/null || true`,
	{ encoding: 'utf-8', cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 }
).trim();

const files = grepOutput.split('\n').filter(Boolean);

console.log(`Found ${files.length} files with mixed imports\n`);

// Regex to match mixed imports
// Matches: import { value1, value2, type Type1, type Type2 } from 'module';
const mixedImportRegex = /import\s*\{([^}]+)\}\s*from\s*(['"][^'"]+['"])\s*;?/g;

function fixMixedImports(content) {
	let modified = false;

	const newContent = content.replace(mixedImportRegex, (match, imports, modulePath) => {
		const importItems = imports
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);

		const valueImports = [];
		const typeImports = [];

		for (const item of importItems) {
			if (item.startsWith('type ')) {
				// Remove 'type ' prefix and add to type imports
				typeImports.push(item.replace(/^type\s+/, ''));
			} else {
				valueImports.push(item);
			}
		}

		// If no type imports, return original (not a mixed import)
		if (typeImports.length === 0) {
			return match;
		}

		// If no value imports, convert to type-only import
		if (valueImports.length === 0) {
			return match; // This shouldn't happen with our grep pattern
		}

		modified = true;

		// Build separate import statements
		const valueStatement = `import { ${valueImports.join(', ')} } from ${modulePath};`;
		const typeStatement = `import type { ${typeImports.join(', ')} } from ${modulePath};`;

		return `${valueStatement}\n${typeStatement}`;
	});

	return { content: newContent, modified };
}

let fixedCount = 0;
let errorCount = 0;

for (const file of files) {
	try {
		const content = readFileSync(file, 'utf-8');
		const { content: newContent, modified } = fixMixedImports(content);

		if (modified) {
			writeFileSync(file, newContent, 'utf-8');
			console.log(`✓ Fixed: ${file}`);
			fixedCount++;
		}
	} catch (err) {
		console.error(`✗ Error processing ${file}: ${err.message}`);
		errorCount++;
	}
}

console.log(`\n${'='.repeat(50)}`);
console.log(`Fixed ${fixedCount} files`);
if (errorCount > 0) {
	console.log(`Errors: ${errorCount}`);
}
