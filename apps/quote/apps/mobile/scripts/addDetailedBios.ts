#!/usr/bin/env tsx

/**
 * Fügt ausführliche Biografien für fehlende Autoren hinzu
 */

import * as fs from 'fs';
import * as path from 'path';
import { Author } from '../services/contentLoader';

function loadAuthors(lang: 'de' | 'en'): Author[] {
  const filePath = path.join(__dirname, `../services/data/authors/${lang}.ts`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/export const authors[A-Z]{2}: Author\[\] = (\[[\s\S]*\]);/);
  return eval(match[1]) as Author[];
}

function writeAuthors(authors: Author[], lang: 'de' | 'en'): void {
  const filePath = path.join(__dirname, `../services/data/authors/${lang}.ts`);
  const backupPath = filePath.replace('.ts', `.backup-${Date.now()}.ts`);
  fs.copyFileSync(filePath, backupPath);

  const authorsJson = JSON.stringify(authors, null, 2);
  const tsContent = `import { Author } from '../../contentLoader';

export const authors${lang.toUpperCase()}: Author[] = ${authorsJson};
`;

  fs.writeFileSync(filePath, tsContent, 'utf-8');
  console.log(`✅ ${lang}.ts aktualisiert`);
}

// Ausführliche Biografien (hochwertig, nicht template-basiert)
const detailedBios: Record<string, string> = {
  'augustinus': `# Aurelius Augustinus
*13. November 354 - 28. August 430*

## Kurzbiografie

Aurelius Augustinus, bekannt als Augustinus von Hippo, war einer der bedeutendsten christlichen Kirchenlehrer und Philosophen der Spätantike. Seine Werke "Confessiones" (Bekenntnisse) und "De civitate Dei" (Vom Gottesstaat) gehören zu den einflussreichsten Schriften der abendländischen Geistesgeschichte.

## Jugend und Irrwege (354-386)

### Herkunft und Familie
Geboren in Thagaste (heute Souk Ahras, Algerien) als Sohn des Heiden Patricius und der  Christin Monica. Die Mutter prägte ihn religiös, doch er wandte sich zunächst ab.

### Student in Karthago
Studium der Rhetorik in Karthago ab 371. Leben in Ausschweifung und Konkubinat. Geburt des Sohnes Adeodatus 372. Lektüre von Ciceros "Hortensius" weckt philosophischen Hunger.

### Manichäer-Zeit
Neun Jahre Anhänger der manichäischen Sekte, die Gut und Böse als kosmische Prinzipien lehrte. Zunehmende Zweifel an deren Lehren.

### Lehrertätigkeit
Rhetoriklehrer in Karthago, Rom (383) und schließlich Mailand (384). Begegnung mit Bischof Ambrosius wird entscheidend.

## Die Bekehrung (386)

### Krise und Wandlung
Intensive philosophische Studien (Neuplatonismus). Innerer Kampf zwischen Fleisch und Geist. Berühmte Szene im Mailänder Garten: Kinderstimme ruft "Tolle lege!" (Nimm und lies!).

### Taufbereitung
Öffnet die Bibel und liest Römer 13,13-14. Entscheidung für Christentum. Rückzug mit Freunden nach Cassiciacum. Taufe durch Ambrosius in der Osternacht 387.

## Rückkehr nach Afrika (387-395)

### Verluste
Tod der Mutter Monica in Ostia 387. Tod des Sohnes Adeodatus 389. Augustinus gründet klösterliche Gemeinschaft in Thagaste.

### Unfreiwillige Priesterweihe
391 in Hippo Regius (heute Annaba, Algerien) vom Volk zum Priester gewählt. Prediger-Tätigkeit beginnt.

### Bischof von Hippo (395)
Wird Bischof von Hippo. Gründet Kloster im Bischofshaus. Beginnt sein gewaltiges literarisches Werk.

## Die großen Werke

### Confessiones (397-401)
Autobiographische Bekenntnisse:
- Erste große Autobiographie der Weltliteratur
- Psychologische Selbstanalyse
- Theologie der Gnade
- Philosophie der Zeit (Buch XI)
- "Spät hab ich dich geliebt, du Schönheit..."

### De civitate Dei (413-426)
Geschichtstheologie in 22 Büchern:
- Antwort auf Vorwurf, Christentum habe Rom geschwächt
- Civitas Dei vs. Civitas terrena
- Zwei Staaten, zwei Liebensweisen
- Geschichtsphilosophie
- Legitimation weltlicher Ordnung

### De Trinitate (399-419)
Trinitätslehre:
- Psychologische Trinität im Menschen
- Memoria, Intelligentia, Voluntas
- Einheit in Dreiheit
- Grundlage scholastischer Theologie

## Theologische Kämpfe

### Donatisten-Streit
Kampf gegen schismatische nordafrikanische Kirche:
- Frage der Sakramentsgültigkeit
- Kirchenverständnis
- Rechtfertigung von Zwang gegen Häretiker

### Pelagianismus
Hauptgegner: Pelagius und seine Anhänger:
- Erbsündenlehre entwickelt
- Gnadenlehre verfeinert
- Prädestinationslehre
- Freier Wille und Gnade
- Einfluss bis Reformation

## Philosophisches Denken

### Neuplatonismus und Christentum
Verbindung von:
- Plotins Emanationslehre
- Christlicher Schöpfungsglaube
- Erkenntnistheorie der Erleuchtung
- Gott als höchstes Sein und Gut

### Zeit und Ewigkeit
Revolutionäre Zeitphilosophie:
- Zeit als Ausdehnung der Seele
- Gegenwart des Vergangenen (Erinnerung)
- Gegenwart des Zukünftigen (Erwartung)
- Ewigkeit als Gleichzeitigkeit

### Zeichentheorie
Grundlagen der Semiotik:
- Unterscheidung von Zeichen und Bezeichnetem
- Sprachphilosophie
- Hermeneutik der Schriftauslegung

## Anthropologie und Psychologie

### Selbsterkenntnis
"In te ipsum redi" - Kehre in dich selbst ein:
- Innerer Mensch als Ort der Wahrheit
- Selbstreflexion als Weg zu Gott
- Psychologie der Innerlichkeit

### Willenslehre
Revolutionäre Willenspsychologie:
- Wille wichtiger als Intellekt
- Gespaltener Wille
- Liebe als Grundkraft
- "Pondus meum amor meus"

### Erbsünde
Dunkle Seite seiner Lehre:
- Erbschuld aller Menschen
- Massa damnata
- Nur Taufe rettet
- Unbarmherzigkeit gegenüber ungetauften Kindern

## Gnadenlehre

### Kernsätze
Fundamentale Einsichten:
- "Da quod iubes et iube quod vis" - Gib was du befiehlst
- Gnade kommt zuvor (gratia praeveniens)
- Gnade wirkt (gratia operans)
- Menschliche Mitwirkung (gratia cooperans)

### Prädestination
Umstrittene Konsequenzen:
- Erwählung vor der Welt
- Gnadenwahl unergründlich
- Anzahl der Geretteten festgelegt
- Basis für Calvin und Jansenismus

## Tod und Vermächtnis (430)

### Letzte Tage
Während der Belagerung Hippos durch die Vandalen stirbt Augustinus am 28. August 430 im Alter von 75 Jahren. Seine Klosterbibliothek übersteht die Eroberung.

### Sofortige Wirkung
Schon zu Lebzeiten wichtigster lateinischer Kirchenvater. Über 100 erhaltene Schriften, 500 Predigten, 200 Briefe.

## Einfluss durch die Jahrhunderte

### Mittelalter
Dominiert die Scholastik:
- Bonaventura und Franziskaner
- Duns Scotus
- Kampf mit Aristotelismus
- Augustinereremitenorden (1256)

### Reformation
Luther als Augustinermönch:
- "Allein durch Gnade"
- Bibelautorität
- Rechtfertigungslehre
- Calvin radikalisiert Prädestination

### Neuzeit
Fortgesetzte Wirkung:
- Pascal und Jansenismus
- Existenzphilosophie (Kierkegaard, Heidegger)
- Personalismus
- Selbstreflexion als Methode

## Kritik und Probleme

### Negative Aspekte
Problematische Lehren:
- Verdammung ungetaufter Kinder
- Rechtfertigung von Zwang
- Sexualnegativität
- Determinismus

### Moderne Rezeption
Ambivalentes Erbe:
- Tiefenpsychologie avant la lettre
- Aber auch Angstreligion
- Freiheitsphilosophie und Determinismus
- Subjektivität und Autorität

## Berühmte Zitate

> "Unruhig ist unser Herz, bis es Ruhe findet in dir."

> "Liebe, und tu was du willst."

> "Spät hab ich dich geliebt, du Schönheit, so alt und so neu."

> "Du hast uns zu dir hin geschaffen, und unruhig ist unser Herz, bis es Ruhe findet in dir."

## Das bleibende Vermächtnis

Augustinus bleibt der einflussreichste Kirchenvater des Westens:

- **Psychologe der Innerlichkeit** - Erfinder der Selbstreflexion
- **Philosoph der Zeit** - Grundlage moderner Zeittheorie
- **Theologe der Gnade** - Prägte Christentum für Jahrhunderte
- **Schriftsteller** - Confessiones als literarisches Meisterwerk

Seine Größe liegt in der radikalen Ehrlichkeit, mit der er sein zerrissenes Ich offenbart, und in der Tiefe, mit der er die Paradoxien menschlicher Existenz durchdenkt. Augustinus lehrte die Gotteserkenntnis durch Selbsterkenntnis und die Selbsterkenntnis durch Gotteserkenntnis.`,

  'kennedy-john-f': `# John Fitzgerald Kennedy
*29. Mai 1917 - 22. November 1963*

## Kurzbiografie

John F. Kennedy, der 35. Präsident der Vereinigten Staaten (1961-1963), verkörperte eine neue Generation amerikanischer Politik. Als jüngster gewählter und erster katholischer Präsident inspirierte er mit seiner Vision einer "New Frontier" und seiner charismatischen Führung die Welt. Seine Ermordung in Dallas beendete abrupt eine Präsidentschaft, die trotz ihrer Kürze die amerikanische Geschichte nachhaltig prägte.

## Kennedy-Clan und frühe Jahre (1917-1940)

### Die Kennedy-Dynastie
Geboren als zweiter Sohn von Joseph P. Kennedy Sr. und Rose Fitzgerald Kennedy in Brookline, Massachusetts. Vater Joe war erfolgreicher Geschäftsmann und Diplomat, die Mutter entstammte einer prominenten irisch-amerikanischen Politikerfamilie Bostons.

### Privilegierte Kindheit
Aufwachsen im Wohlstand mit acht Geschwistern. Besuch exklusiver Privatschulen. Früh eingeübt in Wettbewerb und Leistungsdruck durch den ehrgeizigen Vater, der seine Söhne für die Politik vorbereitete.

### Gesundheitsprobleme
Litt zeitlebens unter schweren Rückenproblemen und der Addison-Krankheit. Häufige Krankenhausaufenthalte prägten seine Jugend, entwickelte aber Willensstärke und Durchhaltevermögen.

## Ausbildung und Krieg (1936-1945)

### Harvard-Student
Studium an der Harvard University. Abschlussarbeit über britische Appeasement-Politik wird als Buch "Why England Slept" (1940) veröffentlicht und ein Bestseller.

### PT-109 Held
Navy-Offizier im Pazifik-Krieg. August 1943: Sein Schnellboot PT-109 wird von japanischem Zerstörer gerammt. Rettet verletzten Kameraden, schwimmt stundenlang mit Riemen zwischen den Zähnen. Ausgezeichnet als Kriegsheld.

### Journalistische Tätigkeit
Nach dem Krieg kurzzeitig Journalist. Berichtet 1945 über Gründung der UN. Tod des älteren Bruders Joe Jr. 1944 (Kriegseinsatz) macht John zum designierten Politiker der Familie.

## Politischer Aufstieg (1946-1960)

### Kongressabgeordneter (1947-1953)
Wahl ins Repräsentantenhaus für Massachusetts mit 29 Jahren. Liberaler Demokrat, aber pragmatisch. Unterstützt Sozialreformen und starke Verteidigung.

### Senator (1953-1960)
Wahl in den Senat 1952. Heirat mit Jacqueline Bouvier 1953. Schwere Rückenoperationen 1954/55. Während Genesung Arbeit an "Profiles in Courage" (Pulitzer-Preis 1957).

### Fast Vizepräsident
1956 knapp an Vizepräsidentschaftskandidatur gescheitert. Nutzung der Zeit für Aufbau nationaler Bekanntheit. Bereitet systematisch Präsidentschaftskampagne vor.

## Präsidentschaftswahlkampf 1960

### Demokratische Vorwahlen
Überwindet Vorbehalte gegen Katholiken. Sieg in West Virginia entscheidend. Nominierung durch Parteitag mit Lyndon B. Johnson als Running Mate.

### TV-Debatten
Erste Fernsehduelle der Geschichte gegen Richard Nixon. Kennedys jugendliche Ausstrahlung vs. Nixons fahles Aussehen. Radio-Hörer sehen Nixon vorn, TV-Zuschauer Kennedy - Medium als Botschaft.

### Knapper Sieg
Hauchdünner Sieg im November 1960: 49,7% vs. 49,5%. Jüngster gewählter Präsident mit 43 Jahren (Theodore Roosevelt war jünger bei Amtsantritt nach Attentat).

## Die Präsidentschaft (1961-1963)

### Antrittsrede (20. Januar 1961)
Legendäre Inaugurationsrede:
> "Fragt nicht, was euer Land für euch tun kann - fragt, was ihr für euer Land tun könnt."

> "Lasst uns niemals aus Furcht verhandeln. Aber lasst uns niemals Furcht haben zu verhandeln."

Vision einer "New Frontier" - neue Grenzen zu überschreiten.

### Schweinebuchtkrise (April 1961)
Erste außenpolitische Katastrophe: Gescheiterte CIA-Invasion Kubas. Kennedy übernimmt Verantwortung, lernt aus Fehler. Misstrauen gegenüber Militär und Geheimdiensten wächst.

### Wiener Gipfel (Juni 1961)
Treffen mit Chruschtschow in Wien. Sowjetführer testet den Neuling. Kennedy fühlt sich überrumpelt. Berlin-Frage ungeklärt.

### Berlinkrise und Mauerbau
Bau der Berliner Mauer August 1961. Kennedy entsetzt, aber militärisch machtlos. Bekräftigt Verteidigungsgarantie für West-Berlin.

### Kuba-Krise (Oktober 1962)
Gefährlichste Krise des Kalten Krieges:
- Sowjetische Atomraketen auf Kuba entdeckt
- Seekblockade statt Luftangriff gewählt
- 13 Tage am Rand des Atomkriegs
- Geheimer Deal: Raketen gegen US-Jupiter aus Türkei
- Chruschtschow lenkt ein

Kennedys Krisenbewältigung wird zur Sternstunde: Festigkeit plus Flexibilität, militärischer Druck plus diplomatische Lösung.

### Friedenspolitik (1963)
Nach Kubakrise Entspannungsphase:
- "Strategie des Friedens" (American University Speech, Juni 1963)
- Atomteststopp-Vertrag (August 1963)
- "Heißer Draht" nach Moskau
- Umdenken über Vietnam beginnt

## Innenpolitik

### New Frontier Programm
Ambitionierte Agenda:
- Steuerreformen
- Armutsbekämpfung
- Bildungsreform
- Medicare-Vorschläge

Viele Gesetze scheitern im Kongress. Demokratische Südstaatler blockieren Reformen.

### Bürgerrechte
Zunächst zögerlich, dann engagiert:
- Entsendung der National Guard in Alabama (1963)
- Unterstützung für James Meredith (Mississippi)
- TV-Ansprache zu Moral der Bürgerrechte (Juni 1963)
- Vorlage des Civil Rights Act (wird erst 1964 unter Johnson Gesetz)

### Raumfahrt
Vision der Mondlandung:
> "Wir haben beschlossen, in diesem Jahrzehnt zum Mond zu fliegen, nicht weil es leicht ist, sondern weil es schwer ist."

Massives Apollo-Programm gestartet. Ziel 1969 erreicht.

### Wirtschaft
- Längste Wirtschaftsexpansion der Nachkriegszeit
- Steuersenkungen zur Konjunkturbelebung
- Keynesianische Politik

## Familie im Weißen Haus

### Jackie Kennedy
Erste Lady Jacqueline als Stil-Ikone. Restaurierung des Weißen Hauses. Fernsehführung durch Präsidentenresidenz. Kulturelle Renaissance.

### Camelot-Image
Weißes Haus wird zu "Camelot" - Anspielung auf König Arthurs Hof. Intellektuelle, Künstler, Nobelpreisträger zu Gast. Pablo Casals spielt Cello.

### Kinder
Caroline (geb. 1957) und John Jr. (geb. 1960, gestorben 1999) im Weißen Haus. Sohn Patrick stirbt nach zwei Tagen (August 1963).

## Das Attentat (22. November 1963)

### Dallas, Texas
Wahlkampfreise nach Texas zur Aussöhnung verfeindeter Demokraten-Flügel. Trotz Warnungen offene Limousine durch Dallas.

### 12:30 Uhr
Dealey Plaza: Schüsse fallen. Kennedy in Kopf und Hals getroffen. Gouverneur Connally ebenfalls verletzt. Fahrt zum Parkland Hospital.

### Tod des Präsidenten
13:00 Uhr für tot erklärt. Jacqueline Kennedy im blutbefleckten Kostüm. Lyndon Johnson wird vereidigt.

### Lee Harvey Oswald
Verhaftung des mutmaßlichen Täters. Zwei Tage später erschießt Jack Ruby Oswald vor laufender Kamera. Unzählige Verschwörungstheorien bis heute.

## Vermächtnis

### Warren-Kommission
Offizielle Untersuchung: Oswald als Einzeltäter. Viele Zweifel bleiben. Skeptizismus gegenüber offizieller Version bis heute.

### Was wäre wenn?
Spekulation über unvollendete Präsidentschaft:
- Hätte er USA aus Vietnam herausgehalten?
- Welche Bürgerrechtsgesetze hätte er durchgesetzt?
- Wie wäre das Verhältnis zur Sowjetunion?

### Mythos und Realität
Komplexes Erbe:
- **Licht**: Charisma, Vision, Krisenmanagement, Inspiration
- **Schatten**: Eheliche Untreue, Gesundheitsprobleme verheimlicht, anfängliches Zögern bei Bürgerrechten

### Fortdauernde Inspiration
Kennedy-Mystik lebt:
- Jugend, Hoffnung, Idealismus
- Ruf zum Dienst an der Gemeinschaft
- Friedenskorps als dauerhaftes Vermächtnis
- "Ask not..." als Appell an jede Generation

## Berühmte Reden und Zitate

> "Ich bin ein Berliner!" (26. Juni 1963, West-Berlin)

> "Eine steigende Flut hebt alle Boote." (über Wirtschaftswachstum)

> "Die Menschheit muss dem Krieg ein Ende setzen, oder der Krieg setzt der Menschheit ein Ende."

> "Jeder Mensch kann einen Unterschied machen und jeder Mensch sollte es versuchen."

## Das Kennedy-Vermächtnis

Über 60 Jahre nach seiner Ermordung bleibt JFK eine der faszinierendsten Figuren amerikanischer Geschichte:

- **Symbol unerfüllten Potenzials** - Was hätte sein können
- **Wendepunkt der Moderne** - Ende der Unschuld Amerikas
- **Inspiration für Generationen** - Ruf zum öffentlichen Dienst
- **Warnung** - Fragilität von Leben und Demokratie

Kennedy verkörperte den Optimismus und die Zuversicht einer Ära, die mit ihm zu Ende ging. Sein früher Tod verwandelte einen guten Präsidenten in eine Legende und ließ seine Vision einer besseren Welt als unerfülltes Versprechen zurück.`,
};

async function main() {
  console.log('📝 Füge ausführliche Biografien hinzu\n');

  const authorsDE = loadAuthors('de');
  const authorsEN = loadAuthors('en');

  let updated = 0;

  const updatedDE = authorsDE.map(author => {
    if (detailedBios[author.id]) {
      console.log(`✅ ${author.name} (${author.id})`);
      updated++;
      return {
        ...author,
        biography: {
          ...author.biography,
          long: detailedBios[author.id]
        }
      };
    }
    return author;
  });

  const updatedEN = authorsEN.map(author => {
    const deAuthor = updatedDE.find(a => a.id === author.id);
    if (deAuthor?.biography?.long && detailedBios[author.id]) {
      return {
        ...author,
        biography: {
          ...author.biography,
          long: deAuthor.biography.long
        }
      };
    }
    return author;
  });

  console.log(`\n📊 ${updated} Biografien hinzugefügt\n`);

  writeAuthors(updatedDE, 'de');
  writeAuthors(updatedEN, 'en');

  console.log('\n✨ Fertig!\n');
}

main();
