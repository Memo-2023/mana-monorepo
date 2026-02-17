/**
 * SpiralDB Demo
 * Run with: npx tsx demo.ts
 */

import {
	SpiralDB,
	createTodoSchema,
	visualizeImageEmoji,
	visualizeSpiralOrder,
	saveToPngFile,
	loadFromPngFile,
	exportToPngBytes,
} from './src/index.js';
import { existsSync } from 'fs';

console.log('='.repeat(60));
console.log('🌀 SpiralDB Demo - Pixel-Based Spiral Database');
console.log('='.repeat(60));

// Show spiral order for a 7x7 image
console.log('\n📐 Spiral Index Order (7x7):');
console.log(visualizeSpiralOrder(7));

// Create database
console.log('\n📦 Creating SpiralDB with Todo schema...');
const db = new SpiralDB({
	schema: createTodoSchema(),
	compression: true,
});

console.log('\n📊 Initial Stats:');
console.log(db.getStats());

// Insert some todos
const todos = [
	{
		id: 0,
		status: 0,
		priority: 2, // high
		createdAt: new Date('2025-01-01'),
		dueDate: new Date('2025-01-15'),
		completedAt: null,
		title: 'Build SpiralDB',
		description: 'Create a pixel-based database',
		tags: [1, 2],
	},
	{
		id: 0,
		status: 0,
		priority: 1, // medium
		createdAt: new Date('2025-01-02'),
		dueDate: new Date('2025-01-20'),
		completedAt: null,
		title: 'Write tests',
		description: 'Add unit tests',
		tags: [1],
	},
	{
		id: 0,
		status: 0,
		priority: 0, // low
		createdAt: new Date('2025-01-03'),
		dueDate: null,
		completedAt: null,
		title: 'Documentation',
		description: null,
		tags: [],
	},
];

console.log('\n✏️  Inserting todos...');
for (const todo of todos) {
	const result = db.insert(todo);
	console.log(`  → ID ${result.recordId}: ${todo.title}`);
}

console.log('\n📊 Stats after inserts:');
const stats = db.getStats();
console.log(`  Image size: ${stats.imageSize}×${stats.imageSize}`);
console.log(`  Total pixels: ${stats.totalPixels}`);
console.log(`  Used pixels: ${stats.usedPixels}`);
console.log(`  Active records: ${stats.activeRecords}`);
console.log(`  Current ring: ${stats.currentRing}`);

// Complete one todo
console.log('\n✅ Completing todo #1...');
db.complete(1);

// Read back
console.log('\n📖 Reading all todos:');
const allTodos = db.getAll();
for (const record of allTodos) {
	const statusIcon = record.meta.status === 'completed' ? '✅' : '⬜';
	console.log(`  ${statusIcon} [${record.meta.id}] ${record.data.title}`);
}

// Visualize the image
console.log('\n🎨 Database Image (emoji visualization):');
const image = db.getImage();
console.log(visualizeImageEmoji(image));

// Legend
console.log('\n📚 Color Legend:');
console.log('  ⬛ Black (000)  - Null/Empty/Active');
console.log('  🟦 Blue (001)   - Data Type 1');
console.log('  🟩 Green (010)  - Completed/True');
console.log('  🔷 Cyan (011)   - Data Type 3');
console.log('  🟥 Red (100)    - Deleted/Important');
console.log('  🟪 Magenta (101) - Data Type 5');
console.log('  🟨 Yellow (110) - Warning/Archived');
console.log('  ⬜ White (111)  - Magic/Separator/End');

// Calculate storage efficiency
const jsonSize = JSON.stringify(todos).length;
const pixelBits = stats.usedPixels * 3;
const pixelBytes = Math.ceil(pixelBits / 8);

console.log('\n📈 Storage Comparison:');
console.log(`  JSON size: ${jsonSize} bytes`);
console.log(`  Pixel size: ${pixelBytes} bytes (${stats.usedPixels} pixels × 3 bits)`);
console.log(`  Compression: ${((1 - pixelBytes / jsonSize) * 100).toFixed(1)}%`);

// PNG Export Demo
console.log('\n📸 PNG Export Demo:');

const pngPath = './demo-output.png';
const pngBytes = exportToPngBytes(image);
console.log(`  Raw PNG size: ${pngBytes.length} bytes`);

// Save to file
await saveToPngFile(image, pngPath);
console.log(`  Saved to: ${pngPath}`);

// Verify by loading back
if (existsSync(pngPath)) {
	const loadedImage = await loadFromPngFile(pngPath);
	console.log(`  Loaded back: ${loadedImage.width}×${loadedImage.height} pixels`);

	// Verify data integrity
	const loadedDb = SpiralDB.fromImage(loadedImage, createTodoSchema());
	const loadedTodos = loadedDb.getAll();
	console.log(`  Verified: ${loadedTodos.length} todos recovered`);

	for (const record of loadedTodos) {
		const statusIcon = record.meta.status === 'completed' ? '✅' : '⬜';
		console.log(`    ${statusIcon} [${record.meta.id}] ${record.data.title}`);
	}
}

console.log('\n' + '='.repeat(60));
console.log('Demo complete!');
