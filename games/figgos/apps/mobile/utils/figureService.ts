import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { ExtendedFigureData } from '../components/CreateFigureForm';

/**
 * Generates a figure using the Edge Function and stores it in the database
 */
export async function generateFigure(formData: ExtendedFigureData, isPublic: boolean = true) {
	try {
		// Convert image to Base64 if available
		let faceImageBase64 = null;
		if (formData.characterImage) {
			// For web
			if (formData.characterImage.startsWith('data:')) {
				faceImageBase64 = formData.characterImage.split(',')[1];
			}
			// For native platforms
			else {
				const base64 = await FileSystem.readAsStringAsync(formData.characterImage, {
					encoding: FileSystem.EncodingType.Base64,
				});
				faceImageBase64 = base64;
			}
		}

		// Prepare payload for the Edge Function with the new JSONB structure
		// Die Edge-Funktion wird die vollständige JSONB-Struktur generieren, wenn Felder fehlen
		const payload = {
			subject: formData.name,
			rarity: formData.rarity || 'common',
			face_image: faceImageBase64,
			// Wir können optional eine vordefinierte JSONB-Struktur mitgeben, wenn wir bestimmte Werte haben
			character_info: {
				character: {
					image_prompt: formData.characterDescription || '',
					// Diese Felder werden von der Edge-Funktion generiert, wenn sie fehlen
					description: '',
					lore: '',
				},
				items: [
					{
						name: formData.artifacts[0]?.name || '',
						image_prompt: formData.artifacts[0]?.description || '',
						description: '',
						lore: '',
					},
					{
						name: formData.artifacts[1]?.name || '',
						image_prompt: formData.artifacts[1]?.description || '',
						description: '',
						lore: '',
					},
					{
						name: formData.artifacts[2]?.name || '',
						image_prompt: formData.artifacts[2]?.description || '',
						description: '',
						lore: '',
					},
				],
			},
		};

		// Prepare a complete payload with all necessary data
		const cleanPayload = {
			subject: formData.name, // This is the only required field
			rarity: formData.rarity || 'common',
			face_image: faceImageBase64,
			character_info: {
				character: {
					image_prompt: formData.characterDescription || '',
					description: formData.characterDescription || '',
					lore: '',
				},
				items: formData.artifacts.map((artifact) => ({
					name: artifact.name || '',
					image_prompt: artifact.description || '',
					description: artifact.description || '',
					lore: '',
				})),
			},
		};

		// Validate payload before sending
		if (!cleanPayload.subject) {
			throw new Error('Error: Name/Subject is required');
		}

		// Log payload to see what is being sent
		console.log('Sending payload to Edge Function:', JSON.stringify(cleanPayload));
		console.log('Payload as string:', JSON.stringify(cleanPayload));

		// Call Edge Function with adjusted options for web environments
		console.log('Calling Edge Function...');

		// Variable for the Edge Function response
		let edgeFunctionResponse;

		// Use supabase.functions.invoke directly - this handles authentication properly
		console.log('Using supabase.functions.invoke...');
		console.log('Payload being sent to Edge Function:', JSON.stringify(cleanPayload, null, 2));

		let edgeFunctionData = null;
		let edgeFunctionError = null;

		try {
			// Stelle sicher, dass wir einen gültigen Supabase-Client haben
			const { data: sessionData } = await supabase.auth.getSession();
			if (!sessionData.session) {
				console.error('No active session found');
			} else {
				console.log('Session found, user is authenticated');
			}

			// Verwende das vollständige Payload mit allen Informationen
			console.log('Using complete payload with character info');

			// Get the access token for authorization
			const accessToken = sessionData?.session?.access_token;
			if (!accessToken) {
				throw new Error('No access token available. Please log in again.');
			}

			// Use the known Supabase URL from the error logs
			const supabaseUrl = 'https://igxexenivpvivtqkweup.supabase.co';

			// Get the anon key using the auth client
			const {
				data: { session },
			} = await supabase.auth.getSession();
			const supabaseKey = session?.access_token || '';

			// Use direct fetch approach instead of supabase.functions.invoke
			const functionUrl = `${supabaseUrl}/functions/v1/barbiebox-generator`;
			console.log('Calling Edge Function at URL:', functionUrl);

			const response = await fetch(functionUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`,
					apikey: supabaseKey,
				},
				body: JSON.stringify(cleanPayload),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Edge Function error response:', errorText);
				throw new Error(`Edge Function returned status ${response.status}: ${errorText}`);
			}

			const data = await response.json();
			const error = null;

			edgeFunctionData = data;
			edgeFunctionError = error;

			console.log('Edge Function response:', data);
			if (error) {
				console.error('Edge Function error details:', error);
			}
		} catch (invokeError) {
			console.error('Exception during Edge Function invoke:', invokeError);
			throw invokeError;
		}

		if (edgeFunctionError) {
			console.error('Error calling Edge Function:', edgeFunctionError);
			throw edgeFunctionError;
		}

		edgeFunctionResponse = edgeFunctionData;

		// Check if the Edge Function response is valid
		if (!edgeFunctionResponse || !edgeFunctionResponse.image_url) {
			throw new Error('The Edge Function did not return a valid image URL');
		}

		console.log('Storing figure in database with image URL:', edgeFunctionResponse.image_url);

		// Get the user ID
		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError) {
			console.error('Error retrieving user:', userError);
			throw new Error('User could not be retrieved: ' + userError.message);
		}

		const userId = userData.user?.id;
		if (!userId) {
			throw new Error('User ID could not be determined');
		}

		// Verwende die generierten Beschreibungen von der Edge-Funktion
		const generatedDescriptions = edgeFunctionResponse.generated_descriptions;

		// Ausführliches Debugging der empfangenen Daten
		console.log('FULL Edge Function Response:', JSON.stringify(edgeFunctionResponse, null, 2));
		console.log(
			'Received generated descriptions from Edge Function:',
			JSON.stringify(generatedDescriptions, null, 2)
		);

		// Prüfe die Struktur der generierten Beschreibungen
		if (generatedDescriptions) {
			console.log('Generated descriptions structure check:');
			console.log('- Has character:', !!generatedDescriptions.character);
			if (generatedDescriptions.character) {
				console.log('  - Character fields:', Object.keys(generatedDescriptions.character));
				console.log('  - Has image_prompt:', !!generatedDescriptions.character.image_prompt);
				console.log('  - Has description:', !!generatedDescriptions.character.description);
				console.log('  - Has lore:', !!generatedDescriptions.character.lore);
			}

			console.log('- Has items:', !!generatedDescriptions.items);
			if (generatedDescriptions.items && Array.isArray(generatedDescriptions.items)) {
				console.log('  - Items count:', generatedDescriptions.items.length);
				generatedDescriptions.items.forEach((item: any, index: number) => {
					console.log(`  - Item ${index + 1} fields:`, Object.keys(item));
					console.log(`    - Has name:`, !!item.name);
					console.log(`    - Has image_prompt:`, !!item.image_prompt);
					console.log(`    - Has description:`, !!item.description);
					console.log(`    - Has lore:`, !!item.lore);
				});
			}
		}

		// Erstelle das character_info JSONB-Objekt basierend auf der neuen Struktur
		let characterInfo: any;

		// Prüfe, ob die Edge-Funktion die neue JSONB-Struktur zurückgegeben hat
		if (generatedDescriptions && generatedDescriptions.character && generatedDescriptions.items) {
			// Verwende die vollständige JSONB-Struktur von der Edge-Funktion
			console.log('Using new JSONB structure from Edge Function');

			// Stelle sicher, dass alle erweiterten Felder vorhanden sind
			const character = {
				description:
					generatedDescriptions.character.description || formData.characterDescription || '',
				image_prompt:
					generatedDescriptions.character.image_prompt ||
					generatedDescriptions.character.description ||
					formData.characterDescription ||
					'',
				lore:
					generatedDescriptions.character.lore ||
					`${formData.name} has a rich history and background.`,
			};

			// Stelle sicher, dass alle Items die erweiterten Felder haben
			const items = generatedDescriptions.items.map((item: any, index: number) => {
				const itemName = item.name || `Item ${index + 1}`;
				const itemDesc = item.description || formData.artifacts[index]?.description || '';

				return {
					name: itemName,
					description: itemDesc,
					image_prompt: item.image_prompt || itemDesc,
					lore: item.lore || `This item has special significance for ${formData.name}.`,
				};
			});

			characterInfo = {
				character,
				items,
				style_description: generatedDescriptions.style_description || '',
			};

			// Logge die finale Struktur
			console.log(
				'Final character_info structure to be saved:',
				JSON.stringify(characterInfo, null, 2)
			);
		} else {
			// Fallback auf die alte Struktur (sollte nicht mehr vorkommen)
			console.log('WARNING: Edge Function returned old format, creating JSONB structure manually');
			characterInfo = {
				character: {
					description:
						formData.characterDescription ||
						(generatedDescriptions ? generatedDescriptions.clothing_description : ''),
					image_prompt:
						formData.characterDescription ||
						(generatedDescriptions ? generatedDescriptions.clothing_description : ''),
					lore: `${formData.name} has a rich history and background.`,
				},
				items: [
					{
						name: 'Item 1',
						description:
							formData.artifacts[0]?.description ||
							(generatedDescriptions ? generatedDescriptions.accessory1_description : ''),
						image_prompt:
							formData.artifacts[0]?.description ||
							(generatedDescriptions ? generatedDescriptions.accessory1_description : ''),
						lore: `This item has special significance for ${formData.name}.`,
					},
					{
						name: 'Item 2',
						description:
							formData.artifacts[1]?.description ||
							(generatedDescriptions ? generatedDescriptions.accessory2_description : ''),
						image_prompt:
							formData.artifacts[1]?.description ||
							(generatedDescriptions ? generatedDescriptions.accessory2_description : ''),
						lore: `This item has special significance for ${formData.name}.`,
					},
					{
						name: 'Item 3',
						description:
							formData.artifacts[2]?.description ||
							(generatedDescriptions ? generatedDescriptions.accessory3_description : ''),
						image_prompt:
							formData.artifacts[2]?.description ||
							(generatedDescriptions ? generatedDescriptions.accessory3_description : ''),
						lore: `This item has special significance for ${formData.name}.`,
					},
				],
			};
		}

		// Store figure in the database
		const { data: figureData, error: figureError } = await supabase
			.from('figures')
			.insert({
				name: formData.name,
				subject: formData.name,
				image_url: edgeFunctionResponse.image_url,
				enhanced_prompt: edgeFunctionResponse.enhanced_prompt, // Store the enhanced prompt
				rarity: payload.rarity, // Added rarity field

				character_info: characterInfo, // Verwende das neue JSONB-Feld
				is_public: isPublic,
				is_archived: false, // Added is_archived field
				user_id: userId,
			})
			.select()
			.single();

		if (figureError) {
			console.error('Error saving the figure:', figureError);
			throw new Error(figureError.message);
		}

		console.log('Figure successfully saved in the database:', figureData);
		return figureData;
	} catch (error) {
		console.error('Error in generateFigure:', error);
		throw error;
	}
}

/**
 * Loads a user's figures from the database
 */
export async function getUserFigures(userId: string) {
	try {
		const { data, error } = await supabase
			.from('figures')
			.select(
				`
        id, 
        name, 
        subject, 
        image_url, 
        likes,
        is_public,
        rarity,
        is_archived,
        character_info
      `
			)
			.eq('user_id', userId)
			.eq('is_archived', false) // Only show non-archived figures
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error loading figures:', error);
			throw new Error(error.message);
		}

		return data || [];
	} catch (error) {
		console.error('Error in getUserFigures:', error);
		throw error;
	}
}

/**
 * Loads public figures from the database
 */
export async function getPublicFigures() {
	try {
		const { data, error } = await supabase
			.from('figures')
			.select(
				`
        id, 
        name, 
        subject, 
        image_url,
        enhanced_prompt,
        likes,
        rarity,
        user_id,
        created_at,
        character_info
      `
			)
			.eq('is_public', true)
			.eq('is_archived', false) // Only show non-archived figures
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error loading public figures:', error);
			throw new Error(error.message);
		}

		return data || [];
	} catch (error) {
		console.error('Error in getPublicFigures:', error);
		throw error;
	}
}

/**
 * Aktualisiert die Likes einer Figur
 */
export async function likeFigure(figureId: number) {
	try {
		const { data, error } = await supabase.rpc('increment_likes', {
			figure_id: figureId,
		});

		if (error) {
			console.error('Fehler beim Liken der Figur:', error);
			throw new Error(error.message);
		}

		return data;
	} catch (error) {
		console.error('Fehler in likeFigure:', error);
		throw error;
	}
}
