import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const contentDir = join(__dirname, 'src', 'content');

async function updateMdxFiles() {
  const collections = ['guides', 'blog', 'team'];
  const languages = ['de', 'en'];

  for (const collection of collections) {
    for (const lang of languages) {
      const collectionPath = join(contentDir, collection, lang);
      
      try {
        const files = await readdir(collectionPath);
        for (const file of files) {
          if (!file.endsWith('.mdx')) continue;
          
          const filePath = join(collectionPath, file);
          let content = await readFile(filePath, 'utf-8');
          
          // Extrahiere die Frontmatter
          const frontmatterMatch = content.match(/^---([\s\S]*?)---/);
          if (!frontmatterMatch) continue;
          
          const frontmatter = frontmatterMatch[1];
          if (!frontmatter.includes('lang:') || !frontmatter.includes('slug:')) {
            // Füge lang und slug hinzu, wenn sie fehlen
            const slug = file.replace('.mdx', '');
            const newFrontmatter = frontmatter.trim() + `\nlang: "${lang}"\nslug: "${slug}"\n`;
            content = content.replace(frontmatterMatch[0], `---\n${newFrontmatter}---`);
            
            await writeFile(filePath, content, 'utf-8');
            console.log(`Updated ${filePath}`);
          }
        }
      } catch (error) {
        console.error(`Error processing ${collectionPath}:`, error);
      }
    }
  }
}

updateMdxFiles().catch(console.error);
