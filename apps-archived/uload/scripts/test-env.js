// Test which PocketBase URL is being used
console.log('Testing Environment Variables:');
console.log('----------------------------');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PUBLIC_POCKETBASE_URL:', process.env.PUBLIC_POCKETBASE_URL);

// Check if .env file exists
const fs = require('fs');
const path = require('path');

const envFiles = ['.env', '.env.development', '.env.production'];

envFiles.forEach((file) => {
	const filePath = path.join(__dirname, file);
	if (fs.existsSync(filePath)) {
		console.log(`\n${file} exists`);
		const content = fs.readFileSync(filePath, 'utf8');
		const lines = content.split('\n');
		lines.forEach((line) => {
			if (line.includes('POCKETBASE_URL')) {
				console.log(`  -> ${line}`);
			}
		});
	}
});

console.log('\nNOTE: SvelteKit/Vite loads environment variables differently.');
console.log('The app should use:');
console.log('- Development: http://localhost:8090 (from .env or fallback)');
console.log('- Production: https://pb.ulo.ad (from .env.production)');
