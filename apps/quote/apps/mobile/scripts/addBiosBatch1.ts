#!/usr/bin/env tsx
/**
 * Batch 1: Featured Autoren - Ausführliche Biografien
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

const batch1Bios: Record<string, string> = {
  'aristotle': `# Aristotle
*384 - 322 v. Chr.*

## Kurzbiografie

Aristoteles war einer der bedeutendsten Philosophen und Universalgelehrten der Antike. Als Schüler Platons und Lehrer Alexanders des Großen prägte er nahezu alle Wissenschaftsdisziplinen für Jahrhunderte. Seine Werke zur Logik, Metaphysik, Ethik, Politik, Biologie und Poetik bildeten die Grundlage des abendländischen Denkens.

## Frühe Jahre in Makedonien (384-367 v. Chr.)

### Herkunft
Geboren in Stageira (Chalkidike), Sohn des Arztes Nikomachos, der am makedonischen Königshof diente. Früher Tod beider Eltern. Vormund Proxenos übernahm Erziehung.

### Medizinische Tradition
Vater als Leibarzt des Königs Amyntas III. Frühe Vertrautheit mit Naturbeobachtung und empirischer Forschung prägte wissenschaftliche Methode.

## Platons Akademie (367-347 v. Chr.)

### Student in Athen
Mit 17 Jahren nach Athen. 20 Jahre in der Akademie. Brillanter Schüler, später Lehrer. Platon nannte ihn "den Geist" (nous) der Schule.

### Philosophische Entwicklung
Zunächst Anhänger der Ideenlehre, entwickelte später eigene kritische Position. Beginn empirischer Naturforschung. Verfasste Dialoge (verloren).

### Platons Tod (347)
Nach Platons Tod nicht Nachfolger (Speusippos gewählt). Verließ Athen, möglicherweise aus politischen Gründen (antimakedonische Stimmung).

## Wanderjahre (347-335 v. Chr.)

### Kleinasien
Mit Xenokrates nach Assos (Mysien). Hof des Hermias von Atarneus. Heirat mit Pythias, Nichte oder Adoptivtochter des Hermias. Intensive biologische Forschung.

### Lesbos
Mitylene, mit Theophrast. Meeresbiologische Studien. Sammlung empirischer Daten über Tiere und Pflanzen. Grundlage der biologischen Schriften.

### Makedonien (343/42)
Ruf an den Hof Philipps II. Erzieher des 13-jährigen Alexander. Unterricht in Mieza. Vermittlung griechischer Bildung und politischer Philosophie.

## Peripatos - Das Lykeion (335-323 v. Chr.)

### Rückkehr nach Athen
Nach Alexanders Regierungsantritt Gründung eigener Schule im Lykeion (Apollon-Heiligtum). "Peripatos" (Wandelhalle) gab der Schule den Namen.

### Forschungsgemeinschaft
Nicht nur Philosophenschule, sondern erstes systematisches Forschungsinstitut:
- Bibliothek
- Sammlung von Schriften und Dokumenten
- Arbeitsteilung in Fachgebieten
- Empirische Forschungsprojekte

### Lehrmethod

e
Vormittags: Esoterische Vorlesungen für Fortgeschrittene (verloren). Nachmittags: Exoterische Vorlesungen für breiteres Publikum.

### Persönliches
Nach Tod der ersten Frau Beziehung mit Herpyllis aus Stageira. Sohn Nikomachos (nach Großvater benannt).

## Flucht und Tod (323-322 v. Chr.)

### Alexanders Tod
Nach Alexanders Tod antimakedonische Reaktion in Athen. Anklage wegen Asebie (Gottlosigkeit). Erinnerte an Sokrates-Prozess.

### Flucht nach Chalkis
"Damit die Athener nicht ein zweites Verbrechen an der Philosophie begehen." Übersiedlung auf Insel Euböa. Magenleiden verschlimmert sich.

### Tod
Starb 322 in Chalkis mit 62 Jahren. Testament regelt Freilassung der Sklaven und Versorgung der Familie. Nachfolge im Lykeion: Theophrast.

## Das philosophische System

### Logik - Das Organon
Erfinder der formalen Logik:
- Kategorien: 10 Grundbegriffe
- Syllogistik: Schlusslehre
- Satz vom Widerspruch: Fundament
- Drei-Figuren-Lehre: Deduktion

### Metaphysik - Erste Philosophie
Lehre vom Seienden als Seienden:
- **Substanz** (ousia): Zugrundeliegendes
- **Form und Stoff** (morphe/hyle)
- **Akt und Potenz** (energeia/dynamis)
- **Unbewegter Beweger**: Gott als reiner Akt

### Naturphilosophie
Teleologische Naturauffassung:
- Vier Ursachen: Material, Form, Wirkend, Zweck
- Zielgerichtete Entwicklung
- Kontinuität der Natur
- Keine Leerräume

### Seelenlehre (De anima)
Stufenleiter der Seelen:
- Vegetative Seele: Pflanzen (Ernährung, Wachstum)
- Sensitive Seele: Tiere (Wahrnehmung, Bewegung)
- Rationale Seele: Menschen (Denken)
Seele als Form des Körpers, nicht unsterblich (außer aktiver Intellekt?).

## Ethik und Politik

### Nikomachische Ethik
Glückseligkeitslehre:
- **Eudaimonia**: Höchstes Gut
- **Tugend** (arete): Mitte zwischen Extremen
- **Phronesis**: Praktische Klugheit
- **Theoretisches Leben**: Höchste Form

### Tugendlehre
Charaktertugenden:
- Tapferkeit: Mitte zwischen Feigheit und Tollkühnheit
- Besonnenheit: Mitte zwischen Zügellosigkeit und Stumpfheit
- Freigebigkeit: Mitte zwischen Geiz und Verschwendung
- Gerechtigkeit: Wichtigste Tugend

### Politik
Der Mensch als zoon politikon:
- **Verfassungsformen**: Königtum, Aristokratie, Politie (gut) vs. Tyrannis, Oligarchie, Demokratie (Entartungen)
- **Mischverfassung**: Ideal
- **Sklaverei**: Naturgegeben (problematisch)
- **Polis**: Natürliche Gemeinschaft

## Naturwissenschaften

### Biologie
Systematische Tierkunde:
- Über 500 Tierarten beschrieben
- Klassifikation nach Merkmalen
- Anatomische Beobachtungen
- Generationenlehre

### Embryologie
Revolutionäre Einsichten:
- Entwicklung vom Einfachen zum Komplexen
- Epigenese vs. Präformation
- Hühnerembryo-Studien

### Kosmologie
Geozentrisch:
- Erde im Zentrum
- 55 Sphären
- Ewigkeit der Welt
- Sublunare vs. superlunare Welt

## Poetik und Rhetorik

### Poetik
Theorie der Dichtkunst:
- **Mimesis**: Nachahmung
- **Katharsis**: Reinigung durch Mitleid und Furcht
- **Tragödie**: Handlungseinheit
- **Mythos**: Wichtiger als Charaktere

### Rhetorik
Kunst der Überzeugung:
- Ethos, Pathos, Logos
- Topik: Argumentationsmuster
- Stilebenen
- Praktische Anwendung

## Wirkungsgeschichte

### Antike
Peripatos unter Theophrast und Straton. Werke zeitweise verschollen (Skepsis). Neuedition durch Andronikos von Rhodos (1. Jh. v. Chr.).

### Mittelalter
- **Arabische Welt**: Avicenna, Averroes
- **Scholastik**: Thomas von Aquin
- **Universitäten**: Philosophus = Aristoteles
- **Autorität**: Unangefochten

### Renaissance
- **Humanismus**: Kritik beginnt
- **Neue Wissenschaft**: Galilei widerlegt Physik
- **Reformation**: Luthers Kritik
- **Aber**: Ethik bleibt einflussreich

### Moderne
- **19. Jh.**: Historische Aristoteles-Forschung
- **20. Jh.**: Renaissance der Tugendethik
- **Analytische Philosophie**: Logik-Studien
- **Biologie**: Vorläufer evolutionären Denkens

## Hauptwerke

### Logik (Organon)
- Kategorien
- De Interpretatione
- Analytica Priora/Posteriora
- Topik
- Sophistische Widerlegungen

### Naturphilosophie
- Physik
- De Caelo (Über den Himmel)
- De Generatione
- Meteorologie

### Biologie
- Historia Animalium
- De Partibus Animalium
- De Generatione Animalium

### Metaphysik
- Metaphysik (14 Bücher)

### Ethik und Politik
- Nikomachische Ethik
- Eudemische Ethik
- Magna Moralia
- Politik

### Rhetorik und Poetik
- Rhetorik
- Poetik

## Berühmte Zitate

> "Der Mensch ist von Natur aus ein politisches Wesen."

> "Das Ganze ist mehr als die Summe seiner Teile."

> "Wir sind, was wir wiederholt tun. Vortrefflichkeit ist daher keine Handlung, sondern eine Gewohnheit."

> "Die Natur tut nichts umsonst."

> "Der Anfang ist die Hälfte des Ganzen."

## Vermächtnis

Aristoteles bleibt der systematischste Denker der Antike:

- **Begründer der Logik** als Wissenschaft
- **Vater der Biologie** als empirische Wissenschaft
- **Ethiker** von zeitloser Relevanz
- **Politikwissenschaftler** mit bleibenden Einsichten

Seine Methode - Beobachtung, Klassifikation, systematische Darstellung - prägte die Wissenschaft für Jahrhunderte. Auch wo seine Theorien überholt sind, bleibt sein methodisches Erbe lebendig.

Als Universalgelehrter verkörperte er ein Ideal von Bildung, das die gesamte Wirklichkeit umfassen wollte. Die Einheit seines Systems, das von der Logik über die Naturwissenschaften bis zur Ethik und Politik reicht, bleibt beeindruckend.`,

  'hesse-hermann': `# Hermann Hesse
*2. Juli 1877 - 9. August 1962*

## Kurzbiografie

Hermann Hesse, Nobelpreisträger für Literatur (1946), schuf Romane der Selbstfindung und spirituellen Suche, die Millionen Leser weltweit inspirierten. Seine Werke wie "Siddhartha", "Der Steppenwolf" und "Das Glasperlenspiel" kreisen um die ewigen Themen von Ich-Findung, Einsamkeit und der Versöhnung von Geist und Natur. Als deutsch-schweizerischer Dichter lebte er in selbstgewählter Isolation im Tessin und wurde zur Kultfigur der Gegenkultur der 1960er Jahre.

## Pietistisches Elternhaus (1877-1895)

### Missionshaus in Calw
Geboren in Calw (Schwarzwald) als Sohn des baltendeutschen Missionars Johannes Hesse und der Indologin Marie Gundert. Aufwachsen in streng pietistischem Milieu.

### Religiöser Druck
Großvater Hermann Gundert: berühmter Indienmissionar und Sprachforscher. Hohe Erwartungen der Familie: Hermann soll Theologe werden. Innerer Widerstand gegen religiöse Enge wächst.

### Flucht aus Maulbronn (1892)
Eintritt ins evangelische Klosterseminar Maulbronn. Nach nur 7 Monaten Flucht. Nervenkrise und Selbstmordgedanken. Einweisung in Nervenheilanstalt Stetten.

### Lehre und Autodidaktentum
Mechanikerlehre in Calw (abgebrochen). Buchhändlerlehre in Esslingen, später Tübingen. Intensive Selbstbildung: Goethe, Novalis, Romantiker. Erste Gedichte.

## Frühe Schriftstellerei (1895-1919)

### Eine Stunde hinter Mitternacht (1899)
Erster Gedichtband mit 22 Jahren. Bescheidener Erfolg. Fortsetzung der Buchhändlertätigkeit in Basel. Freundschaft mit Reformbewegung.

### Peter Camenzind (1904)
Durchbruch-Roman. Geschichte eines Heimkehrers. Verkaufserfolg ermöglicht freies Schriftstellertum. Heirat mit Maria Bernoulli, Übersiedlung nach Gaienhofen am Bodensee.

### Gaienhofer Jahre (1904-1912)
"Unterm Rad" (1906): Abrechnung mit Schulsystem. "Gertrud" (1910). Familienidyll mit drei Söhnen. Aber: Zunehmende Eheprobleme. Künstlerkolonie, Naturleben, Pazifismus.

### Indien-Reise (1911)
Mit Maler Hans Sturzenegger nach Ceylon, Sumatra, Singapur. Enttäuschung: Kolonialismus statt Spiritualität. Aber: Bleibender Eindruck. Wendung zum Buddhismus.

### Bern (1912-1919)
Umzug nach Bern. "Roßhalde" (1914). Erster Weltkrieg: Pazifistische Haltung, Arbeit für Kriegsgefangene. In Deutschland als "Vaterlandsverräter" angefeindet.

## Krise und Psychoanalyse (1916-1923)

### Zusammenbruch
Tod des Vaters, Erkrankung des Sohnes, Psychose der Frau. Eigene schwere Depression. Psychoanalytische Behandlung bei J.B. Lang (Jung-Schüler).

### Demian (1919)
Pseudonym Emil Sinclair. Roman der Selbstwerdung. C.G. Jung und Psychoanalyse als Einfluss. "Der Vogel kämpft sich aus dem Ei."

### Montagnola (ab 1919)
Umzug ins Tessin, Casa Camuzzi in Montagnola. Scheidung von Maria. Einsiedlerdasein. Malen als Therapie. Krisis-Gedichte.

### Siddhartha (1922)
Indische Dichtung. Weg zur Erleuchtung. Buddha-Begegnung, aber eigener Weg. Fluss-Symbolik. Internationale Erfolg, besonders später in USA.

### Kurgast (1925)
Autobiographisches über Baden-Kur. Humor und Selbstironie. Gesundheitsprobleme (Gicht, Augen, Ischias).

## Steppenwolf-Krise (1923-1931)

### Zweite Ehe
1924 Heirat mit Ruth Wenger (Tochter Lisa Wengers). Scheitert nach drei Jahren. Tiefe Depression.

### Der Steppenwolf (1927)
Meisterwerk der Krise. Harry Haller: Bürger und Wolf, gespalten. Magisches Theater. Jazz und Unsterbliche. Kulturkritik und Selbstzerstörung.

### Skandal und Missverständnis
Viele Leser sehen nur Kulturpessimismus, übersehen Humor und Transzendenz. Hesse enttäuscht von Rezeption.

### Narziß und Goldmund (1930)
Mittelalterroman. Geist (Narziß) vs. Sinnlichkeit (Goldmund). Versöhnung der Gegensätze. Kunst als Synthese. Großer Publikumserfolg.

## Glasperlenspiel-Jahre (1931-1962)

### Dritte Ehe
1931 Heirat mit Ninon Dolbin (geb. Ausländer). Endlich glückliche Partnerschaft. Casa Hesse in Montagnola. Zurückgezogenes Leben.

### Nationalsozialismus
Kritik am Faschismus. In Deutschland verfemt. Hilfe für Verfolgte und Emigranten. Schweizer Staatsbürgerschaft (1923). "Trotzdem Ja sagen."

### Das Glasperlenspiel (1943)
Alterswerk, 11 Jahre Arbeit. Kastalien: Utopie des Geistes. Josef Knecht: Magister Ludi. Transzendierung des Ästhetischen. Komplex und vielschichtig.

### Nobelpreis (1946)
Für "sein inspiriertes Werk von wachsender Kühnheit und Durchdringungstiefe". Auch Goethe-Preis. Internationale Anerkennung.

### Späte Jahre
Zunehmende Altersbeschwerden. Leukämie. Weiter schreibend bis zuletzt. Gedichte, Essays, Briefe. Ehrungen weltweit.

### Tod (1962)
Starb 9. August 1962 in Montagnola, 85 Jahre alt. Grab auf Friedhof Sant'Abbondio. Ninon überlebte ihn um 35 Jahre.

## Hauptthemen

### Selbstfindung
Zentrales Thema aller Werke:
- Individuation (Jung)
- Weg zur Ganzheit
- Überwindung der Spaltung
- "Werde, der du bist"

### Natur und Geist
Ewiger Gegensatz und Versöhnung:
- Demian: Sinclair
- Narziß und Goldmund
- Siddhartha: Weisheit und Welt
- Glasperlenspiel: Kastalien und Welt

### Östliche Weisheit
Lebenslange Faszination:
- Buddhismus (Siddhartha)
- Taoismus (Wassersymbolik)
- Indische Philosophie
- Aber: Westlicher Mensch bleibt

### Einsamkeit
Notwendig für Selbstwerdung:
- Außenseiter-Figuren
- Steppenwolf
- Eremiten-Existenz
- Preis der Individuation

## Literarische Technik

### Romantische Tradition
Erbe der deutschen Romantik:
- Novalis, Eichendorff
- Wanderer-Motiv
- Natur-Symbolik
- Musikali

tät

### Märchenhafte Elemente
Symbolische Erzählweise:
- Allegorische Figuren
- Magische Orte
- Verwandlungen
- Zeitlosigkeit

### Autobiographische Basis
Alle Romane als Selbstdarstellung:
- Camenzind: Jugend
- Demian: Pubertät
- Steppenwolf: Krise
- Goldmund: Sinnlichkeit

## Berühmte Zitate

> "In jedem Anfang liegt ein Zauber inne."

> "Man muss das Unmögliche versuchen, um das Mögliche zu erreichen."

> "Der Vogel kämpft sich aus dem Ei. Das Ei ist die Welt. Wer geboren werden will, muss eine Welt zerstören."

> "Glück ist Liebe, nichts anderes. Wer lieben kann, ist glücklich."

> "Die Welt zu durchschauen, sie zu verachten, mag großer Denker Sache sein. Mir aber liegt einzig daran, die Welt lieben zu können."

## Wirkung und Rezeption

### Zu Lebzeiten
Zwiespältig: In Deutschland zeitweise verfemt, in der Schweiz verehrt. Weltweit gelesen, besonders nach Nobelpreis.

### 1960er Jahre
Plötzliche Wiederentdeckung:
- Hippie-Bewegung
- Gegenkultur
- Flower-Power
- Millionenauflagen (bes. "Siddhartha", "Steppenwolf")

### Kritik
- "Zu jugendlich"
- "Narzistisch"
- "Eskapistisch"
- "Unpolitisch"

### Würdigung
- Meister der Selbstfindung
- Brücke zu östlicher Weisheit
- Kritiker des Materialismus
- Zeitlose Fragen

## Vermächtnis

Hermann Hesse bleibt einer der meistgelesenen deutschsprachigen Autoren:

- **Über 150 Millionen** verkaufte Bücher weltweit
- **Generationen** von Jugendlichen inspiriert
- **Ost-West-Synthese** als Vision
- **Individuationsweg** als Lebensprogramm

Seine Romane sind Wegbegleiter für Suchende, Außenseiter und alle, die nach einem authentischen Leben streben. In einer zerrissenen Zeit bot er die Vision der Ganzheit, in einer materialistischen Welt den Weg nach innen.

Hesses Größe liegt in der Ehrlichkeit, mit der er eigene Krisen darstellte, und im Mut, spirituelle Fragen in einer säkularen Zeit zu stellen. Er lebte das Künstlerleben, das er besang, und zahlte den Preis der Einsamkeit für seine Unabhängigkeit.`,

  'marcus-aurelius': `# Marcus Aurelius
*26. April 121 - 17. März 180 n. Chr.*

## Kurzbiografie

Marcus Aurelius Antoninus Augustus war römischer Kaiser (161-180) und einer der bedeutendsten Vertreter der stoischen Philosophie. Seine "Selbstbetrachtungen" (Τὰ εἰς ἑαυτόν), persönliche Notizen zur stoischen Lebensführung, zählen zu den wichtigsten philosophischen Werken der Antike. Als letzter der "Fünf guten Kaiser" versuchte er, philosophische Ideale mit den Pflichten der Macht zu vereinen.

## Der Philosophenkaiser (121-161)

### Geburt und Familie
Geboren als Marcus Annius Verus in Rom. Vater: Marcus Annius Verus (Prätor). Mutter: Domitia Lucilla. Großvater: Konsul und dreifacher Konsul, enger Freund Hadrians.

### Adoption durch Antoninus Pius (138)
Kaiser Hadrian bestimmt Antoninus Pius als Nachfolger unter Bedingung: Adoption von Marcus und Lucius Verus. Marcus wird designierter Thronfolger mit 17 Jahren.

### Bildung
Beste Lehrer Roms:
- **Rhetoric**: Fronto (berühmtester Redner)
- **Philosophie**: Junius Rusticus (Stoiker)
- **Recht**: Verschiedene Juristen
- **Griechisch**: Herodes Atticus

### Stoische Wende
Mit 25 Jahren entscheidende Hinwendung zur Philosophie durch Junius Rusticus. Wollte als Asket leben, davon abgehalten. Trug stoisches Philosophengewand unter der Toga.

### Princeps Iuventutis
Bereits als Thronerbe öffentliche Ämter:
- Quästor
- Konsul (mehrfach)
- Tribunicia Potestas
- Erlernen der Regierungsgeschäfte

### Ehe mit Faustina (145)
Heirat mit Annia Galeria Faustina, Tochter des Antoninus Pius. 13 Kinder, nur 6 überleben. Gerüchte über Untreue (unbewiesen). Marcus bleibt ihr treu ergeben.

## Der regierende Kaiser (161-180)

### Gemeinsame Herrschaft
Erste echte Doppelherrschaft (Diarchie): Marcus und Adoptivbruder Lucius Verus als gleichberechtigte Augusti. In Praxis: Marcus dominiert. Lucius stirbt 169.

### Äußere Bedrohungen
Herrschaft geprägt von Krisen:
- **Partherkrieg** (161-166): Lucius Verus führt Feldzug
- **Markomannenkriege** (166-180): Germanen und Sarmaten bedrohen Donaugrenze
- **Pest** (165-180): Antoninische Pest dezimiert Reich
- **Usurpation**: Avidius Cassius in Syrien (175)

### Markomannenkriege
Hauptkonflikt der Herrschaft:
- Germanen überqueren Donau
- Erstmals seit Jahrhunderten Italien bedroht
- Marcus führt persönlich Krieg (ungewöhnlich für Kaiser)
- Jahre im Feldlager an der Donau
- Dort entstehen die "Selbstbetrachtungen"

### Innenpolitik
- Juristische Reformen (humanere Rechtsprechung)
- Schutz der Schwachen (Sklaven, Witwen, Waisen)
- Finanzielle Belastung durch Kriege
- Verkauf kaiserlicher Güter zur Finanzierung

### Christenverfolgung
Paradox: Philosoph duldet Christenverfolgungen (Lyon 177). Sah Christen als staatsgefährdende Fanatiker. Stoische Pflichterfüllung über persönliche Toleranz.

## Selbstbetrachtungen

### Entstehung
Geschrieben in griechisch im Feldlager (170-180). Privates Tagebuch, nie zur Veröffentlichung bestimmt. Titel "Ta eis heauton" (Zu sich selbst). 12 Bücher.

### Inhalt
Keine systematische Philosophie, sondern:
- Persönliche Ermahnungen
- Danksagungen an Lehrer
- Stoische Grundsätze
- Kampf gegen Versuchungen
- Pflichtethik
- Todesbetrachtungen

### Buch I
Dankbarkeit an Lehrer und Familie:
- Großvater: Würde
- Vater: Bescheidenheit
- Mutter: Frömmigkeit
- Lehrer: Stoische Weisheit
- Antoninus Pius: Herrschertugenden

### Kernthemen
**Logos**: Kosmische Vernunft
**Apatheia**: Leidenschaftslosigkeit
**Prohairesis**: Innere Freiheit
**Pflicht**: Dienst am Ganzen
**Tod**: Natürlicher Prozess
**Gleichmut**: Gegenüber Schicksal

### Stil
Schlicht und eindringlich:
- Kurze Maximen
- Wiederholungen (Selbstvergewisserung)
- Ehrlichkeit über eigene Schwächen
- Keine Pose
- Ringen um Tugendhaftigkeit

## Stoische Philosophie

### Vier Kardinaltugenden
- **Weisheit** (sophia): Einsicht in Natur
- **Gerechtigkeit** (dikaiosyne): Pflicht zu anderen
- **Tapferkeit** (andreia): Standhaftigkeit
- **Mäßigung** (sophrosyne): Selbstbeherrschung

### Kosmopolitismus
- Alle Menschen sind Bürger einer Welt-Polis
- Pflicht zur Menschenliebe (philanthropia)
- Auch Feinde sind Brüder
- Kosmische Perspektive

### Memento Mori
Ständige Vergegenwärtigung der Sterblichkeit:
> "Denke daran, dass du bald niemand mehr sein wirst und nirgends mehr sein wirst."

Aber keine Verzweiflung: Tod als natürlich und notwendig.

### Prohairesis
Innere Freiheit:
- Äußeres unverfügbar
- Innere Haltung allein in eigener Macht
- Niemand kann Geist zwingen
- Selbstbestimmung des Willens

## Berühmte Zitate

> "Das Glück deines Lebens hängt von der Beschaffenheit deiner Gedanken ab."

> "Wenn du am Morgen erwachst, denke daran, was für ein köstlicher Schatz es ist, zu leben, zu atmen, sich zu freuen."

> "Du hast Macht über deinen Geist - nicht über äußere Ereignisse. Erkenne das, und du wirst Stärke finden."

> "Alles, was geschieht, geschieht gerecht."

> "Die Seele wird eingefärbt von den Gedanken."

> "Wie der Gedanke der Seele, so wird die Seele."

## Tod und Nachfolge (180)

### Letzte Tage
Im Feldlager bei Wien (Vindobona). Seuche bricht aus. Marcus erkrankt. Verweigert Nahrung (Selbsttötung durch Fasten?). Empfiehlt den Göttern das Reich.

### Tod am 17. März 180
Stirbt im Feldlager mit 58 Jahren. Wird konsekriert (vergöttlicht). Letzte Worte unklar überliefert. Möglicherweise: "Geht zur aufgehenden Sonne, ich gehe unter."

### Commodus als Nachfolger
Sohn Commodus (Mitkaiser seit 177) wird Alleinherrscher. Katastrophale Regierung. Bruch mit Vater-Idealen. Ende der "Adoptivkaiser-Zeit". Frage: Marcus' größter Fehler?

## Wirkungsgeschichte

### Antike
"Selbstbetrachtungen" wenig bekannt. Ruf als weiser Kaiser. Säule in Rom (Triumphsäule, erhalten). Reiterstatue (heute Kapitol, Kopie).

### Mittelalter
Weitgehend vergessen im Westen. Byzantinisches Reich bewahrt Text. Arabische Philosophen kennen Marc Aurel.

### Renaissance
Wiederentdeckung. Erste Drucke 16. Jh. Begeisterung für antike Weisheit. Fürstenspiegel-Tradition.

### Neuzeit
18./19. Jh.: Bewunderung als "Philosophenkaiser". Gibbon: Höhepunkt römischer Zivilisation. Romantics fasziniert von Melancholie.

### 20./21. Jahrhundert
Ungebrochene Popularität:
- Existentialisten (innere Freiheit)
- Psychotherapie (Kogn

itive Therapie)
- Selbsthilfe-Literatur
- Stoizismus-Renaissance
- Führungskräfte-Lektüre

## Historische Bewertung

### Würdigung
- Letzter großer Kaiser der Pax Romana
- Philosophenkaiser als Ideal
- Menschliche Rechtsprechung
- Pflichterfüllung unter widrigsten Umständen
- Literarisches Meisterwerk

### Kritik
- Christenverfolgung
- Commodus als Nachfolger (Dynastieprinzip statt Adoption)
- Militärisch defensiv
- Reich am Ende geschwächt
- Philosophie unpolitisch?

## Vermächtnis

Marcus Aurelius bleibt der Inbegriff des Philosophenherrschers - Platons Traum (fast) verwirklicht:

- **Selbstbetrachtungen** als zeitlose Weisheit
- **Stoizismus** praktisch gelebt
- **Pflichterfüllung** trotz persönlichem Leid
- **Humanitas** als Herrscherideal

Seine Größe liegt nicht in militärischen Siegen oder territorialen Eroberungen, sondern im Versuch, ein guter Mensch zu sein unter der Last der Macht. Die "Selbstbetrachtungen" zeigen einen Kaiser, der mit sich ringt, der zweifelt, der sich selbst ermahnt - menschlicher als jedes Herrscherdenkmal.

In einer Zeit, da das römische Reich bereits Risse zeigte, hielt er durch Charakter und Pflichtgefühl zusammen, was historische Kräfte auseinanderdrängten. Sein Beispiel lehrt, dass Größe nicht in äußerem Erfolg, sondern in innerer Haltung liegt.`,
};

async function main() {
  console.log('📝 Batch 1: Featured Autoren\n');

  const authorsDE = loadAuthors('de');
  const authorsEN = loadAuthors('en');

  let updated = 0;

  const updatedDE = authorsDE.map(author => {
    if (batch1Bios[author.id]) {
      console.log(`✅ ${author.name} (${author.id})`);
      updated++;
      return {
        ...author,
        biography: {
          ...author.biography,
          long: batch1Bios[author.id]
        }
      };
    }
    return author;
  });

  const updatedEN = authorsEN.map(author => {
    const deAuthor = updatedDE.find(a => a.id === author.id);
    if (deAuthor?.biography?.long && batch1Bios[author.id]) {
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

  console.log('\n✨ Batch 1 fertig!\n');
}

main();
