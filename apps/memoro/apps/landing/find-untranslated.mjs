import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const contentDir = join(__dirname, 'src', 'content');

async function findUntranslatedContent() {
  const collections = ['guides', 'blog', 'team', 'features'];
  
  for (const collection of collections) {
    console.log(`\n🔍 Checking ${collection}...`);
    
    const dePath = join(contentDir, collection, 'de');
    const enPath = join(contentDir, collection, 'en');
    
    try {
      const deFiles = await readdir(dePath);
      const enFiles = await readdir(enPath);
      
      for (const file of deFiles) {
        if (!file.endsWith('.mdx')) continue;
        
        const dePath = join(contentDir, collection, 'de', file);
        const enPath = join(contentDir, collection, 'en', file);
        
        const deContent = await readFile(dePath, 'utf-8');
        const enContent = await readFile(enPath, 'utf-8');
        
        // Extrahiere die Frontmatter
        const deFrontmatter = deContent.match(/^---([\s\S]*?)---/)[1];
        const enFrontmatter = enContent.match(/^---([\s\S]*?)---/)[1];
        
        // Prüfe, ob die englische Version noch den deutschen Inhalt hat
        if (deFrontmatter.includes('"de"') && enFrontmatter.includes('"en"')) {
          const deTitle = deFrontmatter.match(/title: "(.*?)"/)[1];
          const enTitle = enFrontmatter.match(/title: "(.*?)"/)[1];
          
          if (deTitle === enTitle) {
            console.log(`❌ ${file} needs translation (same title in both languages)`);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing ${collection}:`, error);
    }
  }
}

findUntranslatedContent().catch(console.error);
