#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';

async function integrateImages() {
  console.log('🖼️  Integrating author images into app data...\n');

  // Load image data
  const imagesPath = path.join(process.cwd(), 'author-images-all.json');
  const imageData = JSON.parse(await fs.readFile(imagesPath, 'utf-8'));
  
  // Create a map for quick lookup
  const imageMap = new Map();
  imageData.authors.forEach(author => {
    if (author.found && author.imageInfo) {
      imageMap.set(author.id, {
        thumbnail: author.imageInfo.url,
        full: author.imageInfo.url,
        credit: author.imageInfo.user,
        source: 'Wikimedia Commons'
      });
    }
  });

  // Update English authors
  const enPath = path.join(process.cwd(), 'services/data/authors/en.ts');
  let enContent = await fs.readFile(enPath, 'utf-8');
  
  // Update German authors
  const dePath = path.join(process.cwd(), 'services/data/authors/de.ts');
  let deContent = await fs.readFile(dePath, 'utf-8');

  // Function to add image field to author objects
  const addImageFields = (content: string, lang: string) => {
    let updated = content;
    let count = 0;
    
    imageMap.forEach((imageInfo, authorId) => {
      // Find the author object
      const regex = new RegExp(`id: '${authorId}',[\\s\\S]*?(?=\\},|\\}\\s*\\])`);
      const match = updated.match(regex);
      
      if (match) {
        const authorBlock = match[0];
        
        // Check if image field already exists
        if (!authorBlock.includes('image:')) {
          // Add image field before the closing of the object
          const imageField = `\n    image: ${JSON.stringify(imageInfo, null, 2).split('\n').map((line, i) => i === 0 ? line : '    ' + line).join('\n')},`;
          
          // Insert before 'verified' or 'featured' or at the end
          if (authorBlock.includes('verified:')) {
            updated = updated.replace(
              authorBlock,
              authorBlock.replace(/(\n\s*verified:)/, `${imageField}$1`)
            );
            count++;
          } else if (authorBlock.includes('featured:')) {
            updated = updated.replace(
              authorBlock,
              authorBlock.replace(/(\n\s*featured:)/, `${imageField}$1`)
            );
            count++;
          } else {
            // Add at the end
            updated = updated.replace(
              authorBlock,
              authorBlock + ',' + imageField
            );
            count++;
          }
        }
      }
    });
    
    console.log(`  ${lang}: Updated ${count} authors with images`);
    return updated;
  };

  // Update both files
  enContent = addImageFields(enContent, 'EN');
  deContent = addImageFields(deContent, 'DE');
  
  // Write back the updated files
  await fs.writeFile(enPath, enContent, 'utf-8');
  await fs.writeFile(dePath, deContent, 'utf-8');
  
  console.log('\n✅ Successfully integrated author images into the app!');
  console.log('   The app will now display author images from Wikimedia Commons.');
}

integrateImages().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});