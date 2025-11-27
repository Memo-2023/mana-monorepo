#!/usr/bin/env ts-node

/**
 * Migration Script: Markdown Author Profiles → TypeScript Authors
 *
 * Liest die Markdown-Biografien aus content/authors/profiles/
 * und migriert sie in die TypeScript-Autoren-Dateien
 */

import * as fs from 'fs';
import * as path from 'path';
import { Author } from '../services/contentLoader';

interface MarkdownFrontmatter {
  id: string;
  name: string;
  born?: string;
  died?: string;
  nationality?: string;
  image?: string;
  featured?: boolean;
}

interface ParsedMarkdown {
  frontmatter: MarkdownFrontmatter;
  content: string;
}

/**
 * Parse Markdown-Datei mit Frontmatter
 */
function parseMarkdown(filePath: string): ParsedMarkdown | null {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Frontmatter extrahieren (zwischen --- und ---)
    const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    if (!frontmatterMatch) {
      console.warn(`⚠️  Kein Frontmatter gefunden: ${path.basename(filePath)}`);
      return null;
    }

    const [, frontmatterStr, content] = frontmatterMatch;

    // Frontmatter parsen (YAML-ähnlich)
    const frontmatter: any = {};
    frontmatterStr.split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        // Boolean parsen
        if (value === 'true') frontmatter[key] = true;
        else if (value === 'false') frontmatter[key] = false;
        else frontmatter[key] = value;
      }
    });

    return {
      frontmatter: frontmatter as MarkdownFrontmatter,
      content: content.trim()
    };
  } catch (error) {
    console.error(`❌ Fehler beim Parsen von ${filePath}:`, error);
    return null;
  }
}

/**
 * Extrahiert Kurzbiografie aus Markdown-Content
 */
function extractShortBio(content: string): string {
  // Suche nach "## Kurzbiografie" Sektion
  const match = content.match(/## Kurzbiografie\n\n(.*?)(?=\n\n##|$)/s);
  if (match) {
    return match[1].trim();
  }

  // Fallback: Erster Absatz nach dem Titel
  const paragraphs = content.split('\n\n');
  for (const para of paragraphs) {
    if (para.startsWith('#') || para.startsWith('*') || para.startsWith('>')) {
      continue;
    }
    if (para.length > 50) {
      return para.trim();
    }
  }

  return 'Keine Kurzbiografie verfügbar.';
}

/**
 * Extrahiert berühmte Zitate aus Markdown
 */
function extractFamousQuote(content: string): string | undefined {
  const match = content.match(/>\s*"(.+?)"/);
  return match ? match[1] : undefined;
}

/**
 * Konvertiert Markdown-Daten zu Author-Objekt
 */
function convertToAuthor(parsed: ParsedMarkdown): Author {
  const { frontmatter, content } = parsed;

  const author: Author = {
    id: frontmatter.id,
    name: frontmatter.name,
    biography: {
      short: extractShortBio(content),
      long: content, // Gesamter Markdown-Content als long biography
      famousQuote: extractFamousQuote(content)
    },
    verified: true,
    featured: frontmatter.featured || false
  };

  // Lebensdaten
  if (frontmatter.born || frontmatter.died) {
    author.lifespan = {
      birth: frontmatter.born || '',
      death: frontmatter.died
    };
  }

  // Bild
  if (frontmatter.image) {
    author.imageUrl = frontmatter.image;
  }

  return author;
}

/**
 * Liest alle Markdown-Dateien aus dem Profiles-Verzeichnis
 */
function loadAllMarkdownProfiles(): Map<string, Author> {
  const profilesDir = path.join(__dirname, '../content/authors/profiles');
  const authors = new Map<string, Author>();

  console.log(`📂 Lese Markdown-Profile aus: ${profilesDir}\n`);

  const files = fs.readdirSync(profilesDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(profilesDir, file);
    const parsed = parseMarkdown(filePath);

    if (parsed) {
      const author = convertToAuthor(parsed);
      authors.set(author.id, author);
      console.log(`✅ ${author.name} (${author.id})`);
    }
  }

  console.log(`\n📊 Gesamt: ${authors.size} Autoren aus Markdown geladen\n`);

  return authors;
}

/**
 * Liest existierende TypeScript-Autoren
 */
function loadExistingAuthors(lang: 'de' | 'en'): Map<string, Author> {
  const filePath = path.join(__dirname, `../services/data/authors/${lang}.ts`);

  try {
    // Dynamisch importieren geht nicht so einfach, daher nutzen wir require
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extrahiere das Array (hacky aber funktioniert)
    const match = content.match(/export const authors[A-Z]{2}: Author\[\] = (\[[\s\S]*\]);/);

    if (!match) {
      console.warn(`⚠️  Konnte Authors nicht aus ${filePath} extrahieren`);
      return new Map();
    }

    // Parsen via eval (nur für Migration OK!)
    const authorsArray = eval(match[1]) as Author[];

    const authorsMap = new Map<string, Author>();
    authorsArray.forEach(author => authorsMap.set(author.id, author));

    console.log(`📚 ${authorsArray.length} existierende Autoren aus ${lang}.ts geladen`);

    return authorsMap;
  } catch (error) {
    console.error(`❌ Fehler beim Laden von ${filePath}:`, error);
    return new Map();
  }
}

/**
 * Merged Markdown-Autoren mit existierenden TypeScript-Autoren
 */
function mergeAuthors(
  existing: Map<string, Author>,
  markdown: Map<string, Author>
): Author[] {
  const merged = new Map<string, Author>(existing);

  let updated = 0;
  let added = 0;

  for (const [id, markdownAuthor] of markdown) {
    if (merged.has(id)) {
      // Author existiert bereits - Update Biography
      const existingAuthor = merged.get(id)!;

      merged.set(id, {
        ...existingAuthor,
        biography: {
          short: markdownAuthor.biography?.short || existingAuthor.biography?.short || '',
          long: markdownAuthor.biography?.long || existingAuthor.biography?.long,
          sections: existingAuthor.biography?.sections,
          keyAchievements: existingAuthor.biography?.keyAchievements,
          famousQuote: markdownAuthor.biography?.famousQuote || existingAuthor.biography?.famousQuote
        },
        lifespan: markdownAuthor.lifespan || existingAuthor.lifespan,
        imageUrl: markdownAuthor.imageUrl || existingAuthor.imageUrl,
        featured: markdownAuthor.featured || existingAuthor.featured
      });

      updated++;
    } else {
      // Neuer Author aus Markdown
      merged.set(id, markdownAuthor);
      added++;
    }
  }

  console.log(`\n📊 Merge-Statistik:`);
  console.log(`   ✏️  ${updated} Autoren aktualisiert`);
  console.log(`   ➕ ${added} Autoren hinzugefügt`);
  console.log(`   📦 ${merged.size} Autoren gesamt\n`);

  return Array.from(merged.values());
}

/**
 * Schreibt Authors-Array zurück in TypeScript-Datei
 */
function writeAuthorsToTS(authors: Author[], lang: 'de' | 'en'): void {
  const filePath = path.join(__dirname, `../services/data/authors/${lang}.ts`);

  // Backup erstellen
  const backupPath = filePath.replace('.ts', `.backup-${Date.now()}.ts`);
  fs.copyFileSync(filePath, backupPath);
  console.log(`💾 Backup erstellt: ${path.basename(backupPath)}`);

  // JSON-String mit schöner Formatierung
  const authorsJson = JSON.stringify(authors, null, 2);

  // TypeScript-Datei generieren
  const tsContent = `import { Author } from '../../contentLoader';

export const authors${lang.toUpperCase()}: Author[] = ${authorsJson};
`;

  fs.writeFileSync(filePath, tsContent, 'utf-8');
  console.log(`✅ ${lang}.ts erfolgreich aktualisiert (${authors.length} Autoren)\n`);
}

/**
 * Main Migration
 */
async function migrate() {
  console.log('🚀 Markdown → TypeScript Author Migration\n');
  console.log('=' .repeat(60) + '\n');

  // 1. Lade alle Markdown-Profile
  const markdownAuthors = loadAllMarkdownProfiles();

  console.log('=' .repeat(60) + '\n');

  // 2. Migriere DE
  console.log('🇩🇪 DEUTSCHE VERSION (de.ts)\n');
  const existingDE = loadExistingAuthors('de');
  const mergedDE = mergeAuthors(existingDE, markdownAuthors);
  writeAuthorsToTS(mergedDE, 'de');

  console.log('=' .repeat(60) + '\n');

  // 3. Migriere EN
  console.log('🇬🇧 ENGLISCHE VERSION (en.ts)\n');
  const existingEN = loadExistingAuthors('en');
  const mergedEN = mergeAuthors(existingEN, markdownAuthors);
  writeAuthorsToTS(mergedEN, 'en');

  console.log('=' .repeat(60) + '\n');
  console.log('✨ Migration abgeschlossen!\n');
  console.log('📝 Hinweis: Die Markdown-Inhalte wurden in die "long" Biography-Felder eingefügt.');
  console.log('📂 Backups wurden erstellt und können bei Bedarf wiederhergestellt werden.\n');
}

// Run migration
migrate().catch(error => {
  console.error('❌ Migration fehlgeschlagen:', error);
  process.exit(1);
});
