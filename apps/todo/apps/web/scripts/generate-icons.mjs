#!/usr/bin/env node
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
		const svgPath = join(staticDir, 'icons', 'icon.svg');
		const svgBuffer = readFileSync(svgPath);

		for (const { name, size } of sizes) {
			const outputPath = join(staticDir, name);
			await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);
			console.log(`Generated: ${name} (${size}x${size})`);
		}
		console.log('\nAll icons generated!');
	} catch (error) {
		console.error('Error:', error);
		process.exit(1);
	}
}

generateIcons();
