// Simple script to create basic placeholder images
// Just open this in a browser and it will create data URLs you can copy

document.body.innerHTML = `
<h1>Placeholder Images for WhoPixels</h1>
<div>
  <h2>Background (800x600)</h2>
  <canvas id="bg" width="800" height="600" style="border:1px solid #000; max-width: 100%;"></canvas>
  <p id="bgData"></p>
</div>
<div>
  <h2>Player (32x32)</h2>
  <canvas id="player" width="32" height="32" style="border:1px solid #000;"></canvas>
  <p id="playerData"></p>
</div>
<div>
  <h2>Tile (32x32)</h2>
  <canvas id="tile" width="32" height="32" style="border:1px solid #000;"></canvas>
  <p id="tileData"></p>
</div>
`;

// Draw background
const bgCanvas = document.getElementById('bg');
const bgCtx = bgCanvas.getContext('2d');
bgCtx.fillStyle = '#222233';
bgCtx.fillRect(0, 0, 800, 600);
for (let i = 0; i < 100; i++) {
    bgCtx.fillStyle = '#1a1a2a';
    const x = Math.random() * 800;
    const y = Math.random() * 600;
    const size = Math.random() * 5 + 2;
    bgCtx.fillRect(x, y, size, size);
}
document.getElementById('bgData').textContent = 'Save this image as background.png';

// Draw player
const playerCanvas = document.getElementById('player');
const playerCtx = playerCanvas.getContext('2d');
playerCtx.fillStyle = '#ff0000';
playerCtx.fillRect(0, 0, 32, 32);
playerCtx.fillStyle = '#ff5555';
playerCtx.fillRect(8, 8, 16, 16);
document.getElementById('playerData').textContent = 'Save this image as player.png';

// Draw tile
const tileCanvas = document.getElementById('tile');
const tileCtx = tileCanvas.getContext('2d');
tileCtx.fillStyle = '#ffffff';
tileCtx.fillRect(0, 0, 32, 32);
tileCtx.strokeStyle = '#cccccc';
tileCtx.lineWidth = 1;
tileCtx.strokeRect(0.5, 0.5, 31, 31);
document.getElementById('tileData').textContent = 'Save this image as tile.png';
