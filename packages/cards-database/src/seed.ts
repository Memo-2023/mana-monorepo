import { getDb, closeDb } from './client.js';
import { deckTemplates } from './schema/index.js';

/**
 * Seed the database with initial data
 */
async function seed() {
	console.log('Seeding database...');

	const db = getDb();

	try {
		// Seed deck templates
		const templates = [
			{
				title: 'Language Basics',
				description: 'Learn basic vocabulary and phrases for a new language',
				category: 'languages',
				templateData: {
					cards: [
						{
							cardType: 'flashcard' as const,
							content: { front: 'Hello', back: 'Hallo', hint: 'Greeting' },
						},
						{
							cardType: 'flashcard' as const,
							content: { front: 'Goodbye', back: 'Auf Wiedersehen' },
						},
					],
					settings: { language: 'de' },
					tags: ['language', 'basics', 'german'],
				},
				isActive: true,
				isPublic: true,
				popularity: 100,
			},
			{
				title: 'Math Fundamentals',
				description: 'Essential math concepts and formulas',
				category: 'education',
				templateData: {
					cards: [
						{
							cardType: 'quiz' as const,
							content: {
								question: 'What is 2 + 2?',
								options: ['3', '4', '5', '6'],
								correctAnswer: 1,
								explanation: '2 + 2 equals 4',
							},
						},
					],
					settings: { difficulty: 'beginner' },
					tags: ['math', 'basics'],
				},
				isActive: true,
				isPublic: true,
				popularity: 80,
			},
			{
				title: 'Programming Concepts',
				description: 'Core programming concepts and terminology',
				category: 'technology',
				templateData: {
					cards: [
						{
							cardType: 'flashcard' as const,
							content: {
								front: 'Variable',
								back: 'A named storage location in memory that holds a value',
							},
						},
						{
							cardType: 'flashcard' as const,
							content: {
								front: 'Function',
								back: 'A reusable block of code that performs a specific task',
							},
						},
					],
					settings: {},
					tags: ['programming', 'coding', 'basics'],
				},
				isActive: true,
				isPublic: true,
				popularity: 90,
			},
		];

		console.log('Inserting deck templates...');
		await db.insert(deckTemplates).values(templates).onConflictDoNothing();

		console.log('Seeding completed successfully!');
	} catch (error) {
		console.error('Seeding failed:', error);
		throw error;
	} finally {
		await closeDb();
	}
}

seed().catch((error) => {
	console.error('Seed script failed:', error);
	process.exit(1);
});
