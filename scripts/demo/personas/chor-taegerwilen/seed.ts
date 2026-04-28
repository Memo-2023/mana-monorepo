/**
 * Chor Tägerwilen — Persona-Seed-Skript.
 *
 * Schreibt ~120 Records in `mana_sync.sync_changes` über mehrere Module
 * hinweg (kontextDoc, contacts, calendar, library, notes, website,
 * ai-missions, social events). Alle Inserts laufen über das Prod-Schema:
 * `field_timestamps` (nicht `field_meta`), kein `origin`-Column.
 *
 * Recherche-Brief: docs/demo-personas/chor-taegerwilen/README.md
 *
 * ─── Aufruf ────────────────────────────────────────────────
 *
 *   ssh -L 5433:localhost:5432 -N -f mana-server
 *   SYNC_DATABASE_URL="postgresql://postgres:manacore123@localhost:5433/mana_sync" \
 *     bun scripts/demo/personas/chor-taegerwilen/seed.ts
 *
 * Idempotent: räumt vor dem Insert alle Rows mit
 * client_id='system:demo-seed' aus den Demo-Spaces, dann INSERT von
 * vorne. Re-Run = Update.
 */

import postgres from 'postgres';
import {
	VORSTAND,
	CHORLEITER,
	SOPRAN,
	ALT,
	TENOR,
	BASS,
	TERMINE,
	KONZERTE,
	REPERTOIRE,
	KONZERT_ARCHIV,
	KONTEXT_DOC_MARKDOWN,
	type Member,
} from './data';

const USER_ID = 'TCYOdiUdpMSCkw4OW8i7JB7Vn6XI81qf';
const PERSONAL_SPACE_ID = 'PzzwRkbDTcmFGdotQYwGn';
const CLUB_SPACE_ID = '6a3a4d4c1c0e4e5ea918dd30102067cb';
const SLUG = 'chor-taegerwilen';

const ACTOR = {
	kind: 'system',
	principalId: 'system:demo-seed',
	displayName: 'Demo-Seed',
} as const;
const CLIENT_ID = 'system:demo-seed';

const SYNC_DATABASE_URL = process.env.SYNC_DATABASE_URL;
if (!SYNC_DATABASE_URL) {
	console.error('❌ SYNC_DATABASE_URL not set. See header for usage.');
	process.exit(1);
}
const sql = postgres(SYNC_DATABASE_URL);

interface SyncRow {
	app_id: string;
	table_name: string;
	record_id: string;
	user_id: string;
	space_id: string;
	op: 'insert';
	data: Record<string, unknown>;
}

function buildFieldTimestamps(data: Record<string, unknown>, at: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const k of Object.keys(data)) {
		if (k === 'id') continue;
		out[k] = at;
	}
	return out;
}

const collected: SyncRow[] = [];
function emit(row: SyncRow): void {
	collected.push(row);
}

async function flushAll(): Promise<void> {
	if (collected.length === 0) return;
	const at = new Date().toISOString();
	const BATCH = 200;
	for (let i = 0; i < collected.length; i += BATCH) {
		const slice = collected.slice(i, i + BATCH);
		const values = slice.map((r) => ({
			app_id: r.app_id,
			table_name: r.table_name,
			record_id: r.record_id,
			user_id: r.user_id,
			space_id: r.space_id,
			op: r.op,
			data: r.data,
			field_timestamps: buildFieldTimestamps(r.data, at),
			client_id: CLIENT_ID,
			schema_version: 1,
			actor: ACTOR,
			created_at: at,
		}));
		await sql`INSERT INTO sync_changes ${sql(values as never)}`;
	}
	console.log(`  → ${collected.length} rows inserted`);
	collected.length = 0;
}

async function cleanupPriorSeed(): Promise<void> {
	const result = await sql`
		DELETE FROM sync_changes
		 WHERE client_id = ${CLIENT_ID}
		   AND (space_id = ${CLUB_SPACE_ID} OR space_id = ${PERSONAL_SPACE_ID} OR user_id = ${USER_ID})
		RETURNING 1
	`;
	console.log(`✓ cleanup: removed ${result.length} prior demo-seed rows`);
}

async function setRlsContext(): Promise<void> {
	await sql`SELECT set_config('app.current_user_id', ${USER_ID}, false)`;
	await sql`SELECT set_config('app.current_user_space_ids', ${[PERSONAL_SPACE_ID, CLUB_SPACE_ID].join(',')}, false)`;
}

function rid(module: string, key: string | number): string {
	return `${SLUG}:${module}:${key}`;
}

// ─── kontextDoc ─────────────────────────────────────────────

function emitKontextDoc(): void {
	const id = rid('kontext', 'singleton');
	emit({
		app_id: 'kontext',
		table_name: 'kontextDoc',
		record_id: id,
		user_id: USER_ID,
		space_id: CLUB_SPACE_ID,
		op: 'insert',
		data: { id, content: KONTEXT_DOC_MARKDOWN },
	});
}

// ─── contacts ───────────────────────────────────────────────

const VORSTAND_FUNKTION = new Map(VORSTAND.map((v) => [`${v.firstName} ${v.lastName}`, v.role]));

function emitContacts(): void {
	const all: Array<Member & { stimmgruppe: string }> = [
		...SOPRAN.map((m) => ({ ...m, stimmgruppe: 'Sopran' })),
		...ALT.map((m) => ({ ...m, stimmgruppe: 'Alt' })),
		...TENOR.map((m) => ({ ...m, stimmgruppe: 'Tenor' })),
		...BASS.map((m) => ({ ...m, stimmgruppe: 'Bass' })),
	];
	for (const [i, m] of all.entries()) {
		const id = rid('contacts', i);
		const fullName = `${m.firstName} ${m.lastName}`;
		const tags = [m.stimmgruppe, 'Aktiv'];
		const vorstandRolle = VORSTAND_FUNKTION.get(fullName);
		if (vorstandRolle) {
			tags.push('Vorstand', vorstandRolle);
		}
		emit({
			app_id: 'contacts',
			table_name: 'contacts',
			record_id: id,
			user_id: USER_ID,
			space_id: CLUB_SPACE_ID,
			op: 'insert',
			data: {
				id,
				firstName: m.firstName,
				lastName: m.lastName,
				tags,
				isFavorite: !!vorstandRolle,
				isArchived: false,
			},
		});
	}
	const dirigentId = rid('contacts', 'dirigent');
	emit({
		app_id: 'contacts',
		table_name: 'contacts',
		record_id: dirigentId,
		user_id: USER_ID,
		space_id: CLUB_SPACE_ID,
		op: 'insert',
		data: {
			id: dirigentId,
			firstName: CHORLEITER.firstName,
			lastName: CHORLEITER.lastName,
			tags: ['Chorleitung', 'Vorstand'],
			website: CHORLEITER.website,
			notes: CHORLEITER.bio,
			isFavorite: true,
			isArchived: false,
		},
	});
	const postfachId = rid('contacts', 'postfach');
	emit({
		app_id: 'contacts',
		table_name: 'contacts',
		record_id: postfachId,
		user_id: USER_ID,
		space_id: CLUB_SPACE_ID,
		op: 'insert',
		data: {
			id: postfachId,
			firstName: 'Vereinspostfach',
			lastName: 'chor tägerwilen',
			email: 'info@chor-taegerwilen.ch',
			phone: '+41 79 176 21 02',
			street: 'Hauptstrasse 142',
			postalCode: '8274',
			city: 'Tägerwilen',
			country: 'CH',
			website: 'https://www.chor-taegerwilen.ch',
			tags: ['Verein', 'Sammelpostfach'],
			isFavorite: true,
			isArchived: false,
		},
	});
}

// ─── calendar ───────────────────────────────────────────────

function emitCalendar(): void {
	const calId = rid('calendar', 'main');
	emit({
		app_id: 'calendar',
		table_name: 'calendars',
		record_id: calId,
		user_id: USER_ID,
		space_id: CLUB_SPACE_ID,
		op: 'insert',
		data: {
			id: calId,
			name: 'chor tägerwilen',
			color: '#7c3aed',
			isDefault: true,
			isVisible: true,
			timezone: 'Europe/Zurich',
		},
	});

	const writeBlockAndEvent = (
		key: string,
		dateISO: string,
		startTime: string,
		endTime: string,
		title: string,
		description: string,
		location: string,
		recurrenceRule: string | null = null
	): void => {
		const tbId = rid('timeblock', key);
		const evId = rid('event', key);
		const startISO = `${dateISO}T${startTime}:00.000+02:00`;
		const endISO = `${dateISO}T${endTime}:00.000+02:00`;
		emit({
			app_id: 'timeblocks',
			table_name: 'timeBlocks',
			record_id: tbId,
			user_id: USER_ID,
			space_id: CLUB_SPACE_ID,
			op: 'insert',
			data: {
				id: tbId,
				startDate: startISO,
				endDate: endISO,
				allDay: false,
				isLive: false,
				timezone: 'Europe/Zurich',
				recurrenceRule,
				kind: 'scheduled',
				type: 'event',
				sourceModule: 'calendar',
				sourceId: evId,
				linkedBlockId: null,
				title,
				description,
				color: null,
				icon: null,
				projectId: null,
			},
		});
		emit({
			app_id: 'calendar',
			table_name: 'events',
			record_id: evId,
			user_id: USER_ID,
			space_id: CLUB_SPACE_ID,
			op: 'insert',
			data: {
				id: evId,
				calendarId: calId,
				timeBlockId: tbId,
				title,
				description,
				location,
				color: null,
				tagIds: [],
			},
		});
	};

	writeBlockAndEvent(
		'probe-recurring',
		'2026-04-30',
		'20:00',
		'21:45',
		'Probe',
		'Wöchentliche Probe Donnerstag.',
		'Aula Sekundarschule Tägerwilen',
		'FREQ=WEEKLY;BYDAY=TH'
	);

	for (const t of TERMINE) {
		writeBlockAndEvent(
			`termin-${t.date}`,
			t.date,
			t.startTime,
			t.endTime,
			t.title,
			t.description,
			t.location
		);
	}

	for (const k of KONZERTE) {
		writeBlockAndEvent(
			`konzert-${k.date}-${k.startTime.replace(':', '')}`,
			k.date,
			k.startTime,
			k.endTime,
			k.title,
			k.description,
			k.location
		);
	}
}

// ─── socialEvent (1 publicly shared concert) ────────────────

function emitSocialEvent(): void {
	const k = KONZERTE[0];
	const tbId = rid('timeblock', 'social-konzert-1');
	const seId = rid('socialEvent', 'happy-together');
	const startISO = `${k.date}T${k.startTime}:00.000+01:00`;
	const endISO = `${k.date}T${k.endTime}:00.000+01:00`;

	emit({
		app_id: 'timeblocks',
		table_name: 'timeBlocks',
		record_id: tbId,
		user_id: USER_ID,
		space_id: CLUB_SPACE_ID,
		op: 'insert',
		data: {
			id: tbId,
			startDate: startISO,
			endDate: endISO,
			allDay: false,
			isLive: false,
			timezone: 'Europe/Zurich',
			recurrenceRule: null,
			kind: 'scheduled',
			type: 'event',
			sourceModule: 'events',
			sourceId: seId,
			linkedBlockId: null,
			title: k.title,
			description: k.description,
			color: null,
			icon: '🎶',
			projectId: null,
		},
	});

	const publicToken = `cht-happy-together-${Math.random().toString(36).slice(2, 10)}`;
	emit({
		app_id: 'events',
		table_name: 'socialEvents',
		record_id: seId,
		user_id: USER_ID,
		space_id: CLUB_SPACE_ID,
		op: 'insert',
		data: {
			id: seId,
			timeBlockId: tbId,
			title: k.title,
			description: `${k.description}\n\nGemeinsames Konzert mit dem Popchor Konstanz unter dem Motto "Zwei Chöre — ein Konzert". Eintritt frei, Kollekte für die Vereinsarbeit.`,
			location: k.location,
			capacity: null,
			isPublished: true,
			publicToken,
			status: 'published',
			visibility: 'public',
		},
	});
}

// ─── library ────────────────────────────────────────────────

function emitLibrary(): void {
	let i = 0;
	for (const w of REPERTOIRE) {
		const id = rid('library', `repertoire-${i}`);
		emit({
			app_id: 'library',
			table_name: 'libraryEntries',
			record_id: id,
			user_id: USER_ID,
			space_id: CLUB_SPACE_ID,
			op: 'insert',
			data: {
				id,
				kind: 'book',
				title: w.title,
				creator: w.composer,
				status: 'reading',
				rating: null,
				notes: w.notes ?? null,
				tags: ['Repertoire', 'Aktuell'],
			},
		});
		i++;
	}
	for (const a of KONZERT_ARCHIV) {
		const id = rid('library', `archiv-${a.year}-${i}`);
		emit({
			app_id: 'library',
			table_name: 'libraryEntries',
			record_id: id,
			user_id: USER_ID,
			space_id: CLUB_SPACE_ID,
			op: 'insert',
			data: {
				id,
				kind: 'book',
				title: a.title,
				creator: 'chor tägerwilen',
				status: 'completed',
				rating: null,
				notes: `Konzertprogramm ${a.year}.`,
				tags: ['Konzertarchiv', a.year],
			},
		});
		i++;
	}
}

// ─── notes ──────────────────────────────────────────────────

function emitNotes(): void {
	const notes = [
		{
			key: 'philosophie',
			title: 'Vereinsphilosophie',
			content: `# Singen macht Spass

Der chor tägerwilen ist eine bunte, fröhliche und gesellige Truppe, die das gemeinsame Singen liebt. Wert wird auf Singfreude und Genuss gelegt — ohne dabei den Anspruch an die Aufführungsqualität aufzugeben.

Konzerte werden meist von einer kleinen Band oder einem Streichensemble begleitet. Wolfgang Feucht (Chorleiter seit 11/2022) arbeitet mit der Methode Complete Vocal Technique und legt Wert auf gesunden Stimmgebrauch.

> Quelle: chor-taegerwilen.ch (Stand 2026-04-28)`,
		},
		{
			key: 'vorstand-2026',
			title: 'Vorstand 2026',
			content: `# Vorstand

- **Ralf Schneider** — Präsident (Tenor)
- **Monika Friemelt** — Kassierin (Alt)
- **Sonja Hegermann** — Aktuarin (Alt)
- **Nadine Ruf** — Sponsoring & Werbung (Sopran)
- **Liesbeth Zürcher** — Mitgliederbetreuung (Sopran)

Adresse Verein: c/o Ralf Schneider, Hauptstrasse 142, 8274 Tägerwilen.`,
		},
		{
			key: 'aktuelles-repertoire',
			title: 'Aktuelles Repertoire & Programm 2026',
			content: `# Programm Frühling/Sommer 2026

## Hauptwerk
- **Vivaldi Magnificat (RV 610/611)** — Hauptwerk der Saison

## Konzert-Termine
- **14./15.03.2026** — Frühlingskonzert „Happy Together" mit Popchor Konstanz, Bürgerhalle Tägerwilen
- **26.06.2026** — Chornacht / Konstanzer Chorfestival, Altkatholische Kirche St. Konrad
- **26.09.2026** — Herbstkonzert, Mehrzweckhalle Wollmatingen, Konstanz
- **Dezember 2026** — Zwei Adventskonzerte mit Streichorchester Divertimento

## Probenrhythmus
- Donnerstag 20:00–21:45 (Aula Sekundarschule Tägerwilen)
- 28.05. gemeinsame Probe mit Popchor Konstanz, Leitung Dirk Werner
- 04.06. Probe mit Streichensemble Divertimento + Apéro`,
		},
	];
	for (const n of notes) {
		const id = rid('note', n.key);
		emit({
			app_id: 'notes',
			table_name: 'notes',
			record_id: id,
			user_id: USER_ID,
			space_id: CLUB_SPACE_ID,
			op: 'insert',
			data: {
				id,
				title: n.title,
				content: n.content,
				color: null,
				isPinned: n.key === 'philosophie',
				isArchived: false,
			},
		});
	}
}

// ─── website ────────────────────────────────────────────────

function emitWebsite(): void {
	const websiteId = rid('website', 'main');
	emit({
		app_id: 'website',
		table_name: 'websites',
		record_id: websiteId,
		user_id: USER_ID,
		space_id: CLUB_SPACE_ID,
		op: 'insert',
		data: {
			id: websiteId,
			slug: 'chor-taegerwilen',
			name: 'chor tägerwilen',
			theme: { preset: 'classic', overrides: { primary: '#7c3aed' } },
			navConfig: {
				items: [
					{ label: 'Home', pagePath: '/' },
					{ label: 'Über uns', pagePath: '/ueber-uns' },
					{ label: 'Termine', pagePath: '/termine' },
					{ label: 'Kontakt', pagePath: '/kontakt' },
				],
			},
			footerConfig: {
				text: 'chor tägerwilen · gegründet 1880 · Singen macht Spass',
				links: [
					{ label: 'Impressum', href: '/impressum' },
					{ label: 'Original-Website', href: 'https://www.chor-taegerwilen.ch' },
				],
			},
			settings: {
				favicon: null,
				defaultSeo: {
					title: 'chor tägerwilen',
					description: 'Gemischter Chor aus Tägerwilen — gegründet 1880. Singen macht Spass.',
				},
			},
			publishedVersion: null,
			draftVersion: 1,
		},
	});

	const pages = [
		{
			key: 'home',
			path: '/',
			title: 'Home',
			order: 0,
			seo: { title: 'chor tägerwilen', description: 'Gemischter Chor aus Tägerwilen.' },
		},
		{
			key: 'ueber-uns',
			path: '/ueber-uns',
			title: 'Über uns',
			order: 1,
			seo: { title: 'Über uns — chor tägerwilen', description: 'Geschichte und Vorstand.' },
		},
		{
			key: 'termine',
			path: '/termine',
			title: 'Termine',
			order: 2,
			seo: { title: 'Termine — chor tägerwilen', description: 'Proben und Konzerte 2026.' },
		},
		{
			key: 'kontakt',
			path: '/kontakt',
			title: 'Kontakt',
			order: 3,
			seo: { title: 'Kontakt — chor tägerwilen', description: 'Kontakt aufnehmen.' },
		},
	];

	for (const p of pages) {
		const id = rid('page', p.key);
		emit({
			app_id: 'website',
			table_name: 'websitePages',
			record_id: id,
			user_id: USER_ID,
			space_id: CLUB_SPACE_ID,
			op: 'insert',
			data: { id, websiteId, path: p.path, title: p.title, order: p.order, seo: p.seo },
		});
	}

	const blocks = [
		{
			pageKey: 'home',
			type: 'hero',
			order: 0,
			props: {
				title: 'chor tägerwilen',
				subtitle: 'Singen macht Spass — seit 1880',
				cta: { label: 'Termine', href: '/termine' },
			},
		},
		{
			pageKey: 'home',
			type: 'richText',
			order: 1,
			props: {
				html: '<p>Eine bunte, fröhliche und gesellige Truppe von rund 55 Sängerinnen und Sängern aus 18 Ortschaften. Wir lieben das gemeinsame Singen und legen Wert auf Singfreude und Genuss. Konzerte werden meist von einer kleinen Band oder einem Streichensemble begleitet.</p>',
			},
		},
		{
			pageKey: 'home',
			type: 'cta',
			order: 2,
			props: {
				title: 'Frühlingskonzert „Happy Together"',
				body: '14. und 15. März 2026 — Bürgerhalle Tägerwilen — gemeinsam mit dem Popchor Konstanz.',
				button: { label: 'Mehr erfahren', href: '/termine' },
			},
		},
		{
			pageKey: 'ueber-uns',
			type: 'richText',
			order: 0,
			props: {
				html: '<h2>Geschichte</h2><p>Gegründet 1880. Statutarisch dokumentiert ab 1892. Mehrere Phasen mit unterschiedlichen Dirigenten — u.a. Walter Ammann (Ehrendirigent, 1946–1980). Seit November 2022 unter der Leitung von Wolfgang Feucht. 2011 Namensänderung von „Gemischter Chor" zu „chor tägerwilen". 2016 mit dem 125-Jahr-Jubiläum gefeiert.</p>',
			},
		},
		{
			pageKey: 'ueber-uns',
			type: 'richText',
			order: 1,
			props: {
				html: '<h2>Vorstand 2026</h2><ul><li>Ralf Schneider — Präsident</li><li>Monika Friemelt — Kassierin</li><li>Sonja Hegermann — Aktuarin</li><li>Nadine Ruf — Sponsoring &amp; Werbung</li><li>Liesbeth Zürcher — Mitgliederbetreuung</li></ul>',
			},
		},
		{
			pageKey: 'ueber-uns',
			type: 'richText',
			order: 2,
			props: {
				html: '<h2>Chorleitung</h2><p><strong>Wolfgang Feucht</strong> (seit November 2022). Studium Schulmusik mit Schwerpunkt Chorleitung; Aufbaustudium Chorpädagogik in Örebro (Schweden); Jazz- und Popularmusik-Pädagogik. Methode: Complete Vocal Technique.</p>',
			},
		},
		{
			pageKey: 'termine',
			type: 'richText',
			order: 0,
			props: {
				html: '<h2>Konzerte 2026</h2><ul><li><strong>14./15.03.</strong> — Frühlingskonzert „Happy Together", Bürgerhalle Tägerwilen, mit Popchor Konstanz</li><li><strong>26.06.</strong> — Chornacht / Konstanzer Chorfestival</li><li><strong>26.09.</strong> — Herbstkonzert, Mehrzweckhalle Wollmatingen, Konstanz</li><li><strong>Dezember</strong> — Zwei Adventskonzerte mit Streichorchester Divertimento</li></ul>',
			},
		},
		{
			pageKey: 'termine',
			type: 'richText',
			order: 1,
			props: {
				html: '<h2>Probe</h2><p>Donnerstag 20:00–21:45, Aula Sekundarschule Tägerwilen.</p>',
			},
		},
		{
			pageKey: 'kontakt',
			type: 'richText',
			order: 0,
			props: {
				html: '<h2>Kontakt</h2><p><strong>chor tägerwilen</strong><br>c/o Ralf Schneider<br>Hauptstrasse 142<br>CH-8274 Tägerwilen</p><p>E-Mail: <a href="mailto:info@chor-taegerwilen.ch">info@chor-taegerwilen.ch</a><br>Telefon: +41 79 176 21 02</p>',
			},
		},
	];

	let bIdx = 0;
	for (const b of blocks) {
		const id = rid('block', `${b.pageKey}-${bIdx}`);
		const pageId = rid('page', b.pageKey);
		emit({
			app_id: 'website',
			table_name: 'websiteBlocks',
			record_id: id,
			user_id: USER_ID,
			space_id: CLUB_SPACE_ID,
			op: 'insert',
			data: {
				id,
				websiteId,
				pageId,
				parentBlockId: null,
				type: b.type,
				props: b.props,
				order: b.order,
			},
		});
		bIdx++;
	}
}

// ─── ai-missions ────────────────────────────────────────────

function emitAiMissions(): void {
	const missions = [
		{
			key: 'probenrueckblick',
			title: 'Probenrückblick',
			objective:
				'Lies die letzten Probenotizen aus dem notes-Modul und schreibe eine kurze Zusammenfassung als neue Notiz.',
			cadence: 'WEEKLY',
		},
		{
			key: 'newsletter-entwurf',
			title: 'Newsletter-Entwurf monatlich',
			objective:
				'Lies Termine und Notizen der letzten 4 Wochen. Schreibe einen freundlichen Vereinsnewsletter-Entwurf im Tonfall „Singen macht Spass" als broadcast-Entwurf.',
			cadence: 'MONTHLY',
		},
		{
			key: 'geburtstagsgruesse',
			title: 'Geburtstagsgrüsse-Entwurf',
			objective:
				'Prüfe Geburtstage der nächsten 7 Tage und schreibe einen kurzen Glückwunsch-Entwurf pro Mitglied. (Aktuell sind keine Geburtstage hinterlegt.)',
			cadence: 'DAILY',
		},
	];

	for (const m of missions) {
		const id = rid('mission', m.key);
		emit({
			app_id: 'ai',
			table_name: 'aiMissions',
			record_id: id,
			user_id: USER_ID,
			space_id: CLUB_SPACE_ID,
			op: 'insert',
			data: {
				id,
				title: m.title,
				objective: m.objective,
				status: 'paused',
				cadence: m.cadence,
				inputs: [],
				ownerAgentId: null,
			},
		});
	}
}

// ─── Main ───────────────────────────────────────────────────

async function main(): Promise<void> {
	console.log('🎵 Chor Tägerwilen — Persona Seed');
	console.log(`   user:     ${USER_ID}`);
	console.log(`   personal: ${PERSONAL_SPACE_ID}`);
	console.log(`   club:     ${CLUB_SPACE_ID}`);
	console.log('');

	await setRlsContext();
	await cleanupPriorSeed();

	console.log('→ kontextDoc');
	emitKontextDoc();
	await flushAll();

	console.log('→ contacts (Mitglieder + Vorstand + Chorleiter + Postfach)');
	emitContacts();
	await flushAll();

	console.log('→ calendar (1 Hauptkalender + recurring + 7 Probetermine + 5 Konzerte)');
	emitCalendar();
	await flushAll();

	console.log('→ events (1 öffentliches Konzert mit Public-Token)');
	emitSocialEvent();
	await flushAll();

	console.log('→ library (Repertoire + Konzertarchiv)');
	emitLibrary();
	await flushAll();

	console.log('→ notes (3)');
	emitNotes();
	await flushAll();

	console.log('→ website (1 site + 4 pages + 9 blocks)');
	emitWebsite();
	await flushAll();

	console.log('→ ai-missions (3 paused)');
	emitAiMissions();
	await flushAll();

	console.log('');
	console.log('✓ Done. Login at https://mana.how/login as chor-taegerwilen@mana.how');
}

main()
	.catch((err) => {
		console.error('❌ Seed failed:', err);
		process.exit(1);
	})
	.finally(() => sql.end());
