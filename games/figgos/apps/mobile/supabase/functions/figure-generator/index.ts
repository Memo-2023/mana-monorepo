import OpenAI from 'https://deno.land/x/openai@v4.69.0/mod.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Fetches a prompt template from Supabase
 */
async function fetchPromptTemplate(supabase, promptName) {
	try {
		const { data, error } = await supabase
			.from('prompts')
			.select('template')
			.eq('name', promptName)
			.single();
		if (error) {
			console.error(`Error fetching prompt '${promptName}':`, error);
			return { template: null, error };
		}
		return { template: data.template, error: null };
	} catch (error) {
		console.error(`Exception fetching prompt '${promptName}':`, error);
		return { template: null, error };
	}
}

Deno.serve(async (req) => {
	// Handle CORS preflight request
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		// Get environment variables
		const apiKey = Deno.env.get('OPENAI_API_KEY');
		const supabaseUrl = Deno.env.get('SUPABASE_URL');
		const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
		if (!apiKey || !supabaseUrl || !supabaseKey) {
			return new Response('Missing environment variables', {
				status: 500,
				headers: { ...corsHeaders },
			});
		}
		// Initialize clients
		const supabase = createClient(supabaseUrl, supabaseKey);
		const openai = new OpenAI({
			apiKey,
		});
		const body = await req.json();
		// Validate required parameters
		const subject = body.subject;
		if (!subject) {
			return new Response('Missing required field: subject', {
				status: 400,
				headers: { ...corsHeaders },
			});
		}
		// Always generate descriptions first as a separate step
		console.log('Generating character descriptions with LLM...');
		let generatedDescriptions;
		try {
			const descriptionResponse = await openai.chat.completions.create({
				model: 'gpt-4-turbo',
				messages: [
					{
						role: 'system',
						content: `You are an expert in creating detailed descriptions for action figures. 
            Based on the subject name, generate appropriate descriptions for the character and items (accessories).
            
            For the character, provide a detailed description, a short summary, and a lore background.
            
            For the items, be very specific and creative. Each item should be unique and thematically appropriate 
            for the character. Think of items that would enhance the character's abilities, reflect their personality, or 
            complement their story. Items should be visually interesting and varied in size and function.
            
            For each item, provide:
            1. A unique and fitting name
            2. An image prompt (detailed visual description for image generation)
            3. A short description (about 15 words)
            4. A lore background (longer text explaining the item's history and significance)
            
            Return your response as a JSON object with the following structure:
            {
              "character": {
                "image_prompt": "Detailed visual description of the character with clothing, colors, materials, and style",
                "description": "A concise description of the character (about 15 words)",
                "lore": "A longer text explaining the character's background, history, and significance"
              },
              "items": [
                {
                  "name": "Unique name for item 1",
                  "image_prompt": "Detailed visual description of item 1",
                  "description": "A concise description of item 1 (about 15 words)",
                  "lore": "A longer text explaining item 1's history and significance"
                },
                {
                  "name": "Unique name for item 2",
                  "image_prompt": "Detailed visual description of item 2",
                  "description": "A concise description of item 2 (about 15 words)",
                  "lore": "A longer text explaining item 2's history and significance"
                },
                {
                  "name": "Unique name for item 3",
                  "image_prompt": "Detailed visual description of item 3",
                  "description": "A concise description of item 3 (about 15 words)",
                  "lore": "A longer text explaining item 3's history and significance"
                }
              ],
              "style_description": "Description of the overall visual style and aesthetic"
            }
            
            Make the descriptions vivid, creative, and fitting for the character. Each image prompt should be 1-2 sentences with specific details.`,
					},
					{
						role: 'user',
						content: `Generate detailed descriptions for an action figure with the subject name: "${subject}". 
            Be specific about the items - they should be unique accessories that fit the character's theme and would look good as separate items in the packaging.`,
					},
				],
				temperature: 0.8,
				max_tokens: 1500,
				response_format: { type: 'json_object' },
			});

			// Parse the generated descriptions
			const content = descriptionResponse.choices[0].message.content;

			try {
				// Versuche, die JSON-Antwort zu parsen
				generatedDescriptions = JSON.parse(content);
				console.log('Raw generated descriptions:', content);
				console.log(
					'Parsed generated descriptions:',
					JSON.stringify(generatedDescriptions, null, 2)
				);

				// Erstelle eine neue Struktur mit allen erforderlichen Feldern
				const newStructure = {
					character: {
						image_prompt: '',
						description: '',
						lore: '',
					},
					items: [],
					style_description: '',
				};

				// Fülle die Charakterinformationen aus
				if (generatedDescriptions.character) {
					newStructure.character.image_prompt =
						generatedDescriptions.character.image_prompt ||
						generatedDescriptions.character.description ||
						'';
					newStructure.character.description = generatedDescriptions.character.description || '';
					newStructure.character.lore =
						generatedDescriptions.character.lore ||
						`${body.subject} has a rich history and background that influences their appearance and abilities.`;
				} else if (generatedDescriptions.clothing_description) {
					// Fallback für altes Format
					newStructure.character.image_prompt = generatedDescriptions.clothing_description;
					newStructure.character.description = `${body.subject} character with unique style and abilities.`;
					newStructure.character.lore = `${body.subject} has a rich history and background that influences their appearance and abilities.`;
				}

				// Fülle die Items aus
				if (generatedDescriptions.items && Array.isArray(generatedDescriptions.items)) {
					// Neues Format mit Items-Array
					newStructure.items = generatedDescriptions.items.map((item: any, index: number) => {
						const itemName = item.name || `Item ${index + 1}`;
						const itemDesc =
							item.description || `A special item that enhances ${body.subject}'s abilities.`;
						const itemImagePrompt = item.image_prompt || itemDesc;
						const itemLore =
							item.lore ||
							`This ${itemName} has special significance in ${body.subject}'s story. It represents an important aspect of their character and journey.`;

						return {
							name: itemName,
							image_prompt: itemImagePrompt,
							description: itemDesc,
							lore: itemLore,
						};
					});
				} else {
					// Fallback für altes Format mit accessory-Beschreibungen
					const accessoryFields = [
						{ key: 'accessory1_description', name: 'Primary Item' },
						{ key: 'accessory2_description', name: 'Secondary Item' },
						{ key: 'accessory3_description', name: 'Tertiary Item' },
					];

					accessoryFields.forEach((field, index) => {
						if (generatedDescriptions[field.key]) {
							newStructure.items.push({
								name: field.name,
								image_prompt: generatedDescriptions[field.key],
								description: `A special item that enhances ${body.subject}'s abilities.`,
								lore: `This ${field.name} has special significance in ${body.subject}'s story. It represents an important aspect of their character and journey.`,
							});
						}
					});
				}

				// Fülle die Style-Beschreibung aus
				newStructure.style_description = generatedDescriptions.style_description || '';

				// Ersetze die generierten Beschreibungen durch die neue Struktur
				generatedDescriptions = newStructure;

				console.log(
					'Final processed descriptions:',
					JSON.stringify(generatedDescriptions, null, 2)
				);
			} catch (parseError) {
				console.error('Error parsing generated descriptions:', parseError);
				console.log('Raw content that failed to parse:', content);

				// Erstelle eine Standardstruktur, wenn das Parsen fehlschlägt
				generatedDescriptions = {
					character: {
						image_prompt: `A detailed action figure of ${body.subject}`,
						description: `${body.subject} character with unique style and abilities.`,
						lore: `${body.subject} has a rich history and background that influences their appearance and abilities.`,
					},
					items: [
						{
							name: 'Primary Item',
							image_prompt: `A special accessory for ${body.subject}`,
							description: `A special item that enhances ${body.subject}'s abilities.`,
							lore: `This Primary Item has special significance in ${body.subject}'s story. It represents an important aspect of their character and journey.`,
						},
						{
							name: 'Secondary Item',
							image_prompt: `Another accessory for ${body.subject}`,
							description: `A special item that enhances ${body.subject}'s abilities.`,
							lore: `This Secondary Item has special significance in ${body.subject}'s story. It represents an important aspect of their character and journey.`,
						},
						{
							name: 'Tertiary Item',
							image_prompt: `A third accessory for ${body.subject}`,
							description: `A special item that enhances ${body.subject}'s abilities.`,
							lore: `This Tertiary Item has special significance in ${body.subject}'s story. It represents an important aspect of their character and journey.`,
						},
					],
					style_description: `A stylish and detailed action figure of ${body.subject}`,
				};
			}
		} catch (llmError) {
			console.error('Error generating descriptions with LLM:', llmError);

			// Fallback, wenn der LLM-Aufruf fehlschlägt
			generatedDescriptions = {
				character: {
					image_prompt: `A detailed action figure of ${body.subject}`,
					description: `${body.subject} character with unique style and abilities.`,
					lore: `${body.subject} has a rich history and background that influences their appearance and abilities.`,
				},
				items: [
					{
						name: 'Primary Item',
						image_prompt: `A special accessory for ${body.subject}`,
						description: `A special item that enhances ${body.subject}'s abilities.`,
						lore: `This Primary Item has special significance in ${body.subject}'s story. It represents an important aspect of their character and journey.`,
					},
					{
						name: 'Secondary Item',
						image_prompt: `Another accessory for ${body.subject}`,
						description: `A special item that enhances ${body.subject}'s abilities.`,
						lore: `This Secondary Item has special significance in ${body.subject}'s story. It represents an important aspect of their character and journey.`,
					},
					{
						name: 'Tertiary Item',
						image_prompt: `A third accessory for ${body.subject}`,
						description: `A special item that enhances ${body.subject}'s abilities.`,
						lore: `This Tertiary Item has special significance in ${body.subject}'s story. It represents an important aspect of their character and journey.`,
					},
				],
				style_description: `A stylish and detailed action figure of ${body.subject}`,
			};
		}

		// Extract character information for use in the prompt
		const characterInfo = generatedDescriptions;

		// Build the enhanced prompt using the generated descriptions
		console.log('Building enhanced prompt with character descriptions...');
		let enhancedPrompt = `Create a photorealistic action figure of ${subject}. `;

		// Add character description if available
		if (characterInfo.character && characterInfo.character.image_prompt) {
			enhancedPrompt += `The character should be: ${characterInfo.character.image_prompt} `;
		}

		// Add style description if available
		if (characterInfo.style_description) {
			enhancedPrompt += `The overall style should be: ${characterInfo.style_description} `;
		}

		// Add additional details from the request body if provided
		if (body.additional_details) {
			enhancedPrompt += `Additional details: ${body.additional_details} `;
		}

		// Add standard formatting for action figures
		enhancedPrompt +=
			'The action figure should be shown in a dynamic pose against a transparent background, with high-quality studio lighting to highlight details. The figure should have visible joints and articulation points typical of high-end collectible action figures. The image should be in portrait orientation with a 2:3 aspect ratio, showing the full figure.';

		console.log('Enhanced prompt:', enhancedPrompt);

		// Process face image if provided
		let faceImage = null;
		if (body.face_image_base64) {
			console.log('Processing provided face image...');
			// Convert base64 to binary data
			const faceImageBinary = Uint8Array.from(atob(body.face_image_base64), (c) => c.charCodeAt(0));
			// Create a Blob from the binary data
			faceImage = new Blob([faceImageBinary], 'face_image.png', {
				type: 'image/png',
			});
		}
		// Optional step: Get base template if additional structure is needed
		// For now, we use the enhanced prompt directly
		const finalPrompt = enhancedPrompt;

		// Store the enhanced prompt for later use
		const enhancedPromptForResponse = enhancedPrompt;
		// Image generation parameters with the enhanced prompt
		const imageParams = {
			model: 'gpt-image-1',
			prompt: finalPrompt,
			size: '1024x1536',
			quality: 'high',
			moderation: 'low',
			background: 'transparent',
			output_format: 'webp', // Using WebP format for better quality with transparency
			n: 1,
		};
		// Generate image based on whether face image is provided
		const imageResponse = faceImage
			? await openai.images.edit({
					...imageParams,
					image: [faceImage],
				})
			: await openai.images.generate(imageParams);
		// Process the image
		const imageBase64 = imageResponse.data[0].b64_json;
		// Generate a unique filename using timestamp and a random string
		const timestamp = new Date().getTime();
		const randomString = Math.random().toString(36).substring(2, 10);
		const filename = `figure-${subject.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${timestamp}-${randomString}.webp`;
		// Convert base64 to binary data for storage
		const binaryData = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
		// Store the image in Supabase storage
		const { data: upload, error: uploadError } = await supabase.storage
			.from('figures')
			.upload(filename, binaryData, {
				contentType: 'image/webp',
				cacheControl: '3600',
				upsert: false,
			});
		if (uploadError) {
			console.error('Error uploading image to storage:', uploadError);
			return new Response(
				JSON.stringify({
					error: 'Failed to upload image to storage',
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json',
						...corsHeaders,
					},
				}
			);
		}
		// Get the public URL of the uploaded image
		const { data: publicUrlData } = supabase.storage.from('figures').getPublicUrl(upload.path);
		// Return the public URL, enhanced prompt, generated descriptions, and metadata
		return new Response(
			JSON.stringify({
				success: true,
				image_url: publicUrlData.publicUrl,
				enhanced_prompt: enhancedPromptForResponse,
				generated_descriptions: characterInfo,
				metadata: {
					subject,
					created_at: new Date().toISOString(),
				},
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders,
				},
			}
		);
	} catch (error) {
		console.error('Error:', error);
		return new Response(
			JSON.stringify({
				error: error.message,
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders,
				},
			}
		);
	}
});
