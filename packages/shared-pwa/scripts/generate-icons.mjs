#!/usr/bin/env node
/**
 * PWA Icon Generator Script
 *
 * Generates PWA icons from a source SVG or PNG file.
 * Creates: pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png
 *
 * Usage:
 *   node generate-icons.mjs <source-image> [output-dir]
 *
 * Requirements:
 *   - sharp package (installed as devDependency)
 *
 * Example:
 *   node generate-icons.mjs favicon.svg static/
 */

import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ICON_SIZES = [
	{ name: 'pwa-192x192.png', size: 192 },
	{ name: 'pwa-512x512.png', size: 512 },
	{ name: 'apple-touch-icon.png', size: 180 },
];

async function generateIcons(sourcePath, outputDir) {
	// Dynamic import of sharp (may not be installed in all contexts)
	let sharp;
	try {
		sharp = (await import('sharp')).default;
	} catch {
		console.error('Error: sharp package not installed.');
		console.error('Install it with: pnpm add -D sharp');
		process.exit(1);
	}

	if (!existsSync(sourcePath)) {
		console.error(`Error: Source file not found: ${sourcePath}`);
		process.exit(1);
	}

	// Create output directory if it doesn't exist
	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
	}

	console.log(`Generating PWA icons from: ${sourcePath}`);
	console.log(`Output directory: ${outputDir}`);
	console.log('');

	for (const icon of ICON_SIZES) {
		const outputPath = join(outputDir, icon.name);

		try {
			await sharp(sourcePath).resize(icon.size, icon.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(outputPath);

			console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size})`);
		} catch (error) {
			console.error(`  ✗ ${icon.name}: ${error.message}`);
		}
	}

	console.log('');
	console.log('Done! Icons generated successfully.');
	console.log('');
	console.log('Make sure these files are in your static/ directory.');
}

// CLI execution
const args = process.argv.slice(2);

if (args.length < 1) {
	console.log('PWA Icon Generator');
	console.log('');
	console.log('Usage: node generate-icons.mjs <source-image> [output-dir]');
	console.log('');
	console.log('Arguments:');
	console.log('  source-image  Path to source SVG or PNG file');
	console.log('  output-dir    Output directory (default: current directory)');
	console.log('');
	console.log('Example:');
	console.log('  node generate-icons.mjs favicon.svg static/');
	process.exit(0);
}

const sourcePath = args[0];
const outputDir = args[1] || '.';

generateIcons(sourcePath, outputDir);
