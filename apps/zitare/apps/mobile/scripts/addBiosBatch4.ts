#!/usr/bin/env tsx
/**
 * Batch 4: Johannes Paul II, J.K. Rowling, Alfred Adler, Erich Kästner
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

const batch4Bios: Record<string, string> = {
	'johannes-paul-ii': `# Johannes Paul II.
*18. Mai 1920 - 2. April 2005*

## Kurzbiografie

Karol Józef Wojtyła, bekannt als Papst Johannes Paul II., war der erste nicht-italienische Papst seit 455 Jahren und der erste polnische Papst überhaupt. Sein fast 27-jähriges Pontifikat (1978-2005) war das drittlängste der Geschichte und prägte die katholische Kirche und Weltpolitik nachhaltig. Als charismatischer Reisepapst besuchte er 129 Länder und wurde zur globalen moralischen Autorität. Seine Rolle beim Fall des Kommunismus in Osteuropa machte ihn zur Schlüsselfigur des 20. Jahrhunderts.

## Kindheit im Schatten des Krieges (1920-1946)

### Wadowice
Geboren in Wadowice, Kleinstadt nahe Krakau (Polen). Vater: Karol Wojtyła Sr., Offizier der österreichisch-ungarischen Armee. Mutter: Emilia Kaczorowska. Katholische Mittelschichtfamilie. Nachbarschaft mit jüdischen Familien - prägte Haltung zu Judentum.

### Frühe Verluste
- Mutter stirbt 1929 (Karol 8 Jahre alt)
- Bruder Edmund stirbt 1932 an Scharlach (Karol 12)
- Nur Vater und Karol bleiben

Vater erzieht streng katholisch. Tägliches Gebet. Disziplin. Aber auch Liebe.

### Jugend und Theater
Brillanter Schüler. Sportlich (Fußball, Schwimmen, Kajak). Leidenschaftlicher Theaterbegeisterter. Schauspielerei in Schulaufführungen. Talent. Erwägt Schauspielkarriere.

### Studium in Krakau (1938)
Jagiellonen-Universität. Polnische Philologie. Theatergruppe. Gedichte schreibend. Lebensfroh. Dann: 1. September 1939 - Deutsche Invasion.

### Nazi-Besatzung (1939-1945)
Universität geschlossen. Zwangsarbeit in Steinbruch, dann Chemiefabrik. Untergrund-Theatergruppe "Rhapsodic Theater". Gefahr: Verhaftung, Deportation, Tod. Vater stirbt 1941 - Karol völlig allein.

### Priesterberufung
Tod, Leid, Unterdrückung wecken Berufung. 1942 Eintritt ins geheime Priesterseminar (Nazis hatten Seminar geschlossen). Studium im Untergrund. Kardinal Sapieha schützt.

### Kriegsende und Weihe (1946)
Deutschland kapituliert. Seminar wieder legal. 1. November 1946: Priesterweihe. 26 Jahre alt.

## Priester, Bischof, Kardinal (1946-1978)

### Rom und Promotion (1946-1948)
Studium am Angelicum in Rom. Doktorarbeit über Johannes vom Kreuz (spanischer Mystiker). Phänomenologie und Thomismus verbunden. Rückkehr nach Polen.

### Landpfarrer und Studentenseelsorger
Zunächst Kaplan in Dörfern. Ab 1949 Studentenseelsorger in Krakau. Beliebt bei Jugend. Ski-Ausflüge, Kajak-Touren, Diskussionen. "Wujek" (Onkel) genannt. Charismatisch.

### Zweite Doktorarbeit
Habilitation über Max Scheler. Phänomenologie und katholische Ethik. Werden akademischer Philosoph und Ethiker. Lehrtätigkeit.

### Bischof (1958)
Mit 38 Jahren Weihbischof von Krakau. Jüngster Bischof Polens. Zweites Vatikanisches Konzil (1962-1965): Aktiver Teilnehmer. Mitarbeit an "Gaudium et Spes" (Pastoralkonstitution). Öffnung zur Moderne.

### Erzbischof von Krakau (1964)
Kardinal (1967). Konfrontation mit kommunistischem Regime. Kampf um Religionsfreiheit. Bau neuer Kirchen. Pastoral unter Diktatur. Geschickt und mutig.

### "Liebe und Verantwortung" (1960)
Buch über Sexualethik. Personalistischer Ansatz. Basis für spätere "Theologie des Leibes". Fortschrittlicher als man denkt: Würde der Frau, eheliche Liebe, gegen Objektivierung.

## Papst Johannes Paul II. (1978-2005)

### Konklave 1978 - "Das Jahr der drei Päpste"
- Paul VI. stirbt August 1978
- Johannes Paul I. gewählt, stirbt nach 33 Tagen
- Oktober 1978: Neues Konklave

16. Oktober: Wojtyła gewählt. Sensation! Erster Nicht-Italiener seit 1523. Erster Pole. Jüngster (58) seit über 100 Jahren.

### "Habemus Papam"
> "Fürchtet euch nicht! Öffnet die Türen für Christus!"

Erste Worte. Charisma sofort spürbar. Massen begeistert.

### Der Reisepapst
129 Länder besucht. Mehr als alle Päpste zuvor zusammen. Pastoralreisen als Evangelisierung. Weltjugendtage. Millionen Menschen persönlich getroffen.

**Historische Reisen:**
- **Polen** (1979): Erste Reise. Erweckte polnische Freiheitsbewegung. Millionen bei Messen. Solidarność inspiriert.
- **Mexiko, Brasilien**: Befreiungstheologie-Kritik, aber Solidarität mit Armen
- **USA**: Mehrfach. Kritik und Dialog.
- **Kuba** (1998): Treffen mit Castro
- **Heiliges Land** (2000): Versöhnung mit Juden, Besuch Westmauer
- **Syrien, Griechenland**: Ökumene mit Orthodoxie

### Attentat (13. Mai 1981)
Petersplatz. Mehmet Ali Ağca schießt. Schwer verletzt. Notoperation. Überlebt knapp. Dankt Maria von Fátima (13. Mai = Fátima-Jahrestag).

1983: Besucht Attentäter im Gefängnis. Vergebung. Ikonisches Bild.

## Kampf gegen Kommunismus

### Polen und Solidarność
1979-Besuch in Polen: Wendepunkt. Massen erkennen: Regime nicht allmächtig. Solidarność (1980) direkt inspiriert. Johannes Paul unterstützt diskret.

### Fall der Mauer (1989)
Polen: Erste freie Wahlen. Dominoeffekt: Ungarn, Tschechoslowakei, DDR. Papst: Moralische Autorität des Widerstands. Reagan, Thatcher: Politische Verbündete. Dreigespann gegen Moskau.

### Ende der Sowjetunion (1991)
Gorbatschow 1989 im Vatikan. Religionsfreiheit in UdSSR. Papst: Beschleuniger des Endes. Historiker: Ohne Johannes Paul II. kein friedlicher Zusammenbruch.

### Vermächtnis
Befreiung Osteuropas. Demokratie. Keine Gewalt. Christentum als Freiheitskraft. Größte politische Leistung.

## Theologie und Lehre

### "Redemptor Hominis" (1979)
Erste Enzyklika. Christozentrismus. Mensch findet sich selbst nur in Christus. Würde jedes Menschen. Personalistisch.

### "Theologie des Leibes" (1979-1984)
Katechesen über menschliche Sexualität. Revolutionär für Katholizismus:
- Körper gut (gegen Leibfeindlichkeit)
- Eheliche Liebe als Abbild göttlicher Liebe
- Sexualität heilig
- Aber: Humanae Vitae bekräftigt (keine Verhütung)

### "Evangelium Vitae" (1995)
"Kultur des Lebens" gegen "Kultur des Todes". Gegen Abtreibung, Euthanasie, Todesstrafe. Konsistent pro-life. Kritik am Materialismus, Utilitarismus.

### Sozialenzykliken
"Laborem Exercens", "Sollicitudo Rei Socialis", "Centesimus Annus": Kritik an Kapitalismus UND Kommunismus. Würde der Arbeit. Option für Arme. Solidarität. Christliche Sozialethik aktualisiert.

## Ökumene und Interreligiöser Dialog

### Mit Juden
Revolutionär:
- Synagoge in Rom besucht (1986) - Papst erstmals!
- Israel-Besuch (2000): Yad Vashem, Klagemauer
- "Ältere Brüder im Glauben"
- Schoa als moralische Verpflichtung

### Mit Muslimen
- Koran küsst (symbolisch)
- Moschee in Damaskus besucht (2001)
- Aber: Kritik am radikalen Islam
- Dialog trotz Spannungen

### Mit Orthodoxen
- Konstantinopel, Athen besucht
- Versöhnungsgesten
- Aber: Große Einheit unerreicht

### Mit Protestanten
- Gemeinsame Erklärung zur Rechtfertigungslehre (Lutheraner, 1999)
- Canterbury besucht
- Aber: Weiheämter weiter Problem

### Assisi-Treffen (1986, 2002)
Weltreligionen zum Friedensgebet. Kontrovers. Konservative: Synkretismus. Johannes Paul: Zeichen des Friedens.

## Konservative Seite

### Sexualmoral
Keine Zugeständnisse:
- Keine Priesterinnenweihe (Ordinatio Sacerdotalis, 1994): "Definitiv"
- Zölibat unverrückbar
- Homosexualität: Liebe ja, Akte nein
- Verhütung weiter verboten
- Abtreibung: Absolutes Nein

Kritik: Realitätsfern, besonders in AIDS-Krise (Kondom-Verbot).

### Befreiungstheologie
Kritisch gegenüber lateinamerikanischer Befreiungstheologie. Marxismus-Nähe abgelehnt. Sanktionen gegen Theologen (Leonardo Boff). Konservative Bischöfe ernannt. Linke: Verrat an Armen.

### Disziplinierung
Theologen gemaßregelt: Hans Küng, Charles Curran. Kirche zentr

alisiert. Autoritär (trotz Charisma). Lehramt über Ortskirchen.

### Missbrauchsskandal
Unter seiner Herrschaft vertuscht. Maciel (Legionäre Christi): Geschützt trotz Missbrauch. Schwarzes Kapitel. Erst Benedikt XVI. handelt.

## Letzte Jahre und Tod (2001-2005)

### Parkinson
Ab 1990er sichtbar. Zittern, undeutliche Sprache, Bewegungsprobleme. Öffentlich. Nicht zurückgetreten. "Leiden als Zeugnis".

### Krankheit als Verkündigung
Letzte Jahre: Gebrechlich, leidend, aber weiter im Amt. Botschaft: Würde auch im Leiden. Alter ist wertvoll. Gegen Euthanasie.

### Tod (2. April 2005)
Karsamstag. Lange Agonie. Letzte Worte: "Amen." Millionen Trauernde in Rom. "Santo Subito!" (Sofort heilig!) gerufen.

### Beerdigung
Größte Zusammenkunft von Staatsoberhäuptern der Geschichte. 4 Könige, 5 Königinnen, 70 Präsidenten. 300.000 Menschen. Welt trauert.

### Seligsprechung (2011)
Benedikt XVI. spricht selig. Rekordverdächtig schnell. Johannes Paul-Generation drängt. Wunder: Nonne geheilt.

### Heiligsprechung (2014)
Papst Franziskus heiligt zusammen mit Johannes XXIII. (ohne zweites Wunder). "Heiliger Johannes Paul der Große".

## Persönlichkeit

### Charisma
Elektrisierende Präsenz. Massen begeistert. Schauspielerisches Talent. Medial genial. Erste "Medienpapst".

### Sportler und Outdoor-Mensch
Bis spät Ski gefahren. Wandern. Schwimmen. Pool im Vatikan installiert. Gesundheit als Wert.

### Intellektueller
Fünf Sprachen fließend. Philosoph. Poet (schrieb Gedichte bis ins Pontifikat). Belesen. Tiefe Theologie.

### Konservativ und Progressiv
Widersprüchlich:
- Sozial progressiv (Arme, Arbeiter, Frieden)
- Moralisch konservativ (Sex, Gender)
- Ökumenisch offen
- Disziplinär streng

## Berühmte Zitate

> "Fürchtet euch nicht!"

> "Öffnet die Türen für Christus!"

> "Sei, wer du bist, und werde, was du sein sollst."

> "Die Zukunft beginnt heute, nicht morgen."

> "Das Leben eines jeden Menschen ist heilig, vom Anfang bis zum Ende."

## Vermächtnis

Johannes Paul II. bleibt eine der prägendsten Figuren des 20. Jahrhunderts:

- **Politisch**: Fall des Kommunismus
- **Kirchlich**: Reisepapst, Weltjugendtage, Globalisierung der Kirche
- **Dialogisch**: Ökumene, interreligiöser Dialog
- **Moralisch**: Globale Autorität

**Aber auch:**
- Missbrauchsskandal nicht adressiert
- Sexualmoral starr
- Zentralisierung der Macht
- Befreiungstheologie gebremst

Sein Einfluss ist ambivalent. Für Millionen: Heiliger und Visionär. Für Kritiker: Reaktionär in sozialen Fragen.

Die Figur Johannes Paul II. zeigt: Auch Heilige sind Menschen. Größe und Versagen können koexistieren. Seine Rolle beim Fall des Kommunismus und seine moralische Autorität bleiben unbestritten. Seine Härte in moralischen Fragen und sein Versagen beim Missbrauchsskandal ebenso.

Er prägte das Papsttum neu: Reisend, medial, charismatisch. Franziskus ist anders, aber ohne Johannes Paul undenkbar.`,

	'rowling-jk': `# J.K. Rowling
*31. Juli 1965 - heute*

## Kurzbiografie

Joanne Kathleen Rowling ist eine britische Schriftstellerin, die mit der "Harry Potter"-Reihe das erfolgreichste Literaturphänomen der Gegenwart schuf. Aus ärmlichen Verhältnissen als alleinerziehende Mutter wurde sie zur ersten Milliardärin durch Schreiben. Die sieben Harry-Potter-Bücher (1997-2007) verkauften über 500 Millionen Exemplare und wurden zur prägenden Lese-Erfahrung einer Generation. Als Philanthropin spendet sie Hunderte Millionen. In jüngerer Zeit kontrovers wegen Äußerungen zu Transgender-Themen.

## Kindheit und Jugend (1965-1990)

### Yate, England
Geboren in Yate bei Bristol als Joanne Rowling. Vater Peter: Rolls-Royce-Ingenieur. Mutter Anne: Wissenschaftsassistentin. Schwester Dianne (Di), zwei Jahre jünger. Normale Mittelschichtfamilie.

### Frühe Schreiblust
Mit 6 Jahren erste Geschichte: "Rabbit". Schrieb ständig. Fantasiereich. Erzählte Schwester Geschichten. Wusste früh: Will Schriftstellerin werden.

### Wyedean Comprehensive
Sekundarschule. Schüchtern, Brillenträgerin (wie Harry). Gute Schülerin, besonders Englisch. Nicht populär. Außenseiter-Erfahrung (später in Hogwarts-Häusern).

### Mutter erkrankt (1980)
Anne Rowling Multiple Sklerose-Diagnose. Lange Krankheit, zunehmende Behinderung. Joanne 15 Jahre alt. Prägt Thema Tod in Harry Potter.

### Universität Exeter (1983-1987)
Studium Französisch und Klassische Philologie. Vater wollte Sekretärin. Joanne: Kompromiss (Sprachen = "nützlich"). Auslandsjahr in Paris. Abschluss: Nichts Besonderes. Unsicher über Zukunft.

## Die harten Jahre (1990-1997)

### Portugal (1991-1993)
Englischlehrerin in Porto. Partyleben. Treffen mit Jorge Arantes (TV-Journalist). Leidenschaftliche Beziehung. Heirat 1992. Tochter Jessica (1993). Ehe gewalttätig. Trennung und Scheidung. Joanne flieht mit Baby nach Schottland.

### Edinburgh - Am Boden
Alleinerziehende Mutter. Keine Arbeit. Sozialhilfe. Depression. Selbstmordgedanken. Winzige Wohnung. Arm. Gedemütigt. Aber: Baby und Schreiben halten am Leben.

### Harry Potter-Idee (1990)
Zugfahrt Manchester-London: Idee für Harry Potter kommt plötzlich. Junge, weiß nicht, dass er Zauberer ist. Hogwarts. Sofort klar, detailliert. Kein Stift dabei. Züge verspätet. Vier Stunden Gedanken entwickelt.

### Schreiben in Cafés
Nicolson's Café (Edinburgh). Baby Jessica schläft. Joanne schreibt. Stundenweise. Notizblock. Longhand. Kein Computer. Tasse Kaffee. Entwickelt Welt: 7 Bücher geplant von Anfang.

### Mutters Tod (1990)
Anne Rowling stirbt, bevor Harry Potter fertig. Joanne tief getroffen. Thema Tod in Büchern noch zentraler. Lily Potters Opfer = Annes Liebe. Spiegel Nerhegeb (zeigt Tote) = Sehnsucht.

### Lehrerdiplom (1996)
Ausbildung zur Französisch-Lehrerin. Perspektive. Aber: Buch endlich fertig (1995). "Harry Potter und der Stein der Weisen". Will Verlag finden.

## Der Durchbruch (1995-2000)

### 12 Ablehnungen
Manuskript eingeschickt. Ablehnung nach Ablehnung. "Zu lang für Kinder." "Nicht kommerziell." "Niemand kauft Fantasy." Frustration. Zweifel.

### Bloomsbury sagt Ja (1996)
Christopher Little (Agent) findet Bloomsbury. Kleiner Verlag. Barry Cunningham (Editor): "Alice (8) liebt es!" Vertrag. Vorschuss: £1,500 (lächerlich). Aber: Veröffentlichung!

### "J.K." statt "Joanne"
Verlag rät: Geschlechterneutral. Jungen lesen keine Autorinnen. Joanne fügt "K" (Kathleen, Großmutter) hinzu. "J.K. Rowling" geboren.

### 26. Juni 1997 - Veröffentlichung
"Harry Potter and the Philosopher's Stone". 500 Exemplare. Erste Auflage klein. Heute Sammlerstücke (Tausende £).

### Mundpropaganda-Erfolg
Kinder lieben es. Eltern lesen. Lehrer empfehlen. Mund-zu-Mund. Keine große Werbung. Organisch. Kinder bestehen auf Fortsetzung.

### Amerikaner interessiert
Scholastic (USA) kauft Rechte für $105,000 (Rekord für Kinderbuch). Titel geändert: "Sorcerer's Stone" (Amerikaner kennen Philosophenstein nicht). USA: Noch größerer Markt.

### Chamb

er of Secrets (1998)
Zweites Buch. Bestseller sofort. Erwartung riesig. Liefert. Dunkler. Basilisk. Tom Riddle. Fangemeinde wächst exponentiell.

### Prisoner of Azkaban (1999)
Drittes Buch. Komplexer. Zeitreise. Sirius Black. Reifer. Kritiker anerkennen: Nicht nur Kinderbuch. Erwachsene lesen offen.

### Goblet of Fire (2000)
Buch 4. 636 Seiten (doppelt so lang). Midnight-Release-Parties. Hysterie. Tri-Wizard-Turnier. Voldemorts Rückkehr. Cedrics Tod (erste Hauptfigur stirbt). Dunkler Ton. Kritischer Punkt: Von hier kein Zurück.

## Das Phänomen (2000-2007)

### Medienhype
J.K. Rowling überall. Interviews. Titelseiten. Reichste Frau Großbritanniens (überholt Queen). Vergleiche mit Dickens, Dahl. Kulturphänomen.

### Film-Adaptionen
Warner Brothers. Chris Columbus (Regie). Rowling: Kreativkontrolle. Casting-Approval. Britische Schauspieler. Treue zum Buch. Daniel Radcliffe, Emma Watson, Rupert Grint: Weltberühmt.

### Order of the Phoenix (2003)
Buch 5. 870 Seiten. Dunkelstes bisher. Harrys Teenager-Wut. Umbridges Tyrannei. Sirius' Tod. Prophezeiung. Große Erwartung. Liefert.

### Half-Blood Prince (2005)
Buch 6. Voldemorts Vergangenheit. Horkruxe. Snapes Verrat (?). Dumbledores Tod. Schock. Fans trauern.

### Deathly Hallows (2007)
Buch 7. Finale. Camping, Horkrux-Jagd, Schlacht um Hogwarts. Snapes Redemption. Epilog "19 Jahre später". Millionen lesen in 24 Stunden. Kulturelles Ereignis.

### Zahlen zum Phänomen
- 500+ Millionen Bücher verkauft
- 80 Sprachen übersetzt
- 8 Filme (Deathly Hallows geteilt), über $7 Milliarden eingespielt
- Themenparks (Universal Studios)
- Merchandise-Imperium

### Einfluss
- Ganze Generation las wieder
- "Harry Potter Generation"
- Mitternachts-Release-Parties als Kulturphänomen
- Fanfiction-Explosion
- Kinder-Literatur legitimiert

## Nach Harry Potter (2007-heute)

### "The Casual Vacancy" (2012)
Erwachsenen-Roman. Kleinstadtintrigen. Sozialkritik. Düster. Kritiken gemischt. Bestseller (Name), aber enttäuscht manche Fans.

### Robert Galbraith - Cormoran Strike (ab 2013)
Pseudonym. Krimis. "The Cuckoo's Calling" (2013) zunächst unbemerkt veröffentlicht. Gute Kritiken, schlechte Verkäufe. Leak: J.K. Rowling. Sofort Bestseller. Serie fortsetzt. Besser aufgenommen als "Vacancy".

### Fantastic Beasts (ab 2016)
Prequel-Filmserie zu Harry Potter. Rowling: Drehbücher. 1920er New York. Newt Scamander. Grindelwald. Fünf Filme geplant. Drei erschienen. Box Office OK, aber nicht Potter-Level. Qualität sinkt.

### Pottermore / Wizarding World
Website. Ergänzende Infos. Häuser-Sortierung. Neue Geschichten. Problematisch: Retcons (Dumbledore schwul, Hermione evtl. schwarz, etc.). Fans gespalten: Bereicherung oder Geldmacherei?

### Theaterstück "Cursed Child" (2016)
Harrys Sohn Albus. Zeitreise. Canon? Umstritten. Kommerziell erfolgreich. Literarisch: Gemischt.

## Philanthropie

### Spenden
Schätzungsweise £150+ Millionen gespendet. Verliert Milliardärs-Status dadurch (+ Steuern). Egal, will helfen.

### Gründungen
- **Lumos**: Hilft institutionalisierten Kindern (Waisen), zurück in Familien
- **Volant Charitable Trust**: Multiple Sklerose-Forschung, Armutsbekämpfung

### Single Parents, Multiple Sclerosis
Unterstützt Alleinerziehende (eigene Erfahrung). MS-Forschung (Mutter). Persönliche Themen.

## Die Transgender-Kontroverse (ab 2019)

### Anfänge
2019: Tweet zu Maya Forstater-Fall (Entlassung wegen Gender-Aussagen). Rowling: Solidarität. Kritik: Transfeindlich.

### Juni 2020 - Essay
Langes Statement zu Gender. Punkte:
- Biologisches Geschlecht real
- Frauen-Räume schützen
- Detransitionen erwähnen
- Sorge um Kinder und Transitionierung

### Reaktion
Massiver Backlash:
- "TERF" (Trans-Exclusionary Radical Feminist) genannt
- Boykott-Aufrufe
- Daniel Radcliffe, Emma Watson, Rupert Grint distanzieren sich
- Transgender-Aktivisten: "Schädlich, gefährlich"

### Rowlings Position
Behauptet: Nicht transfeindlich. Unterstützt Transrechte. Aber: Biologisches Geschlecht wichtig. Frauen-Räume schützen. Free Speech verteidigen.

### Konsequenzen
- Kulturkrieg-Ikone geworden (ungewollt?)
- Politisch gespalten: Konservative applaudieren, Progressive attackieren
- Vermächtnis kompliziert
- "Harry Potter" selbst bleibt geliebt (meist)

## Persönlichkeit

### Schüchtern vs. Öffentlich
Introvertiert. Interviews schwierig. Aber: Verteidigt sich scharf auf Twitter. Widerspruch.

### Detailversessen
Plante sieben Bücher von Anfang. Notizen, Timelines, Genealogien. Kontrollbedürfnis (kreativ).

### Selbstkritisch
Spricht offen über Depression, Suizidgedanken, Versagen. Keine Schönfärbung.

### Politisch
Labour-Wählerin. Soziale Gerechtigkeit. Aber: Transgender-Debatte macht politisch obdachlos.

## Berühmte Zitate

> "Es ist unsere Entscheidungen, die zeigen, wer wir wirklich sind, weit mehr als unsere Fähigkeiten."

> "Glück kann man auch in den dunkelsten Zeiten finden, wenn man sich nur daran erinnert, das Licht anzumachen."

> "Worte sind unsere unerschöpflichste Quelle der Magie."

> "Es braucht viel Mut, sich seinen Feinden zu stellen, aber genauso viel, sich seinen Freunden entgegenzustellen."

## Vermächtnis

J.K. Rowling bleibt die prägendste Kinderbuchautorin des 21. Jahrhunderts:

- **Harry Potter** - kulturelles Phänomen einer Generation
- **Vom Tellerwäscher zum Millionär** - moderne Märchengeschichte
- **Lesemotivation** - machte Lesen cool
- **Philanthropin** - gibt zurück

**Aber:**
- **Transgender-Kontroverse** - spaltet Fangemeinde
- **Post-Potter-Werke** - enttäuschen teils
- **Retcons** - Geldmacherei-Vorwurf

Ihre Geschichte ist shakespearean: Armut, Erfolg, Kontroverse. Ihr Werk wird bleiben. Ihre Person bleibt umstritten. Harry Potter selbst - größer als die Autorin, Botschaft von Toleranz, Freundschaft, Mut - überlebt die Kontroversen.

Rowlings größte Leistung: Sie brachte eine Generation zum Lesen. Hogwarts wurde zur zweiten Heimat für Millionen. Diese Magie ist unsterblich - egal, was auf Twitter passiert.`,

	'adler-alfred': `# Alfred Adler
*7. Februar 1870 - 28. Mai 1937*

## Kurzbiografie

Alfred Adler war ein österreichischer Arzt und Psychotherapeut, der als Begründer der Individualpsychologie die Tiefenpsychologie nachhaltig prägte. Zunächst Mitarbeiter Sigmund Freuds, brach er 1911 mit diesem und entwickelte eine eigene Richtung, die den Menschen als soziales Wesen und das Streben nach Überlegenheit (nicht Sexualität) als zentral ansah. Konzepte wie Minderwertigkeitskomplex, Kompensation, Lebensstil und Gemeinschaftsgefühl stammen von ihm. Als sozialer Reformer verband er Psychologie mit Pädagogik und Sozialarbeit.

## Kindheit in Wien (1870-1888)

### Rudolfsheim, Vorstadt Wien
Geboren als zweites von sieben Kindern. Vater Leopold Adler: jüdischer Getreidehändler. Mutter Pauline. Mittelständische, assimilierte jüdische Familie. Nicht religiös.

### Rachitis und Krankheit
Frühkindliche Rachitis (Vitamin-D-Mangel). Schwächlich. Oft krank. Neid auf gesunden älteren Bruder Sigmund. Unfälle: Mit 3 Jahren fast überfahren. Mit 5 Jahren Lungenentzündung, fast gestorben. Arzt: "Nicht zu retten." Überlebte. Entschied: Werde Arzt.

**Prägend:** Erfahrung von Schwäche, Minderwertigkeit, Krankheit. Später Theorie: Organminderwertigkeit als Kompensationsantrieb.

### Schulzeit
Anfangs schlechter Schüler (Mathematik). Lehrer: "Besser Schuster werden." Vater glaubt an ihn. Alfred arbeitet hart. Wird Klassenbester. **Kompensation in Aktion.**

### Brüderliche Rivalität
Bruder Sigmund stirbt früh. Alfred: Schuldgefühle? Überlebensschuld? Später Theorie: Geschwisterkonstellation prägt Persönlichkeit. Zweitgeborener kompensiert.

## Medizinstudium und frühe Karriere (1888-1902)

### Universität Wien
Studiert Medizin. Interessiert an allem: Soziale Medizin, Ophthalmologie (Augen), später Neurologie und Psychiatrie. Politisch aktiv: Sozialistisch orientiert. Volksbildung wichtig.

### Promotion (1895)
Dr. med. Zunächst Allgemeinmediziner. Praxis in ärmlichem Prater-Viertel. Zirkusartisten, Akrobaten als Patienten. Beobachtung: Körperliche Defizite führen zu Höchstleistungen. Kompensation!

### Heirat (1897)
Raissa Timofejewna Epstein. Russische Intellektuelle, Sozialistin, Feministin. Vier Kinder. Gleichberechtigte Ehe (für die Zeit radikal). Raissa: Lebenslange Unterstützerin.

### "Gesundheitsbuch für das Schneidergewerbe" (1898)
Erste Publikation. Arbeitsmedizin. Soziale Ursachen von Krankheit. Schneider: Schlechte Arbeitsbedingungen = Krankheit. Prävention durch soziale Reform. **Früher Sozialreformer.**

### Wechsel zur Psychiatrie
Um 1900: Von Allgemeinmedizin zu Neurologie und Psychiatrie. Liest Freud. Fasziniert. Verteidigt "Traumdeutung" öffentlich (1902). Freud bemerkt. Einladung zur "Mittwochsgesellschaft" (später: Wiener Psychoanalytische Gesellschaft).

## Freud-Jahre (1902-1911)

### Mittwochsgesellschaft
Freud, Adler, Stekel, später Jung. Diskussionen. Adler: Kritisch, eigenständig. Nicht Schüler, sondern Kollege (aus Adlers Sicht).

### "Studie über Minderwertigkeit von Organen" (1907)
Hauptwerk der Frühphase. These: Organ-Minderwertigkeit (schwache Lunge, schlechtes Sehen) treibt zu Kompensation. Überkompensation möglich. Demosthenes (Stotterer wurde Redner) als Beispiel.

**Konflikt mit Freud:** Adler sieht biologische Basis, nicht Sexualität als primär. Freud misstrauisch.

### Aggression und Macht
Adler: Aggressionstrieb wichtiger als Libido. Wille zur Macht (Nietzsche-Einfluss). Maskuliner Protest (gegen Weiblichkeit).

Freud: Ablehnung. Nur Libido ist Trieb.

### Präsident der Wiener Gesellschaft (1910)
Adler wird Präsident (Freud bleibt Ehrenpräsident). Spannung wächst. Adler: Eigenständige Theorie. Freud: Häresie.

### Der Bruch (1911)
Offener Konflikt. Adler kritisiert Pansexualismus. Freud: Adler versteht Psychoanalyse nicht. Ultimatum. Adler tritt zurück als Präsident und aus Gesellschaft aus. Neun weitere folgen. Endgültige Trennung.

**Freud (bitter):** "Der kleine Adler." Neid auf Größe?

**Adler:** Befreiung. Eigene Richtung.

## Individualpsychologie (1911-1937)

### Gründung
1911: "Verein für freie psychoanalytische Forschung" (später: Individualpsychologie). Name: Individuum als unteilbare Ganzheit (nicht Individuell vs. Gesellschaft).

### Kernbegriffe

**Minderwertigkeitsgefühl:**
- Jeder Mensch fühlt sich minderwertig (Kind vs. Erwachsene, Schwäche vs. Ideal)
- Treibt zur Kompensation
- Gesund: Echte Leistung
- Pathologisch: Minderwertigkeitskomplex (gelähmt) oder Überlegenheitskomplex (überkompensiert, aber hohl)

**Streben nach Überlegenheit / Geltung:**
- Nicht Sex, sondern Macht/Anerkennung zentral
- Von unten nach oben
- "Aufwärtsbewegung"

**Lebensstil:**
- Früh (4-5 Jahre) geformt
- Einheitlicher Plan des Lebens
- Roter Faden der Persönlichkeit
- Therapie: Verstehen und ändern des Lebensstils

**Gemeinschaftsgefühl (Sozialinteresse):**
- Wichtigster Begriff! (später Fokus)
- Psychische Gesundheit = starkes Gemeinschaftsgefühl
- Neurose = schwaches Gemeinschaftsgefühl
- Erziehung muss Gemeinschaftsgefühl fördern

**Geschwisterkonstellation:**
- Geburtsreihenfolge prägt
- Erstgeborener: Entthront, konservativ, verantwortlich
- Zweitgeborener: Wetteifer, ehrgeizig
- Nesthäkchen: verwöhnt oder motiviert
- Einzelkind: Zentrum, evtl. egozentrisch

**Fiktionale Finalität:**
- Mensch lebt nach fiktiven Zielen ("Als-ob")
- "So, als wäre ich großartig..."
- Ziel leitet Verhalten, auch wenn unrealistisch

### Therapie
Kürzer als Freudsche Psychoanalyse. Face-to-face (nicht Couch). Ermutigung zentral. Lebensstil analysieren. Gemeinschaftsgefühl stärken. Praktischer, weniger mystisch als Freud.

## Erziehung und Sozialreform (1920er)

### Wiener Erziehungsberatungsstellen (1920er)
Adler revolutionär: Kostenlose Erziehungsberatung in Wiener Schulen. Über 30 Stellen. Eltern, Lehrer, Kinder beraten. Präventiv. Gemeinschaftsgefühl fördern.

**Prinzipien:**
- Ermutigung statt Strafe
- Natürliche Folgen statt Autorität
- Gleichwertigkeit Kind-Erwachsener (nicht gleich, aber gleichwertig)
- Demokratische Erziehung

Beeinflusst: Rudolf Dreikurs, Thomas Gordon, moderne Pädagogik.

### Volksbildung
Vorträge für Laien. Psychologie für alle. Nicht Elfenbeinturm. Verständliche Sprache. Soziale Mission.

### Sozialismus
Zeit seines Lebens sozialistisch. Psychologie muss soziale Verhältnisse ändern. Kritik am Kapitalismus als Konkurrenzgesellschaft, schädigt Gemeinschaftsgefühl. Rot Wien (1919-1934): Adler aktiv beteiligt.

## Emigration und Tod (1926-1937)

### USA-Reisen (ab 1926)
Vortragsreisen. Enthusiastisch aufgenommen. Praktischer als Freud, optimistischer als Jung. Amerikaner lieben Adler.

### Columbia University (1932)
Gastprofessor, später visiting professor. Long Island College of Medicine: Position. Pendelt zwischen Wien und New York.

### Austrofaschismus und Nazis
1934: Dollfuß-Diktatur in Österreich. Adlers Kliniken geschlossen (sozialistische Verbindungen). 1934: Endgültige Emigration nach USA.

Antisemitismus wächst. Obwohl konvertiert (Protestant geworden, pragmatisch), Gefahr wegen jüdischer Herkunft.

### Vortragsreise in Schottland (1937)
Mai 1937: Vorträge in Schottland. Herzinfarkt auf Straße in Aberdeen. Sofort tot. 67 Jahre alt. Beerdigung in Edinburgh.

### Vermächtnis gespalten
Zu Lebzeiten: Berühmter als Freud in USA. Nach Tod: Freud dominiert. Adler: Lange unterschätzt. Renaissance ab 1960ern.

## Vergleich mit Freud und Jung

### Freud
- **Sex vs. Macht**: Libido vs. Streben nach Überlegenheit
- **Trieb vs. Ziel**: Vergangenheit (Triebe) vs. Zukunft (Ziele)
- **Pessimismus vs. Optimismus**: Determinist vs. Möglichkeit zur Änderung
- **Individuum vs. Gesellschaft**: Intrapsychisch vs. interpersonal

### Jung
- **Mystisch vs. Pragmatisch**: Archetypen vs. Soziale Realität
- **Spirituell vs. Materialistisch**: Kollektives Unbewusstes vs. Soziale Bedingungen
- Beide: Bruch mit Freud. Aber ganz unterschiedliche Richtungen.

## Einfluss und Wirkung

### Psychotherapie
- **Kognitive Therapie**: Ellis, Beck (Gedanken ändern Gefühle) = adlerianisch
- **Humanistische Psychologie**: Maslow, Rogers (Selbstverwirklichung, Optimismus)
- **Systemische Therapie**: Familie als System

### Pädagogik
- **Dreikurs**: "Children: The Challenge"
- **Positive Discipline**: Jane Nelsen
- **Gordon**: "Familienkonferenz"
- Demokratische, ermutigende Erziehung

### Selbsthilfe
- **"Think positive"**: Adlerianische Ermutigung
- **Growth Mindset** (Carol Dweck): Adlers Optimismus
- **Resilienz**: Kompensation von Minderwertigkeitsgefühlen

### Sozialarbeit
Gemeinschaftsgefühl als Ziel. Soziale Faktoren zentral. Prävention wichtig.

## Berühmte Konzepte

> "Das einzige, was wir in diesem Leben wirklich besitzen, sind die Beziehungen zu unseren Mitmenschen."

> "Ein Mensch zu sein bedeutet, ein Gefühl der Minderwertigkeit zu haben, das einen ständig zur Überlegenheit treibt."

> "Es ist leicht, Kinder zu kritisieren, aber schwer, sie zu ermutigen."

> "Das wichtigste im Leben ist, zu lernen, zu geben und zu teilen."

## Vermächtnis

Alfred Adler bleibt der unterschätzte dritte Gigant der Tiefenpsychologie:

- **Soziale Perspektive**: Mensch als soziales Wesen
- **Optimismus**: Änderung möglich
- **Pädagogik**: Ermutigende Erziehung
- **Gemeinschaftsgefühl**: Psychische Gesundheit = soziales Interesse

Sein Schatten: Freud überstrahlt. Jung faszinierender. Adler: Zu praktisch? Zu optimistisch? Zu einfach?

Aber: Sein Einfluss ist riesig - oft unerkannt. Kognitive Therapie, humanistische Psychologie, moderne Pädagogik: Alle adlerianisch beeinflusst. "Minderwertigkeitskomplex" ist Alltagswort.

Adlers Vision: Psychologie im Dienst der Menschlichkeit. Heilung durch Gemeinschaft. Erziehung zur Demokratie. In zerrissener Zeit aktueller denn je.`,

	'kästner-erich': `# Erich Kästner
*23. Februar 1899 - 29. Juli 1974*

## Kurzbiografie

Erich Kästner war ein deutscher Schriftsteller, Drehbuchautor und Kabarettist, berühmt für seine Kinderbücher wie "Emil und die Detektive" und "Das doppelte Lottchen". Als scharfzüngiger Satiriker und Moralist der Weimarer Republik kritisierte er Militarismus und Nationalsozialismus, überlebte aber das Dritte Reich in Deutschland. Seine klare, sachliche Prosa und sein humanistischer Optimismus prägten Generationen. Trotz Publikations- und Schreibverbot blieb er in Deutschland - ein innerer Emigrant, der nach 1945 zur moralischen Instanz wurde.

## Kindheit in Dresden (1899-1919)

### Neustadt, Dresden
Geboren in Dresden als einziger Sohn von Emil Kästner (Sattlermeister) und Ida Kästner (geb. Augustin). Mutter: Friseurin, stark, dominant. Vater: zurückhaltend, sanft. Kästner zeit seines Lebens Muttersohn.

### Intime Mutter-Sohn-Bindung
Ida verehrte Erich, nannte ihn "mein Junge". Extrem enge Bindung. Korrespondierten täglich bis zu ihrem Tod (1951). Heute: Grenzüberschreitend? Damals: Intensiv, aber nicht unüblich. Prägte Frauenbild.

### Vater-Frage
Gerücht (später bestätigt): Biologischer Vater war Dr. Emil Zimmermann, Ida's Arbeitgeber (jüdischer Arzt). Erich wusste es wohl. Heimlichkeit. Erklärte Väter Verhältnis? Nichtehelicher Sohn, aber in Ehe großgezogen.

### Schulzeit
König-Georg-Gymnasium, Dresden. Guter Schüler, besonders Deutsch. Schrieb früh Gedichte. Klassenbester. Aber: Leidenschaftslos. Pflichterfüllung.

### Erster Weltkrieg - Lehrer
Lehrerausbildung (Notausbildung wegen Krieg). Mit 18 Jahren Volksschullehrer. Kurze Zeit. Einberufung folgte.

### Militärdienst (1917-1918)
Schwere Artillerie. Ausbildung brutal. Herzkrankheit (dauerhaft) durch Drill. Schikane durch Vorgesetzte. Hass auf Militarismus entsteht. **Prägend für Pazifismus.**

Nie Fronteinsatz (Kriegsende). Aber: Trauma des Drills bleibt. "Fabian" später: Antimilitarismus.

## Studium und Weimarer Republik (1919-1933)

### Leipzig, Rostock, Berlin
Studium: Germanistik, Geschichte, Philosophie, Theaterwissenschaft. Promotion 1925 (Leipzig) über Friedrich den Großen und Literatur. Dr. phil.

### Freier Schriftsteller
Entscheidet gegen Akademikerkarriere. Will Schriftsteller werden. Gedichte. Feuilletons. Kabarett-Texte. Freier Journalist. Prekär, aber künstlerisch.

### "Die Weltbühne" und "Neue Leipziger Zeitung"
Publiziert in linksintellektuellen Zeitschriften. Satirische Gedichte. Sozialkritik. Antimilitarismus. Scharfe Zunge. "Herz auf Taille" (1928): Gedichtband. Erfolg.

### Berlin (ab 1927)
Umzug nach Berlin. Zentrum der Weimarer Kultur. Kabarett "Die Katakombe". Kontakte: Kurt Tucholsky, Carl von Ossietzky. Linksliberale Intellektuelle. Gegen Nazis, gegen Militarismus, gegen Spießer.

### "Fabian" (1931)
Großstadtroman. Jakob Fabian: Anti-Held, Moralist, Pessimist. Sittengemälde der untergehenden Weimarer Republik. Erotik, Zynismus, Kapitalismuskritik. Skandal wegen Sex-Szenen. Kritik: Zu moralisierend. Heute: Zeitdokument.

### "Emil und die Detektive" (1929)
Durchbruch als Kinderbuchautor. Emil Tischbein verfolgt Dieb durch Berlin. Kinderbande. Realistische Großstadt. Detektiv-Geschichte. Sofort Klassiker. Verfilmt (1931). Welterfolg. Übersetzungen in 59 Sprachen.

**Besonderheit:** Respektiert Kinder. Nicht verniedlicht. Intelligente, aktive Kinder. Moderne Pädagogik.

## NS-Zeit - Innere Emigration (1933-1945)

### Bücherverbrennung (10. Mai 1933)
Kästner erlebt eigene Bücherverbrennung. Opernplatz Berlin. Steht in Menge. Sieht Bücher brennen. Gestapo erkennt ihn (angeblich). Geht nicht weg. **Zeuge der eigenen Verdammung.**

### Publikationsverbot
Bücher verboten. Nicht verhaftet (warum? Unklar. Evtl. Devisenbringer durch internationale Kinderbucher?). Darf nicht publizieren unter eigenem Namen.

### Warum blieb er?
Große Frage. Tucholsky, Ossietzky, Mann: Exil oder Tod. Kästner: Blieb.

**Seine Begründung:** "Ich bin ein Deutscher aus Dresden in Sachsen. Mich läßt meine Mutter nicht fort." Auch: Chronist bleiben. Zeuge sein. Aber: Kritik an Feigheit, Opportunismus.

### Pseudonyme und Drehbücher
Schrieb Drehbücher unter Pseudonymen. "Münchhausen" (1943, Hans Albers): Erfolgreichster deutscher Film der NS-Zeit. Kästner: Berthold Bürger (Pseudonym). Geld verdient im Dritten Reich. **Kompromiss oder Verrat?**

### Kriegsende in Tirol
Mai 1945: Mit Filmteam in Mayrhofen (Tirol). Kriegsende. Befreiung. Notizen für "Das doppelte Lottchen" (Idee entsteht).

## Nachkriegszeit (1945-1974)

### München
Lebt in München (nicht Ostberlin). Feuilleton-Chef "Neue Zeitung" (amerikanische Lizenz). Kabarett "Die Schaubude" (später "Kleine Freiheit") - Mitbegründer. Mahner und Kritiker.

### Kinderbücher der Nachkriegszeit
- **"Das doppelte Lottchen"** (1949): Getrennte Zwillinge. Scheidung. Wiederverei

nigung. Warmherzig. Klassiker.
- **"Die Konferenz der Tiere"** (1949): Tiere zwingen Menschen zum Frieden. Pazifistisch. Idealistische Utopie.
- **"Das fliegende Klassenzimmer"** (1933, Neuauflage): Internatsjungs. Freundschaft. Lehrer-Schüler-Vertrauen.

### "Als ich ein kleiner Junge war" (1957)
Autobiographie der Kindheit. Dresden um 1900. Mutter-Beziehung. Wehmütig. Nostalgisch. Ehrlich.

### Büchner-Preis (1957)
Höchste deutsche Literatur-Auszeichnung. Anerkennung. Aber: Kritik, dass Kinderbuchautor ausgezeichnet wurde. Kästner: "Auch Kinder sind Menschen."

### Kritik am Wirtschaftswunder
1950er/60er: Deutschland vergisst Vergangenheit. Materialismus. Kästner kritisiert: Verdrängung, Wohlstandsbesessenheit, fehlende Aufarbeitung. Aber: Gehör findet er kaum. Zeitgeist gegen ihn.

### Impotenz und Alkohol
Persönlich: Vereinsamt. Mehrere Affären, keine dauerhafte Beziehung. Spät (1957) Sohn Thomas (mit Friedel Siebert, nicht geheiratet). Trinkt zunehmend. Depression?

### Letzte Jahre
Gesundheitlich angeschlagen. Schreibt weniger. Wiederholungen. Ruhm lebt von Vergangenheit. 1960er/70er: Neue Generation findet Kästner altmodisch.

### Tod (29. Juli 1974)
München. Speiseröhrenkrebs (Rauchen). 75 Jahre alt. Beerdigung: Viele kommen. Deutschland trauert. Kinderautor, Moralist, Zeitzeuge.

## Literarischer Stil

### Neue Sachlichkeit
Klare, einfache Sprache. Keine Metaphern-Überfülle. Sachlich, aber nicht emotionslos. Anti-Expressionismus. Reportage-Stil. **Verständlich für Kinder und Erwachsene.**

### Moralischer Ton
Immer Moral. Gut vs. Böse klar. Optimismus trotz Kritik. Glaubt an Vernunft, Anstand, Güte. Lehrer-Ton? Ja. Aber auch: Herzenswärme.

### Humor und Satire
Erwachsenenbücher: Scharf satirisch. Kinderb ücher: Warmherziger Humor. Nie zynisch gegenüber Kindern.

### Pessimismus des Verstandes, Optimismus des Herzens
Weiß: Welt schlecht. Menschen schwach. Aber: Kämpft weiter. Hoffnung auf Vernunft. Trotz allem.

## Politische Haltung

### Pazifismus
Absolut. Militarismus = Wurzel des Übels. "Kennst du das Land, wo die Kanonen blühn?" (Gedicht). Antimilitaristisch.

### Antifaschismus
Gegen Nazis von Anfang. Bücher verbrannt. Aber: Blieb in Deutschland. Innere Emigration = mutig oder feige? Debatte bis heute.

### Humanismus
Glaube an Güte, Vernunft, Anstand. Aufklärung. Bildung. Einfache menschliche Tugenden. Nicht ideologisch, sondern menschlich.

### Unpolitisch?
Kritik: Zu vage. Keine klare politische Theorie. Moralisiert statt analysiert. Verteidigung: Moral IST Politik.

## Verhältnis zu Frauen und Mutter

### Mutter Ida
Zentral. Tägliche Briefe. "Mein Junge." Über-Mutter? Heute: Problematisch. Kästner selbst reflektierte nicht kritisch.

### Frauen
Mehrere Beziehungen. Keine lange Ehe. Oft jüngere Frauen. Ilse Julius, Luiselotte Enderle, Friedel Siebert (Mutter seines Sohns). Keine erfüllte Partnerschaft? Oder Beziehungsunfähigkeit?

### Frauenbild
Fortschrittlich für Zeit (Frauen als stark, intelligent). Aber: Mutterfixiert. Idealisierung.

## Berühmte Zitate und Gedichte

> "Es gibt nichts Gutes, außer: Man tut es."

> "Wer noch nie einen Fehler gemacht hat, hat sich noch nie um etwas bemüht."

> "Das Gewissen ist fähig, Unrecht für Recht zu halten. Inquisition für Gott. Und Mord für Politik."

**"Sachliche Romanze" (Gedicht):**
> "Als sie einander acht Jahre kannten / (und man darf sagen: sie kannten sich gut), / kam ihre Liebe plötzlich abhanden. / Wie andern Leuten ein Stock oder Hut."

Melancholisch. Neue Sachlichkeit in Lyrik.

## Vermächtnis

Erich Kästner bleibt der moralische Kinderbuchautor und Satiriker Deutschlands:

- **Kinderbücher**: "Emil", "Lottchen", "Fliegendes Klassenzimmer" - Generationen geprägt
- **Neue Sachlichkeit**: Klare, verständliche Literatur
- **Moralist**: Pazifismus, Humanismus, Anstand
- **Innerer Emigrant**: Überlebte NS-Zeit in Deutschland - kontrovers

**Kritik:**
- Zu moralisierend?
- NS-Zeit: Mut oder Feigheit?
- Nachkriegszeit: Zu pessimistisch, zu rückwärtsgewandt?

Seine Größe: Respekt vor Kindern, klare Sprache, moralischer Kompass. Seine Ambivalenz: NS-Zeit, Alkohol, Vereinsamung.

Kästners Werke leben. "Emil" wird gelesen. "Doppelte Lottchen" verfilmt. Seine Gedichte zitiert. Sein moralischer Appell: Tut das Gute. Bleibt anständig. Zeitlos - in bösen Zeiten besonders wichtig.`,
};

async function main() {
	console.log('📝 Batch 4: Johannes Paul II, Rowling, Adler, Kästner\n');

	const authorsDE = loadAuthors('de');
	const authorsEN = loadAuthors('en');

	let updated = 0;

	const updatedDE = authorsDE.map((author) => {
		if (batch4Bios[author.id]) {
			console.log(`✅ ${author.name} (${author.id})`);
			updated++;
			return {
				...author,
				biography: {
					...author.biography,
					long: batch4Bios[author.id],
				},
			};
		}
		return author;
	});

	const updatedEN = authorsEN.map((author) => {
		const deAuthor = updatedDE.find((a) => a.id === author.id);
		if (deAuthor?.biography?.long && batch4Bios[author.id]) {
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

	console.log('\n✨ Batch 4 fertig!\n');
}

main();
