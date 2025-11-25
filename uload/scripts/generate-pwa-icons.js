#!/usr/bin/env node

// Script to generate PWA icons from logo
// Since we don't have image processing libs, we'll create placeholder SVGs

const fs = require('fs');
const path = require('path');

// SVG Logo content (simple U for uLoad)
const createSvgIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3B82F6" rx="${size * 0.15}"/>
  <text x="50%" y="55%" font-family="system-ui, -apple-system, sans-serif" font-size="${size * 0.5}px" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">U</text>
</svg>
`;

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Ensure directory exists
const iconsDir = path.join(__dirname, '..', 'static', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  const content = createSvgIcon(size);
  
  fs.writeFileSync(filepath, content.trim());
  console.log(`Generated ${filename}`);
});

// Also create apple-touch-icon
const appleIcon = createSvgIcon(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleIcon.trim());
console.log('Generated apple-touch-icon.svg');

// Create maskable icon (with safe area padding)
const createMaskableIcon = (size) => {
  const safeArea = size * 0.8; // 80% safe area
  const padding = (size - safeArea) / 2;
  
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3B82F6"/>
  <rect x="${padding}" y="${padding}" width="${safeArea}" height="${safeArea}" fill="#3B82F6" rx="${safeArea * 0.15}"/>
  <text x="50%" y="55%" font-family="system-ui, -apple-system, sans-serif" font-size="${safeArea * 0.5}px" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">U</text>
</svg>
`;
};

// Generate maskable icons
[192, 512].forEach(size => {
  const filename = `icon-maskable-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  const content = createMaskableIcon(size);
  
  fs.writeFileSync(filepath, content.trim());
  console.log(`Generated ${filename}`);
});

console.log('\n✅ All PWA icons generated successfully!');