#!/usr/bin/env tsx
/**
 * Batch 2: Weitere Featured Autoren
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

const batch2Bios: Record<string, string> = {
	epiktet: `# Epiktet
*ca. 50 - ca. 138 n. Chr.*

## Kurzbiografie

Epiktet war einer der bedeutendsten stoischen Philosophen der römischen Kaiserzeit. Als Sklave geboren, wurde er zum einflussreichsten Moralphilosophen seiner Epoche. Seine Lehrgespräche ("Diatribai") und das "Handbüchlein der Moral" (Encheiridion) prägten die stoische Ethik nachhaltig. Sein Kerngedanke: Wahre Freiheit liegt in der inneren Haltung, nicht in äußeren Umständen.

## Vom Sklaven zum Philosophen

### Sklaverei (ca. 50-80)
Geboren in Hierapolis (Phrygien, heute Türkei) als Sklave. Name "Epiktet" bedeutet "der Erworbene" oder "Zugekaufte". Gehörte Epaphroditos, mächtigem Freigelassenen Kaiser Neros.

### Körperbehinderung
Ein Bein blieb zeitlebens verkrüppelt. Erzählung (vielleicht Legende): Herr quälte ihn, Epiktet blieb gelassen und sagte voraus, dass Bein brechen würde - geschah, er blieb unerschüttert.

### Philosophische Bildung
Trotz Sklaverei Zugang zu Bildung. Schüler des berühmten Stoikers Gaius Musonius Rufus in Rom. Intensive Auseinandersetzung mit stoischer Philosophie.

### Freilassung (ca. 80)
Nach Neros Tod (68) und Tod des Epaphroditos (95) wurde Epiktet freigelassen. Begann selbst als Philosoph zu lehren in Rom.

## Die Philosophenschule in Nikopolis (ab 93/94)

### Verbannung (93/94)
Kaiser Domitian verbannte Philosophen aus Rom (antintellektuelle Politik). Epiktet zog nach Nikopolis in Epirus (Griechenland).

### Schulgründung
Gründete einflussreiche Philosophenschule. Einfaches Leben in Armut. Unterrichtete im Dialog. Berühmt für eindringliche Lehrgespräche.

### Berühmte Schüler
- **Arrian**: Später Statthalter und Historiker, zeichnete Epiktets Lehren auf
- **Gellius**: Römischer Schriftsteller
- **Kaiser Hadrian**: Besuchte möglicherweise Schule
- **Marcus Aurelius**: Las Epiktet intensiv

### Lebensweise
Lebte asketisch: kleine Hütte, eisernes Lämpchen (Tonlampe gestohlen). Zölibat lange, spät adoption eines Waisenkindes. Bescheidenheit als Philosophenideal.

## Die Lehre

### Dihairesis - Grundunterscheidung
Kern der Philosophie:
**Eph' hemin / Ouk eph' hemin** (In unserer Macht / Nicht in unserer Macht)

**In unserer Macht:**
- Meinungen (doxai)
- Impulse (hormai)
- Begierden (orexeis)
- Abneigungen (ekkl

iseis)
- Kurz: unsere Prohairesis (moralische Wahl)

**Nicht in unserer Macht:**
- Körper
- Besitz
- Ruf
- Ämter
- Alles Äußere

### Prohairesis
Zentral für Epiktet:
- Moralisches Selbst
- Fähigkeit zu wählen und zu urteilen
- Unverwundbar durch Äußeres
- Einziges wahrhaft Eigenes
- Göttlicher Funke im Menschen

### Freiheit
Wahre Freiheit = Unabhängigkeit von Äußerem:
> "Nicht die Dinge beunruhigen die Menschen, sondern ihre Meinungen über die Dinge."

Sklave kann innerlich frei sein, Kaiser innerlich Sklave seiner Leidenschaften.

### Pflichten (Kathekonta)
Soziale Rollen und Pflichten:
- Als Sohn, Vater, Bürger
- Vernunftgemäßes Handeln
- Nicht weltfern, sondern praktisch
- "Handle deiner Rolle gemäß"

## Encheiridion - Das Handbüchlein

### Entstehung
Zusammengestellt von Schüler Arrian aus den Lehrgesprächen (Diatribai). 53 kurze Kapitel. Praktischer Leitfaden. Wurde "Handbüchlein der Moral" genannt.

### Erste Sätze (berühmt)
> "Von den Dingen sind die einen in unserer Gewalt, die anderen nicht. In unserer Gewalt sind Meinung, Trieb, Begierde, Verabscheuung, kurz: alles, was unser eigenes Werk ist."

### Inhalte
- Grundunterscheidung (s.o.)
- Umgang mit Schicksalsschlägen
- Soziale Rollen
- Umgang mit Tod
- Bescheidenheit
- Selbstprüfung
- Askese als Training

### Wirkung
Wurde zum populärsten stoischen Text. Handlich und praktisch. Kompendium der Lebenskunst. Bis heute gelesen.

## Die Lehrgespräche (Diatribai)

### Form
Lebendige Dialoge:
- Arrian als stenographischer Aufzeichner
- Sokrat

ischer Dialog
- Rhetorische Fragen
- Direkter Ton
- Lebensnahe Beispiele

### Themen
- Was ist Philosophie?
- Über die Vorsehung
- Über die Freiheit
- Umgang mit Tyrannen
- Über Krankheit und Tod
- Über Familienpflichten
- Kritik an Epikureern

### Stil
- Derb und direkt
- Bildhafte Sprache
- Alltagsbeispiele
- Humorvoll
- Manchmal rau

### Erhaltung
Von ursprünglich 8 Büchern nur 4 erhalten (durch Arrian). Authentischer als bei anderen antiken Philosophen.

## Zentrale Gedanken

### Gelassenheit (Ataraxia)
Seelenruhe durch:
- Unterscheidung Verfügbar/Unverfügbar
- Nur Inneres kontrollierbar
- Äußeres mit Gleichmut annehmen
- "Amor fati" avant la lettre

### Prüfungen (Gymnasmata)
Leben als Training:
- Äußeres als Test
- Charakterbildung
- Selbstdisziplin
- "Was würde Sokrates tun?"

### Todesverachtung
Tod ist nichts Schlimmes:
- Natürlicher Prozess
- Rückgabe des Geliehenen
- "Wann die Trompete ruft, gehorche"
- Sokrates als Vorbild

### Gottvertrauen
Stoischer Monotheismus:
- Zeus als Vorsehung
- Kosmos vernünftig geordnet
- Mensch als Fragment Gottes
- Vertrauen in göttliche Ordnung

## Berühmte Zitate

> "Nicht die Dinge selbst beunruhigen die Menschen, sondern ihre Meinungen über die Dinge."

> "Verlange nicht, dass die Dinge geschehen, wie du es wünschst, sondern wünsche, dass sie geschehen, wie sie geschehen, und es wird dir gut gehen."

> "Wenn du küsst dein Kindlein oder dein Weib, so sprich, dass du einen Menschen küssest; denn wenn es stirbt, wirst du nicht betrübt sein."

> "Es sind nicht die Dinge, die uns beunruhigen, sondern die Meinungen, die wir von den Dingen haben."

> "Du bist eine kleine Seele, die einen Leichnam mit sich herumträgt."

## Einfluss und Wirkung

### Antike
Marcus Aurelius las Epiktet intensiv ("Selbstbetrachtungen" voller Anklänge). Favorinus kritisierte. Lukian parodierte. Bis Spätantike gelesen.

### Christentum
Frühe Christen fasziniert:
- Simplicius (Neuplatoniker, 6. Jh.): Kommentar
- Mönchstum: Askese-Ideal
- Mittelalter: Weitergel

esen
- "Fast ein Christ" (Kirchenväter)

### Neuzeit
Renaissance-Humanismus: Wiederentdeckung. 1670: Erstmals komplett gedruckt. Einfluss auf:
- **Montaigne**: Essais
- **Pascal**: Gedanken
- **Descartes**: Stoische Ethik
- **Spinoza**: Gelassenheit

### Moderne
Ungebrochene Aktualität:
- **Existenzphilosophie**: Heidegger, Sartre (Freiheitsbegriff)
- **Kognitive Therapie**: Ellis, Beck (Gedanken ändern Gefühle)
- **Resilienz-Forschung**: Umgang mit Unverfügbarem
- **Stoizismus-Renaissance**: 21. Jh. (Ryan Holiday u.a.)

## Epiktet und die Stoa

### Orthodoxer Stoiker
Treu zur Schultradition:
- Chrysipp und Zenon zitiert
- Kleanthes' Hymnus an Zeus
- Keine Innovation in Physik/Logik
- Fokus auf Ethik

### Vereinfachung
Konzentration auf Praktisches:
- Weniger Systematik als Chrysipp
- Dihairesis als Kern
- Alltagstauglich
- Für Nichtphilosophen

### Sokratisches Element
Sokrates als Ideal:
- Dialog-Form
- Selbstprüfung
- Leben nach Prinzipien
- Tod als Befreiung

## Historische Einordnung

### Kaiserzeit-Stoa
Repräsentant der römischen Stoa:
- Nach Seneca, vor Marc Aurel
- Praktische Ethik im Vordergrund
- Politische Zurückhaltung
- Individuelle Seelenführung

### Sklavenperspektive
Einzigartig:
- Philosophie aus Sklavenerfahrung
- Freiheit von innen trotz äußerer Unfreiheit
- Glaubwürdigkeit durch Lebenspraxis
- Radikalität der Haltung

## Vermächtnis

Epiktet bleibt der praktischste Philosoph der Antike:

- **Handbuch fürs Leben** - bis heute benutzbar
- **Freiheit durch Haltung** - zeitlose Weisheit
- **Sklave als Weiser** - Umkehrung aller Werte
- **Unverwundbarkeit** - durch Verzicht auf Unverfügbares

Seine Größe liegt in der Radikalität, mit der er seine Philosophie lebte. Als Sklave lehrte er Freiheit, als Armer Glück, als Körperbehinderter Seelenruhe. Seine Botschaft: Äußere Umstände haben keine Macht über uns, wenn wir es nicht zulassen.

Das Encheiridion ist vielleicht der beste Beweis, dass Philosophie keine akademische Disziplin, sondern Lebenskunst ist. In 53 kurzen Kapiteln zeigt Epiktet, wie man ein gutes Leben führt - nicht in perfekten Umständen, sondern trotz aller Widrigkeiten.

Sein Einfluss reicht von Marc Aurel bis zur modernen Psychotherapie. Wann immer Menschen lernen müssen, mit Unverfügbarem umzugehen, bleibt Epiktet aktuell. In unsicheren Zeiten ist sein Rat zeitlos: Konzentriere dich auf das, was du ändern kannst, und akzeptiere, was du nicht ändern kannst.`,

	'coelho-paulo': `# Paulo Coelho
*24. August 1947 - heute*

## Kurzbiografie

Paulo Coelho ist ein brasilianischer Schriftsteller und einer der meistgelesenen Autoren der Gegenwart. Sein Welterfolg "Der Alchimist" (1988) wurde in über 80 Sprachen übersetzt und mehr als 150 Millionen Mal verkauft. Seine spirituellen Romane verbinden mystische Weisheit mit modernem Sinnsuchen und inspirieren Millionen von Lesern weltweit. Von der Militärdiktatur verfolgt und dreimal in psychiatrische Kliniken eingewiesen, wurde er zum Bestsellerautor und Mitglied der Brasilianischen Akademie der Literatur.

## Frühe Jahre in Rio de Janeiro (1947-1970)

### Mittelschichtfamilie
Geboren in Rio de Janeiro als Sohn eines Ingenieurs. Jesuitenschule. Wollte Schriftsteller werden - Eltern wünschten Ingenieur. Frühe Rebellion gegen Konventionen.

### Psychiatrische Einweisungen
Mit 17, 20 und 21 Jahren von Eltern in psychiatrische Kliniken eingewiesen. Angeblich "abnormales Verhalten". Elektroschocks. Traumatische Erfahrung. Versuch, Träume zu töten.

### Hippie-Jahre
1960er: Teil der Gegenkultur. Langes Haar, Drogen, alternativer Lebensstil. Gegen Militärdiktatur. Interesse an Mystik und Okkultismus.

## Der Weg zur Magie (1970-1987)

### Journalist und Songwriter
Arbeit als Journalist. Erfolgreicher Texter für brasilianische Rockmusik. Raul Seixas als Partner. Hits in Brasilien. Finanzieller Erfolg, aber innerliche Leere.

### Verhaftung (1974)
Militärdiktatur verhaftet ihn wegen subversiver Texte. Folter angedroht. Nach Tagen freigelassen. Traumatische Erfahrung verstärkt Sinnsuche.

### Satanismus-Phase
Kurze Beschäftigung mit schwarzer Magie und Satanismus. Führte zu Krise. Erkannte Gefahr. Wendung zur Spiritualität.

### Pilgerreise nach Santiago (1986)
Entscheidende Erfahrung: Jakobsweg mit Frau Christina. 700 km zu Fuß. Spirituelle Transformation. Grundlage für ersten Roman "Auf dem Jakobsweg" (1987).

### RAM-Orden
Mitglied des katholisch-mystischen Ordens RAM (Regnus Agnus Mundi). Verbindung von Christentum und Esoterik. Rituale und Initiationen.

## Der Durchbruch (1988-1993)

### Der Alchimist (1988)
Parabel über einen andalusischen Hirten auf der Suche nach Schatz. Erste Auflage: 900 Exemplare, Flop. Verlag gibt auf. Neuer Verlag 1990. Plötzlich Mundpropaganda. Bestseller in Brasilien.

### Weltweiter Erfolg
Übersetzungen in alle Sprachen. 1993 Durchbruch in USA. Oprah Winfrey-Empfehlung. Phänomen: Je mehr Zeit vergeht, desto mehr Verkäufe. Kultbuch der Selbstfindung.

### Themen des Alchimisten
- Persönliche Legende (Lebensaufgabe)
- Weltenseele
- Zeichen lesen lernen
- Träume verwirklichen
- Schatz im eigenen Herzen

### Kritik und Verteidigung
Kritiker: Kitschig, esoterisch, seicht. Fans: Inspirierend, lebensverändernd. Coelho: "Ich schreibe fürs Herz, nicht für Kritiker."

## Schriftstellerleben (1993-heute)

### Produktivität
Etwa alle zwei Jahre ein neuer Roman. Über 30 Bücher. Routinierter Arbeitsprozess. Vorbereitung durch Recherche und Reisen.

### Themen
Wiederkehrende Motive:
- Spirituelle Suche
- Persönliche Transformation
- Mut zum Träumen
- Liebe als Kraft
- Zeichen und Omen
- Schicksal und freier Wille

### Wichtige Werke
- **Am Ufer des Rio Piedra saß ich und weinte** (1994): Liebe und spirituelles Erwachen
- **Veronika beschließt zu sterben** (1998): Psychiatrie und Lebenswille
- **Der Dämon und Fräulein Prym** (2000): Gut und Böse
- **Elf Minuten** (2003): Sexualität und heilige Prostitution
- **Der Zahir** (2005): Obsession und Freiheit
- **Die Hexe von Portobello** (2006): Weibliche Spiritualität
- **Aleph** (2011): Zeitreise und Reinkarnation

### Kontroversen
- Plagiatsvorwürfe (nie bewiesen)
- Esoterik-Kritik
- Vereinfachung spiritueller Traditionen
- Kommerzialismus

## Erfolg und Zahlen

### Verkaufszahlen
- Über 320 Millionen verkaufte Bücher
- Übersetzungen in 83 Sprachen
- Meist-übersetzer Autor der Welt (Guinness)
- "Der Alchimist" allein über 150 Millionen

### Auszeichnungen
- Mitglied der Brasilianischen Akademie der Literatur (2002)
- Chevalier de l'Ordre national de la Légion d'honneur (Frankreich)
- Crystal Award (Weltwirtschaftsforum)
- Zahlreiche internationale Ehrungen

### Einfluss
Leser aus allen Kulturen. Besonders erfolgreich in:
- Iran (trotz Zensur)
- Türkei
- Japan
- Russland
- Europa
- Lateinamerika

## Philosophie und Spiritualität

### Persönliche Legende
Kernkonzept:
- Jeder hat einzigartige Lebensaufgabe
- Universum hilft bei Verwirklichung
- Zeichen weisen den Weg
- Mut erfordert, zu folgen

### Synchronizität
Inspiration durch C.G. Jung:
- Bedeutungsvolle Zufälle
- Alles ist verbunden
- Achte auf Omen
- Universum spricht zu uns

### Weltenseele
Stoische/neuplatonische Idee:
- Alles ist eins
- Liebe als verbindende Kraft
- Kommunikation mit Kosmos möglich
- Pantheistische Elemente

### Katholizismus + Esoterik
Eigenwillige Mischung:
- Katholisch getauft und sozialisiert
- Jakobsweg als katholische Tradition
- Aber: Reinkarnation, Magie, I Ging
- Synkretismus

## Digitale Präsenz

### Social Media Pioneer
Früher Blogger (seit 1996). Aktiv auf:
- Facebook: Millionen Follower
- Twitter/X: Inspirierende Tweets
- Instagram: Visuell-spirituell
Teilt Gedanken, Reisen, Weisheiten täglich.

### Piraterie-Haltung
Ungewöhnlich: Toleriert illegale Downloads. "Wichtig ist, gelesen zu werden, nicht Geld." Sieht Piraterie als Marketing. Dennoch Bestseller.

## Paulo Coelho als Person

### Ehe
Seit 1980 mit der Künstlerin Christina Oiticica verheiratet. Keine Kinder. Jakobsweg gemeinsam. Sie inspiriert viele Charaktere.

### Wohnsitze
Hauptwohnsitz: Genf (Schweiz). Auch in Rio. Vielreisend. Kosmopolit.

### Routine
Disziplinierter Arbeiter. Morgenschreiber. Recherche-intensiv. Jeden Tag kleine Schritte. "Zehn Prozent Inspiration, neunzig Prozent Transpiration."

### Persönlichkeit
Öffentlich: Charismatisch, spirituell, weise. Privat: Diszipliniert, fleißig, strategisch. Geschäftsmann und Mystiker zugleich.

## Kritik

### Literarisch
- "Esoterischer Kitsch"
- "Oberflächlich"
- "Vereinfachend"
- "Kommerziell"
- "Selbsthilfe, keine Literatur"

### Philosophisch
- "Synkretistische Beliebigkeit"
- "Konsumismus der Spiritualität"
- "Falsche Versprechungen"
- "Individualismus statt Soziales"

### Verteidigung
Coelho: "Ich schreibe keine Literatur für Professoren. Ich schreibe, um Menschen zu helfen, sich selbst zu finden."

## Berühmte Zitate

> "Wenn du etwas wirklich willst, dann wird das gesamte Universum darauf hinwirken, dass du es erreichst."

> "Die Welt liegt in den Händen derer, die den Mut haben, zu träumen und das Risiko einzugehen, ihre Träume zu leben."

> "Du bist nicht krank, du bist traurig. Es ist

 die moderne Welt."

> "Es gibt nur eine Sache, die einen Traum unmöglich macht: die Angst vor dem Scheitern."

> "Jeder Tag ist ein neuer Anfang."

## Vermächtnis

Paulo Coelho bleibt einer der einflussreichsten Schriftsteller des 21. Jahrhunderts:

- **Inspirator von Millionen** - Leser finden Mut zum Träumen
- **Brückenbauer** zwischen Kulturen und Religionen
- **Pionier** der spirituellen Literatur
- **Phänomen** der Mundpropaganda-Vermarktung

Seine Größe liegt nicht in literarischer Kunstfertigkeit (die Kritiker vermissen), sondern in der Fähigkeit, Menschen zu berühren. Er gibt einfache Antworten auf komplexe Fragen - und genau das suchen Millionen.

Ob man seine Philosophie teilt oder nicht: Der Einfluss ist unbestreitbar. Ganze Generationen wurden von ihm inspiriert, ihre "persönliche Legende" zu suchen. In einer desillusionierenden Welt bietet er Hoffnung - und das ist vielleicht wichtiger als literarische Perfektion.`,

	'gibran-khalil': `# Khalil Gibran
*6. Januar 1883 - 10. April 1931*

## Kurzbiografie

Khalil Gibran (arabisch جبران خليل جبران) war ein libanesisch-amerikanischer Dichter, Philosoph und Maler. Sein Hauptwerk "Der Prophet" (1923) gehört zu den meistverkauften Büchern aller Zeiten und wurde in über 100 Sprachen übersetzt. Als Brücke zwischen östlicher Mystik und westlicher Moderne prägte er eine Generation von Suchenden. Seine poetisch-philosophischen Texte über Liebe, Freiheit und menschliche Bestimmung berühren bis heute Menschen weltweit.

## Kindheit im Libanon (1883-1895)

### Bsharri
Geboren in Bsharri, christlich-maronitisches Bergdorf im Nordlibanon. Familie gehörte zur christlichen Minderheit. Vater Khalil Sa'd Gibran: Steuereintreiber, Trinker, Glücksspieler. Mutter Kamila Rahmeh: stark, fromm, Halt der Familie.

### Schwierige Familienverhältnisse
Vater verschuldet, inhaftiert wegen Korruption. Familie verarmt. Mutter entscheidet zur Auswanderung. Libanesische Diaspora nach Amerika.

### Prägende Landschaft
Heilige Zedern des Libanon. Wadi Qadisha (Heiliges Tal). Klöster und Einsiedeleien. Landschaft durchzog alle späteren Werke.

## Boston und New York (1895-1931)

### Einwanderung nach Boston (1895)
Mit Mutter und Geschwistern (Vater blieb). Armes Einwandererviertel. Khalil lernte Englisch in öffentlicher Schule. Talent für Zeichnen entdeckt.

### Fred Holland Day
Fotograf und Kulturmäzen entdeckt Khalil. Führt ihn in Bostoner Bohème ein. Gibran porträtiert prominente Persönlichkeiten. Erste künstlerische Förderung.

### Rückkehr in den Libanon (1898-1902)
Zur weiteren Ausbildung nach Beirut, Collège de la Sagesse. Studium Arabisch, Französisch, Literatur. Begeisterung für arabische Romantik. Erste arabische Gedichte.

### Familiäre Tragödien (1902-1904)
Rückkehr nach Boston. Schwester Sultana stirbt an Tuberkulose (14 Jahre). Bruder Boutros stirbt (Tuberkulose). Mutter stirbt (Krebs). Innerhalb von zwei Jahren drei Verluste. Nur Schwester Marianna überlebt, wird lebenslange Stütze.

### Mary Elizabeth Haskell
1904 Begegnung mit Schulleiterin Mary Haskell (10 Jahre älter). Mäzenin, Mentorin, Vertraute. Finanziert Studium in Paris. Briefwechsel über 25 Jahre. Komplizierte Liebe (Ehe abgelehnt, aber lebenslang verbunden).

### Paris (1908-1910)
Studium an der Académie Julian. Treffen mit Rodin (großer Einfluss). Verkehr in Künstlerkreisen. Malstil entwickelt sich. Beeinflusst von Symbolismus und Art Nouveau.

### New York (ab 1911)
Umzug nach New York, Atelier in Greenwich Village. Schreibt zunehmend auf Englisch. Kontakte zu Literatenszene. Marianna führt Haushalt und Galerie.

## Der arabische Erneuerer (1905-1918)

### "Tränen und Lachen" (1914)
Erste Sammlung arabischer Essays. Kritik an religiösem Dogmatismus. Angriff auf Unterdrückung. Ruf nach Freiheit und Liebe.

### "Die gebrochenen Flügel" (1912)
Arabischer Roman. Tragische Liebesgeschichte. Kritik an arrangierten Ehen und Patriarchat. Bestseller in arabischer Welt.

### Al-Mahjar - Die Emigrantendichter
Mitbegründer der "Pen League" arabischer Emigranten-Schriftsteller in New York. Mit Ameen Rihani, Mikhail Naimy. Erneuerung arabischer Literatur. Befreiung von klassischen Formen.

### Sprache und Stil
Biblischer Ton in Arabisch. Kurze, poetische Sätze. Parabeln und Gleichnisse. Natursymbolik. Mystische Bilder.

## Der Prophet (1923)

### Entstehung
Jahrelange Arbeit. Immer wieder überarbeitet. Mary Haskell korrigierte Englisch. Vereint östliche Weisheit und westliche Moderne.

### Struktur
Almustafa (der Prophet) verlässt Stadt Orphalese nach 12 Jahren. Bewohner bitten um Weisheit. 26 Themen in poetischer Prosa.

### Themen
- Liebe
- Ehe
- Kinder
- Arbeit
- Freude und Schmerz
- Häuser
- Kleider
- Kaufen und Verkaufen
- Verbrechen und Strafe
- Gesetze
- Freiheit
- Vernunft und Leidenschaft
- Schmerz
- Selbsterkenntnis
- Lehren
- Freundschaft
- Sprechen
- Zeit
- Gut und Böse
- Gebet
- Wonne
- Schönheit
- Religion
- Tod
- Abschied

### Über die Liebe (berühmteste Passage)
> "Wenn die Liebe dir winkt, folge ihr, sind ihre Wege auch schwer und steil."
> "Die Liebe gibt nichts als sich selbst und nimmt nichts als von sich selbst."

### Über Kinder
> "Eure Kinder sind nicht eure Kinder. Sie sind die Söhne und Töchter der Sehnsucht des Lebens nach sich selbst."
> "Ihr könnt ihnen eure Liebe geben, aber nicht eure Gedanken, denn sie haben ihre eigenen Gedanken."

### Erfolg
Anfangs bescheiden. Dann Mundpropaganda. Steady Seller über Jahrzehnte. Über 100 Millionen verkaufte Exemplare. Dritt-meist-verkauftes poetisches Werk nach Bibel und Laozi.

## Philosophie und Spiritualität

### Mystische Einheit
Alle Religionen als Wege zum Einen. Sufismus, Christentum, östliche Weisheit verschmolzen. Pantheistische Grundhaltung. Gott in allem.

### Freiheit und Liebe
Zentrale Werte:
- Freiheit als höchstes Gut
- Liebe als göttliche Kraft
- Individuum vor Institution
- Intuition vor Dogma

### Schmerz und Freude
Paradoxes Denken:
- Schmerz und Freude untrennbar
- Leid als Lehrmeister
- Tod als Übergang
- Gegensätze vereint

### Soziale Kritik
Gegen:
- Materialismus
- Unterdrückung
- Religiösen Zwang
- Patriarchat
- Imperialismus

## Als Maler

### Stil
Symbolistisch. Fließende, erotische Formen. Engel, Propheten, weibliche Akte. Blake-Einfluss. Mystische Vision.

### Ausstellungen
Regelmäßige Ausstellungen in New York und Boston. Porträts von Prominenten (Yeats, Jung, Tagore). Verkäufe bescheiden, aber respektiert.

### Buchillustrationen
Illustrierte eigene Werke. Verschmelzung von Text und Bild. Gesamtkunstwerk-Anspruch.

## Späte Werke

### "Der Garten des Propheten" (1933, posthum)
Fortsetzung des Propheten. Unvollendet. Von Mary Haskell zusammengestellt.

### "Jesus, der Menschensohn" (1928)
Jesus aus Perspektive von 77 Zeitgenossen. Humanistisches Jesus-Bild. Christus als Poet und Rebell.

### "Sand und Schaum" (1926)
Aphorismen-Sammlung. Poetische Kurztexte. Mystische Weisheiten.

## Tod und Vermächtnis (1931)

### Krankheit
Leberzirrhose und Tuberkulose. Lebenslang Lungenprobleme. Alkoholkonsum verschlimmerte. Letztes Jahr im Krankenhaus.

### Tod
10. April 1931 in New York, 48 Jahre alt. Letzte Worte (angeblich): "This is my last breath, and I love you all."

### Rückführung
Leichnam nach Libanon überführt. Beigesetzt in Mar Sarkis-Kloster, Bsharri. Heute Museum (Gibran-Museum). Nationalheld des Libanon.

### Testament
Vermögen und Werke an Bsharri. Schwester Marianna verwaltete Nachlass bis 1972.

## Wirkung und Rezeption

### Kultbuch der 1960er/70er
"Der Prophet" Lieblingsbuch der Hippies. Hochzeiten und Beerdigungen. Gegenkultur-Bibel. John F. Kennedy zitierte Gibran. Elvis besaß "Der Prophet".

### Kritik
Literaturkritiker: Kitschig, seicht, pseudo-mystisch. "Hallmark-Philosophie". Zu eklektisch. Zu glatt.

### Verteidigung
Fans: Authentisch berührend. Zeitlose Weisheit. Trost spendend. Form egal, wenn Herz erreicht.

### Bis heute
Millionen Exemplare jährlich verkauft. Übersetzungen in 110+ Sprachen. Besonders populär: USA, Arabische Welt, Indien, Lateinamerika.

## Berühmte Zitate

> "Du sollst frei sein von allem, ausgenommen von deiner Freiheit."

> "Und vergesst nicht, dass die Erde sich freut, eure nackten Füße zu fühlen, und die Winde sehnen sich danach, mit eurem Haar zu spielen."

> "Denn was ist Böses, wenn nicht Gutes, das von seinem eigenen Hunger und Durst gequält wird?"

> "Ich lerne Schweigen von den Geschwätzigen, Toleranz von den Intoleranten und Freundlichkeit von den Unfreundlichen. Seltsam, dass ich diesen Lehrern nicht dankbar bin."

> "Wenn du Liebe gibst, gibst du alles."

## Vermächtnis

Khalil Gibran bleibt ein Prophet des 20. Jahrhunderts:

- **Brücke** zwischen Ost und West
- **Stimme** der arabischen Renaissance
- **Dichter** der universalen Spiritualität
- **Künstler** der mystischen Vision

Seine Größe liegt in der Fähigkeit, tiefe Wahrheiten in einfacher Schönheit auszudrücken. Ob man seine Philosophie als tief oder seicht beurteilt - sein Einfluss auf Millionen ist unbestreitbar.

In einer fragmentierten Welt bot er die Vision der Einheit. In einer Zeit des Materialismus erinnerte er an das Spirituelle. In einer Ära des Dogmas predigte er die Freiheit. "Der Prophet" bleibt ein Geschenk an die Menschheit - imperfekt vielleicht, aber authentisch aus dem Herzen eines Suchenden.`,
};

async function main() {
	console.log('📝 Batch 2: Featured Autoren\n');

	const authorsDE = loadAuthors('de');
	const authorsEN = loadAuthors('en');

	let updated = 0;

	const updatedDE = authorsDE.map((author) => {
		if (batch2Bios[author.id]) {
			console.log(`✅ ${author.name} (${author.id})`);
			updated++;
			return {
				...author,
				biography: {
					...author.biography,
					long: batch2Bios[author.id],
				},
			};
		}
		return author;
	});

	const updatedEN = authorsEN.map((author) => {
		const deAuthor = updatedDE.find((a) => a.id === author.id);
		if (deAuthor?.biography?.long && batch2Bios[author.id]) {
			return {
				...author,
				biography: {
					...author.biography,
					long: deAuthor.biography.long,
				},
			};
		}
		return author;
	});

	console.log(`\n📊 ${updated} Biografien hinzugefügt\n`);

	writeAuthors(updatedDE, 'de');
	writeAuthors(updatedEN, 'en');

	console.log('\n✨ Batch 2 fertig!\n');
}

main();
