/**
 * Chor Tägerwilen — recherchierte Daten zur Befüllung der Demo-Persona.
 *
 * Quellen + Lücken-Diskussion: docs/demo-personas/chor-taegerwilen/README.md
 */

export interface BoardMember {
	firstName: string;
	lastName: string;
	role: string;
	stimmgruppe: 'Sopran' | 'Alt' | 'Tenor' | 'Bass';
	notes?: string;
}

export const VORSTAND: BoardMember[] = [
	{
		firstName: 'Ralf',
		lastName: 'Schneider',
		role: 'Präsident',
		stimmgruppe: 'Tenor',
		notes: 'Vereinsadresse via Impressum: c/o Ralf Schneider, Hauptstrasse 142, 8274 Tägerwilen',
	},
	{ firstName: 'Monika', lastName: 'Friemelt', role: 'Kassierin', stimmgruppe: 'Alt' },
	{
		firstName: 'Sonja',
		lastName: 'Hegermann',
		role: 'Aktuarin',
		stimmgruppe: 'Alt',
		notes: 'Annahme — Vorstandsseite nennt nur Vornamen.',
	},
	{ firstName: 'Nadine', lastName: 'Ruf', role: 'Sponsoring & Werbung', stimmgruppe: 'Sopran' },
	{
		firstName: 'Liesbeth',
		lastName: 'Zürcher',
		role: 'Mitgliederbetreuung',
		stimmgruppe: 'Sopran',
	},
];

export const CHORLEITER = {
	firstName: 'Wolfgang',
	lastName: 'Feucht',
	since: '2022-11-01',
	bio: 'Studium Schulmusik mit Schwerpunkt Chorleitung; Aufbaustudium Chorpädagogik in Örebro (Schweden); Jazz- und Popularmusik-Pädagogik. Methode Complete Vocal Technique. Spielt Jazz-Klavier. Daneben Musiklehrer am Alexander-von-Humboldt-Gymnasium und Organist Sulgen-Kradolf + Gachnang.',
	website: 'https://www.wolfgang-feucht.de',
};

export interface Member {
	firstName: string;
	lastName: string;
}

export const SOPRAN: Member[] = [
	{ firstName: 'Bettina', lastName: 'Nessensohn' },
	{ firstName: 'Corina', lastName: 'Signer' },
	{ firstName: 'Friederike', lastName: 'Volkenand' },
	{ firstName: 'Gabi', lastName: 'Robinson' },
	{ firstName: 'Heidi', lastName: 'Sauter' },
	{ firstName: 'Jacqueline', lastName: 'Somm' },
	{ firstName: 'Karina', lastName: 'Zabel' },
	{ firstName: 'Katharina', lastName: 'Siegrist' },
	{ firstName: 'Lea', lastName: 'Straub' },
	{ firstName: 'Liesbeth', lastName: 'Zürcher' },
	{ firstName: 'Lisanne', lastName: 'Robinson' },
	{ firstName: 'Lucia', lastName: 'Zingg' },
	{ firstName: 'Nadine', lastName: 'Ruf' },
	{ firstName: 'Petra', lastName: 'Schroff' },
	{ firstName: 'Pia', lastName: 'Hepp' },
	{ firstName: 'Renate', lastName: 'Signer' },
];

export const ALT: Member[] = [
	{ firstName: 'Alexandra', lastName: 'Bär' },
	{ firstName: 'Ana Maria', lastName: 'Thurnheer' },
	{ firstName: 'Andrea', lastName: 'Eckert' },
	{ firstName: 'Astrid', lastName: 'Mell' },
	{ firstName: 'Christiane', lastName: 'Wuddel' },
	{ firstName: 'Daniela', lastName: 'Opprecht' },
	{ firstName: 'Daniela', lastName: 'Braun' },
	{ firstName: 'Denise', lastName: 'Zürcher' },
	{ firstName: 'Gudrun', lastName: 'Haenselt' },
	{ firstName: 'Jolanda', lastName: 'Schär' },
	{ firstName: 'Liddy', lastName: 'Schwemer' },
	{ firstName: 'Martina', lastName: 'Aeschbacher' },
	{ firstName: 'Melanie', lastName: 'Bättig' },
	{ firstName: 'Monika', lastName: 'Friemelt' },
	{ firstName: 'Rosmarie', lastName: 'Testa-Stäheli' },
	{ firstName: 'Silke', lastName: 'Mühlhoff' },
	{ firstName: 'Sonja', lastName: 'Hegermann' },
	{ firstName: 'Sonja', lastName: 'Helmstätter' },
	{ firstName: 'Susanne', lastName: 'Ribi' },
	{ firstName: 'Sybille', lastName: 'Hierling' },
	{ firstName: 'Uta', lastName: 'Rausch' },
	{ firstName: 'Ute', lastName: 'Schneider' },
];

export const TENOR: Member[] = [
	{ firstName: 'Anita', lastName: 'Arnold' },
	{ firstName: 'Beat', lastName: 'Schwarz' },
	{ firstName: 'Jean-Pierre', lastName: 'Golliez' },
	{ firstName: 'Markus', lastName: 'Wiesli' },
	{ firstName: 'Max', lastName: 'Aeberhard' },
	{ firstName: 'Ralf', lastName: 'Schneider' },
	{ firstName: 'Reto', lastName: 'Oberhänsli' },
];

export const BASS: Member[] = [
	{ firstName: 'Fritz', lastName: 'Weigle' },
	{ firstName: 'Guido', lastName: 'Häberlin' },
	{ firstName: 'Hartmut', lastName: 'Rausch' },
	{ firstName: 'Jan', lastName: 'Schneider' },
	{ firstName: 'Martin', lastName: 'De Boni' },
	{ firstName: 'Roland', lastName: 'Kolb' },
	{ firstName: 'Sepp', lastName: 'Teuber' },
	{ firstName: 'Stefan', lastName: 'Borkert' },
	{ firstName: 'Thomas', lastName: 'Schneider' },
];

export interface Termin {
	date: string;
	startTime: string;
	endTime: string;
	title: string;
	description: string;
	location: string;
}

export const TERMINE: Termin[] = [
	{
		date: '2026-04-30',
		startTime: '20:00',
		endTime: '21:45',
		title: 'Probe — Vivaldi Magnificat & sakrale Werke',
		description: 'Probe Vivaldi Magnificat und sakrale Chorwerke.',
		location: 'Aula Sekundarschule Tägerwilen',
	},
	{
		date: '2026-05-07',
		startTime: '20:00',
		endTime: '21:45',
		title: 'Probe — Magnificat & Pop-Repertoire',
		description: 'Magnificat-Wiederholung und Pop-Repertoire.',
		location: 'Aula Sekundarschule Tägerwilen',
	},
	{
		date: '2026-05-28',
		startTime: '20:00',
		endTime: '21:45',
		title: 'Gemeinsame Probe mit Pop-Chor (Leitung Dirk Werner)',
		description: 'Gemeinsame Probe mit dem Popchor; Leitung an diesem Abend Dirk Werner.',
		location: 'Aula Sekundarschule Tägerwilen',
	},
	{
		date: '2026-06-04',
		startTime: '19:30',
		endTime: '21:45',
		title: 'Probe mit Streichensemble Divertimento + Apéro',
		description:
			'Probe mit dem Streichorchester Divertimento, anschließend Apéro (Männer organisieren Snacks).',
		location: 'Aula Sekundarschule Tägerwilen',
	},
	{
		date: '2026-06-11',
		startTime: '20:00',
		endTime: '21:45',
		title: 'Programm-Probe „Chornacht"',
		description: 'Programm-Probe für die Chornacht.',
		location: 'Aula Sekundarschule Tägerwilen',
	},
	{
		date: '2026-06-18',
		startTime: '20:00',
		endTime: '21:45',
		title: 'Programm-Probe „Chornacht"',
		description: 'Programm-Probe Chornacht.',
		location: 'Aula Sekundarschule Tägerwilen',
	},
	{
		date: '2026-06-25',
		startTime: '20:00',
		endTime: '21:45',
		title: 'Programm-Probe „Chornacht"',
		description: 'Programm-Probe Chornacht — letzte Probe vor dem Festival.',
		location: 'Aula Sekundarschule Tägerwilen',
	},
];

export interface Konzert {
	date: string;
	startTime: string;
	endTime: string;
	title: string;
	description: string;
	location: string;
	partners?: string[];
	isPublic: boolean;
}

export const KONZERTE: Konzert[] = [
	{
		date: '2026-03-14',
		startTime: '20:00',
		endTime: '22:00',
		title: 'Frühlingskonzert „Happy Together"',
		description:
			'Zwei Chöre — ein Konzert. Der chor tägerwilen und der Popchor Konstanz präsentieren ein gemeinsames Programm.',
		location: 'Bürgerhalle Tägerwilen',
		partners: ['Popchor Konstanz'],
		isPublic: true,
	},
	{
		date: '2026-03-15',
		startTime: '12:00',
		endTime: '14:00',
		title: 'Frühlingskonzert „Happy Together" (Sonntag)',
		description: 'Zweite Aufführung des Frühlingskonzerts.',
		location: 'Bürgerhalle Tägerwilen',
		partners: ['Popchor Konstanz'],
		isPublic: true,
	},
	{
		date: '2026-06-26',
		startTime: '20:00',
		endTime: '22:30',
		title: 'Chornacht — Konstanzer Chorfestival',
		description: 'Auftritt im Rahmen der Chornacht des Konstanzer Chorfestivals.',
		location: 'Altkatholische Kirche St. Konrad, Konstanz',
		isPublic: true,
	},
	{
		date: '2026-09-26',
		startTime: '19:30',
		endTime: '21:30',
		title: 'Herbstkonzert',
		description: 'Herbstkonzert in der Mehrzweckhalle Wollmatingen, Konstanz.',
		location: 'Mehrzweckhalle Wollmatingen, Konstanz',
		isPublic: true,
	},
	{
		date: '2026-12-12',
		startTime: '20:00',
		endTime: '21:45',
		title: 'Adventskonzert mit Streichorchester Divertimento',
		description:
			'Adventskonzert mit dem Streichorchester Divertimento. Genaues Datum + Venue noch in Planung.',
		location: 'tba',
		partners: ['Streichorchester Divertimento'],
		isPublic: true,
	},
];

export interface KonzertArchiv {
	year: string;
	title: string;
}

export const KONZERT_ARCHIV: KonzertArchiv[] = [
	{ year: '2025', title: 'Sounds of Love' },
	{ year: '2024', title: 'Summer in the City' },
	{ year: '2023', title: 'Sang & Klang' },
	{ year: '2022', title: 'Viva la Vida' },
	{ year: '2021', title: 'Rocking around the Christmas Tree' },
	{ year: '2019', title: 'Follow that Star' },
	{ year: '2019', title: 'The Sound of Silence' },
	{ year: '2018', title: 'Concerto Finale' },
	{ year: '2017', title: 'Im Musikhimmel' },
	{ year: '2016', title: 'Jukebox Night' },
	{ year: '2015', title: 'TägAirWilen' },
];

export interface Werk {
	composer: string;
	title: string;
	notes?: string;
}

export const REPERTOIRE: Werk[] = [
	{
		composer: 'Antonio Vivaldi',
		title: 'Magnificat (RV 610/611)',
		notes: 'Hauptwerk Frühling/Sommer 2026.',
	},
];

export const KONTEXT_DOC_MARKDOWN = `# chor tägerwilen — Vereins-Kontext

## Verein
- Gemischter Chor, gegründet **1880**, statutarisch dokumentiert ab 1892
- Rechtsform: Verein nach Schweizer ZGB
- ~54 aktive Mitglieder aus 18 Ortschaften
- Adresse: c/o Ralf Schneider, Hauptstrasse 142, CH-8274 Tägerwilen
- Kontakt: info@chor-taegerwilen.ch · +41 79 176 21 02
- Website: https://www.chor-taegerwilen.ch
- Motto: „Singen macht Spass"

## Stimmgruppen
- Sopran: 16 · Alt: 22 · Tenor: 7 · Bass: 9

## Chorleitung
**Wolfgang Feucht** (seit November 2022) — Studium Schulmusik mit Schwerpunkt Chorleitung; Aufbaustudium Chorpädagogik in Örebro (Schweden); Jazz- und Popularmusik-Pädagogik. Methode: Complete Vocal Technique.

## Vorstand 2026
- Ralf Schneider — Präsident (Tenor)
- Monika Friemelt — Kassierin (Alt)
- Sonja Hegermann — Aktuarin (Alt)
- Nadine Ruf — Sponsoring & Werbung (Sopran)
- Liesbeth Zürcher — Mitgliederbetreuung (Sopran)

## Probe
Donnerstag 20:00–21:45, Aula Sekundarschule Tägerwilen.

## Repertoire
Pop / Crossover als Schwerpunkt, gelegentliche geistliche Werke. Aktuell: Vivaldi Magnificat.

## Termine 2026
- 14./15.03. Frühlingskonzert „Happy Together" (mit Popchor Konstanz)
- 26.06. Chornacht / Konstanzer Chorfestival
- 26.09. Herbstkonzert, Wollmatingen
- Dezember: Adventskonzerte mit Streichorchester Divertimento

## Aktuelle Vereinsverwaltung
Läuft auf ClubDesk (alte Site: chor-taegerwilen.clubdesk.com). Mana-Migration als Demo befüllt.
`;
