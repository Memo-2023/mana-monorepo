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
	const sharp = (await import('sharp')).default;
	const svgBuffer = readFileSync(join(staticDir, 'favicon.svg'));
	for (const { name, size } of sizes) {
		await sharp(svgBuffer).resize(size, size).png().toFile(join(staticDir, name));
		console.log(`Generated: ${name} (${size}x${size})`);
	}
}
generateIcons();
