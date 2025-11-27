#!/usr/bin/env tsx
/**
 * Batch 3: Bruce Lee, Charlie Chaplin, David Ben-Gurion, Jean-Jacques Rousseau
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

const batch3Bios: Record<string, string> = {
	'lee-bruce': `# Bruce Lee
*27. November 1940 - 20. Juli 1973*

## Kurzbiografie

Bruce Lee war ein chinesisch-amerikanischer Kampfkünstler, Schauspieler, Filmregisseur und Philosoph, der die Kampfkunst revolutionierte und zum globalen Kultstar wurde. Als Begründer des Jeet Kune Do verband er östliche Kampfkunst mit westlicher Effizienz und eigener Philosophie. Seine Filme machten asiatische Kampfkunst weltweit populär und durchbrachen rassistische Barrieren Hollywoods. Trotz seines frühen Todes mit 32 Jahren bleibt sein Einfluss auf Kampfkunst, Film und Popkultur ungebrochen.

## Kindheit zwischen Ost und West (1940-1959)

### Geburt in San Francisco
Geboren als Lee Jun-fan (李振藩) in San Francisco während Tournee seines Vaters Lee Hoi-chuen, kantonesischer Opern-Star. Amerikanische Staatsbürgerschaft. Chinesischer Name bedeutet "Rückkehr wieder" - Hoffnung auf Rückkehr nach Amerika.

### Hongkong-Jahre
Familie kehrt nach Hongkong zurück (1941). Aufwachsen in Kowloon. Wohlhabende Familie, aber turbulente Zeiten. Japanische Besatzung (1941-1945) überstanden. Straßenkämpfe in der Jugend.

### Kinderstar
Ab 5 Jahren in kantonesischen Filmen. Über 20 Kinderfilme bis 18. Rolle in "The Kid" (1950) machte bekannt. Bezauberndes Kind, später rebellischer Teenager.

### Wing Chun bei Yip Man
Mit 13 Jahren beginnt Training bei Meister Yip Man (Ip Man). Wing Chun-Kung Fu. Zunächst als Straßenkampf-Training. Entwickelt Leidenschaft. Trainiert obsessiv. Yip Man erkennt Talent.

### Straßenkämpfe
Teenager-Banden in Hongkong. Bruce oft in Schlägereien. Eltern besorgt. Polizeiliche Probleme drohen. Entscheidung: Bruce muss weg nach Amerika.

## Amerika: Von Seattle nach Hollywood (1959-1971)

### Neuanfang in Seattle (1959)
Mit 18 nach San Francisco, dann Seattle. Bei Freunden der Familie. Arbeitet als Kellner. Beendet Highschool. Studiert Philosophie an University of Washington.

### Kampfkunstschule in Seattle
Beginnt Wing Chun zu unterrichten. Jun Fan Gung Fu Institute eröffnet. Unorthodox: Unterrichtet auch Nicht-Chinesen (tabu). Entwickelt eigene Methoden.

### Linda Emery
Trifft Linda, weiße Studentin, in seiner Kampfkunstklasse. Liebe gegen Konventionen. Heirat 1964. Tochter Shannon (1969), Sohn Brandon (1965). Linda wird lebenslange Partnerin.

### Oakland und das zweite Dojo (1964)
Umzug nach Oakland. Zweite Schule. Kontroverse mit traditioneller chinesischer Kampfkunst-Gemeinde. Herausforderungskampf gegen Wong Jack Man (umstrittener Ausgang). Bruce gewinnt, aber unzufrieden mit eigener Performance. Beginn der JKD-Entwicklung.

### Long Beach International Karate Championships (1964)
Demonstration revolutioniert amerikanische Kampfkunst-Szene. One-Inch-Punch (Ein-Zoll-Schlag) begeistert Publikum. Two-Finger-Pushups. Produzent Jay Sebring entdeckt ihn. Weg nach Hollywood beginnt.

### Kato in "The Green Hornet" (1966-1967)
TV-Serie, Bruce spielt Sidekick Kato. Serie floppt nach einer Staffel. Aber: Bruce wird "Kato" für Amerika. Kann nicht von Typcasting wegkommen. Hollywood bietet nur stereotype Rollen.

### Privatlehrer der Stars
Unterrichtet Hollywood-Prominenz: Steve McQueen, James Coburn, Kareem Abdul-Jabbar, Roman Polanski. Verdient gut. Frustriert von fehlenden Hauptrollen. Rassismus Hollywoods: Asiate nicht als Held vorstellbar.

### "Kung Fu" - Die gestohlene Rolle
Entwickelt Konzept für Serie über Shaolin-Mönch im Wilden Westen. Warner Brothers interessiert. Bruce soll Star sein. Stattdessen: David Carradine (weiß) bekommt Rolle. Bruce tief verletzt. Entscheidet: Zurück nach Hongkong.

## Hongkong: Der Durchbruch (1971-1973)

### "The Big Boss" (Fist of Fury, 1971)
Rückkehr nach Hongkong. Low-Budget-Film mit Golden Harvest. Sensation! Bricht alle Kassenrekorde. Bruce Lee über Nacht Megastar in Asien.

### "Fist of Fury" (1972)
Zweiter Film. Noch größerer Erfolg. Chinesischer Nationalist gegen japanische Unterdrücker. Politisch aufgeladen. Hongkong-Kinos überfüllt. Hysterie.

### "Way of the Dragon" (1972)
Bruce schreibt, regie

rt, choreographiert, und spielt Hauptrolle. Erste komplett selbst kontrollierte Produktion. Kolosseum-Kampf gegen Chuck Norris (Höhepunkt). Noch ein Rekordbrecher.

### Rückkehr nach Hollywood als Star
Warner Brothers bemerkt Erfolg. Hollywood will Bruce jetzt. "Enter the Dragon" (1973) - erste Hollywood-Hongkong-Koproduktion. Großes Budget. Internationaler Release.

### "Enter the Dragon" (1973)
Fertiggestellt Monate vor Tod. Veröffentlicht nach Tod (August 1973). Weltweit Kassenerfolg. Macht Kampfkunst-Filme global. Bruce posthumer Superstar. Film-Klassiker.

## Jeet Kune Do - Die Philosophie

### "Der Weg der abfangenden Faust"
Entwickelt ab Mitte 1960er. Jeet Kune Do (JKD): "Intercepting Fist Way". Keine feste Stilform. Prinzip: "Using no way as way, having no limitation as limitation."

### Grundprinzipien
- **Einfachheit**: Direkte, effiziente Bewegungen
- **Direktheit**: Kürzester Weg zum Ziel
- **Persönlicher Ausdruck**: Jeder entwickelt eigenen Stil
- **Wissenschaftlich**: Basiert auf Biomechanik, nicht Tradition
- **"Absorb what is useful"**: Nimm, was funktioniert, aus allen Stilen

### Ablehnung der Tradition
Kritik an klassischen Kampfkünsten:
- Zu ritualisiert
- Unrealistisch im echten Kampf
- Formgebunden
- "Classical mess"

### Philosophischer Einfluss
- Taoismus (Wasser-Prinzip)
- Zen-Buddhismus
- Krishnamurti (Freiheit von Konditionierung)
- Westliche Philosophie (Studium)

### "Be Water, My Friend"
Berühmteste Metapher:
> "Be like water. Water can flow or it can crash. Be water, my friend."

Anpassungsfähigkeit als höchste Tugend.

## Der Philosoph-Krieger

### Studium und Lektüre
Philosophie-Student an UW. Begeisterung für:
- Jiddu Krishnamurti (größter Einfluss)
- Alan Watts (Zen)
- Lao Tzu (Taoismus)
- Spinoza
- Hegel (Dialektik)

### Eigene Notizen
Tausende Seiten Notizen. Mixing von Kampfkunst und Philosophie. Skizzen, Diagramme, Zitate, Reflexionen. Nach Tod als Bücher veröffentlicht ("Tao of Jeet Kune Do", "Striking Thoughts").

### Zen und Kampfkunst
No-Mind (Mushin): Handeln ohne Denken. Spontaneität. Unmittelbarkeit. Kampf als Meditation.

### Selbstverwirklichung
"Honestly expressing yourself" zentral. Authentizität wichtiger als Technik. Kampfkunst als Weg zur Selbsterkenntnis.

## Training und Körper

### Obsessives Training
Trainierte 7 Tage/Woche, mehrere Stunden täglich:
- Kung Fu (Technik)
- Gewichtheben (Kraft)
- Cardio (Ausdauer)
- Flexibilität (Stretching)
- Ernährung (Protein-Shakes, Supplemente)

### Körperliche Perfektion
- 141 Pfund (64 kg) bei 5'7" (1,70m)
- Körperfett: ~5-7%
- Unglaubliche Definition
- Geschwindigkeit: Schläge zu schnell für normale Film-Kameras
- One-Inch-Punch: 300+ Pfund Kraft

### Verletzung (1970)
Rückenverletzung durch Übertraining (Good Morning Exercise ohne Aufwärmen). Ärzte: "Nie wieder Kampfkunst." Bruce ignoriert. Monatelange Schmerzen. Trainiert sich zurück. Noch intensiver danach.

### Nahrungsergänzung
Pionier in Sport-Ernährung:
- Protein-Shakes
- Vitamine
- Ginseng
- Experimente mit allem (auch Problematisches)

## Der mysteriöse Tod (20. Juli 1973)

### Letzte Wochen
Arbeitet an "Game of Death" (unvollendet). Meetings für neue Projekte. Auf Höhepunkt der Karriere. Gesundheitliche Probleme (Kopfschmerzen, Kollaps am Set Wochen zuvor).

### Der Tag
20. Juli 1973, Hongkong. Meeting mit Produzent Raymond Chow. Dann zu Betty Ting Pei (Schauspielerin, Geliebte?) Apartment. Kopfschmerzen. Nimmt Equagesic (Schmerzmittel). Legt sich hin.

### Tod
Wacht nicht auf. Notarzt gerufen. Krankenhaus: "Dead on Arrival." 32 Jahre alt.

### Offizielle Todesursache
"Tod durch Misadventure": Allergische Reaktion auf Equagesic (enthält Aspirin und Muskelrelaxans). Gehirn-Ödem. Kontroverser Autopsiebericht.

### Verschwörungstheorien
Bis heute:
- Fluch (Sohn Brandon starb auch jung, 1993)
- Mafia/Triaden
- Kampfkunst-Rivalen
- Gift
- Energetisches Ungleichgewicht (zu viel Yang)

Wahrscheinlich: Kombination aus Medikament, Hitze, Überanstrengung, ev. Vorerkrankung.

### Beerdigung
Seattle, Lake View Cemetery. 25.000 Menschen. Steve McQueen, James Coburn trugen Sarg. Linda im schwarzen Schleier mit Kindern.

## Vermächtnis

### Film-Revolution
- Erste asiatische Actionstar in Hollywood
- Kampfkunst-Genre global
- Beeinflusste: Jackie Chan, Jet Li, Donnie Yen, Matrix, Kill Bill
- Stereotypen durchbrochen (teilweise)

### Kampfkunst-Revolution
- Mixed Martial Arts (MMA) Vorläufer
- Cross-Training normalisiert
- Realismus vor Tradition
- Jeet Kune Do weltweit praktiziert

### Popkultur-Ikone
- Gelber Trainingsanzug (Kill Bill)
- Nunchaku
- Schrei/Battle Cry
- Philosophische Zitate
- Unzählige Parodien und Hommagen

### Kinder
- **Brandon Lee** (1965-1993): Schauspieler, starb bei Drehunfall ("The Crow")
- **Shannon Lee** (1969-): Schauspielerin, Produzentin, verwaltet Erbe

### Kontroversen im Vermächtnis
- Authentizität vs. Selbsterfindung
- Gewaltverherrlichung?
- Kulturelle Aneignung oder Brückenbau?
- "White Savior" in umgekehrter Form?

## Berühmte Zitate

> "Be like water, my friend."

> "Ich fürchte nicht den Mann, der 10.000 Kicks einmal geübt hat, aber ich fürchte den Mann, der einen Kick 10.000 mal geübt hat."

> "Knowing is not enough, we must apply. Willing is not enough, we must do."

> "The successful warrior is the average man, with laser-like focus."

> "Absorb what is useful, discard what is not, add what is uniquely your own."

> "Mistakes are always forgivable, if one has the courage to admit them."

## Das Phänomen Bruce Lee

Bruce Lee bleibt über 50 Jahre nach seinem Tod eine globale Ikone:

- **Kampfkunst-Revolutionär**: Befreite Martial Arts vom Dogma
- **Filmstar**: Durchbrach rassistische Barrieren
- **Philosoph**: Blend von Ost und West
- **Kultfigur**: Symbol für Selbstbestimmung

Seine Größe lag in der Verbindung scheinbar unvereinbarer Welten: Tradition und Innovation, Ost und West, Körper und Geist, Kampf und Philosophie. Er lebte, was er predigte: authentischer Selbstausdruck ohne Grenzen.

Der frühe Tod verwandelte eine aufsteigende Karriere in einen Mythos. Aber auch ohne Tod wäre sein Einfluss revolutionär gewesen. Bruce Lee lehrte, dass Grenzen - kulturelle, physische, philosophische - nur im Kopf existieren. Seine Botschaft bleibt zeitlos: Sei du selbst, aber die beste Version davon.`,

	'chaplin-charlie': `# Charlie Chaplin
*16. April 1889 - 25. Dezember 1977*

## Kurzbiografie

Sir Charles Spencer Chaplin war ein britischer Schauspieler, Regisseur, Komponist und Komiker, der zur Ikone der Stummfilm-Ära wurde. Seine Figur des "Tramp" mit Melone, Gehstock und Watschelgang gehört zu den bekanntesten Gestalten der Filmgeschichte. Als genialer Pantomime und scharfsichtiger Sozialkritiker schuf er Meisterwerke wie "Modern Times" und "The Great Dictator". Chaplins Leben war geprägt von künstlerischem Triumph und persönlichen Tragödien, politischer Verfolgung und schließlich weltweiter Ehrung.

## Elend in London (1889-1913)

### Music Hall Eltern
Geboren in Walworth, London. Vater Charles Chaplin Sr.: Music Hall-Sänger, Alkoholiker. Mutter Hannah Hill: Sängerin "Lily Harley". Beide auf Bühne mäßig erfolgreich. Ehe scheitert früh.

### Mutters Zusammenbruch
Hannah verliert Stimme auf Bühne. Fünfjähriger Charlie muss weitersingen. Erste "Performance". Mutter mentale Krankheit (evtl. Syphilis). Immer wieder in Irrenanstalten. Traumatische Trennungen.

### Armut und Waisenhäuser
Leben in bitterster Armut. Workhouses (Arbeitshäuser). Lambeth-Viertel: Slums. Hunger, Kälte, Angst. Prägt lebenslang. Tramp-Figur entstammt dieser Erfahrung.

### Tod des Vaters (1901)
Vater stirbt mit 37 an Alkoholismus. Charlie 12 Jahre alt. Mutter endgültig in Anstalt. Charlie und Halbbruder Sydney auf sich gestellt.

### Music Hall und Pantomime
Mit 8 Jahren Auftritt in "Eight Lancashire Lads". Lernt Tanz, Pantomime, Timing. Naturtalent. Mit 14 bei Fred Karno's Comedy Company - beste Pantomime-Truppe Englands. Spielt Betrunkene, Dandys, Tölpel.

## Hollywood-Aufstieg (1913-1923)

### Amerika-Tournee (1910, 1912)
Mit Karno-Truppe nach USA. Vaudeville-Shows. Großer Erfolg. Mack Sennett (Keystone Studios) sieht Charlie.

### Keystone Studios (1914)
Erster Filmvertrag: 150 $/Woche. Lernt Filmmedium. 35 Kurzfilme in einem Jahr. Entwickelt "Tramp"-Figur: zu große Hose, zu kleine Jacke, Melone, Schnurrbart, Gehstock, Watschelgang.

### "The Tramp" entsteht
Zweiter Film: "Kid Auto Races at Venice" (1914). Erste Erscheinung des Landstreichers. Sofort erkennbar, unvergesslich. Wird über Nacht weltberühmt.

### Essanay, Mutual, First National
Springt zwischen Studios. Gehälter explodieren:
- 1915: 1.250 $/Woche (Essanay)
- 1916: 670.000 $/Jahr (Mutual) - höchstbezahlter Entertainer der Welt
- 1918: 1 Million $ + Bonus (First National)

### Künstlerische Kontrolle
Mit steigendem Erfolg fordert totale Kontrolle: Regie, Schnitt, Drehbuch, Musik. Perfektionist. Dutzende Takes. Studios widerstehen zunächst, geben nach.

### Weltstar mit 25
Charlie Chaplin-Manie: Merchandising, Imitatoren, Cartoons. Beliebtester Mensch der Welt. Stummfilm-Ära: Chaplin ist König.

### United Artists (1919)
Mitbegründung mit Mary Pickford, Douglas Fairbanks, D.W. Griffith. Eigene Produktionsfirma. Vollständige Unabhängigkeit. Revolutionär in Hollywood.

## Die Meisterwerke (1921-1940)

### "The Kid" (1921)
Erster Langfilm. Autobiographisch: Tramp adoptiert Waisenkind (Jackie Coogan). Mischung aus Slapstick und Sentimentalität. Publikum weint und lacht. Riesenerfolg.

### "The Gold Rush" (1925)
Meisterwerk der Stummfilm-Ära. Alaska-Goldgräber. Legendäre Szenen:
- Schuhe essen
- Brötchen-Tanz
- Cabin am Abgrund
Perfektes Timing. Tragikomik. Bis heute frisch.

### "City Lights" (1931)
"Ton-Film" ohne Dialog (nur Musik). Trotz Talkies an Stummfilm festgehalten. Blinde Blumenverkäuferin. Boxkampf-Szene. Ende: Millionen Tränen. Chaplin: "City Lights" sein bester Film. Einstein, Churchill liebten ihn.

### "Modern Times" (1936)
Sozialkritik an Industrialisierung. Fließband-Arbeit unmenschlich. Chaplin als Zahnrad im Getriebe. "Feeding Machine"-Szene. Letztes Erscheinen des Tramps. Musik: Chaplin komponiert. Anklänge an Kommunismus - politische Probleme beginnen.

### "The Great Dictator" (1940)
Erster Vollton-Film. Parodie auf Hitler ("Adenoid Hynkel"). Chaplin spielt jüdischen Barbier UND Diktator. Mutig: USA noch neutral. Schlussrede: 6 Minuten direkter Appell an Menschlichkeit. Kontrovers. Kommerziell erfolgreich. Heute: Klassiker.

## Persönliches Leben - Skandale (1918-1952)

### Junge Frauen
Lebenslanges Muster: Wesentlich jüngere Frauen/Teenager. Heute: Problematisch. Damals: Auch kontrovers.

**Mildred Harris** (1918-1920): Heirat mit 16 (er 29). Unglücklich. Scheidung.

**Lita Grey** (1924-1927): Heirat mit 16 (er 35). Zwei Söhne: Charles Jr., Sydney. Bittere Scheidung. Skandal-Scheidungsklage (sexuelle Details). Öffentlichkeit geschockt. Image beschädigt.

**Paulette Goddard** (1936-1942): Schauspielerin, "Modern Times" Star. Geheimheirat. Glücklichste Beziehung. Scheidung freundschaftlich.

**Oona O'Neill** (1943-1977): Tochter des Dramatikers Eugene O'Neill. Heirat: Sie 18, er 54. Acht Kinder. Glücklich bis Tod. Oona: "Liebe meines Lebens."

### Joan Barry Vaterschaftsklage (1943)
Schauspielerin behauptet Vaterschaft. Bluttests beweisen: Nicht Vater. Jury spricht trotzdem Vaterschaft zu (Vorurteil). Alimentezahlung. Rufschädigung.

### FBI-Überwachung
J. Edgar Hoover lässt überwachen. "Kommunistenverdacht". Akte über 2000 Seiten. Privatleben ausgespäht. Politische Verfolgung.

## Politische Verfolgung (1940-1952)

### "The Great Dictator" und Antifaschismus
Film gegen Hitler macht ihn verdächtig. Unterstützung für Sowjetunion (WW2-Alliierte!). Reden für "Second Front" (Hilfe für UdSSR).

### McCarthy-Ära
Kalter Krieg. Rote Angst. Hollywood-Blacklist. Chaplin nie kommunistisch, aber links-liberal. Weigert sich zu distanzieren.

### Limelight-Premiere und Verbannung (1952)
"Limelight" fertig. Chaplin reist mit Familie nach London für Premiere. Unterwegs: US-Justizministerium entzieht Wiedereinreise-Erlaubnis. "Moral Turpitude" (moralische Verwerflichkeit). Faktisch verbannt.

### Entscheidung: Schweiz
Chaplin wütend, verletzt. Entscheidet, nicht zurückzukehren. Zieht nach Corsier-sur-Vevey, Schweiz (Villa "Manoir de Ban"). Lebt dort bis Tod.

## Schweizer Jahre (1952-1977)

### "Ein König in New York" (1957)
Bittere Satire auf McCarthy-Amerika. Kommunisten-Jagd. Konsumgesellschaft. Nicht in USA gezeigt bis 1973. Persönlichster Film.

### "Die Gräfin von Hongkong" (1967)
Letzter Film. Sophia Loren, Marlon Brando. Kritiker vernichten. Kommerzieller Flop. Enttäuschung. Nie wieder Regie.

### "Meine Autobiographie" (1964)
Best

seller. Offene Darstellung armer Kindheit. Liebesbeziehungen verharmlost. Politisches verteidigt.

### Versöhnung mit Amerika (1972)
Academy Awards - Special Oscar "für unschätzbaren Beitrag zum Film". Rückkehr nach 20 Jahren. Standing Ovation. Tränen. Oona an seiner Seite. Vergeben und vergessen (teilweise).

### Ritterschlag (1975)
Queen Elizabeth II.: Knight Commander of the British Empire. Sir Charles Chaplin. Von Slumkind zum Ritter.

### Tod (1977)
Weihnachten, 25. Dezember, 88 Jahre alt. Im Schlaf, friedlich. Beerdigung in Vevey. Oona überlebte bis 1991.

### Leichenraub (1978)
Bizarr: Leiche gestohlen, Lösegeld gefordert. Körper gefunden. Täter gefasst. Oona: "Charlie hätte gelacht." Grab nun diebstahlsicher.

## Künstlerische Genialität

### Pantomime-Genie
Körperbeherrschung wie Balletttänzer. Timing perfekt. Jede Geste spricht. Musik ohne Ton.

### Komposition
Komponierte Musik für alle Filme. "Smile" (aus "Modern Times"): Hit-Song. Emotional, melodisch.

### Regie und Schnitt
Totale Kontrolle. Hunderte Takes. Perfektionist bis Tyrannei. Aber: Resultate rechtfertigen.

### Sozialkritik
Tramp als Underdog. Kritik an:
- Kapitalismus
- Industrialisierung
- Militarismus
- Ungerechtigkeit
Nie plump. Immer menschlich.

## Der Tramp

### Ikonische Figur
Melone + Bambusstock + Schnurrbart + Watschelgang = Instant Recognition. Optimist trotz Armut. Würde in Lumpen. Gentleman trotz Hunger. Komisch UND tragisch.

### Universelle Identifikation
Stummfilm = keine Sprachbarriere. Tramp verstanden von China bis Chile. Underdog der Welt.

### Abschied
"Modern Times" (1936): Letzter Auftritt. Geht in Sonnenuntergang mit Paulette Goddard. "Smile!" Ikonisches Ende.

## Berühmte Zitate

> "Ein Tag ohne Lachen ist ein verlorener Tag."

> "Das Leben ist eine Tragödie, wenn man es in der Nahaufnahme betrachtet, aber eine Komödie in der Totale."

> "Du wirst den Regenbogen niemals finden, wenn du nach unten schaust."

> "Man muss die Dinge nicht zu ernst nehmen - besonders sich selbst nicht."

> "Ich glaube an das Lachen und das Weinen, an das Leid und das Mitleid."

## Vermächtnis

Charlie Chaplin bleibt der größte Komiker der Filmgeschichte:

- **Universalgenie**: Schauspieler, Regisseur, Komponist, Autor
- **Der Tramp**: Unsterbliche Figur der Popkultur
- **Sozialkritiker**: Humanist mit Herz für Underdog
- **Künstlerische Integrität**: Opferte Komfort für Vision

Seine Filme sind zeitlos - "City Lights" und "Modern Times" bewegen heute wie vor 90 Jahren. Die Kombination aus Slapstick und Pathos, Komik und Tragik, bleibt unerreicht.

Von den Londoner Slums zum Weltstar, von Hollywood-Liebling zum politischen Flüchtling, von Verbanntem zum geehrten Ritter - Chaplins Leben war selbst ein Film. Seine Botschaft: Lachen und Mitgefühl sind revolutionär. Die kleinen Leute zählen. Menschlichkeit siegt über Maschinen.

Der Tramp watschelt durch die Geschichte - Symbol für alle, die trotz allem weitermachen, lächeln und hoffen. Das ist Charlie Chaplins unsterbliches Geschenk.`,

	'ben-gurion-david': `# David Ben-Gurion
*16. Oktober 1886 - 1. Dezember 1973*

## Kurzbiografie

David Ben-Gurion, geboren als David Grün, war der erste Ministerpräsident Israels und gilt als Hauptarchitekt des jüdischen Staates. Als charismatischer Führer und pragmatischer Visionär führte er die zionistische Bewegung durch entscheidende Jahre: Von der Immigration nach Palästina über die Staatsgründung 1948 bis zum Aufbau einer modernen Nation. Seine Persönlichkeit prägte Israel fundamental - als Sozialist und Nationalist, Idealist und Realist, Prophet und Politiker zugleich.

## Polen: Die Wurzeln (1886-1906)

### Plonsk
Geboren als David Grün in Plonsk (damals Russisches Reich, heute Polen). Vater Avigdor Grün: Jurist, Anhänger der Hovevei Zion (Zionsfreunde). Mutter Scheindel starb, als David 11 war. Prägend: Antisemitismus, Pogrome, Diskriminierung.

### Zionistisches Elternhaus
Aufwachsen in zionistischer Atmosphäre. Vater Mitbegründer der zionistischen Organisation in Plonsk. David mit 14 Jahren Gründer von "Ezra" - Jugendorganisation für Hebräisch und Zionismus. Hebräisch statt Jiddisch: Ideologisch wichtig.

### Träume von Palästina
Liest Herzl. Träumt von jüdischem Staat. Beschließt Aliyah (Einwanderung). Lehnt russische Universität ab. Nicht Assimilation, sondern eigener Staat.

## Zweite Aliyah nach Palästina (1906-1918)

### Ankunft in Jaffa (1906)
20-jährig mit wenig Geld. Zweite Aliyah (1904-1914): Idealistische Pioniere. David arbeitet als Landarbeiter. Orangen pflücken. Malaria. Harte körperliche Arbeit. Aber: Erfüllung. Jude auf jüdischem Land.

### Poale Zion - Arbeiterzionismus
Tritt Poale Zion bei (Arbeiter Zions). Sozialistischer Zionismus:
- Jüdischer Staat UND Sozialismus
- Arbeiter als Avantgarde
- Landwirtschaft als Ideal (nicht Luftmenschen des Schtetl)
- Hebräische Arbeiterklasse schaffen

### Name "Ben-Gurion" (1910)
Hebräisiert Namen von David Grün zu David Ben-Gurion. "Sohn des Löwen" - nach Yosef Ben Gurion, Anführer im jüdischen Aufstand gegen Rom (1. Jh.). Symbolisch: Neuer Mensch, neue Identität.

### Journalismus und Agitation
Editor von "Ahdut" (Einheit), Zeitung der Poale Zion. Beredt und kämpferisch. Talentierter Redner. Organisator. Aufstieg in Arbeiterbewegung.

### Istanbul und Rechtsstudium (1912-1914)
Studiert Jura in Istanbul (damals Teil des Osmanischen Reichs). Ziel: Palästina von innen reformieren. Aber: Osmanisches Reich und Zionismus schwer vereinbar.

### Verbannung (1915)
Erster Weltkrieg. Osmanische Behörden misstrauisch gegen Zionisten. Ben-Gurion und Yitzhak Ben-Zvi deportiert nach Ägypten, dann USA. Drei Jahre Exil.

### New York (1915-1918)
Propaganda für Zionismus. Gründet Hechalutz (Pionier-Organisation). Rekrutierung für Jüdische Legion (britische Armee). Heirat mit Paula Munweis (1917) - lebenslange Ehe, drei Kinder. Paula: Krankenschwester, Fels in Brandung.

## Aufbau des Yishuv (1918-1947)

### Rückkehr als Soldat (1918)
Mit Jüdischer Legion zurück nach Palästina. Britisches Mandat beginnt. Balfour-Deklaration (1917): Hoffnung auf "national home for Jewish people".

### Histadrut (1920)
Gründung der Histadrut - Generalföderation jüdischer Arbeiter. Nicht nur Gewerkschaft: Soziale Bewegung, Krankenkassen, Schulen, Unternehmen. Ben-Gurion Generalsekretär bis 1935. Machtbasis.

### Mapai-Partei (1930)
Vereinigung sozialistischer Parteien zur Mapai (Arbeiterpartei). Ben-Gurion Führer. Dominiert politisches Leben des Yishuv (jüdische Gemeinschaft in Palästina) bis Staatsgründung.

### Jewish Agency (1935)
Chairman der Jewish Agency (Quasi-Regierung des Yishuv unter Mandat). Verhandlungen mit Briten. Internationale Diplomatie. Palästinische Araber. Innerz

ionistische Politik. Zentrale Figur.

### Pragmatismus vs. Maximalismus
Kritisiert von Revisionisten (Jabotinsky): Zu kompromissbereit. Ben-Gurion: "Realpolitik" - nehmen was möglich, ausbauen. Teilung akzeptieren, dann erweitern. Langfristige Strategie.

### Arabische Aufstände (1936-1939)
Gewaltsame arabisch-palästinensische Revolte gegen Juden und Briten. Hunderte Tote. Ben-Gurion: Aufbau Haganah (jüdische Untergrund-Armee). Selbstverteidigung notwendig. Aber auch: Verständnis für arabische Ängste (in Privat).

### Weißbuch (1939)
Britische Einschränkung jüdischer Immigration. Katastrophe vor Holocaust. Ben-Gurion wütend. "Wir werden gegen Hitler kämpfen, als gäbe es kein Weißbuch, und gegen das Weißbuch kämpfen, als gäbe es keinen Hitler."

### Holocaust und Immigration
Während Holocaust verzweifelte Versuche, Juden zu retten. "Aliyah Bet" - illegale Immigration trotz Weißbuch. Schiffe mit Flüchtlingen. Briten abweisen. Machtlosigkeit quält Ben-Gurion lebenslang.

## Staatsgründung (1947-1948)

### UN-Teilungsplan (1947)
UN-Generalversammlung stimmt für Teilung Palästinas: Jüdischer und arabischer Staat. Ben-Gurion akzeptiert trotz Mängel. Pragmatismus: Staat jetzt, Grenzen später.

### Bürgerkrieg (1947-1948)
Sofort Gewalt. Palästinensische Milizen gegen jüdische Siedlungen. Haganah kämpft. Ben-Gurion bereitet Staatsgründung vor trotz Krieg.

### 14. Mai 1948 - Unabhängigkeitserklärung
Tel Aviv Museum. Ben-Gurion liest Unabhängigkeitserklärung:
> "Der Staat Israel ist gegründet!"

Tränen, Jubel. 2000 Jahre Traum erfüllt. Nächster Tag: Arabische Armeen greifen an.

### Unabhängigkeitskrieg (1948-1949)
Israel gegen Ägypten, Jordanien, Syrien, Irak, Libanon. Ben-Gurion: Verteidigungsminister und Premierminister. Mikromanagement. Entscheidungen über Taktik. Kontrovers: Harte Befehle (Dörfer, Vertreibungen). Israel überlebt. Waffenstillstand 1949.

### Nakba
Für Palästinenser: Katastrophe. 700.000 Flüchtlinge. Dörfer zerstört. Ben-Gurion Politik: Rückkehr verhindern. Demografische Sicherheit. Moralisch komplex. Schatten über Gründung.

## Premierminister und Staatsbauer (1948-1963)

### Erste Regierung (1948-1954)
Aufbau aus Nichts:
- Massenimmigration (Holocaust-Überlebende, orientalische Juden)
- Ma'abarot (Übergangslager) für Immigranten
- IDF (Israel Defense Forces) aus Untergrundorganisationen
- Wirtschaft, Infrastruktur, Institutionen

### "Mamlachtiyut" (Staatlichkeit)
Ben-Gurions Doktrin: Staat über Partei. Armee unpolitisch. Zentralisierung. Autorität. Kontrovers in demokratischem Rahmen.

### Lavon-Affäre (1954)
Geheimdienstskandal. Sabotage in Ägypten. Ben-Gurion tritt zurück (1954). Zieht nach Sde Boker (Kibbuz in Negev). "Im Negev wird Israels Schicksal entschieden."

### Rückkehr (1955)
Nach Wahlen zurück als Verteidigungsminister, dann PM. Lavon-Affäre verfolgt weiter. Interne Konflikte.

### Suez-Krise (1956)
Geheimes Bündnis mit Frankreich, England gegen Nasser (Ägypten). Israel erobert Sinai. Internationaler Druck (USA, UdSSR). Rückzug. Aber: Militärisch erfolgreich. Abschreckung etabliert.

### Eichmann-Prozess (1961)
Mossad kidnap

pt Adolf Eichmann aus Argentinien. Prozess in Jerusalem. Weltweite Aufmerksamkeit. Holocaust-Bewusstsein. Ben-Gurion: "Welt muss wissen." Eichmann hingerichtet 1962 (einzige Todesstrafe in Israel).

### Rücktritt (1963)
Interne Parteistreitigkeiten (Lavon-Affäre, Generationenwechsel). Ben-Gurion resigniert. Levi Eshkol Nachfolger. Ben-Gurion verbittert. Spaltung mit Mapai.

## Letzte Jahre (1963-1973)

### Rafi-Partei (1965)
Gründet Splitterpartei Rafi. Gegen Eshkol. Wahl-Flop. Isolation. Aber: Junge Anhänger (Moshe Dayan, Shimon Peres).

### Sechs-Tage-Krieg (1967)
Nicht an Regierung beteiligt. Kritisiert Eshkol (unfair). Nach Sieg: Ambivalent über Eroberungen. Besetzte Gebiete: Sicherheit, aber demografische Gefahr.

### Rückzug nach Sde Boker
Letztes Jahrzehnt in Negev-Kibbuz. Schreibt Memoiren. Liest Philosophie, Geschichte. Platon, Spinoza. Lernt Altgriechisch, Sanskrit. Universaler Geist.

### Tod (1973)
1. Dezember 1973, 87 Jahre alt. Gehirnblutung. Staatsbeerdigung auf Mount Herzl, Jerusalem? Nein: Beerdigung in Sde Boker wie gewünscht. Millionen trauern.

## Persönlichkeit

### Charisma und Autorität
Kleine Statur (1,62m), aber riesige Präsenz. Weiße Haarmähne. Intensive Augen. Hypnotischer Redner. Dominierte Raum. "Der Alte" genannt (schon mit 40).

### Pragmatischer Idealist
Zionist UND Realist. Träume + Machopolitik. Kompromisse + Vision. "Unmögliches wird sofort erledigt, Wunder dauern etwas länger."

### Arbeitsethos
14-Stunden-Tage. Workaholic. Mikromanagement. Erwartete gleiches von anderen. Rücksichtslos zu sich und anderen.

### Familie
Paula Ben-Gurion: Leidende Ehefrau. David oft abwesend. Drei Kinder. Sohn in 1948-Krieg schwer verwundet. Familie Opfer für Staat.

### Widersprüche
- Sozialist, aber autoritär
- Demokrat, aber ungeduldig mit Opposition
- Friedliebend (rhetorisch), aber Militarist
- Säkular, aber biblisch inspiriert

## Ideologie und Vision

### Sozialistischer Zionismus
Einzigartiger Mix:
- Jüdischer Nationalismus
- Sozialistisches Wirtschaftssystem
- Pionier-Ethos (Chalutzim)
- Kibbuzim als Ideal

### "Neuer Jude"
Transformation vom passiven Diaspora-Juden zum aktiven Sabra:
- Physisch stark (Arbeiter, Soldat)
- Hebräisch sprechend
- Landverbunden
- Selbstverteidigung

### Bibel und Säkularismus
Paradox: Säkular, aber biblisch. Bibel als nationales Epos, nicht religiös. Joshua, David, Maccabees als Vorbilder. Jüdisches Volk, nicht Religion.

### "Mamlachtiyut" (Staatlichkeit)
Staat über allen Partikularinteressen. Armee überparteilich. Zentralisierung. Autorität. Demokratie, aber geführt.

## Kontroversen und Kritik

### Vertreibung der Palästinenser
Plan Dalet (1948). Dörfer geräumt. Rückkehr verhindert. "Transfer"-Gedanken schon in 1930ern. Heute: Zentrale Schuldfrage. Ben-Gurion: Sicherheit + Demografie. Kritiker: Ethnische Säuberung.

### Mizrahi-Diskriminierung
Orientalische Juden (aus arabischen Ländern): Zweitklassig behandelt. Sprühen mit DDT. Einfache Jobs. Kulturelle Arroganz europäischer Elite. Ben-Gurion Teil dessen.

### Autoritarismus
Demokrat, aber intolerant gegen Dissens. Lavon-Affäre: Rücksichtslos. Innerpolitische Feinde.

### "Ohne Bibel keine Ansprüche"
Säkularer Zionismus + biblische Ansprüche = Problematisch. Religiöse Nationalisten später missbrauchen.

## Berühmte Zitate

> "Wir werden gegen Hitler kämpfen, als gäbe es kein Weißbuch, und gegen das Weißbuch kämpfen, als gäbe es keinen Hitler."

> "Im Negev wird Israels Schicksal entschieden."

> "Unmöglich ist kein hebräisches Wort."

> "Wer nicht an Wunder glaubt, ist kein Realist."

> "Es spielt keine Rolle, was die Gojim sagen, es spielt nur eine Rolle, was die Juden tun."

## Vermächtnis

David Ben-Gurion bleibt der Staatsgründer Israels:

- **Architekt** des jüdischen Staates
- **Führer** durch Unabhängigkeitskrieg
- **Erbauer** der Institutionen
- **Visionär** mit Pragmatismus

Seine Größe: Traum Wirklichkeit machen. Gegen alle Widerstände: Holocaust, britisches Empire, arabische Armeen, interne Zwiste - Israel entstand.

Seine Schwächen: Rücksichtslosigkeit, Autoritarismus, blinde Flecken gegenüber Palästinensern. Preise der Gründung bis heute spürbar.

Ohne Ben-Gurion kein Israel in 1948. Seine Willenskraft, strategische Intelligenz und charismatische Führung waren entscheidend. Er war der richtige Mann zur richtigen Zeit.

Israel heute - demokratisch, wirtschaftlich erfolgreich, militärisch stark, aber auch im Konflikt - trägt Ben-Gurions Stempel: Seine Stärken UND seine Ambivalenzen. Das Urteil über ihn bleibt komplex, wie der Staat, den er schuf.`,

	'rousseau-jean': `# Jean-Jacques Rousseau
*28. Juni 1712 - 2. Juli 1778*

## Kurzbiografie

Jean-Jacques Rousseau war ein Genfer Philosoph, Schriftsteller und Komponist der Aufklärung, dessen Ideen die Französische Revolution, die Romantik und die moderne politische Theorie nachhaltig prägten. Als Kritiker der Zivilisation und Prophet der Natürlichkeit entwickelte er die Ideen des Gesellschaftsvertrags, der Volkssouveränität und der natürlichen Erziehung. Sein Leben war geprägt von Widersprüchen: Ein Theoretiker der Erziehung, der seine eigenen Kinder ins Findelhaus gab; ein Verkünder der Einfachheit, der Paranoia verfiel; ein Philosoph der Freiheit, dessen Ideen Diktaturen inspirierten.

## Genf und frühe Wanderjahre (1712-1742)

### Geburt und Mutterlose Kindheit
Geboren in Genf als Sohn des Uhrmachers Isaac Rousseau. Mutter Suzanne Bernard starb neun Tage nach Geburt im Kindbettfieber. Vater machte Jean-Jacques für Tod verantwortlich. Schuldgefühle prägten lebenslang.

### Frühe Bildung
Vater las mit ihm sentimentale Romane und Plutarchs Heldenleben. Frühe Identifikation mit antiken Republikanern. Keine systematische Schulbildung. Autodidakt.

### Lehre und Flucht (1728)
Lehre bei Graveur. Harte Behandlung. Mit 16 Jahren Flucht aus Genf (Stadttore geschlossen). Wanderte umher. Begegnung mit Madame de Warens - Wendepunkt.

### Madame de Warens (1728-1740)
Louise de Warens: Konvertitin zum Katholismus, Agentin Savoyens. Nahm Jean-Jacques auf. "Maman" genannt. Wurde Geliebte (später). Les Charmettes bei Chambéry: Jahre des Lernens. Bibliothek. Musik. Philosophie. Glücklichste Zeit.

### Konversion
Übertritt zum Katholizismus in Turin. Pragmatisch, nicht überzeugt. Verlor Genfer Bürgerrecht. Später zurück zum Calvinismus (1754).

### Wanderjahre
Hauslehrer, Sekretär, Musiklehrer. Unbeständig. Hypochondrie. Autodidaktische Bildung: Descartes, Leibniz, Newton, Locke. Entwicklung eigenen Denkens.

## Paris und erste Erfolge (1742-1756)

### Ankunft in Paris (1742)
Mit Notationssystem für Musik. Vorstellung bei Académie. Ablehnung. Aber: Entrée in Pariser Gesellschaft.

### Thérèse Levasseur (ab 1745)
Beziehung mit Wäscherin. Ungebildet, aber treu. Nie geheiratet (bis 1768). Fünf Kinder - alle ins Findelhaus gegeben. Skandal. Rousseau rechtfertigt: Zu arm. Später: Lebenslanges Schuldbewusstsein.

### Freundschaft mit Diderot
Diderot und Encyclopédistes. Rousseau schreibt Artikel über Musik. Teil der Aufklärungsszene. Aber: Bald Bruch.

### Première Discours (1750)
Akademie Dijon: Preisfrage "Hat Fortschritt der Wissenschaften und Künste zur Läuterung der Sitten beigetragen?"

Rousseaus Antwort: **NEIN!**
- Zivilisation korrumpiert
- Natürliche Tugend verloren
- Luxus schwächt
- Künste dekadent

Sensation! Paradox in Aufklärungszeit. Diskussionsgewinner. Berühmt über Nacht.

### Second Discours (1755) - Über Ungleichheit
"Discours sur l'origine et les fondements de l'inégalité parmi les hommes":
- **Naturzustand**: "Edler Wilder" (bon sauvage)
- Ursprünglich frei, gleich, gut
- **Eigentum**: "Erster, der eingezäunt" = Unglück
- Zivilisation = Entfremdung
- Ungleichheit künstlich, nicht natürlich

Radikale Kritik. Skandal. Voltaire (später Feind): "Ich habe Lust, auf allen Vieren zu gehen."

### Diskographie
Auch Komponist. Oper "Le Devin du Village" (1752). Erfolgreich. Aber: Lehnt Pension ab. Will unabhängig bleiben.

## Eremitage und Meisterwerke (1756-1762)

### Rückzug aufs Land
Madame d'Épinay bietet Häuschen "Ermitage" in Montmorency (bei Paris). Rousseau zieht mit Thérèse. Einfaches Leben. Natur. Schreibt Hauptwerke.

### "Julie ou La Nouvelle Héloïse" (1761)
Briefroman. Leidenschaftliche Liebe + Tugend. Bestseller! Sentimentalität. Empfindsamkeit. Vorbereitung Romantik. Frauen weinten beim Lesen.

### "Du contrat social" (1762) - Der Gesellschaftsvertrag
Politische Philosophie:

**Kernideen:**
- Mensch geboren frei, überall in Ketten
- Gesellschaftsvertrag = Lösung
- **Volonté générale** (Gemeinwille) ≠ Wille aller
- Volkssouveränität
- Repräsentation problematisch
- **Kleine Republik** ideal
- **Zivilreligion** notwendig

Inspirierte Französische Revolution. Aber auch: Jakobiner, Totalitarismus. Umstritten.

### "Émile ou De l'éducation" (1762)
Erziehungsroman. Naturgemäße Erziehung:

**Prinzipien:**
- Kind nicht kleiner Erwachsener
- Entwicklungsstufen beachten
- Lernen durch Erfahrung, nicht Bücher (außer Robinson Crusoe)
- Natürliche Neugier fördern
- Gegen Zwang
- "Glaubensbekenntnis des savoyischen Vikars": Naturreligion

**Skandal:**
- Buch verbrannt in Paris UND Genf
- Haftbefehl gegen Rousseau
- Kritik an Kirche
- Kinder-ins-Findelhaus-Widerspruch

### Flucht (1762)
Vor Verhaftung nach Yverdon (Schweiz), dann Môtiers (Neuenburg, preußisch). Verfolgung überall. Paranoia wächst.

## Verfolgung und Paranoia (1762-1770)

### Bruch mit Aufklärern
Voltaire attackiert öffentlich (Kinder-Skandal). D'Alembert kritisiert. Diderot entfremdet. Rousseau fühlt sich von allen verraten.

### Steinigung in Môtiers (1765)
Dorfbewohner werfen Steine auf Haus. Flüchtete auf Petersinsel (Bielersee). Idyll. Aber: Berner Obrigkeit weist aus.

### David Hume und England (1766-1767)
Auf Einladung Humes nach England. Gastfreundschaft. Aber: Rousseau sieht überall Verschwörung. Beschuldigt Hume der Intrige. Spektakulärer Bruch. Rückkehr nach Frankreich (inkognito).

### Wahnvorstellungen
Klassische Paranoia:
- Alle gegen ihn
- Komplotte überall
- Verfolg

ungswahn
- Aber: Manchmal real (Verbote, Haftbefehle)

Mischung aus realer Verfolgung und psychischer Krankheit.

## Letzte Jahre in Paris (1770-1778)

### Rückkehr
Unter falschem Namen nach Paris. Offiziell geduldet. Lebt bescheiden. Notenkopieren als Einkommen.

### "Les Confessions" (1765-1770, posthum)
Autobiographie. Revolutionär ehrlich:
- Sexuelle Deviationen (Exhibitionismus, Masochismus)
- Diebstähle
- Kinder-Weggabe
- Fehler, Schwächen

Präzedenzlos offenherzig. "Zeige ich mich, wie ich war: verächtlich und niedrig [...] gut, edel, erhaben." Begründer moderner Autobiographie.

### "Rêveries du promeneur solitaire" (1776-1778)
"Träumereien eines einsamen Spaziergängers". Letzte Schrift. Melancholisch, pastoral. Sucht Frieden in Natur. Botanik als Trost. Schönste Prosa.

### Tod (1778)
2. Juli, Schloss Ermenonville (Gast Marquis de Girardin). Schlaganfall. 66 Jahre alt. Beerdigung auf Île des Peupliers. 1794: Panthéon-Überführung (Revolution ehrt ihn). Grab gegenüber von Voltaire.

## Kernideen

### Naturzustand vs. Zivilisation
- **Bon sauvage** (edler Wilder): Ursprünglich gut
- Zivilisation = Korruption
- Eigentum = Unglück
- Entfremdung durch Gesellschaft
- Aber: Kein zurück - nur vorwärts

### Volonté générale (Gemeinwille)
- Unterschied: Gemeinwille ≠ Wille aller
- Gemeinwohl vor Einzelinteresse
- Souverän = Volk
- Unveräußerlich
- Problem: Deutungshoheit?

### Freiheit
Paradoxe Formulierung:
> "Der Mensch wird gezwungen, frei zu sein."

Freiheit = Gehorsam gegenüber selbst gegebenen Gesetzen. Positiver Freiheitsbegriff. Gefährlich interpretierbar.

### Natürliche Erziehung
- Gegen Zwang
- Entwicklungsstufen respektieren
- Erfahrung > Bücher
- Natürliche Neugier
- Émile = Ideal (aber unrealistisch)

### Religion
- Gegen organisierte Religion
- Für natürliche Frömmigkeit
- Gewissen als Stimme Gottes
- Zivilreligion im Staat notwendig
- Deistisch

## Wirkungsgeschichte

### Französische Revolution
Robespierre: Rousseau-Verehrer. "Social Contract" als Bibel. Aber: Jakobinischer Terror im Namen des Gemeinwillens. Problematisches Erbe.

### Romantik
Wegbereiter:
- Emotionalität > Rationalität
- Natur > Kultur
- Innerlichkeit
- Sentimentalität
- Goethe, Schiller beeinflusst

### Pädagogik
Pestalozzi, Fröbel, Montessori, Reformpädagogik: Alle Erben Rousseaus. Kindorientierte Erziehung. Entwicklungspsychologie.

### Politische Philosophie
- Demokratietheorie
- Volkssouveränität
- Aber auch: Totalitarismus (Benjamin Constant kritisierte)
- Republikanismus

### Autobiographie
Confessions: Vorbild für alle späteren. Ehrlichkeit, Selbstoffenbarung. Goethe, Tolstoi, Proust.

## Berühmte Zitate

> "Der Mensch wird frei geboren, und überall ist er in Ketten."

> "Zurück zur Natur!"

> "Das Geld, das man besitzt, ist das Mittel zur Freiheit, dasjenige, dem man nachjagt, das Mittel zur Knechtschaft."

> "Man muss viel gelernt haben, um über das, was man nicht weiß, fragen zu können."

> "Gewissen! Göttlicher Instinkt, unsterbliche himmlische Stimme!"

## Widersprüche und Kritik

### Kinder ins Findelhaus
Theoretiker der Erziehung gibt eigene Kinder weg. Unentschuldbar. Selbst eingestanden. Versuch der Rechtfertigung in Confessions. Glaubwürdigkeit beschädigt.

### Frauenbild
Sophie (Émiles Partnerin): Untergeordnet, für Mann erzogen. Mary Wollstonecraft kritisierte. Rousseau: Progressiv UND reaktionär.

### Totalitarismus-Gefahr
"Gemeinwille" zweideutig. Kann Minderheiten unterdrücken. "Gezwungen frei zu sein": Orwellian? Jakobiner, später Faschisten missbrauchten.

### Paranoia
Letzte Jahre: Psychisch krank. Ungerechtfertigte Anschuldigungen (Hume). Menschenscheu. Beeinträchtigt Werk?

### Genf vs. Schriften
Genfer Bürger, Lob der kleinen Republik. Aber: Gibt Bürgerrecht auf, lebt in Frankreich. Heuchlerisch?

## Vermächtnis

Jean-Jacques Rousseau bleibt einer der einflussreichsten und widersprüchlichsten Denker:

- **Demokratietheorie** - Volkssouveränität fundamental
- **Pädagogik** - Revolution der Erziehung
- **Romantik** - Gefühl über Vernunft
- **Kulturkritik** - Entfremdungsanalyse modern

Seine Größe: Radikale Kritik der Zivilisation, Vision natürlicher Freiheit, Begründung der Volkssouveränität. Er dachte gegen seine Zeit.

Seine Problematik: Widersprüche zwischen Leben und Lehre, Totalitarismus-Potential seiner Ideen, Paranoia, Frauenbild.

Rousseau war Prophet und Neurotiker, Visionär und Egoist, Wegbereiter der Demokratie und potentieller Totalitärer. Diese Ambivalenz macht ihn endlos faszinierend - und gefährlich aktuell.

Seine zentrale Einsicht bleibt: Moderne Gesellschaft entfremdet. Freiheit erfordert aktive Bürgerschaft. Erziehung muss das Kind respektieren. Diese Ideen leben - trotz aller Widersprüche ihres Urhebers.`,
};

async function main() {
	console.log('📝 Batch 3: Bruce Lee, Charlie Chaplin, Ben-Gurion, Rousseau\n');

	const authorsDE = loadAuthors('de');
	const authorsEN = loadAuthors('en');

	let updated = 0;

	const updatedDE = authorsDE.map((author) => {
		if (batch3Bios[author.id]) {
			console.log(`✅ ${author.name} (${author.id})`);
			updated++;
			return {
				...author,
				biography: {
					...author.biography,
					long: batch3Bios[author.id],
				},
			};
		}
		return author;
	});

	const updatedEN = authorsEN.map((author) => {
		const deAuthor = updatedDE.find((a) => a.id === author.id);
		if (deAuthor?.biography?.long && batch3Bios[author.id]) {
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

	console.log('\n✨ Batch 3 fertig!\n');
}

main();
