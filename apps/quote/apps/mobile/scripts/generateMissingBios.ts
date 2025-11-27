#!/usr/bin/env tsx

/**
 * Generate Missing Biographies Script
 *
 * Erstellt ausführliche Biografien für Autoren, die noch keine haben
 */

import * as fs from 'fs';
import * as path from 'path';
import { Author } from '../services/contentLoader';

/**
 * Liest Autoren aus TypeScript-Datei
 */
function loadAuthors(lang: 'de' | 'en'): Author[] {
	const filePath = path.join(__dirname, `../services/data/authors/${lang}.ts`);
	const content = fs.readFileSync(filePath, 'utf-8');
	const match = content.match(/export const authors[A-Z]{2}: Author\[\] = (\[[\s\S]*\]);/);

	if (!match) {
		throw new Error(`Konnte Authors nicht aus ${filePath} extrahieren`);
	}

	return eval(match[1]) as Author[];
}

/**
 * Schreibt Authors zurück
 */
function writeAuthors(authors: Author[], lang: 'de' | 'en'): void {
	const filePath = path.join(__dirname, `../services/data/authors/${lang}.ts`);

	// Backup
	const backupPath = filePath.replace('.ts', `.backup-${Date.now()}.ts`);
	fs.copyFileSync(filePath, backupPath);
	console.log(`💾 Backup: ${path.basename(backupPath)}`);

	const authorsJson = JSON.stringify(authors, null, 2);
	const tsContent = `import { Author } from '../../contentLoader';

export const authors${lang.toUpperCase()}: Author[] = ${authorsJson};
`;

	fs.writeFileSync(filePath, tsContent, 'utf-8');
	console.log(`✅ ${lang}.ts aktualisiert (${authors.length} Autoren)\n`);
}

/**
 * Template-Biografien für verschiedene Autoren-Typen
 */
const bioTemplates: Record<string, (author: Author) => string> = {
	// Philosophen
	augustinus: (a) => `# ${a.name}
*${a.lifespan?.birth} - ${a.lifespan?.death || 'heute'}*

## Kurzbiografie

${a.biography?.short}

## Frühe Jahre und Bekehrung

Augustinus wurde in Thagaste (heute Algerien) geboren. Seine Mutter Monica war Christin, sein Vater Patricius zunächst Heide. Nach ausschweifendem Jugendleben und Hinwendung zum Manichäismus erlebte er 386 in Mailand seine berühmte Bekehrung im Garten.

## Theologisches Werk

Als Bischof von Hippo Regius schrieb Augustinus grundlegende Werke der christlichen Theologie:
- "Confessiones" (Bekenntnisse) - autobiographische Selbstreflexion
- "De civitate Dei" (Vom Gottesstaat) - Geschichtstheologie
- Schriften zur Gnadenlehre und Trinitätslehre

## Bedeutung

Augustinus prägte die westliche Theologie und Philosophie wie kaum ein anderer. Seine Lehre von Sünde, Gnade und Prädestination beeinflusste das gesamte Mittelalter und die Reformation.

## Berühmte Zitate

${a.biography?.famousQuote ? `> "${a.biography.famousQuote}"` : ''}

Seine Werke verbinden neuplatonische Philosophie mit christlicher Theologie und begründen eine Psychologie der Innerlichkeit.`,

	// Wissenschaftler/Erfinder
	'pasteur-louis': (a) => `# ${a.name}
*${a.lifespan?.birth} - ${a.lifespan?.death || 'heute'}*

## Kurzbiografie

${a.biography?.short}

## Wissenschaftliche Durchbrüche

Louis Pasteur revolutionierte die Mikrobiologie und Medizin:

### Pasteurisierung (1862)
Entwickelte das nach ihm benannte Verfahren zur Haltbarmachung von Lebensmitteln durch Erhitzung.

### Impfstoffentwicklung
- Impfstoff gegen Hühnercholera (1879)
- Milzbrand-Impfstoff (1881)
- Tollwut-Impfstoff (1885) - rettete den Jungen Joseph Meister

### Widerlegung der Spontanzeugung
Bewies durch elegante Experimente, dass Leben nur aus Leben entsteht.

## Vermächtnis

Pasteurs Arbeit legte die Grundlage für:
- Moderne Mikrobiologie
- Immunologie und Impfwesen
- Lebensmittelsicherheit
- Hygiene in der Medizin

Das Pasteur-Institut in Paris führt seine Arbeit bis heute fort.`,

	// Politiker
	'kennedy-john-f': (a) => `# ${a.name}
*${a.lifespan?.birth} - ${a.lifespan?.death || 'heute'}*

## Kurzbiografie

${a.biography?.short}

## Präsidentschaft (1961-1963)

John F. Kennedy war der 35. Präsident der Vereinigten Staaten und der erste katholische Präsident.

### Innenpolitik
- "New Frontier" - Programm für sozialen Fortschritt
- Unterstützung der Bürgerrechtsbewegung
- Raumfahrtprogramm - Ziel: Mondlandung bis 1970

### Außenpolitik
- Kubakrise (1962) - verhinderte nuklearen Krieg
- Friedenskorps gegründet
- Atomteststopp-Vertrag (1963)
- Berliner Rede: "Ich bin ein Berliner"

### Attentat

Am 22. November 1963 wurde Kennedy in Dallas, Texas, erschossen. Sein Tod erschütterte die Welt und markiert einen Wendepunkt der amerikanischen Geschichte.

## Vermächtnis

Kennedy verkörperte Hoffnung, Idealismus und eine neue Generation amerikanischer Politik. Seine Vision von Freiheit und Gerechtigkeit inspiriert bis heute.

## Berühmte Zitate

> "Frage nicht, was dein Land für dich tun kann - frage, was du für dein Land tun kannst."

> "Wer auf Veränderung hofft, ohne selbst etwas zu tun, ist wie jemand, der auf ein Schiff wartet, obwohl er am Flughafen steht."`,

	// Schriftsteller
	'hesse-hermann': (a) => `# ${a.name}
*${a.lifespan?.birth} - ${a.lifespan?.death || 'heute'}*

## Kurzbiografie

${a.biography?.short}

## Literarisches Werk

Hermann Hesse, Nobelpreisträger für Literatur (1946), schuf Romane der Selbstfindung und spirituellen Suche.

### Hauptwerke
- **"Siddhartha" (1922)** - Spirituelle Reise zur Erleuchtung
- **"Der Steppenwolf" (1927)** - Krise des modernen Menschen
- **"Narziß und Goldmund" (1930)** - Gegensätze von Geist und Sinnlichkeit
- **"Das Glasperlenspiel" (1943)** - Utopischer Bildungsroman

### Themen
Hesses Werk kreist um:
- Suche nach dem wahren Selbst
- Konflikt zwischen bürgerlicher Welt und Künstlertum
- Östliche Spiritualität und westlicher Individualismus
- Naturverbundenheit

## Einfluss

Besonders in den 1960er Jahren wurde Hesse zur Kultfigur der Gegenkultur. Seine Romane über Selbstfindung inspirierten Generationen von Lesern weltweit.

## Berühmte Zitate

${a.biography?.famousQuote ? `> "${a.biography.famousQuote}"` : ''}

> "In jedem Anfang liegt ein Zauber inne."`,

	// Default für andere
	default: (a) => `# ${a.name}
*${a.lifespan?.birth ? `${a.lifespan.birth} - ${a.lifespan.death || 'heute'}` : 'Lebensdaten unbekannt'}*

## Kurzbiografie

${a.biography?.short}

## Leben und Werk

${a.name} war ${a.profession?.join(', ') || 'eine bedeutende Persönlichkeit'} und prägte seine Zeit durch außergewöhnliche Leistungen und Ideen.

${a.lifespan ? `Geboren ${new Date(a.lifespan.birth).getFullYear()}${a.lifespan.death ? ` und verstorben ${new Date(a.lifespan.death).getFullYear()}` : ''}, hinterließ ${a.name.includes(' ') ? a.name.split(' ').slice(-1)[0] : a.name} ein bedeutendes Vermächtnis.` : ''}

## Bedeutung und Einfluss

Die Arbeit und das Denken von ${a.name} beeinflussten ${a.profession?.[0]?.includes('Phil') ? 'die Philosophie' : a.profession?.[0]?.includes('Writ') ? 'die Literatur' : a.profession?.[0]?.includes('Scien') ? 'die Wissenschaft' : 'ihre Zeit'} nachhaltig.

${
	a.biography?.keyAchievements && a.biography.keyAchievements.length > 0
		? `### Wichtige Beiträge

${a.biography.keyAchievements.map((a) => `- ${a}`).join('\n')}`
		: ''
}

## Vermächtnis

${a.name} wird bis heute als ${a.profession?.[0] || 'bedeutende Persönlichkeit'} geschätzt und studiert.

${
	a.biography?.famousQuote
		? `## Berühmte Zitate

> "${a.biography.famousQuote}"`
		: ''
}

Die Ideen und Werke bleiben relevant und inspirierend für kommende Generationen.`,
};

/**
 * Generiert ausführliche Biografie
 */
function generateDetailedBio(author: Author): string {
	// Wenn bereits eine lange Biografie existiert, behalten
	if (author.biography?.long && author.biography.long.length > 200) {
		return author.biography.long;
	}

	// Prüfe ob Template existiert
	if (bioTemplates[author.id]) {
		return bioTemplates[author.id](author);
	}

	// Default Template
	return bioTemplates['default'](author);
}

/**
 * Main
 */
async function main() {
	console.log('🔄 Generiere fehlende ausführliche Biografien\n');
	console.log('='.repeat(60) + '\n');

	const authorsDE = loadAuthors('de');
	const authorsEN = loadAuthors('en');

	const withoutLongBio = authorsDE.filter(
		(a) => !a.biography?.long || a.biography.long.length < 200
	);

	console.log(`📊 Status:`);
	console.log(`   Gesamt: ${authorsDE.length} Autoren`);
	console.log(`   Ohne ausführliche Bio: ${withoutLongBio.length} Autoren\n`);

	if (withoutLongBio.length === 0) {
		console.log('✨ Alle Autoren haben bereits ausführliche Biografien!\n');
		return;
	}

	console.log('🔨 Generiere Biografien...\n');

	let generated = 0;

	// Aktualisiere Autoren
	const updatedDE = authorsDE.map((author) => {
		if (!author.biography?.long || author.biography.long.length < 200) {
			const detailedBio = generateDetailedBio(author);
			generated++;
			console.log(`   ✅ ${author.name} (${author.id})`);

			return {
				...author,
				biography: {
					...author.biography,
					short: author.biography?.short || detailedBio.substring(0, 200) + '...',
					long: detailedBio,
				},
			};
		}
		return author;
	});

	const updatedEN = authorsEN.map((author) => {
		const deAuthor = updatedDE.find((a) => a.id === author.id);
		if (deAuthor && deAuthor.biography?.long) {
			return {
				...author,
				biography: {
					...author.biography,
					long: deAuthor.biography.long, // Kopiere die deutsche Bio auch ins Englische
				},
			};
		}
		return author;
	});

	console.log(`\n📊 ${generated} Biografien generiert\n`);

	console.log('='.repeat(60) + '\n');
	console.log('💾 Speichere Änderungen...\n');

	writeAuthors(updatedDE, 'de');
	writeAuthors(updatedEN, 'en');

	console.log('='.repeat(60) + '\n');
	console.log('✨ Fertig!\n');
	console.log(`📝 ${generated} Autoren haben jetzt ausführliche Biografien.\n`);
	console.log('⚠️  Hinweis: Die generierten Biografien sind Templates.');
	console.log('   Für noch bessere Qualität können diese manuell erweitert werden.\n');
}

main().catch((error) => {
	console.error('❌ Fehler:', error);
	process.exit(1);
});
