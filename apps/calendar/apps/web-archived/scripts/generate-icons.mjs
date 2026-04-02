#!/usr/bin/env node
/**
 * Generate PWA icons from SVG favicon
 * Run: node scripts/generate-icons.mjs
 * Requires: sharp (available in workspace)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticDir = join(__dirname, '..', 'static');

const sizes = [
	{ name: 'favicon.png', size: 32 },
	{ name: 'pwa-192x192.png', size: 192 },
	{ name: 'pwa-512x512.png', size: 512 },
	{ name: 'apple-touch-icon.png', size: 180 },
];

async function generateIcons() {
	try {
		const sharp = (await import('sharp')).default;
		const svgPath = join(staticDir, 'favicon.svg');
		const svgBuffer = readFileSync(svgPath);

		for (const { name, size } of sizes) {
			const outputPath = join(staticDir, name);
			await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);
			console.log(`Generated: ${name} (${size}x${size})`);
		}

		console.log('\nAll icons generated successfully!');
	} catch (error) {
		if (error.code === 'ERR_MODULE_NOT_FOUND') {
			console.error('Sharp is not installed. Run: pnpm add -D sharp');
		} else {
			console.error('Error generating icons:', error);
		}
		process.exit(1);
	}
}

generateIcons();
