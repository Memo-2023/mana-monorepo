import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	UploadedFile,
	UseInterceptors,
	UseGuards,
	Param,
	Query,
	Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// import { CharacterService } from './character.service';
import { ImageSupabaseService } from '../core/services/image-supabase.service';
import { PromptingService } from '../core/services/prompting.service';
import {
	AuthGuard,
	CurrentUser,
	CreditClientService,
	InsufficientCreditsException,
} from '@mana-core/nestjs-integration';
import { UserToken } from '../decorators/user.decorator';
import { JwtPayload } from '../types/jwt-payload.interface';
// import { Character } from '../core/models/character';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { SupabaseJsonbAuthService } from '../core/services/supabase-jsonb-auth.service';

@Controller('character')
@UseGuards(AuthGuard)
export class CharacterController {
	private readonly logger = new Logger(CharacterController.name);

	constructor(
		private readonly imageService: ImageSupabaseService,
		private readonly promptingService: PromptingService,
		private readonly supabaseAuthService: SupabaseJsonbAuthService,
		private readonly creditClient: CreditClientService
	) {}

	@Post('generate-images')
	async generateCharacterImages(
		@Body('description') description: string,
		@Body('name') name: string,
		@CurrentUser() user: JwtPayload,
		@UserToken() token: string
	) {
		this.logger.log(`Generating character images for user ${user.email} (${user.sub})`);
		this.logger.log(`Character name: ${name}, description: ${description}`);

		try {
			// Pre-flight credit check for character creation (20 credits)
			const creditValidation = await this.creditClient.validateCredits(
				user.sub,
				'character_creation',
				20
			);

			if (!creditValidation.hasCredits) {
				this.logger.warn(
					`User ${user.sub} has insufficient credits for character creation. Required: 20, Available: ${creditValidation.availableCredits}`
				);
				throw new InsufficientCreditsException({
					requiredCredits: 20,
					availableCredits: creditValidation.availableCredits,
					creditType: 'user',
					operation: 'character_creation',
				});
			}

			// Create a more structured prompt for enhanced character generation
			const promptedDescription = `Create a charming, detailed 3D Pixar-style character for a children's book. Character description: ${description}. Make them appealing, expressive, and memorable with rich visual details.`;

			const characterDescriptionPrompt_2 =
				await this.promptingService.createCharacterDescriptionPrompt(promptedDescription, 0.9);
			const characterDescriptionPrompt_3 =
				await this.promptingService.createCharacterDescriptionPrompt(promptedDescription, 0.6);

			if (characterDescriptionPrompt_2.error || characterDescriptionPrompt_3.error) {
				return {
					error: 'Failed to generate character images',
				};
			}

			// Generate all images in parallel for faster character creation
			const [image_original, image_2, image_3] = await Promise.all([
				this.imageService.generateImage(
					promptedDescription,
					`${user.sub}/characters`,
					token,
					user.sub
				),
				this.imageService.generateImage(
					characterDescriptionPrompt_2.data!,
					`${user.sub}/characters`,
					token,
					user.sub
				),
				this.imageService.generateImage(
					characterDescriptionPrompt_3.data!,
					`${user.sub}/characters`,
					token,
					user.sub
				),
			]);

			if (image_original.error || image_2.error || image_3.error) {
				// Log specific errors for debugging
				if (image_original.error) this.logger.error('Image 1 error:', image_original.error);
				if (image_2.error) this.logger.error('Image 2 error:', image_2.error);
				if (image_3.error) this.logger.error('Image 3 error:', image_3.error);

				// Throw the first error encountered to let global filter handle it
				const firstError = image_original.error || image_2.error || image_3.error;
				throw firstError;
			}

			// Prepare images in the format expected by Supabase
			const imagesData = [
				{
					description: promptedDescription,
					image_url: image_original.data,
				},
				{
					description: characterDescriptionPrompt_2.data,
					image_url: image_2.data,
				},
				{
					description: characterDescriptionPrompt_3.data,
					image_url: image_3.data,
				},
			];

			const characterId = randomUUID();

			// Get BlurHash for the main image
			const blurHash = this.imageService.getBlurHashForUrl(image_original.data!);
			this.logger.log(`Retrieved BlurHash for character: ${blurHash}`);

			// Create character data structure for Supabase
			const characterData = {
				id: characterId,
				name,
				images_data: imagesData,
				user_description: description, // Raw user input
				character_description: description, // For non-animal characters, use as-is
				character_description_prompt: description,
				image_url: image_original.data,
				blur_hash: blurHash, // Add BlurHash for smooth loading
				is_animal: false,
				created_at: new Date().toISOString(),
			};

			// Save character to Supabase using auth service (JWT now works with RLS)
			const character = await this.supabaseAuthService.createCharacter(
				user.sub,
				characterData,
				token
			);

			if (!character) {
				return {
					error: 'Failed to create character',
				};
			}

			// Consume credits after successful character creation
			await this.creditClient.consumeCredits(
				user.sub,
				'character_creation',
				20,
				`Created character: ${name}`,
				{
					characterId,
					characterName: name,
					description,
				}
			);

			this.logger.log(
				`Successfully consumed 20 credits for character creation by user ${user.sub}`
			);

			// Return the response expected by the frontend
			return {
				data: {
					images: imagesData.map((img) => ({
						description: img.description,
						imageUrl: img.image_url,
					})),
					characterId,
				},
			};
		} catch (error) {
			if (error instanceof InsufficientCreditsException) {
				// Re-throw to let NestJS handle it with proper 402 status
				throw error;
			}
			this.logger.error('Error in generateCharacterImages:', error);
			// Throw error to let global exception filter handle it with user-friendly messages
			throw error;
		}
	}

	@Post('generate-animal')
	async generateAnimalCharacter(
		@Body('name') name: string,
		@Body('description') description: string,
		@CurrentUser() user: JwtPayload,
		@UserToken() token: string
	) {
		this.logger.log(`Generating animal character for user ${user.email} (${user.sub})`);
		this.logger.log(`Animal name: ${name}, description: ${description}`);

		try {
			// Pre-flight credit check for character creation (20 credits)
			const creditValidation = await this.creditClient.validateCredits(
				user.sub,
				'character_creation',
				20
			);

			if (!creditValidation.hasCredits) {
				this.logger.warn(
					`User ${user.sub} has insufficient credits for animal character creation. Required: 20, Available: ${creditValidation.availableCredits}`
				);
				throw new InsufficientCreditsException({
					requiredCredits: 20,
					availableCredits: creditValidation.availableCredits,
					creditType: 'user',
					operation: 'character_creation',
				});
			}

			// Step 1: Store the raw user input
			const userDescription = description;

			// Step 2: Enhance the description with AI to make it detailed and consistent
			const enhancedResult = await this.promptingService.enhanceAnimalCharacterDescription(
				userDescription,
				name
			);

			if (enhancedResult.error) {
				this.logger.warn('Failed to enhance character description, using original');
			}

			const characterDescription = enhancedResult.data || userDescription;
			this.logger.log(`Enhanced character description: ${characterDescription}`);

			// Check if AI refused to generate content (content moderation)
			const contentViolations = [
				'I am programmed to be a harmless AI',
				'I cannot create',
				'against my programming',
				'cannot assist',
				'swastika',
				'nazi',
				'hitler',
				'armbands',
				'third reich',
				'ss uniform',
				'inappropriate',
			];

			const lowerDescription = characterDescription.toLowerCase();
			const hasViolation = contentViolations.some((term) =>
				lowerDescription.includes(term.toLowerCase())
			);

			if (hasViolation) {
				this.logger.warn('Content moderation: Inappropriate content detected');
				throw new Error(
					'The requested content violates our content policy. Please try a different character description.'
				);
			}

			// Step 3: Detect animal type from ORIGINAL user input (not enhanced version)
			const animalType = await this.promptingService.detectAnimalType(userDescription);
			this.logger.log(`Detected animal type: ${animalType.data || 'none'}`);

			// Step 4: Create Pixar-style image generation prompt
			const imagePrompt = `a cute, cartoon, 3d pixar style animal character: ${characterDescription}`;

			// Step 5: Generate three image variants with slightly different styling
			const characterDescriptionPrompt_2 =
				await this.promptingService.createAnimalCharacterDescriptionPrompt(imagePrompt, 0.9);
			const characterDescriptionPrompt_3 =
				await this.promptingService.createAnimalCharacterDescriptionPrompt(imagePrompt, 0.6);

			if (characterDescriptionPrompt_2.error || characterDescriptionPrompt_3.error) {
				throw new Error('Failed to generate character image prompts');
			}

			// Step 6: Generate images for all three description variants in parallel
			const [image_original, image_2, image_3] = await Promise.all([
				this.imageService.generateImage(imagePrompt, `${user.sub}/characters`, token, user.sub),
				this.imageService.generateImage(
					characterDescriptionPrompt_2.data!,
					`${user.sub}/characters`,
					token,
					user.sub
				),
				this.imageService.generateImage(
					characterDescriptionPrompt_3.data!,
					`${user.sub}/characters`,
					token,
					user.sub
				),
			]);

			if (image_original.error || image_2.error || image_3.error) {
				// Log specific errors for debugging
				if (image_original.error) this.logger.error('Image 1 error:', image_original.error);
				if (image_2.error) this.logger.error('Image 2 error:', image_2.error);
				if (image_3.error) this.logger.error('Image 3 error:', image_3.error);

				// Throw the first error encountered to let global filter handle it
				const firstError = image_original.error || image_2.error || image_3.error;
				throw firstError;
			}

			// Prepare images in the format expected by Supabase
			const imagesData = [
				{
					description: imagePrompt,
					image_url: image_original.data,
				},
				{
					description: characterDescriptionPrompt_2.data,
					image_url: image_2.data,
				},
				{
					description: characterDescriptionPrompt_3.data,
					image_url: image_3.data,
				},
			];

			// Create character ID
			const characterId = randomUUID();

			// Get BlurHash for the main image
			const blurHash = this.imageService.getBlurHashForUrl(image_original.data!);
			this.logger.log(`Retrieved BlurHash for character: ${blurHash}`);

			// Step 7: Create character data structure for Supabase with new fields
			const characterData = {
				id: characterId,
				name,
				images_data: imagesData,
				user_description: userDescription, // Raw user input
				character_description: characterDescription, // AI-enhanced description
				character_description_prompt: imagePrompt,
				image_url: image_original.data,
				blur_hash: blurHash, // Add BlurHash for smooth loading
				created_at: new Date().toISOString(),
				is_animal: true,
				animal_type: animalType.error ? '' : animalType.data,
			};

			// Save character to Supabase using auth service (JWT now works with RLS)
			const character = await this.supabaseAuthService.createCharacter(
				user.sub,
				characterData,
				token
			);

			if (!character) {
				return {
					error: 'Failed to create animal character',
				};
			}

			// Consume credits after successful character creation
			await this.creditClient.consumeCredits(
				user.sub,
				'character_creation',
				20,
				`Created animal character: ${name}`,
				{
					characterId,
					characterName: name,
					description,
					isAnimal: true,
					animalType: animalType.error ? '' : animalType.data,
				}
			);

			this.logger.log(
				`Successfully consumed 20 credits for animal character creation by user ${user.sub}`
			);

			// Return the response expected by the frontend
			return {
				data: {
					images: imagesData.map((img) => ({
						description: img.description,
						imageUrl: img.image_url,
					})),
					characterId,
				},
			};
		} catch (error) {
			if (error instanceof InsufficientCreditsException) {
				// Re-throw to let NestJS handle it with proper 402 status
				throw error;
			}
			this.logger.error('Error in generateAnimalCharacter:', error);
			// Throw error to let global exception filter handle it with user-friendly messages
			throw error;
		}
	}

	@Get()
	async getCharacters(
		@CurrentUser() user: JwtPayload,
		@UserToken() token: string,
		@Query('includeArchived') includeArchived?: string
	) {
		this.logger.log(
			`Fetching characters for user ${user.email} (${user.sub}), includeArchived: ${includeArchived}`
		);

		try {
			const characters = await this.supabaseAuthService.getUserCharacters(
				user.sub,
				token,
				includeArchived === 'true'
			);
			this.logger.log(`Found ${characters.length} characters for user ${user.sub}`);

			// Transform snake_case database fields to camelCase for frontend
			const transformedCharacters = characters.map((char) => ({
				id: char.id,
				uid: char.id, // For backwards compatibility
				name: char.name,
				imageUrl: char.image_url,
				originalDescription: char.user_description || char.original_description,
				characterDescriptionPrompt: char.character_description_prompt || char.character_description,
				images:
					char.images_data?.map((img: any) => ({
						description: img.description,
						imageUrl: img.image_url,
					})) || [],
				createdAt: char.created_at,
				archived: char.archived || false,
				isAnimal: char.is_animal || false,
				animalType: char.animal_type,
				blur_hash: char.blur_hash,
				share_code: char.share_code, // Include share code for character sharing
			}));

			return {
				data: transformedCharacters,
			};
		} catch (error) {
			this.logger.error('Error fetching characters:', error);
			return {
				error: 'Failed to fetch characters',
			};
		}
	}

	@Get(':id')
	async getCharacterById(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
		@UserToken() token: string
	) {
		this.logger.log(`Fetching character ${id} for user ${user.email} (${user.sub})`);

		try {
			const character = await this.supabaseAuthService.getCharacterById(id, token);

			// Verify the character belongs to this user OR is a system character
			const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
			const isSystemCharacter = character.user_id === SYSTEM_USER_ID;
			const isOwnCharacter = character.user_id === user.sub;

			if (!isSystemCharacter && !isOwnCharacter) {
				return {
					error: 'Character not found or access denied',
				};
			}

			return {
				data: character,
			};
		} catch (error) {
			this.logger.error('Error fetching character:', error);
			return {
				error: 'Failed to fetch character',
			};
		}
	}

	@Put(':id')
	async updateCharacter(
		@Param('id') id: string,
		@Body() updateData: any,
		@CurrentUser() user: JwtPayload,
		@UserToken() token: string
	) {
		this.logger.log(`Updating character ${id} for user ${user.email} (${user.sub})`);
		this.logger.log(`Update data: ${JSON.stringify(updateData)}`);

		try {
			const character = await this.supabaseAuthService.getCharacterById(id, token);

			// Verify the character belongs to this user OR is a system character
			const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
			const isSystemCharacter = character.user_id === SYSTEM_USER_ID;
			const isOwnCharacter = character.user_id === user.sub;

			if (!isSystemCharacter && !isOwnCharacter) {
				return {
					error: 'Character not found or access denied',
				};
			}

			// Update character using Supabase auth service
			const updatedCharacter = await this.supabaseAuthService.updateCharacter(
				id,
				updateData,
				token
			);

			// Log if share_code was updated
			if (updateData.share_code) {
				this.logger.log(
					`Share code ${updateData.share_code} saved for character ${id}. Verify: ${updatedCharacter.share_code}`
				);
			}

			return {
				data: updatedCharacter,
			};
		} catch (error: any) {
			this.logger.error('Error in updateCharacter - Raw error:', error);
			this.logger.error('Error type:', typeof error);
			this.logger.error('Error constructor:', error?.constructor?.name);
			this.logger.error('Error stack:', error?.stack);

			// Try different ways to get the error message
			let errorMessage = 'Unknown error';
			if (error?.message) {
				errorMessage = error.message;
			} else if (typeof error === 'string') {
				errorMessage = error;
			} else if (error?.toString && typeof error.toString === 'function') {
				errorMessage = error.toString();
			} else {
				try {
					errorMessage = JSON.stringify(error);
				} catch {
					errorMessage = 'Unable to serialize error';
				}
			}

			const errorDetails = error?.details || error?.hint || error?.code || '';

			this.logger.error(`Final error message: ${errorMessage}`);
			this.logger.error(`Error details: ${errorDetails}`);

			return {
				message: `Failed to update character: ${errorMessage}`,
				details: errorDetails,
				error: 'Bad Request',
				statusCode: 400,
			};
		}
	}

	@Delete(':id')
	async deleteCharacter(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
		@UserToken() token: string
	) {
		this.logger.log(`Deleting character ${id} for user ${user.email} (${user.sub})`);

		try {
			const character = await this.supabaseAuthService.getCharacterById(id, token);

			// Verify the character belongs to this user OR is a system character
			const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
			const isSystemCharacter = character.user_id === SYSTEM_USER_ID;
			const isOwnCharacter = character.user_id === user.sub;

			if (!isSystemCharacter && !isOwnCharacter) {
				return {
					error: 'Character not found or access denied',
				};
			}

			// Delete character using Supabase auth service
			const result = await this.supabaseAuthService.deleteCharacter(id, token);
			this.logger.log(`Successfully deleted character ${id}`);

			return {
				data: result,
			};
		} catch (error) {
			this.logger.error('Error in deleteCharacter:', error);
			return {
				error: 'Failed to delete character',
			};
		}
	}

	@Post('publish')
	async publishCharacter(
		@Body()
		body: {
			characterId: string;
			sharingPreference: 'private' | 'link_only' | 'public';
		},
		@CurrentUser() user: JwtPayload,
		@UserToken() token: string
	) {
		this.logger.log(`Publishing character ${body.characterId} for user ${user.sub}`);

		try {
			// Generate a share code if needed
			const shareCode =
				body.sharingPreference !== 'private' ? Math.random().toString(36).substring(2, 14) : null;

			// First get the character to ensure it exists and belongs to the user
			const character = await this.supabaseAuthService.getCharacterById(body.characterId, token);

			if (!character || character.user_id !== user.sub) {
				return { error: 'Character not found or access denied' };
			}

			// Update character using the auth service's updateCharacter method
			const updatedCharacter = await this.supabaseAuthService.updateCharacter(
				body.characterId,
				{
					is_published: body.sharingPreference !== 'private',
					sharing_preference: body.sharingPreference,
					published_at: body.sharingPreference !== 'private' ? new Date().toISOString() : null,
					share_code: shareCode,
				},
				token
			);

			return {
				data: updatedCharacter,
				share_code: shareCode,
				message: 'Character published successfully',
			};
		} catch (error) {
			this.logger.error('Error publishing character:', error);
			return { error: 'Failed to publish character' };
		}
	}

	@Post('unpublish/:characterId')
	async unpublishCharacter(
		@Param('characterId') characterId: string,
		@CurrentUser() user: JwtPayload,
		@UserToken() token: string
	) {
		this.logger.log(`Unpublishing character ${characterId} for user ${user.sub}`);

		try {
			// First get the character to ensure it exists and belongs to the user
			const character = await this.supabaseAuthService.getCharacterById(characterId, token);

			if (!character || character.user_id !== user.sub) {
				return { error: 'Character not found or access denied' };
			}

			// Update character using the auth service's updateCharacter method
			const updatedCharacter = await this.supabaseAuthService.updateCharacter(
				characterId,
				{
					is_published: false,
					sharing_preference: 'private',
					published_at: null,
				},
				token
			);

			return {
				data: updatedCharacter,
				message: 'Character unpublished successfully',
			};
		} catch (error) {
			this.logger.error('Error unpublishing character:', error);
			return { error: 'Failed to unpublish character' };
		}
	}

	@Get('shared/:characterId')
	async getSharedCharacter(
		@Param('characterId') characterId: string,
		@CurrentUser() user: JwtPayload
	) {
		this.logger.log(`User ${user.sub} fetching shared character ${characterId}`);

		try {
			// Use service account to fetch character (bypasses RLS)
			const character = await this.supabaseAuthService.getSharedCharacter(characterId);

			return {
				data: character,
			};
		} catch (error) {
			this.logger.error('Error fetching shared character:', error);
			return {
				error: 'Character not found or not available for sharing',
			};
		}
	}

	@Post('import/:characterId')
	async importCharacter(
		@Param('characterId') characterId: string,
		@CurrentUser() user: JwtPayload,
		@UserToken() token: string
	) {
		this.logger.log(`User ${user.email} (${user.sub}) importing character ${characterId}`);

		try {
			// Pre-flight credit check for character import (10 credits)
			const creditValidation = await this.creditClient.validateCredits(
				user.sub,
				'character_import',
				10
			);

			if (!creditValidation.hasCredits) {
				this.logger.warn(
					`User ${user.sub} has insufficient credits for character import. Required: 10, Available: ${creditValidation.availableCredits}`
				);
				throw new InsufficientCreditsException({
					requiredCredits: 10,
					availableCredits: creditValidation.availableCredits,
					creditType: 'user',
					operation: 'character_import',
				});
			}

			// Import the character
			const importedCharacter = await this.supabaseAuthService.importCharacter(
				characterId,
				user.sub,
				token
			);

			if (!importedCharacter) {
				return {
					error: 'Failed to import character',
				};
			}

			// Consume credits after successful import
			await this.creditClient.consumeCredits(
				user.sub,
				'character_import',
				10,
				`Imported character: ${importedCharacter.name}`,
				{
					importedCharacterId: importedCharacter.id,
					originalCharacterId: characterId,
					characterName: importedCharacter.name,
				}
			);

			this.logger.log(`Successfully consumed 10 credits for character import by user ${user.sub}`);

			// Transform to match frontend expectations
			const transformedCharacter = {
				id: importedCharacter.id,
				uid: importedCharacter.id,
				name: importedCharacter.name,
				imageUrl: importedCharacter.image_url,
				originalDescription:
					importedCharacter.user_description || importedCharacter.original_description,
				characterDescriptionPrompt:
					importedCharacter.character_description_prompt || importedCharacter.character_description,
				images:
					importedCharacter.images_data?.map((img: any) => ({
						description: img.description,
						imageUrl: img.image_url,
					})) || [],
				createdAt: importedCharacter.created_at,
				archived: importedCharacter.archived || false,
				isAnimal: importedCharacter.is_animal || false,
				animalType: importedCharacter.animal_type,
				blur_hash: importedCharacter.blur_hash,
			};

			return {
				data: transformedCharacter,
				message: 'Character imported successfully',
			};
		} catch (error) {
			if (error instanceof InsufficientCreditsException) {
				throw error;
			}
			this.logger.error('Error importing character:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to import character';
			return {
				error: errorMessage,
			};
		}
	}

	@Post('generate-animal-from-image')
	@UseInterceptors(FileInterceptor('image'))
	async generateAnimalFromImage(
		@UploadedFile() file: any, // Using any type for now, but we can define a proper interface if needed
		@Body('name') name: string,
		@CurrentUser() user?: JwtPayload, // Make user optional for local testing
		@UserToken() token?: string
	) {
		// For local testing, use a test user ID if not provided through auth
		const effectiveUserId = user?.sub || 'test-user-123';
		if (!file) {
			return {
				error: 'No image file uploaded',
			};
		}

		try {
			// Pre-flight credit check for character creation (20 credits) - only if we have a real user
			if (user?.sub) {
				const creditValidation = await this.creditClient.validateCredits(
					user.sub,
					'character_creation',
					20
				);

				if (!creditValidation.hasCredits) {
					this.logger.warn(
						`User ${user.sub} has insufficient credits for animal character creation from image. Required: 20, Available: ${creditValidation.availableCredits}`
					);
					throw new InsufficientCreditsException({
						requiredCredits: 20,
						availableCredits: creditValidation.availableCredits,
						creditType: 'user',
						operation: 'character_creation',
					});
				}
			}

			// 1. Save the uploaded image to Supabase Storage
			const fileExtension = path.extname(file.originalname).substring(1);
			const uploadResult = await this.imageService.saveUploadedImage(
				file.buffer,
				`${effectiveUserId}/uploaded-animals`,
				fileExtension || 'jpg',
				token
			);

			if (uploadResult.error) {
				this.logger.error(
					`Failed to save uploaded image for user ${effectiveUserId}:`,
					uploadResult.error
				);
				return {
					error: 'Failed to save uploaded image',
				};
			}

			const uploadedImageUrl = uploadResult.data!.url;
			const uploadedImageBlurHash = uploadResult.data!.blurHash;

			// 2. Analyze the image to get a description of the animal
			console.log('Analyzing image:', uploadedImageUrl);
			const analysisResult = await this.imageService.analyzeImage(uploadedImageUrl!);

			// Extract the description from the analysis result or use a fallback
			let userDescription: string;

			if (analysisResult.error) {
				console.error('Image analysis error:', analysisResult.error);
				// For testing purposes, we'll provide a fallback description
				// This allows us to continue with the character creation even if AI analysis fails
				userDescription = 'A domestic animal with fur, four legs, and a friendly expression.';
				console.log('Using fallback description:', userDescription);
			} else {
				userDescription = analysisResult.data || '';
				console.log('Successfully analyzed image, description:', userDescription);
			}

			// 3. Enhance the AI-detected description with detailed visual features
			const enhancedResult = await this.promptingService.enhanceAnimalCharacterDescription(
				userDescription,
				name
			);

			if (enhancedResult.error) {
				this.logger.warn('Failed to enhance character description from image, using original');
			}

			const characterDescription = enhancedResult.data || userDescription;
			this.logger.log(`Enhanced character description: ${characterDescription}`);

			// 4. Detect animal type from the AI analysis (not from enhanced version)
			const animalType = await this.promptingService.detectAnimalType(userDescription);
			this.logger.log(`Detected animal type: ${animalType.data || 'none'}`);

			// 5. Create Pixar-style image generation prompt
			const imagePrompt = `a cute, cartoon, 3d pixar style animal character: ${characterDescription}`;

			// 6. Generate three image variants with slightly different styling
			const characterDescriptionPrompt_2 =
				await this.promptingService.createAnimalCharacterDescriptionPrompt(imagePrompt, 0.9);
			const characterDescriptionPrompt_3 =
				await this.promptingService.createAnimalCharacterDescriptionPrompt(imagePrompt, 0.6);

			if (characterDescriptionPrompt_2.error || characterDescriptionPrompt_3.error) {
				throw new Error('Failed to generate character image prompts');
			}

			// 7. Generate images for all three descriptions in parallel
			const [image_original, image_2, image_3] = await Promise.all([
				this.imageService.generateImage(
					imagePrompt,
					`${effectiveUserId}/characters`,
					token,
					effectiveUserId
				),
				this.imageService.generateImage(
					characterDescriptionPrompt_2.data!,
					`${effectiveUserId}/characters`,
					token,
					effectiveUserId
				),
				this.imageService.generateImage(
					characterDescriptionPrompt_3.data!,
					`${effectiveUserId}/characters`,
					token,
					effectiveUserId
				),
			]);

			if (image_original.error || image_2.error || image_3.error) {
				// Log specific errors for debugging
				if (image_original.error) this.logger.error('Image 1 error:', image_original.error);
				if (image_2.error) this.logger.error('Image 2 error:', image_2.error);
				if (image_3.error) this.logger.error('Image 3 error:', image_3.error);

				// Throw the first error encountered to let global filter handle it
				const firstError = image_original.error || image_2.error || image_3.error;
				throw firstError;
			}

			// Prepare images in the format expected by Supabase
			const imagesData = [
				{
					description: imagePrompt,
					image_url: image_original.data,
				},
				{
					description: characterDescriptionPrompt_2.data,
					image_url: image_2.data,
				},
				{
					description: characterDescriptionPrompt_3.data,
					image_url: image_3.data,
				},
			];

			// 8. Create and store the animal character
			const characterId = randomUUID();

			// Get BlurHash for the main image
			const blurHash = this.imageService.getBlurHashForUrl(image_original.data!);
			this.logger.log(`Retrieved BlurHash for character: ${blurHash}`);

			// Create character data structure for Supabase with new fields
			const characterData = {
				id: characterId,
				name,
				images_data: imagesData,
				user_description: userDescription, // AI-analyzed description from image
				character_description: characterDescription, // Enhanced detailed description
				character_description_prompt: imagePrompt,
				image_url: image_original.data,
				source_image_url: uploadedImageUrl, // Store the uploaded image URL
				blur_hash: blurHash, // BlurHash of generated character
				created_at: new Date().toISOString(),
				is_animal: true,
				animal_type: animalType.error ? '' : animalType.data,
			};

			// Save character to Supabase
			const character = await this.supabaseAuthService.createCharacter(
				effectiveUserId,
				characterData,
				token
			);

			if (!character) {
				return {
					error: 'Failed to create animal character from image',
				};
			}

			// Consume credits after successful character creation - only if we have a real user
			if (user?.sub) {
				await this.creditClient.consumeCredits(
					user.sub,
					'character_creation',
					20,
					`Created animal character from image: ${name}`,
					{
						characterId,
						characterName: name,
						isAnimal: true,
						animalType: animalType.error ? '' : animalType.data,
						fromImage: true,
						uploadedImageUrl,
					}
				);

				this.logger.log(
					`Successfully consumed 20 credits for animal character creation from image by user ${user.sub}`
				);
			}

			// Return the response expected by the frontend
			return {
				data: {
					images: imagesData.map((img) => ({
						description: img.description,
						imageUrl: img.image_url,
					})),
					characterId,
					uploadedImage: uploadedImageUrl,
					animalDescription: characterDescription,
				},
			};
		} catch (error) {
			if (error instanceof InsufficientCreditsException) {
				// Re-throw to let NestJS handle it with proper 402 status
				throw error;
			}
			console.error('Error generating animal from image:', error);
			return {
				error: 'Failed to process the uploaded image',
			};
		}
	}
}
