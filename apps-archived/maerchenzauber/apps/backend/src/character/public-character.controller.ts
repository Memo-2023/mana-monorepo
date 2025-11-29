import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	Logger,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@mana-core/nestjs-integration';
import { UserToken } from '../decorators/user.decorator';
import { JwtPayload } from '../types/jwt-payload.interface';
import { SupabaseJsonbAuthService } from '../core/services/supabase-jsonb-auth.service';
import { randomUUID } from 'crypto';

@Controller('characters/public')
export class PublicCharacterController {
	private readonly logger = new Logger(PublicCharacterController.name);

	constructor(private readonly supabaseAuthService: SupabaseJsonbAuthService) {}

	/**
	 * Get list of public characters with filtering and pagination
	 */
	@Get()
	async getPublicCharacters(
		@Query('filter') filter = 'popular',
		@Query('limit') limit = '20',
		@Query('offset') offset = '0',
		@Query('collection') collectionId?: string
	) {
		this.logger.log(
			`Fetching public characters - filter: ${filter}, limit: ${limit}, offset: ${offset}`
		);

		try {
			const limitNum = parseInt(limit, 10) || 20;
			const offsetNum = parseInt(offset, 10) || 0;

			const characters = await this.supabaseAuthService.getPublicCharacters(
				filter,
				limitNum,
				offsetNum,
				collectionId
			);

			// Check if there are more characters
			const hasMore = characters.length === limitNum;

			return {
				characters,
				hasMore,
				total: characters.length,
			};
		} catch (error) {
			this.logger.error('Error fetching public characters:', error);
			return {
				characters: [],
				hasMore: false,
				error: 'Failed to fetch public characters',
			};
		}
	}

	/**
	 * Get character collections (predefined groups)
	 */
	@Get('collections')
	async getCharacterCollections() {
		this.logger.log('Fetching character collections');

		try {
			// For now, return static collections
			// Later this can be moved to database
			const collections = [
				{
					id: 'official',
					name: 'Offizielle Charaktere',
					description: 'Von Märchenzauber erstellte Charaktere',
					type: 'official',
					is_official: true,
					is_active: true,
					sort_order: 1,
					icon_url: null,
					banner_url: null,
					character_count: 0,
				},
				{
					id: 'community',
					name: 'Community Lieblinge',
					description: 'Die beliebtesten Charaktere der Community',
					type: 'community',
					is_official: false,
					is_active: true,
					sort_order: 2,
					icon_url: null,
					banner_url: null,
					character_count: 0,
				},
				{
					id: 'seasonal',
					name: 'Saisonale Charaktere',
					description: 'Charaktere für besondere Anlässe',
					type: 'seasonal',
					is_official: false,
					is_active: true,
					sort_order: 3,
					icon_url: null,
					banner_url: null,
					character_count: 0,
				},
			];

			return collections;
		} catch (error) {
			this.logger.error('Error fetching collections:', error);
			return [];
		}
	}

	/**
	 * Vote for a character
	 */
	@Post('vote')
	@UseGuards(AuthGuard)
	async voteForCharacter(
		@Body() body: { characterId: string; voteType: 'like' | 'love' | 'star' },
		@CurrentUser() user: JwtPayload,
		@UserToken() token: string
	) {
		this.logger.log(
			`User ${user.sub} voting for character ${body.characterId} with ${body.voteType}`
		);

		try {
			// Check if character exists and is public
			const character = await this.supabaseAuthService.getPublicCharacterById(body.characterId);

			if (!character) {
				return { error: 'Character not found or not public' };
			}

			// Save vote
			const result = await this.supabaseAuthService.voteForCharacter(
				body.characterId,
				user.sub,
				body.voteType,
				token
			);

			if (!result) {
				return { error: 'Failed to vote' };
			}

			return {
				success: true,
				message: 'Vote recorded successfully',
			};
		} catch (error) {
			this.logger.error('Error voting for character:', error);
			return { error: 'Failed to vote for character' };
		}
	}

	/**
	 * Remove vote from a character
	 */
	@Delete('vote/:characterId')
	@UseGuards(AuthGuard)
	async removeVote(
		@Param('characterId') characterId: string,
		@CurrentUser() user: JwtPayload,
		@UserToken() token: string
	) {
		this.logger.log(`User ${user.sub} removing vote from character ${characterId}`);

		try {
			const result = await this.supabaseAuthService.removeVote(characterId, user.sub, token);

			if (!result) {
				return { error: 'Failed to remove vote' };
			}

			return {
				success: true,
				message: 'Vote removed successfully',
			};
		} catch (error) {
			this.logger.error('Error removing vote:', error);
			return { error: 'Failed to remove vote' };
		}
	}

	/**
	 * Clone a public character to user's collection
	 */
	@Post('clone/:characterId')
	@UseGuards(AuthGuard)
	async cloneCharacter(
		@Param('characterId') characterId: string,
		@CurrentUser() user: JwtPayload,
		@UserToken() token: string
	) {
		this.logger.log(`User ${user.sub} cloning character ${characterId}`);

		try {
			// Get the public character
			const publicCharacter = await this.supabaseAuthService.getPublicCharacterById(characterId);

			if (!publicCharacter) {
				return { error: 'Character not found or not public' };
			}

			// Create a copy for the user
			const newCharacterId = randomUUID();
			const clonedCharacter = {
				...publicCharacter,
				id: newCharacterId,
				user_id: user.sub,
				name: `${publicCharacter.name} (Kopie)`,
				is_published: false,
				sharing_preference: 'private',
				published_at: null,
				share_code: null,
				cloned_from: characterId,
				created_at: new Date().toISOString(),
			};

			// Remove fields that shouldn't be copied
			delete clonedCharacter.total_vote_score;
			delete clonedCharacter.stories_count;

			// Save the cloned character
			const result = await this.supabaseAuthService.createCharacter(
				user.sub,
				clonedCharacter,
				token
			);

			if (!result) {
				return { error: 'Failed to clone character' };
			}

			return {
				character: result,
				message: 'Character cloned successfully',
			};
		} catch (error) {
			this.logger.error('Error cloning character:', error);
			return { error: 'Failed to clone character' };
		}
	}

	/**
	 * Get a single public character by ID and share code
	 * Used for universal links: https://märchen-zauber.de/character/{id}/{shareCode}
	 */
	@Get(':id/:shareCode')
	async getCharacterByIdAndShareCode(
		@Param('id') id: string,
		@Param('shareCode') shareCode: string
	) {
		this.logger.log(`Fetching character ${id} with share code: ${shareCode} (no auth required)`);

		try {
			// Use service account to fetch character (bypasses RLS)
			const character = await this.supabaseAuthService.getSharedCharacter(id);

			// Validate share code matches
			if (character.share_code !== shareCode) {
				this.logger.warn(
					`Share code mismatch for character ${id}. Expected: ${character.share_code}, Got: ${shareCode}`
				);
				return { error: 'Invalid share code or character not found' };
			}

			// Transform to match frontend expectations
			const transformedCharacter = {
				id: character.id,
				name: character.name,
				imageUrls: character.images_data?.map((img: any) => img.image_url) || [character.image_url],
				description: character.user_description || character.character_description,
				createdAt: character.created_at,
				isAnimal: character.is_animal || false,
				animalType: character.animal_type,
			};

			return transformedCharacter;
		} catch (error) {
			this.logger.error('Error fetching character by ID and share code:', error);
			return { error: 'Character not found or not available for sharing' };
		}
	}

	/**
	 * Get a single public character by share code
	 */
	@Get('share/:shareCode')
	async getCharacterByShareCode(@Param('shareCode') shareCode: string) {
		this.logger.log(`Fetching character by share code: ${shareCode}`);

		try {
			const character = await this.supabaseAuthService.getCharacterByShareCode(shareCode);

			if (!character) {
				return { error: 'Character not found' };
			}

			return {
				character,
			};
		} catch (error) {
			this.logger.error('Error fetching character by share code:', error);
			return { error: 'Failed to fetch character' };
		}
	}
}
