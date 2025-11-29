import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

dotenv.config();

async function testEnhancedAuthentication() {
	try {
		// Step 1: Get app token from middleware
		console.log('Authenticating with middleware...');
		const middlewareUrl =
			'https://mana-core-middleware-dev-111768794939.europe-west3.run.app/auth/signin';
		const appId = '8d2f5ddb-e251-4b3b-8802-84022a7ac77f';

		const response = await axios.post(`${middlewareUrl}?appId=${appId}`, {
			email: process.env.TEST_USER_EMAIL || 'nils.weiser@memoro.ai',
			password: process.env.TEST_USER_PASSWORD || 'Test123!',
		});

		const { appToken } = response.data;
		console.log('Got app token from middleware');

		// Step 2: Decode the token to get the user ID (simulating what our service does)
		const decoded = jwt.decode(appToken);
		console.log('Decoded token:', decoded);

		// Step 3: Initialize admin client with service role key
		const adminClient = createClient(
			process.env.MAERCHENZAUBER_SUPABASE_URL,
			process.env.MAERCHENZAUBER_SUPABASE_ANON_KEY
		);

		// Step 4: Create a character using the execute_as_user function
		console.log('Creating a character using execute_as_user...');
		const { data: character, error: charError } = await adminClient.rpc('execute_as_user', {
			p_user_id: decoded.sub,
			p_operation: 'create_character',
			p_params: {
				name: 'Test Character',
				description: 'A test character',
				prompt: 'Create a test character',
				image_url: 'https://example.com/main.jpg',
				images_data: [],
			},
		});

		if (charError) throw charError;
		console.log('Character created:', character.id);

		// Step 5: Get the character using execute_as_user
		console.log('Getting the character...');
		const { data: fetchedCharacter, error: fetchError } = await adminClient.rpc('execute_as_user', {
			p_user_id: decoded.sub,
			p_operation: 'get_character',
			p_params: { id: character.id },
		});

		if (fetchError) throw fetchError;
		console.log('Character fetched:', fetchedCharacter.name);

		// Step 6: Update the character
		console.log('Updating the character...');
		const { data: updatedCharacter, error: updateError } = await adminClient.rpc(
			'execute_as_user',
			{
				p_user_id: decoded.sub,
				p_operation: 'update_character',
				p_params: {
					id: character.id,
					name: 'Updated Test Character',
					description: 'An updated test character',
				},
			}
		);

		if (updateError) throw updateError;
		console.log('Character updated:', updatedCharacter.name);

		// Step 7: List all characters
		console.log('Listing all characters...');
		const { data: charactersList, error: listError } = await adminClient.rpc('execute_as_user', {
			p_user_id: decoded.sub,
			p_operation: 'list_characters',
			p_params: {},
		});

		if (listError) throw listError;
		console.log('Characters found:', charactersList.length);

		// Step 8: Delete the character
		console.log('Deleting the character...');
		const { data: deletedCharacter, error: deleteError } = await adminClient.rpc(
			'execute_as_user',
			{
				p_user_id: decoded.sub,
				p_operation: 'delete_character',
				p_params: { id: character.id },
			}
		);

		if (deleteError) throw deleteError;
		console.log('Character deleted:', deletedCharacter.id);

		console.log('All tests passed successfully!');
	} catch (error) {
		console.error('Test failed:', error);
	}
}

testEnhancedAuthentication()
	.then(() => console.log('Test script completed'))
	.catch((err) => console.error('Error in test script:', err));
