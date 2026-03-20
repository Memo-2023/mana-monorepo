// This script uses Node.js to generate placeholder images for our game
const fs = require('fs');
const { createCanvas } = require('canvas');

// Create background image (800x600)
const bgCanvas = createCanvas(800, 600);
const bgCtx = bgCanvas.getContext('2d');
bgCtx.fillStyle = '#222233';
bgCtx.fillRect(0, 0, 800, 600);

// Add some pattern to background
bgCtx.fillStyle = '#1a1a2a';
for (let i = 0; i < 100; i++) {
	const x = Math.random() * 800;
	const y = Math.random() * 600;
	const size = Math.random() * 5 + 2;
	bgCtx.fillRect(x, y, size, size);
}

// Create player image (32x32)
const playerCanvas = createCanvas(32, 32);
const playerCtx = playerCanvas.getContext('2d');
playerCtx.fillStyle = '#ff0000';
playerCtx.fillRect(0, 0, 32, 32);
playerCtx.fillStyle = '#ff5555';
playerCtx.fillRect(8, 8, 16, 16);

// Create tile image (32x32)
const tileCanvas = createCanvas(32, 32);
const tileCtx = tileCanvas.getContext('2d');
tileCtx.fillStyle = '#ffffff';
tileCtx.fillRect(0, 0, 32, 32);
tileCtx.strokeStyle = '#cccccc';
tileCtx.lineWidth = 1;
tileCtx.strokeRect(0.5, 0.5, 31, 31);

// Save images
const bgBuffer = bgCanvas.toBuffer('image/png');
fs.writeFileSync('./assets/background.png', bgBuffer);

const playerBuffer = playerCanvas.toBuffer('image/png');
fs.writeFileSync('./assets/player.png', playerBuffer);

const tileBuffer = tileCanvas.toBuffer('image/png');
fs.writeFileSync('./assets/tile.png', tileBuffer);

console.log('All placeholder images have been generated!');
