import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { contacts } from './schema';

const DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/contacts';

// User ID - can be set via environment variable or defaults to test user
const USER_ID = process.env.SEED_USER_ID || 'seed-user-001';

interface SeedContact {
	firstName: string;
	lastName: string;
	email?: string;
	phone?: string;
	mobile?: string;
	company?: string;
	jobTitle?: string;
	street?: string;
	city?: string;
	postalCode?: string;
	country?: string;
	notes?: string;
	isFavorite?: boolean;
}

const seedContacts: SeedContact[] = [
	// Tech Industry
	{
		firstName: 'Anna',
		lastName: 'Müller',
		email: 'anna.mueller@techstartup.de',
		phone: '+49 30 12345678',
		mobile: '+49 170 1234567',
		company: 'TechStartup GmbH',
		jobTitle: 'CEO',
		street: 'Alexanderplatz 1',
		city: 'Berlin',
		postalCode: '10178',
		country: 'Deutschland',
		notes: 'Kennengelernt auf der TechConf 2024. Interessiert an AI-Lösungen.',
		isFavorite: true,
	},
	{
		firstName: 'Max',
		lastName: 'Schmidt',
		email: 'max.schmidt@devhouse.io',
		phone: '+49 89 98765432',
		mobile: '+49 171 9876543',
		company: 'DevHouse Solutions',
		jobTitle: 'Lead Developer',
		street: 'Marienplatz 8',
		city: 'München',
		postalCode: '80331',
		country: 'Deutschland',
		notes: 'Full-Stack Entwickler, spezialisiert auf React und Node.js',
		isFavorite: true,
	},
	{
		firstName: 'Sophie',
		lastName: 'Weber',
		email: 'sophie.weber@cloudify.com',
		mobile: '+49 172 5551234',
		company: 'Cloudify AG',
		jobTitle: 'Cloud Architect',
		city: 'Hamburg',
		country: 'Deutschland',
	},
	{
		firstName: 'Felix',
		lastName: 'Becker',
		email: 'felix.becker@datainsights.de',
		phone: '+49 69 44556677',
		company: 'Data Insights',
		jobTitle: 'Data Scientist',
		street: 'Zeil 15',
		city: 'Frankfurt',
		postalCode: '60313',
		country: 'Deutschland',
		notes: 'Machine Learning Experte',
	},
	{
		firstName: 'Laura',
		lastName: 'Klein',
		email: 'laura.klein@uxdesign.studio',
		mobile: '+49 173 8889990',
		company: 'UX Design Studio',
		jobTitle: 'UX Designer',
		city: 'Köln',
		country: 'Deutschland',
		isFavorite: true,
	},

	// Business & Finance
	{
		firstName: 'Thomas',
		lastName: 'Hoffmann',
		email: 'thomas.hoffmann@financeplus.de',
		phone: '+49 211 7778899',
		mobile: '+49 174 1112233',
		company: 'FinancePlus Consulting',
		jobTitle: 'Managing Director',
		street: 'Königsallee 27',
		city: 'Düsseldorf',
		postalCode: '40212',
		country: 'Deutschland',
		notes: 'Spezialist für Unternehmensfinanzierung',
	},
	{
		firstName: 'Julia',
		lastName: 'Fischer',
		email: 'julia.fischer@legalexperts.de',
		phone: '+49 30 5556789',
		company: 'Legal Experts',
		jobTitle: 'Rechtsanwältin',
		city: 'Berlin',
		country: 'Deutschland',
		notes: 'Spezialisiert auf IT-Recht und Datenschutz',
	},
	{
		firstName: 'Michael',
		lastName: 'Wagner',
		email: 'm.wagner@investcorp.de',
		phone: '+49 89 3334455',
		mobile: '+49 175 6667788',
		company: 'InvestCorp',
		jobTitle: 'Investment Manager',
		city: 'München',
		country: 'Deutschland',
		isFavorite: true,
	},
	{
		firstName: 'Christina',
		lastName: 'Braun',
		email: 'christina.braun@taxadvisors.de',
		phone: '+49 711 9998877',
		company: 'Tax Advisors Stuttgart',
		jobTitle: 'Steuerberaterin',
		street: 'Königstraße 42',
		city: 'Stuttgart',
		postalCode: '70173',
		country: 'Deutschland',
	},

	// Creative & Media
	{
		firstName: 'David',
		lastName: 'Zimmermann',
		email: 'david@creativemind.agency',
		mobile: '+49 176 2223344',
		company: 'CreativeMind Agency',
		jobTitle: 'Creative Director',
		city: 'Berlin',
		country: 'Deutschland',
		notes: 'Award-winning Kreativagentur für Branding',
	},
	{
		firstName: 'Nina',
		lastName: 'Krause',
		email: 'nina.krause@mediahouse.de',
		phone: '+49 40 1234000',
		company: 'MediaHouse Hamburg',
		jobTitle: 'Content Manager',
		city: 'Hamburg',
		country: 'Deutschland',
	},
	{
		firstName: 'Patrick',
		lastName: 'Lehmann',
		email: 'patrick@photostudio.com',
		mobile: '+49 177 4445566',
		company: 'Lehmann Fotografie',
		jobTitle: 'Fotograf',
		city: 'Köln',
		country: 'Deutschland',
		notes: 'Spezialisiert auf Produktfotografie und Events',
		isFavorite: true,
	},

	// Healthcare
	{
		firstName: 'Dr. Sarah',
		lastName: 'König',
		email: 'dr.koenig@praxis-koenig.de',
		phone: '+49 30 8889900',
		company: 'Praxis Dr. König',
		jobTitle: 'Allgemeinmedizinerin',
		street: 'Friedrichstraße 120',
		city: 'Berlin',
		postalCode: '10117',
		country: 'Deutschland',
	},
	{
		firstName: 'Dr. Martin',
		lastName: 'Schäfer',
		email: 'martin.schaefer@klinikum.de',
		phone: '+49 89 4445500',
		company: 'Klinikum München',
		jobTitle: 'Oberarzt Kardiologie',
		city: 'München',
		country: 'Deutschland',
	},

	// Education
	{
		firstName: 'Prof. Elisabeth',
		lastName: 'Hartmann',
		email: 'hartmann@uni-berlin.de',
		phone: '+49 30 9876000',
		company: 'Freie Universität Berlin',
		jobTitle: 'Professorin für Informatik',
		city: 'Berlin',
		country: 'Deutschland',
		notes: 'Forschungsschwerpunkt: Künstliche Intelligenz',
	},
	{
		firstName: 'Andreas',
		lastName: 'Richter',
		email: 'a.richter@gymnasium.de',
		phone: '+49 711 5554433',
		company: 'Schiller-Gymnasium',
		jobTitle: 'Schulleiter',
		city: 'Stuttgart',
		country: 'Deutschland',
	},

	// Retail & Gastronomy
	{
		firstName: 'Stefanie',
		lastName: 'Wolf',
		email: 'stefanie@wolfs-bistro.de',
		phone: '+49 69 1112200',
		mobile: '+49 178 3334455',
		company: "Wolf's Bistro",
		jobTitle: 'Inhaberin',
		street: 'Goethestraße 15',
		city: 'Frankfurt',
		postalCode: '60313',
		country: 'Deutschland',
		notes: 'Tolle Location für Team-Events',
	},
	{
		firstName: 'Oliver',
		lastName: 'Neumann',
		email: 'oliver@weinhandel-neumann.de',
		phone: '+49 6131 778899',
		company: 'Weinhandel Neumann',
		jobTitle: 'Sommelier',
		city: 'Mainz',
		country: 'Deutschland',
	},

	// International Contacts
	{
		firstName: 'James',
		lastName: 'Wilson',
		email: 'james.wilson@techcorp.com',
		phone: '+1 415 555 0123',
		company: 'TechCorp Inc.',
		jobTitle: 'VP Engineering',
		city: 'San Francisco',
		country: 'USA',
		notes: 'Met at Web Summit. Interested in European expansion.',
		isFavorite: true,
	},
	{
		firstName: 'Marie',
		lastName: 'Dubois',
		email: 'marie.dubois@startup.fr',
		phone: '+33 1 42 68 53 00',
		mobile: '+33 6 12 34 56 78',
		company: 'Paris Startup Hub',
		jobTitle: 'Directrice',
		street: '25 Rue de Rivoli',
		city: 'Paris',
		postalCode: '75001',
		country: 'Frankreich',
	},
	{
		firstName: 'Marco',
		lastName: 'Rossi',
		email: 'marco.rossi@designitalia.it',
		mobile: '+39 333 123 4567',
		company: 'Design Italia',
		jobTitle: 'Art Director',
		city: 'Mailand',
		country: 'Italien',
	},
	{
		firstName: 'Yuki',
		lastName: 'Tanaka',
		email: 'y.tanaka@techcompany.jp',
		phone: '+81 3 1234 5678',
		company: 'Tech Company Tokyo',
		jobTitle: 'Product Manager',
		city: 'Tokyo',
		country: 'Japan',
	},

	// Freelancers & Consultants
	{
		firstName: 'Sebastian',
		lastName: 'Maier',
		email: 'seb.maier@freelance.de',
		mobile: '+49 179 1234567',
		jobTitle: 'Freelance Developer',
		city: 'Berlin',
		country: 'Deutschland',
		notes: 'Vue.js und Python Spezialist. Verfügbar ab Q2.',
	},
	{
		firstName: 'Katharina',
		lastName: 'Peters',
		email: 'k.peters@marketing-beratung.de',
		mobile: '+49 170 9876543',
		company: 'Peters Marketing Beratung',
		jobTitle: 'Marketing Consultant',
		city: 'Hamburg',
		country: 'Deutschland',
		isFavorite: true,
	},
	{
		firstName: 'Daniel',
		lastName: 'Schneider',
		email: 'daniel@agile-coach.de',
		mobile: '+49 171 5556677',
		jobTitle: 'Agile Coach',
		city: 'München',
		country: 'Deutschland',
		notes: 'Certified Scrum Master, 10+ Jahre Erfahrung',
	},

	// Personal Contacts
	{
		firstName: 'Lisa',
		lastName: 'Berger',
		email: 'lisa.berger@gmail.com',
		mobile: '+49 172 1112233',
		city: 'Köln',
		country: 'Deutschland',
		notes: 'Freundin aus Studienzeit',
		isFavorite: true,
	},
	{
		firstName: 'Markus',
		lastName: 'Schulze',
		email: 'markus.schulze@web.de',
		mobile: '+49 173 4445566',
		city: 'Düsseldorf',
		country: 'Deutschland',
		notes: 'Tennispartner',
	},
	{
		firstName: 'Eva',
		lastName: 'Friedrich',
		email: 'eva.friedrich@outlook.com',
		phone: '+49 30 1234321',
		street: 'Prenzlauer Allee 42',
		city: 'Berlin',
		postalCode: '10405',
		country: 'Deutschland',
		notes: 'Nachbarin',
	},

	// More Tech
	{
		firstName: 'Tobias',
		lastName: 'Keller',
		email: 'tobias@backend-solutions.de',
		mobile: '+49 174 7778899',
		company: 'Backend Solutions',
		jobTitle: 'Backend Engineer',
		city: 'Frankfurt',
		country: 'Deutschland',
	},
	{
		firstName: 'Hannah',
		lastName: 'Vogel',
		email: 'hannah.vogel@securityfirst.de',
		phone: '+49 30 9998877',
		company: 'Security First GmbH',
		jobTitle: 'Security Analyst',
		city: 'Berlin',
		country: 'Deutschland',
		notes: 'Expertin für Penetration Testing',
	},
	{
		firstName: 'Jan',
		lastName: 'Schwarz',
		email: 'jan@mobile-apps.de',
		mobile: '+49 175 2223344',
		company: 'Mobile Apps Studio',
		jobTitle: 'iOS Developer',
		city: 'Hamburg',
		country: 'Deutschland',
	},
	{
		firstName: 'Melanie',
		lastName: 'Krüger',
		email: 'melanie.krueger@ailab.de',
		phone: '+49 89 6665544',
		company: 'AI Lab München',
		jobTitle: 'ML Engineer',
		city: 'München',
		country: 'Deutschland',
		isFavorite: true,
	},
	{
		firstName: 'Robert',
		lastName: 'Lang',
		email: 'robert.lang@devops-pro.de',
		mobile: '+49 176 8889900',
		company: 'DevOps Pro',
		jobTitle: 'DevOps Engineer',
		city: 'Stuttgart',
		country: 'Deutschland',
		notes: 'AWS und Kubernetes Spezialist',
	},

	// More Business
	{
		firstName: 'Claudia',
		lastName: 'Bauer',
		email: 'claudia@hr-consulting.de',
		phone: '+49 211 3332211',
		company: 'HR Consulting Plus',
		jobTitle: 'HR Director',
		city: 'Düsseldorf',
		country: 'Deutschland',
	},
	{
		firstName: 'Frank',
		lastName: 'Huber',
		email: 'f.huber@salesforce-partner.de',
		mobile: '+49 177 1234567',
		company: 'CRM Solutions',
		jobTitle: 'Sales Director',
		city: 'Frankfurt',
		country: 'Deutschland',
	},
	{
		firstName: 'Sabine',
		lastName: 'Walter',
		email: 'sabine@walter-events.de',
		phone: '+49 30 4443322',
		mobile: '+49 178 5556677',
		company: 'Walter Events',
		jobTitle: 'Event Manager',
		city: 'Berlin',
		country: 'Deutschland',
		notes: 'Organisiert unsere Firmenevents',
		isFavorite: true,
	},

	// Minimal contacts (just name and one contact method)
	{
		firstName: 'Peter',
		lastName: 'Engel',
		email: 'peter.engel@email.de',
	},
	{
		firstName: 'Maria',
		lastName: 'Sommer',
		mobile: '+49 170 1111222',
	},
	{
		firstName: 'Alexander',
		lastName: 'Winter',
		phone: '+49 40 9998877',
		company: 'Winter & Partner',
	},
];

async function seed() {
	console.log('🌱 Starting seed...');
	console.log(`📊 Preparing to insert ${seedContacts.length} contacts`);

	const connection = postgres(DATABASE_URL);
	const db = drizzle(connection);

	try {
		// Clear existing contacts for the test user
		console.log('🧹 Clearing existing seed contacts...');
		const { sql } = await import('drizzle-orm');
		await db.delete(contacts).where(sql`${contacts.userId} = ${USER_ID}`);

		// Insert seed contacts
		console.log('📝 Inserting contacts...');
		const contactsToInsert = seedContacts.map((contact) => ({
			userId: USER_ID,
			createdBy: USER_ID,
			firstName: contact.firstName,
			lastName: contact.lastName,
			displayName: `${contact.firstName} ${contact.lastName}`,
			email: contact.email || null,
			phone: contact.phone || null,
			mobile: contact.mobile || null,
			company: contact.company || null,
			jobTitle: contact.jobTitle || null,
			street: contact.street || null,
			city: contact.city || null,
			postalCode: contact.postalCode || null,
			country: contact.country || null,
			notes: contact.notes || null,
			isFavorite: contact.isFavorite || false,
			isArchived: false,
			visibility: 'private',
		}));

		await db.insert(contacts).values(contactsToInsert);

		console.log(`✅ Successfully inserted ${seedContacts.length} contacts`);
		console.log('');
		console.log('📋 Summary:');
		console.log(`   - Favorites: ${seedContacts.filter((c) => c.isFavorite).length}`);
		console.log(`   - With company: ${seedContacts.filter((c) => c.company).length}`);
		console.log(
			`   - International: ${seedContacts.filter((c) => c.country && c.country !== 'Deutschland').length}`
		);
		console.log('');
		console.log(`🔑 User ID: ${USER_ID}`);
		console.log('');
		console.log('💡 To see these contacts, log in with a user that has this ID.');
		console.log('   Or run with: SEED_USER_ID=your-user-id pnpm db:seed');
	} catch (error) {
		console.error('❌ Seed failed:', error);
		throw error;
	} finally {
		await connection.end();
	}
}

seed()
	.then(() => {
		console.log('🎉 Seed completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Seed error:', error);
		process.exit(1);
	});
