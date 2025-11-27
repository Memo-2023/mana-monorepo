import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testCustomAuthentication() {
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

		// Step 2: Initialize Supabase client with service role key
		// In a real implementation, this would be your SupabaseAuthService
		const adminClient = createClient(
			process.env.MAERCHENZAUBER_SUPABASE_URL,
			process.env.MAERCHENZAUBER_SUPABASE_ANON_KEY
		);

		// Step 3: Call the custom authentication function
		console.log('Authenticating with Supabase using custom token...');
		// Using the public wrapper function that calls the auth schema function
		const { data: userId, error: authError } = await adminClient.rpc('authenticate_custom_jwt', {
			token: appToken,
		});

		if (authError) {
			throw authError;
		}

		console.log('Successfully authenticated with user ID:', userId);

		// Step 4: Create a character with the service role client to bypass RLS
		// In a real implementation, we would use proper authentication
		console.log('Creating a character...');

		// For testing purposes, we'll use the service role client with RLS disabled
		const { data: character, error: charError } = await adminClient.rpc('create_test_character', {
			p_user_id: userId.toString(),
			p_name: 'Test Character',
			p_description: 'A test character',
			p_prompt: 'Create a test character',
			p_image_url: 'https://example.com/main.jpg',
		});

		if (charError) throw charError;
		console.log('Character created:', character.id);

		// Step 5: Clean up - delete test data
		console.log('Cleaning up test data...');
		const { error: deleteCharError } = await adminClient
			.from('characters')
			.delete()
			.eq('id', character.id);

		if (deleteCharError) throw deleteCharError;
		console.log('Test character deleted');

		console.log('All tests passed successfully!');
	} catch (error) {
		console.error('Test failed:', error);
	}
}

testCustomAuthentication()
	.then(() => console.log('Test script completed'))
	.catch((err) => console.error('Error in test script:', err));
