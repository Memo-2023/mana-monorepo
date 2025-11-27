import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { SupabaseJsonbService } from '../src/core/services/supabase-jsonb.service';
import { randomUUID } from 'crypto';
import { CustomFirestoreService } from '../src/core/services/firestore.service';
import { SettingsService } from '../src/core/services/settings.service';
import { SupabaseProvider } from '../src/supabase/supabase.provider';
import * as admin from 'firebase-admin';

// Initialize Firebase with mock credentials for testing
function initializeFirebase() {
	try {
		// Check if Firebase is already initialized
		admin.app();
		console.log('Firebase already initialized');
	} catch (error) {
		// Initialize Firebase with a minimal app
		admin.initializeApp({
			projectId: 'test-project',
		});
		console.log('Firebase initialized with mock app');
	}
}

// Create mock for Firebase Firestore
class MockFirestore {
	collection() {
		return this;
	}
	doc() {
		return this;
	}
	get() {
		return Promise.resolve({
			exists: true,
			data: () => ({
				replicateModel: 'test-model',
				authorPrompts: {},
				illustratorPrompts: {},
			}),
		});
	}
	set() {
		return Promise.resolve();
	}
	update() {
		return Promise.resolve();
	}
	delete() {
		return Promise.resolve();
	}
}

async function runTests() {
	// Initialize Firebase before creating the test module
	initializeFirebase();

	// Create a mock database to store data between operations
	const mockDatabase = {
		characters: new Map(),
		stories: new Map(),
	};

	// Mock Supabase client
	const mockSupabaseClient = {
		from: (table: string) => ({
			select: (columns = '*') => ({
				eq: (column: string, value: any) => ({
					single: () => {
						if (table === 'characters' && mockDatabase.characters.has(value)) {
							return Promise.resolve({
								data: mockDatabase.characters.get(value),
								error: null,
							});
						} else if (table === 'stories' && mockDatabase.stories.has(value)) {
							return Promise.resolve({
								data: mockDatabase.stories.get(value),
								error: null,
							});
						}
						return Promise.resolve({ data: null, error: null });
					},
					maybeSingle: () => Promise.resolve({ data: null, error: null }),
					order: () => Promise.resolve({ data: [], error: null }),
					limit: () => Promise.resolve({ data: [], error: null }),
				}),
				order: () => ({
					limit: () => Promise.resolve({ data: [], error: null }),
				}),
				limit: () => Promise.resolve({ data: [], error: null }),
			}),
			insert: (items: any[]) => ({
				select: () => {
					if (table === 'characters') {
						const item = { ...items[0] };
						mockDatabase.characters.set(item.id, item);
						return Promise.resolve({ data: [item], error: null });
					} else if (table === 'stories') {
						const item = { ...items[0] };
						mockDatabase.stories.set(item.id, item);
						return Promise.resolve({ data: [item], error: null });
					}
					return Promise.resolve({ data: items, error: null });
				},
			}),
			update: (data: any) => ({
				eq: (column: string, value: string) => {
					if (table === 'characters' && mockDatabase.characters.has(value)) {
						const item = mockDatabase.characters.get(value);
						const updatedItem = { ...item, ...data };
						mockDatabase.characters.set(value, updatedItem);
						return Promise.resolve({ data: [updatedItem], error: null });
					} else if (table === 'stories' && mockDatabase.stories.has(value)) {
						const item = mockDatabase.stories.get(value);
						const updatedItem = { ...item, ...data };
						mockDatabase.stories.set(value, updatedItem);
						return Promise.resolve({ data: [updatedItem], error: null });
					}
					return Promise.resolve({ data: [], error: null });
				},
				match: () => Promise.resolve({ data: {}, error: null }),
			}),
			delete: () => ({
				eq: (column: string, value: string) => {
					if (table === 'characters') {
						mockDatabase.characters.delete(value);
					} else if (table === 'stories') {
						mockDatabase.stories.delete(value);
					}
					return Promise.resolve({ data: {}, error: null });
				},
				match: () => Promise.resolve({ data: {}, error: null }),
			}),
			upsert: () => Promise.resolve({ data: {}, error: null }),
		}),
		storage: {
			from: () => ({
				upload: () => Promise.resolve({ data: {}, error: null }),
				getPublicUrl: () => ({
					data: { publicUrl: 'https://example.com/test.jpg' },
				}),
			}),
		},
		auth: {
			setSession: () => {},
		},
	};

	// Create a test NestJS application with mocked services
	const moduleRef = await Test.createTestingModule({
		imports: [AppModule],
	})
		.overrideProvider(CustomFirestoreService)
		.useValue({
			firestore: new MockFirestore(),
			getCharacterData: () => Promise.resolve({ data: {}, error: null }),
			getStoryData: () => Promise.resolve({ data: {}, error: null }),
			saveStory: () => Promise.resolve({ data: {}, error: null }),
			saveCharacter: () => Promise.resolve({ data: {}, error: null }),
		})
		.overrideProvider(SettingsService)
		.useValue({
			prompts: { author: {}, illustrator: {} },
			getAuthorPrompt: () => 'Test author prompt',
			getIllustratorPrompt: () => 'Test illustrator prompt',
			getReplicateModel: () => 'test-model',
			getCreators: () => [],
			getCreatorById: () => null,
			initialize: () => Promise.resolve(),
		})
		.overrideProvider(SupabaseProvider)
		.useValue({
			getClient: () => mockSupabaseClient,
		})
		.compile();

	const app = moduleRef.createNestApplication();
	await app.init();

	// Get the SupabaseJsonbService instance
	const supabaseService = app.get<SupabaseJsonbService>(SupabaseJsonbService);

	// Test user ID - use a real user ID or create a special test user
	const testUserId = 'test-user-' + randomUUID().substring(0, 8);

	try {
		console.log('=== SUPABASE MIGRATION TEST ===');
		console.log(`Using test user ID: ${testUserId}`);

		// Test 1: Create a character
		console.log('\n--- Test 1: Create a character ---');
		const characterId = randomUUID();

		const characterData = {
			id: characterId,
			name: 'Test Character',
			images_data: [
				{
					description: 'Test image description',
					image_url: 'https://example.com/test.jpg',
				},
			],
			original_description: 'A test character',
			character_description_prompt: 'A test character for Supabase migration',
			image_url: 'https://example.com/test.jpg',
			created_at: new Date().toISOString(),
			is_animal: false,
		};

		const character = await supabaseService.createCharacter(testUserId, characterData);
		console.log('Created character:', character ? 'Success' : 'Failed');

		// Test 2: Retrieve the character
		console.log('\n--- Test 2: Retrieve the character ---');
		const retrievedCharacter = await supabaseService.getCharacterById(characterId);
		console.log('Retrieved character:', retrievedCharacter ? 'Success' : 'Failed');
		console.log(
			'Character data matches:',
			retrievedCharacter &&
				retrievedCharacter.name === characterData.name &&
				retrievedCharacter.original_description === characterData.original_description
				? 'Yes'
				: 'No'
		);

		// Test 3: Create a story
		console.log('\n--- Test 3: Create a story ---');
		const storyId = randomUUID();

		const storyData = {
			id: storyId,
			title: 'Test Story',
			description: 'A test story for Supabase migration',
			pages_data: [
				{
					page_number: 1,
					story_text: 'Once upon a time...',
					illustration_description: 'A beautiful landscape',
					image_url: 'https://example.com/illustration1.jpg',
				},
				{
					page_number: 2,
					story_text: 'There was a brave character...',
					illustration_description: 'A character standing tall',
					image_url: 'https://example.com/illustration2.jpg',
				},
			],
			characters_data: [
				{
					character_description: 'A brave character',
					pages: [1, 2],
				},
			],
			combined_story: 'Once upon a time... There was a brave character...',
			created_at: new Date().toISOString(),
			user_id: testUserId,
			character_ids: [characterId],
		};

		const story = await supabaseService.createStory(testUserId, storyData);
		console.log('Created story:', story ? 'Success' : 'Failed');

		// Test 4: Retrieve the story
		console.log('\n--- Test 4: Retrieve the story ---');
		const retrievedStory = await supabaseService.getStoryById(storyId);
		console.log('Retrieved story:', retrievedStory ? 'Success' : 'Failed');
		console.log(
			'Story data matches:',
			retrievedStory &&
				retrievedStory.title === storyData.title &&
				retrievedStory.pages_data.length === storyData.pages_data.length
				? 'Yes'
				: 'No'
		);

		console.log('\n=== TEST SUMMARY ===');
		console.log('All tests completed. Check above logs for details.');
	} catch (error) {
		console.error('Test failed with error:', error);
	} finally {
		// Clean up
		await app.close();
	}
}

// Run the tests
runTests()
	.then(() => {
		console.log('Tests completed');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Test script failed:', error);
		process.exit(1);
	});
