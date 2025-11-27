#!/usr/bin/env tsx

/**
 * Sync Script: Synchronisiert Autoren zwischen de.ts und en.ts
 *
 * Stellt sicher, dass alle Autoren in beiden Sprachen vorhanden sind
 * mit allen verfügbaren Informationen
 */

import * as fs from 'fs';
import * as path from 'path';
import { Author } from '../services/contentLoader';

/**
 * Liest Autoren aus TypeScript-Datei
 */
function loadAuthors(lang: 'de' | 'en'): Map<string, Author> {
  const filePath = path.join(__dirname, `../services/data/authors/${lang}.ts`);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/export const authors[A-Z]{2}: Author\[\] = (\[[\s\S]*\]);/);

    if (!match) {
      throw new Error(`Konnte Authors nicht aus ${filePath} extrahieren`);
    }

    const authorsArray = eval(match[1]) as Author[];
    const authorsMap = new Map<string, Author>();
    authorsArray.forEach(author => authorsMap.set(author.id, author));

    return authorsMap;
  } catch (error) {
    console.error(`❌ Fehler beim Laden von ${filePath}:`, error);
    return new Map();
  }
}

/**
 * Schreibt Authors-Array zurück in TypeScript-Datei
 */
function writeAuthors(authors: Author[], lang: 'de' | 'en'): void {
  const filePath = path.join(__dirname, `../services/data/authors/${lang}.ts`);

  // Backup erstellen
  const backupPath = filePath.replace('.ts', `.backup-${Date.now()}.ts`);
  fs.copyFileSync(filePath, backupPath);
  console.log(`💾 Backup erstellt: ${path.basename(backupPath)}`);

  const authorsJson = JSON.stringify(authors, null, 2);
  const tsContent = `import { Author } from '../../contentLoader';

export const authors${lang.toUpperCase()}: Author[] = ${authorsJson};
`;

  fs.writeFileSync(filePath, tsContent, 'utf-8');
  console.log(`✅ ${lang}.ts erfolgreich aktualisiert (${authors.length} Autoren)\n`);
}

/**
 * Merged zwei Author-Objekte (behält die meisten Informationen)
 */
function mergeAuthorData(author1: Author, author2: Author): Author {
  return {
    id: author1.id,
    name: author1.name || author2.name,
    profession: author1.profession || author2.profession,
    biography: {
      short: author1.biography?.short || author2.biography?.short || '',
      long: author1.biography?.long || author2.biography?.long,
      sections: author1.biography?.sections || author2.biography?.sections,
      keyAchievements: author1.biography?.keyAchievements || author2.biography?.keyAchievements,
      famousQuote: author1.biography?.famousQuote || author2.biography?.famousQuote
    },
    lifespan: author1.lifespan || author2.lifespan,
    verified: author1.verified || author2.verified,
    featured: author1.featured || author2.featured,
    imageUrl: author1.imageUrl || author2.imageUrl,
    image: author1.image || author2.image
  };
}

/**
 * Synchronisiert zwei Author-Maps
 */
function syncAuthorMaps(
  primary: Map<string, Author>,
  secondary: Map<string, Author>
): { synced: Author[], added: number, updated: number } {
  const synced = new Map<string, Author>();
  let added = 0;
  let updated = 0;

  // 1. Alle primären Autoren hinzufügen
  for (const [id, author] of primary) {
    synced.set(id, author);
  }

  // 2. Fehlende aus secondary hinzufügen oder mergen
  for (const [id, secondaryAuthor] of secondary) {
    if (synced.has(id)) {
      // Merge: Nimm die meisten Infos aus beiden
      const primaryAuthor = synced.get(id)!;
      const merged = mergeAuthorData(primaryAuthor, secondaryAuthor);
      synced.set(id, merged);
      updated++;
    } else {
      // Neu hinzufügen
      synced.set(id, secondaryAuthor);
      added++;
    }
  }

  return {
    synced: Array.from(synced.values()).sort((a, b) => a.id.localeCompare(b.id)),
    added,
    updated
  };
}

/**
 * Main Sync
 */
async function sync() {
  console.log('🔄 Autoren-Synchronisation zwischen DE und EN\n');
  console.log('=' .repeat(60) + '\n');

  // 1. Lade beide Dateien
  console.log('📚 Lade Autoren...\n');
  const authorsDE = loadAuthors('de');
  const authorsEN = loadAuthors('en');

  console.log(`   🇩🇪 DE: ${authorsDE.size} Autoren`);
  console.log(`   🇬🇧 EN: ${authorsEN.size} Autoren\n`);

  // 2. Finde Unterschiede
  const onlyDE = Array.from(authorsDE.keys()).filter(id => !authorsEN.has(id));
  const onlyEN = Array.from(authorsEN.keys()).filter(id => !authorsDE.has(id));

  console.log('📊 Unterschiede:\n');
  console.log(`   ⚠️  Nur in DE: ${onlyDE.length} Autoren`);
  if (onlyDE.length > 0 && onlyDE.length <= 20) {
    console.log(`      → ${onlyDE.join(', ')}`);
  }
  console.log(`   ⚠️  Nur in EN: ${onlyEN.length} Autoren`);
  if (onlyEN.length > 0 && onlyEN.length <= 20) {
    console.log(`      → ${onlyEN.join(', ')}`);
  }
  console.log();

  // 3. Synchronisiere DE (füge fehlende aus EN hinzu)
  console.log('=' .repeat(60) + '\n');
  console.log('🇩🇪 Synchronisiere DE...\n');
  const syncedDE = syncAuthorMaps(authorsDE, authorsEN);
  console.log(`   ➕ ${syncedDE.added} Autoren hinzugefügt`);
  console.log(`   ✏️  ${syncedDE.updated} Autoren aktualisiert`);
  console.log(`   📦 ${syncedDE.synced.length} Autoren gesamt\n`);
  writeAuthors(syncedDE.synced, 'de');

  // 4. Synchronisiere EN (füge fehlende aus DE hinzu)
  console.log('=' .repeat(60) + '\n');
  console.log('🇬🇧 Synchronisiere EN...\n');
  const syncedEN = syncAuthorMaps(authorsEN, authorsDE);
  console.log(`   ➕ ${syncedEN.added} Autoren hinzugefügt`);
  console.log(`   ✏️  ${syncedEN.updated} Autoren aktualisiert`);
  console.log(`   📦 ${syncedEN.synced.length} Autoren gesamt\n`);
  writeAuthors(syncedEN.synced, 'en');

  // 5. Vergleiche Informationen (Vollständigkeit)
  console.log('=' .repeat(60) + '\n');
  console.log('📋 Vollständigkeits-Check:\n');

  const finalDE = new Map(syncedDE.synced.map(a => [a.id, a]));
  const finalEN = new Map(syncedEN.synced.map(a => [a.id, a]));

  let missingBioDE = 0;
  let missingBioEN = 0;
  let missingLifespanDE = 0;
  let missingLifespanEN = 0;

  for (const [id, author] of finalDE) {
    if (!author.biography?.short) missingBioDE++;
    if (!author.lifespan) missingLifespanDE++;
  }

  for (const [id, author] of finalEN) {
    if (!author.biography?.short) missingBioEN++;
    if (!author.lifespan) missingLifespanEN++;
  }

  console.log(`   🇩🇪 DE:`);
  console.log(`      ✅ ${finalDE.size} Autoren gesamt`);
  console.log(`      ⚠️  ${missingBioDE} ohne Biografie`);
  console.log(`      ⚠️  ${missingLifespanDE} ohne Lebensdaten`);
  console.log();
  console.log(`   🇬🇧 EN:`);
  console.log(`      ✅ ${finalEN.size} Autoren gesamt`);
  console.log(`      ⚠️  ${missingBioEN} ohne Biografie`);
  console.log(`      ⚠️  ${missingLifespanEN} ohne Lebensdaten`);
  console.log();

  console.log('=' .repeat(60) + '\n');
  console.log('✨ Synchronisation abgeschlossen!\n');
  console.log('📝 Beide Sprachen haben jetzt die gleichen Autoren mit allen verfügbaren Infos.\n');
}

// Run sync
sync().catch(error => {
  console.error('❌ Synchronisation fehlgeschlagen:', error);
  process.exit(1);
});
