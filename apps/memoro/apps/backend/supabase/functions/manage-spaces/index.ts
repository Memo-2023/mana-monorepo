import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
// Express backend URL
const EXPRESS_BACKEND_URL = Deno.env.get('EXPRESS_BACKEND_URL');
serve(async (req) => {
	try {
		console.log('Manage-Spaces Function called');
		// Create a Supabase client with the service role key
		const supabaseUrl = Deno.env.get('SUPABASE_URL');
		const supabaseServiceRoleKey = Deno.env.get('C_SUPABASE_SECRET_KEY');
		if (!supabaseUrl || !supabaseServiceRoleKey) {
			console.error('Supabase environment variables not found');
			return new Response(
				JSON.stringify({
					error: 'Supabase credentials not found',
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}
		if (!EXPRESS_BACKEND_URL) {
			console.error('EXPRESS_BACKEND_URL environment variable not found');
			return new Response(
				JSON.stringify({
					error: 'Express backend URL not found',
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}
		const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
		// Parse request body
		const { action, space, token } = await req.json();
		if (!action || !space || !token) {
			return new Response(
				JSON.stringify({
					error: 'Action, space details, and token are required',
				}),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}
		// Validate request based on action
		if (action === 'create' && (!space.name || !space.appId)) {
			return new Response(
				JSON.stringify({
					error: 'For create action, name and appId are required',
				}),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}
		if ((action === 'update' || action === 'delete') && !space.id) {
			return new Response(
				JSON.stringify({
					error: 'For update or delete action, space id is required',
				}),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}
		// Step 1: Call Express backend to perform the action
		let expressResult;
		let expressUrl;
		let expressMethod;
		let expressBody;
		switch (action) {
			case 'create':
				expressUrl = `${EXPRESS_BACKEND_URL}/api/spaces`;
				expressMethod = 'POST';
				expressBody = JSON.stringify({
					name: space.name,
					appId: space.appId,
				});
				break;
			case 'update':
				expressUrl = `${EXPRESS_BACKEND_URL}/api/spaces/${space.id}`;
				expressMethod = 'PUT';
				expressBody = JSON.stringify({
					name: space.name,
				});
				break;
			case 'delete':
				expressUrl = `${EXPRESS_BACKEND_URL}/api/spaces/${space.id}`;
				expressMethod = 'DELETE';
				expressBody = null;
				break;
			default:
				return new Response(
					JSON.stringify({
						error: 'Invalid action',
					}),
					{
						status: 400,
						headers: {
							'Content-Type': 'application/json',
						},
					}
				);
		}
		const expressResponse = await fetch(expressUrl, {
			method: expressMethod,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: expressBody,
		});
		if (!expressResponse.ok) {
			const errorText = await expressResponse.text();
			console.error(`Express backend error (${action}):`, errorText);
			return new Response(
				JSON.stringify({
					error: `Error from Express backend: ${errorText}`,
				}),
				{
					status: expressResponse.status,
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}
		expressResult = await expressResponse.json();
		// Step 2: Update local Supabase database based on the action
		let supabaseResult;
		switch (action) {
			case 'create':
				// Get user information from the auth token
				const { data: user, error: userError } = await supabaseClient.auth.getUser(token);
				if (userError) {
					console.error('Error getting user from token:', userError);
					return new Response(
						JSON.stringify({
							error: `Error getting user: ${userError.message}`,
						}),
						{
							status: 401,
							headers: {
								'Content-Type': 'application/json',
							},
						}
					);
				}
				// Use spaceId returned from express backend
				const spaceId = expressResult.spaceId;
				if (!spaceId) {
					return new Response(
						JSON.stringify({
							error: 'Express backend did not return a space ID',
						}),
						{
							status: 500,
							headers: {
								'Content-Type': 'application/json',
							},
						}
					);
				}
				// Create the space in local Supabase
				const { data: localSpace, error: insertError } = await supabaseClient
					.from('spaces')
					.insert({
						id: spaceId,
						name: space.name,
						description: space.description || '',
						color: space.color || '#4CAF50',
						user_id: user.user.id,
						is_default: false,
					})
					.select()
					.single();
				if (insertError) {
					console.error('Error creating space in Supabase:', insertError);
					// Continue anyway since Express backend operation succeeded
					supabaseResult = {
						warning: `Local database update failed: ${insertError.message}`,
					};
				} else {
					supabaseResult = localSpace;
				}
				break;
			case 'update':
				// Update the space in local Supabase
				const { data: updatedSpace, error: updateError } = await supabaseClient
					.from('spaces')
					.update({
						name: space.name,
						description: space.description,
						color: space.color,
						updated_at: new Date().toISOString(),
					})
					.eq('id', space.id)
					.select()
					.single();
				if (updateError) {
					console.error('Error updating space in Supabase:', updateError);
					supabaseResult = {
						warning: `Local database update failed: ${updateError.message}`,
					};
				} else {
					supabaseResult = updatedSpace;
				}
				break;
			case 'delete':
				// Delete the space in local Supabase
				const { error: deleteError } = await supabaseClient
					.from('spaces')
					.delete()
					.eq('id', space.id);
				if (deleteError) {
					console.error('Error deleting space in Supabase:', deleteError);
					supabaseResult = {
						warning: `Local database delete failed: ${deleteError.message}`,
					};
				} else {
					supabaseResult = {
						success: true,
					};
				}
				break;
		}
		// Return success response
		return new Response(
			JSON.stringify({
				success: true,
				action,
				expressResult,
				localResult: supabaseResult,
			}),
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	} catch (error) {
		console.error('Unexpected error:', error);
		return new Response(
			JSON.stringify({
				error: `Unexpected error: ${error.message}`,
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}
});
