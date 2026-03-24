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
		{
			name: 'Konstanzer Münster',
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
			category: 'sight',
			description:
				'Die Imperia ist eine satirische Skulptur des Bildhauers Peter Lenk im Hafen von Konstanz. Sie dreht sich langsam um die eigene Achse.',
			address: 'Hafenstraße, 78462 Konstanz',
			latitude: 47.6596,
			longitude: 9.1784,
			imageUrl: '/images/imperia.jpg',
			timeline: [{ year: '1993', event: 'Aufstellung im Hafen' }],
		},
		{
			name: 'Restaurant Ophelia',
			category: 'restaurant',
			description:
				'Fine-Dining-Restaurant im Riva-Gebäude am Konstanzer Hafen mit Blick auf den Bodensee.',
			address: 'Seestraße 25, 78464 Konstanz',
			latitude: 47.6589,
			longitude: 9.1795,
			imageUrl: '/images/ophelia.jpg',
		},
		{
			name: 'LAGO Shopping Center',
			category: 'shop',
			description: 'Großes Einkaufszentrum in der Konstanzer Innenstadt mit über 80 Geschäften.',
			address: 'Bodanstraße 1, 78462 Konstanz',
			latitude: 47.6615,
			longitude: 9.1742,
			imageUrl: '/images/lago.jpg',
		},
		{
			name: 'Rosgartenmuseum',
			category: 'museum',
			description:
				'Das Rosgartenmuseum zeigt die Geschichte der Stadt Konstanz und der Bodenseeregion.',
			address: 'Rosgartenstraße 3-5, 78462 Konstanz',
			latitude: 47.6612,
			longitude: 9.1753,
		},
		{
			name: 'Archäologisches Landesmuseum',
			category: 'museum',
			description: 'Landesmuseum für Archäologie in Baden-Württemberg mit Funden aus der Region.',
			address: 'Benediktinerplatz 5, 78467 Konstanz',
			latitude: 47.6637,
			longitude: 9.1801,
		},
	]);

	console.log('Seeded 6 locations.');
	await connection.end();
}

seed().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
