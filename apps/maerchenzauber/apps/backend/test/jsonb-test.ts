import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testJsonbOperations() {
	// Get authentication tokens from your middleware
	console.log('Authenticating with middleware...');

	// Option 1: Using the middleware directly (if available)
	let appToken;
	try {
		// Replace with your actual middleware endpoint
		const response = await axios.post(
			'https://mana-core-middleware-dev-111768794939.europe-west3.run.app/auth/signin?appId=8d2f5ddb-e251-4b3b-8802-84022a7ac77f',
			{
				email: process.env.TEST_USER_EMAIL || 'nils.weiser@memoro.ai',
				password: process.env.TEST_USER_PASSWORD || 'Test123!',
			}
		);

		appToken = response.data.appToken;
		console.log('Got app token from middleware');
	} catch (error) {
		console.error('Error authenticating with middleware:', error.message);
		throw error;
	}

	// Initialize Supabase client with the app token
	// For testing purposes, we'll use the service role key to bypass authentication
	// In a real implementation, you would use the custom authentication service
	const supabase = createClient(
		process.env.MAERCHENZAUBER_SUPABASE_URL,
		process.env.MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY
	);

	// Authenticate with custom token (this is a placeholder for now)
	// In a real implementation, you would call your SupabaseAuthService
	console.log('Using service role key for testing');

	try {
		// 1. Create a character with empty images array
		console.log('Creating a character...');
		// Note: We're using the service role key for testing
		// In a production environment, you would use the custom authentication service

		const { data: character, error: charError } = await supabase
			.from('characters')
			.insert({
				user_id: 'test-user',
				name: 'Test Character',
				original_description: 'A test character',
				character_description_prompt: 'Create a test character',
				image_url: 'https://example.com/main.jpg',
				images_data: [],
			})
			.select()
			.single();

		if (charError) throw charError;
		console.log('Character created:', character.id);

		// 2. Add images to the character
		console.log('Adding character images...');
		const images = [
			{
				id: '1',
				description: 'Test Image 1',
				image_url: 'https://example.com/1.jpg',
			},
			{
				id: '2',
				description: 'Test Image 2',
				image_url: 'https://example.com/2.jpg',
			},
		];

		const { data: updatedChar, error: updateError } = await supabase
			.from('characters')
			.update({ images_data: images })
			.eq('id', character.id)
			.select()
			.single();

		if (updateError) throw updateError;
		console.log('Images added:', updatedChar.images_data.length);

		// 3. Create a story with pages
		console.log('Creating a story with pages...');
		const pages = [
			{
				id: '1',
				page_number: 1,
				story_text: 'Page 1 text',
				illustration_description: 'Page 1 illustration',
			},
			{
				id: '2',
				page_number: 2,
				story_text: 'Page 2 text',
				illustration_description: 'Page 2 illustration',
			},
		];

		const { data: story, error: storyError } = await supabase
			.from('stories')
			.insert({
				user_id: 'test-user',
				title: 'Test Story',
				story_prompt: 'A test story',
				pages_data: pages,
				characters_data: [],
			})
			.select()
			.single();

		if (storyError) throw storyError;
		console.log('Story created with pages:', story.id);

		// 4. Add character to the story
		console.log('Adding a character to the story...');
		const storyCharacter = {
			id: '1',
			character_description: 'The main character',
			pages: [1, 2],
		};

		const { data: updatedStory, error: storyUpdateError } = await supabase
			.from('stories')
			.update({
				characters_data: [storyCharacter],
			})
			.eq('id', story.id)
			.select()
			.single();

		if (storyUpdateError) throw storyUpdateError;
		console.log('Character added to story:', updatedStory.characters_data);

		// 5. Update a specific page in the story
		console.log('Updating a page in the story...');
		const existingPages = updatedStory.pages_data;
		const pageToUpdate = existingPages.find((p) => p.id === '2');
		if (pageToUpdate) {
			pageToUpdate.story_text = 'Updated page 2 text';
			pageToUpdate.image_url = 'https://example.com/updated2.jpg';

			const { data: storyWithUpdatedPage, error: pageUpdateError } = await supabase
				.from('stories')
				.update({ pages_data: existingPages })
				.eq('id', story.id)
				.select()
				.single();

			if (pageUpdateError) throw pageUpdateError;
			console.log(
				'Page updated successfully:',
				storyWithUpdatedPage.pages_data.find((p) => p.id === '2').story_text
			);
		}

		// 6. Query for characters with images (test JSONB contains query)
		console.log('Testing JSONB queries...');
		const { data: charactersWithImages, error: queryError } = await supabase
			.from('characters')
			.select('id, name, images_data')
			.contains('images_data', [{ id: '1' }]);

		if (queryError) throw queryError;
		console.log('Found characters with specific image:', charactersWithImages.length);

		// 7. Clean up - delete test data
		console.log('Cleaning up test data...');

		// Delete story
		const { error: deleteStoryError } = await supabase.from('stories').delete().eq('id', story.id);

		if (deleteStoryError) throw deleteStoryError;

		// Delete character
		const { error: deleteCharError } = await supabase
			.from('characters')
			.delete()
			.eq('id', character.id);

		if (deleteCharError) throw deleteCharError;

		console.log('Test data deleted');
		console.log('All tests passed successfully!');
	} catch (error) {
		console.error('Test failed:', error);
	}
}

testJsonbOperations()
	.then(() => console.log('Test script completed'))
	.catch((err) => console.error('Error in test script:', err));
