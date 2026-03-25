import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { locations } from './schema';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const postgres = require('postgres');

const databaseUrl =
	process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/citycorners';

async function seed() {
	const connection = postgres(databaseUrl);
	const db = drizzle(connection);

	console.log('Seeding citycorners database...');

	await db.insert(locations).values([
		// === SIGHTS ===
		{
			name: 'Konstanzer Münster',
			slug: 'konstanzer-muenster',
			category: 'sight',
			description:
				'Das Konstanzer Münster ist eine römisch-katholische Basilika in der Altstadt von Konstanz. Der Bau begann im Jahr 615 und wurde im Laufe der Jahrhunderte mehrmals erweitert.',
			address: 'Münsterplatz 1, 78462 Konstanz',
			latitude: 47.6603,
			longitude: 9.1757,
			imageUrl: '/images/muenster.jpg',
			timeline: [
				{ year: '615', event: 'Grundsteinlegung' },
				{ year: '1089', event: 'Romanischer Neubau' },
				{ year: '1414-1418', event: 'Konzil von Konstanz' },
			],
		},
		{
			name: 'Imperia',
			slug: 'imperia',
			category: 'sight',
			description:
				'Die Imperia ist eine satirische Skulptur des Bildhauers Peter Lenk im Hafen von Konstanz. Sie dreht sich langsam um die eigene Achse.',
			address: 'Hafenstraße, 78462 Konstanz',
			latitude: 47.6596,
			longitude: 9.1784,
			imageUrl: '/images/imperia.jpg',
			timeline: [{ year: '1993', event: 'Aufstellung im Hafen' }],
		},

		// === RESTAURANTS ===
		{
			name: 'Restaurant Ophelia',
			slug: 'restaurant-ophelia',
			category: 'restaurant',
			description:
				'Fine-Dining-Restaurant im Riva-Gebäude am Konstanzer Hafen mit Blick auf den Bodensee.',
			address: 'Seestraße 25, 78464 Konstanz',
			latitude: 47.6589,
			longitude: 9.1795,
			imageUrl: '/images/ophelia.jpg',
			openingHours: {
				mo: 'closed',
				tu: 'closed',
				we: '18:30 - 22:00',
				th: '18:30 - 22:00',
				fr: '18:30 - 22:00',
				sa: '18:30 - 22:00',
				su: 'closed',
			},
		},

		// === SHOPS ===
		{
			name: 'LAGO Shopping Center',
			slug: 'lago-shopping-center',
			category: 'shop',
			description: 'Großes Einkaufszentrum in der Konstanzer Innenstadt mit über 80 Geschäften.',
			address: 'Bodanstraße 1, 78462 Konstanz',
			latitude: 47.6615,
			longitude: 9.1742,
			imageUrl: '/images/lago.jpg',
			openingHours: {
				mo: '09:30 - 20:00',
				tu: '09:30 - 20:00',
				we: '09:30 - 20:00',
				th: '09:30 - 20:00',
				fr: '09:30 - 20:00',
				sa: '09:30 - 20:00',
				su: 'closed',
			},
		},

		// === MUSEUMS ===
		{
			name: 'Rosgartenmuseum',
			slug: 'rosgartenmuseum',
			category: 'museum',
			description:
				'Das Rosgartenmuseum zeigt die Geschichte der Stadt Konstanz und der Bodenseeregion.',
			address: 'Rosgartenstraße 3-5, 78462 Konstanz',
			latitude: 47.6612,
			longitude: 9.1753,
			openingHours: {
				mo: 'closed',
				tu: '10:00 - 18:00',
				we: '10:00 - 18:00',
				th: '10:00 - 18:00',
				fr: '10:00 - 18:00',
				sa: '10:00 - 17:00',
				su: '10:00 - 17:00',
			},
		},
		{
			name: 'Archäologisches Landesmuseum',
			slug: 'archaeologisches-landesmuseum',
			category: 'museum',
			description: 'Landesmuseum für Archäologie in Baden-Württemberg mit Funden aus der Region.',
			address: 'Benediktinerplatz 5, 78467 Konstanz',
			latitude: 47.6637,
			longitude: 9.1801,
			openingHours: {
				mo: 'closed',
				tu: '10:00 - 18:00',
				we: '10:00 - 18:00',
				th: '10:00 - 18:00',
				fr: '10:00 - 18:00',
				sa: '10:00 - 18:00',
				su: '10:00 - 18:00',
			},
		},

		// === CAFÉS ===
		{
			name: 'Café Zeitlos',
			slug: 'cafe-zeitlos',
			category: 'cafe',
			description:
				'Gemütliches Café in der Konstanzer Altstadt mit hausgemachten Kuchen, Frühstück und einer großen Auswahl an Kaffeespezialitäten.',
			address: 'Hussenstraße 13, 78462 Konstanz',
			latitude: 47.6609,
			longitude: 9.1749,
			openingHours: {
				mo: '08:00 - 18:00',
				tu: '08:00 - 18:00',
				we: '08:00 - 18:00',
				th: '08:00 - 18:00',
				fr: '08:00 - 18:00',
				sa: '09:00 - 18:00',
				su: '10:00 - 17:00',
			},
		},
		{
			name: 'Café Wessenberg',
			slug: 'cafe-wessenberg',
			category: 'cafe',
			description:
				'Traditionsreiches Café im Herzen von Konstanz mit Terrasse und Blick auf die Altstadt. Bekannt für Torten und Frühstücksbuffet.',
			address: 'Wessenbergstraße 41, 78462 Konstanz',
			latitude: 47.6614,
			longitude: 9.1739,
			openingHours: {
				mo: '07:30 - 18:30',
				tu: '07:30 - 18:30',
				we: '07:30 - 18:30',
				th: '07:30 - 18:30',
				fr: '07:30 - 18:30',
				sa: '08:00 - 18:00',
				su: '09:00 - 17:00',
			},
		},
		{
			name: 'Café Gessler 1159',
			slug: 'cafe-gessler-1159',
			category: 'cafe',
			description:
				'Modernes Café und Bäckerei mit langer Tradition. Frisches Gebäck, Snacks und Kaffeespezialitäten in zentraler Lage.',
			address: 'Bodanstraße 9, 78462 Konstanz',
			latitude: 47.6608,
			longitude: 9.173,
			openingHours: {
				mo: '06:30 - 19:00',
				tu: '06:30 - 19:00',
				we: '06:30 - 19:00',
				th: '06:30 - 19:00',
				fr: '06:30 - 19:00',
				sa: '07:00 - 18:00',
				su: '08:00 - 17:00',
			},
		},
		{
			name: 'Voglhaus Café',
			slug: 'voglhaus-cafe',
			category: 'cafe',
			description:
				'Beliebtes Bio-Café mit vegetarischer und veganer Küche. Kreative Frühstücksgerichte und selbstgemachte Limonaden.',
			address: 'Wessenbergstraße 8, 78462 Konstanz',
			latitude: 47.6619,
			longitude: 9.1744,
			openingHours: {
				mo: '09:00 - 18:00',
				tu: '09:00 - 18:00',
				we: '09:00 - 18:00',
				th: '09:00 - 18:00',
				fr: '09:00 - 18:00',
				sa: '09:00 - 18:00',
				su: '10:00 - 17:00',
			},
		},
		{
			name: 'Café Herr Hase',
			slug: 'cafe-herr-hase',
			category: 'cafe',
			description:
				'Kleines Specialty-Coffee-Café in der Niederburg. Third-Wave-Kaffee, Matcha und hausgemachte Leckereien.',
			address: 'Niederburggasse 2, 78462 Konstanz',
			latitude: 47.6623,
			longitude: 9.1762,
			openingHours: {
				mo: '08:30 - 17:00',
				tu: '08:30 - 17:00',
				we: '08:30 - 17:00',
				th: '08:30 - 17:00',
				fr: '08:30 - 17:00',
				sa: '09:00 - 17:00',
				su: 'closed',
			},
		},

		// === BARS ===
		{
			name: 'Klimperkasten',
			slug: 'klimperkasten',
			category: 'bar',
			description:
				'Kultige Kneipe und Bar in der Altstadt mit Live-Musik, Cocktails und lockerer Atmosphäre. Treffpunkt für Studierende und Nachtschwärmer.',
			address: 'Bodanstraße 18, 78462 Konstanz',
			latitude: 47.6611,
			longitude: 9.1736,
			openingHours: {
				mo: '18:00 - 01:00',
				tu: '18:00 - 01:00',
				we: '18:00 - 01:00',
				th: '18:00 - 02:00',
				fr: '18:00 - 03:00',
				sa: '18:00 - 03:00',
				su: 'closed',
			},
		},
		{
			name: 'Shamrock Irish Pub',
			slug: 'shamrock-irish-pub',
			category: 'bar',
			description:
				'Irischer Pub mit großer Bierauswahl, Live-Sportübertragungen und regelmäßigen Quiz-Abenden. Seit Jahren eine Institution.',
			address: 'Bodanstraße 28, 78462 Konstanz',
			latitude: 47.6607,
			longitude: 9.1728,
			openingHours: {
				mo: '17:00 - 01:00',
				tu: '17:00 - 01:00',
				we: '17:00 - 01:00',
				th: '17:00 - 01:00',
				fr: '17:00 - 02:00',
				sa: '15:00 - 02:00',
				su: '15:00 - 00:00',
			},
		},
		{
			name: 'Seekuh',
			slug: 'seekuh',
			category: 'bar',
			description:
				'Legendäre Konstanzer Bar und Kulturkneipe am Seerhein. Craft Beer, Cocktails und regelmäßig Konzerte auf kleiner Bühne.',
			address: 'Konradigasse 1, 78462 Konstanz',
			latitude: 47.6632,
			longitude: 9.1773,
			openingHours: {
				mo: '17:00 - 01:00',
				tu: '17:00 - 01:00',
				we: '17:00 - 01:00',
				th: '17:00 - 02:00',
				fr: '17:00 - 03:00',
				sa: '15:00 - 03:00',
				su: '15:00 - 00:00',
			},
		},
		{
			name: 'Brauhaus Johann Albrecht',
			slug: 'brauhaus-johann-albrecht',
			category: 'bar',
			description:
				'Brauhaus-Restaurant mit hauseigenem Bier direkt am Seerhein. Deftige Küche und frisch gebrautes Bier in historischem Ambiente.',
			address: 'Konradigasse 2, 78462 Konstanz',
			latitude: 47.663,
			longitude: 9.177,
			openingHours: {
				mo: '11:00 - 23:00',
				tu: '11:00 - 23:00',
				we: '11:00 - 23:00',
				th: '11:00 - 23:00',
				fr: '11:00 - 00:00',
				sa: '11:00 - 00:00',
				su: '11:00 - 22:00',
			},
		},
		{
			name: 'Schwarze Katz',
			slug: 'schwarze-katz',
			category: 'bar',
			description:
				'Kleine, gemütliche Bar in der Katzgasse mit kreativen Cocktails und einer großen Gin-Auswahl. Perfekt für einen entspannten Abend.',
			address: 'Katzgasse 7, 78462 Konstanz',
			latitude: 47.6617,
			longitude: 9.1752,
			openingHours: {
				mo: 'closed',
				tu: '19:00 - 01:00',
				we: '19:00 - 01:00',
				th: '19:00 - 02:00',
				fr: '19:00 - 03:00',
				sa: '19:00 - 03:00',
				su: 'closed',
			},
		},

		// === PARKS ===
		{
			name: 'Stadtgarten Konstanz',
			slug: 'stadtgarten-konstanz',
			category: 'park',
			description:
				'Großer Park direkt am Bodenseeufer mit altem Baumbestand, Spielplätzen, Minigolf und Biergarten. Der beliebteste Erholungsort der Stadt.',
			address: 'Seestraße, 78464 Konstanz',
			latitude: 47.6582,
			longitude: 9.1812,
		},
		{
			name: 'Herosé-Park',
			slug: 'herose-park',
			category: 'park',
			description:
				'Ruhiger Park am Seerhein mit Liegewiesen, Grillplätzen und Rheinuferweg. Ideal zum Joggen, Grillen oder Entspannen.',
			address: 'Herosé-Park, 78467 Konstanz',
			latitude: 47.6676,
			longitude: 9.1699,
		},
		{
			name: 'Lorettowald',
			slug: 'lorettowald',
			category: 'park',
			description:
				'Bewaldeter Hügel im Süden von Konstanz mit Wanderwegen und Aussichtspunkten über den Bodensee. Beliebt bei Joggern und Spaziergängern.',
			address: 'Lorettostraße, 78464 Konstanz',
			latitude: 47.6524,
			longitude: 9.1768,
		},
		{
			name: 'Bücklepark',
			slug: 'buecklepark',
			category: 'park',
			description:
				'Kleiner, gepflegter Park nahe der Universität mit Spielplatz und schattigem Baumbestand. Ein ruhiges Plätzchen abseits des Trubels.',
			address: 'Bücklestraße, 78467 Konstanz',
			latitude: 47.6672,
			longitude: 9.1726,
		},
		{
			name: 'Rheinsteig-Promenade',
			slug: 'rheinsteig-promenade',
			category: 'park',
			description:
				'Landschaftlich reizvoller Uferweg entlang des Seerheins von der Altstadt bis Petershausen. Perfekt für Spaziergänge und Radtouren.',
			address: 'Rheinsteig, 78462 Konstanz',
			latitude: 47.6641,
			longitude: 9.1753,
		},

		// === BEACHES ===
		{
			name: 'Strandbad Horn',
			slug: 'strandbad-horn',
			category: 'beach',
			description:
				'Eines der größten Freibäder am Bodensee mit großer Liegewiese, Sandstrand, Sprungturm und Beachvolleyball. Traumhafter Seeblick.',
			address: 'Eichhornstraße 100, 78464 Konstanz',
			latitude: 47.6527,
			longitude: 9.201,
		},
		{
			name: 'Freibad Hörnle',
			slug: 'freibad-hoernle',
			category: 'beach',
			description:
				'Beliebtes Strandbad an der Spitze der Halbinsel Horn mit flachem Einstieg, ideal für Familien. Kiosk und Liegewiesen vorhanden.',
			address: 'Hörnleweg, 78464 Konstanz',
			latitude: 47.6487,
			longitude: 9.207,
		},
		{
			name: 'Rheinstrandbad',
			slug: 'rheinstrandbad',
			category: 'beach',
			description:
				'Freibad am Seerhein mit beheiztem Becken und Flusszugang. Seit den 1930er-Jahren ein Konstanzer Klassiker.',
			address: 'Schlosserstraße 18, 78467 Konstanz',
			latitude: 47.671,
			longitude: 9.1661,
		},
		{
			name: 'Freibad Jakob',
			slug: 'freibad-jakob',
			category: 'beach',
			description:
				'Familiäres Freibad im Stadtteil Petershausen mit Bodenseezugang, Nichtschwimmerbecken und großer Liegewiese.',
			address: 'Jakobstraße 153, 78467 Konstanz',
			latitude: 47.6723,
			longitude: 9.1592,
		},
		{
			name: 'Schmugglerbucht',
			slug: 'schmugglerbucht',
			category: 'beach',
			description:
				'Kleine, versteckte Badestelle unterhalb der Seestraße. Bei Einheimischen beliebt als Geheimtipp zum Schwimmen im Bodensee.',
			address: 'Seestraße, 78464 Konstanz',
			latitude: 47.6561,
			longitude: 9.186,
		},

		// === HOTELS ===
		{
			name: 'Steigenberger Inselhotel',
			slug: 'steigenberger-inselhotel',
			category: 'hotel',
			description:
				'Luxushotel in einem ehemaligen Dominikanerkloster auf einer Insel im Bodensee. Eines der historischsten Hotels Deutschlands.',
			address: 'Auf der Insel 1, 78462 Konstanz',
			latitude: 47.6598,
			longitude: 9.181,
			timeline: [
				{ year: '1235', event: 'Gründung als Dominikanerkloster' },
				{ year: '1875', event: 'Umbau zum Hotel' },
			],
		},
		{
			name: 'Hotel Riva',
			slug: 'hotel-riva',
			category: 'hotel',
			description:
				'Modernes Designhotel direkt am Bodenseeufer. Beherbergt das Sternerestaurant Ophelia und bietet einen eigenen Spa-Bereich.',
			address: 'Seestraße 25, 78464 Konstanz',
			latitude: 47.6589,
			longitude: 9.1795,
		},
		{
			name: 'Hotel Halm',
			slug: 'hotel-halm',
			category: 'hotel',
			description:
				'Traditionsreiches Vier-Sterne-Hotel am Bahnhof mit eleganten Zimmern, Restaurant und zentraler Lage für Stadterkundungen.',
			address: 'Bahnhofplatz 6, 78462 Konstanz',
			latitude: 47.6586,
			longitude: 9.1717,
		},
		{
			name: 'Hotel Barbarossa',
			slug: 'hotel-barbarossa',
			category: 'hotel',
			description:
				'Historisches Boutique-Hotel am Obermarkt mitten in der Altstadt. Individuell gestaltete Zimmer in einem Gebäude aus dem 15. Jahrhundert.',
			address: 'Obermarkt 8-12, 78462 Konstanz',
			latitude: 47.6621,
			longitude: 9.1746,
			timeline: [{ year: '1419', event: 'Erstmalige urkundliche Erwähnung' }],
		},
		{
			name: 'Hotel Viva Sky',
			slug: 'hotel-viva-sky',
			category: 'hotel',
			description:
				'Modernes Hotel nahe der Altstadt mit Rooftop-Bar und Blick über die Dächer von Konstanz bis zum Bodensee.',
			address: 'Sigismundstraße 19, 78462 Konstanz',
			latitude: 47.6597,
			longitude: 9.173,
		},

		// === EVENT VENUES ===
		{
			name: 'Konzil Konstanz',
			slug: 'konzil-konstanz',
			category: 'event_venue',
			description:
				'Historisches Konzilgebäude am Hafen, in dem 1417 das Konklave zur Papstwahl stattfand. Heute Veranstaltungshalle und Restaurant.',
			address: 'Hafenstraße 2, 78462 Konstanz',
			latitude: 47.6596,
			longitude: 9.178,
			timeline: [
				{ year: '1388', event: 'Erbaut als Kaufhaus' },
				{ year: '1414-1418', event: 'Tagungsort des Konzils' },
			],
		},
		{
			name: 'Stadttheater Konstanz',
			slug: 'stadttheater-konstanz',
			category: 'event_venue',
			description:
				'Das Theater Konstanz ist eines der ältesten aktiven Theater Deutschlands. Schauspiel, Musiktheater und Junges Theater auf mehreren Bühnen.',
			address: 'Konzilstraße 11, 78462 Konstanz',
			latitude: 47.6593,
			longitude: 9.177,
		},
		{
			name: 'Bodenseeforum',
			slug: 'bodenseeforum',
			category: 'event_venue',
			description:
				'Modernes Kongress- und Veranstaltungszentrum direkt am Seerhein. Konferenzen, Messen, Konzerte und kulturelle Events.',
			address: 'Reichenaustraße 21, 78467 Konstanz',
			latitude: 47.6652,
			longitude: 9.172,
		},
		{
			name: 'Spiegelhalle',
			slug: 'spiegelhalle',
			category: 'event_venue',
			description:
				'Spielstätte des Stadttheaters für experimentelles Theater, Lesungen und Kleinkunst. Intimere Atmosphäre als das Haupthaus.',
			address: 'Sigismundstraße 11, 78462 Konstanz',
			latitude: 47.66,
			longitude: 9.1735,
		},
		{
			name: 'Kulturzentrum am Münster',
			slug: 'kulturzentrum-am-muenster',
			category: 'event_venue',
			description:
				'Kulturelles Veranstaltungszentrum neben dem Münster mit wechselnden Ausstellungen, Vorträgen und Kulturprogramm.',
			address: 'Wessenbergstraße 43, 78462 Konstanz',
			latitude: 47.661,
			longitude: 9.1755,
		},

		// === VIEWPOINTS ===
		{
			name: 'Münsterturm-Aussichtsplattform',
			slug: 'muensterturm-aussicht',
			category: 'viewpoint',
			description:
				'Nach 193 Stufen erreicht man die Aussichtsplattform des Münsterturms mit 360°-Panorama über Konstanz, den Bodensee und bei klarer Sicht bis zu den Alpen.',
			address: 'Münsterplatz 1, 78462 Konstanz',
			latitude: 47.6603,
			longitude: 9.1757,
		},
		{
			name: 'Bismarckturm',
			slug: 'bismarckturm',
			category: 'viewpoint',
			description:
				'Historischer Aussichtsturm auf einer Anhöhe im Konstanzer Stadtteil Litzelstetten. Weiter Blick über den Überlinger See und die Insel Mainau.',
			address: 'Bismarckturm, 78465 Konstanz-Litzelstetten',
			latitude: 47.693,
			longitude: 9.2052,
			timeline: [{ year: '1914', event: 'Einweihung des Turms' }],
		},
		{
			name: 'Seerheinsteg',
			slug: 'seerheinsteg',
			category: 'viewpoint',
			description:
				'Fußgängerbrücke über den Seerhein mit freiem Blick auf die Altstadt, das Münster und den Rheinabfluss aus dem Bodensee.',
			address: 'Seerheinsteg, 78462 Konstanz',
			latitude: 47.6638,
			longitude: 9.1748,
		},
		{
			name: 'Lorettowald Aussichtspunkt',
			slug: 'lorettowald-aussichtspunkt',
			category: 'viewpoint',
			description:
				'Aussichtspunkt im Lorettowald über den Baumkronen. Blick auf den westlichen Bodensee, die Schweizer Alpen und die Altstadt.',
			address: 'Lorettostraße, 78464 Konstanz',
			latitude: 47.6518,
			longitude: 9.1755,
		},
		{
			name: 'Hörnle-Spitze',
			slug: 'hoernle-spitze',
			category: 'viewpoint',
			description:
				'Äußerste Spitze der Halbinsel Horn mit unverbautem 180°-Panorama über den Bodensee. Besonders beeindruckend bei Sonnenuntergang.',
			address: 'Hörnleweg, 78464 Konstanz',
			latitude: 47.648,
			longitude: 9.2085,
		},
	]);

	console.log('Seeded 41 locations.');
	await connection.end();
}

seed().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
