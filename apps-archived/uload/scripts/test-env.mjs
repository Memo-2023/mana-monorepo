// Test which PocketBase URL is being used
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing Environment Variables:');
console.log('----------------------------');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PUBLIC_POCKETBASE_URL:', process.env.PUBLIC_POCKETBASE_URL);

const envFiles = ['.env', '.env.development', '.env.production'];

envFiles.forEach(file => {
  const filePath = join(__dirname, file);
  if (existsSync(filePath)) {
    console.log(`\n${file} exists`);
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
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