import {
	Controller,
	Get,
	Put,
	Body,
	UseGuards,
	UsePipes,
	ValidationPipe,
	Param,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@mana-core/nestjs-integration';
import { UserToken } from '../decorators/user.decorator';
import { SettingsClientService, UserSettings } from './settings-client.service';
import { SettingsService } from '../core/services/settings.service';
import { JwtPayload } from '../types/jwt-payload.interface';
import { UpdateUserSettingsDto } from './dto/settings.dto';
import { ImageModelId } from '../core/models/image-models';

@Controller('settings')
@UseGuards(AuthGuard)
export class SettingsController {
	constructor(
		private readonly settingsClientService: SettingsClientService,
		private readonly settingsService: SettingsService
	) {}

	/**
	 * Get user-specific settings
	 */
	@Get('user')
	async getUserSettings(
		@CurrentUser() user: JwtPayload,
		@UserToken() token: string
	): Promise<{ userId: string; settings: UserSettings }> {
		const settings = await this.settingsClientService.getUserSettings(token);
		return {
			userId: user.sub,
			settings: settings || {
				// Default settings if none exist
				preferences: {
					language: 'en',
					timezone: 'UTC',
					dateFormat: 'MM/DD/YYYY',
				},
				maerchenzauber: {
					language: 'de',
					storyLength: 'medium',
					ageGroup: '4-6',
				},
			},
		};
	}

	/**
	 * Get available image generation models
	 */
	@Get('image-models')
	async getAvailableImageModels() {
		const models = this.settingsService.getAvailableImageModels();
		return {
			models,
			default: 'imagen-4-fast',
			categories: {
				budget: models.filter((m) => m.category === 'budget'),
				standard: models.filter((m) => m.category === 'standard'),
				premium: models.filter((m) => m.category === 'premium'),
				specialty: models.filter((m) => m.category === 'specialty'),
			},
		};
	}

	/**
	 * Get user's selected image model
	 */
	@Get('user/image-model')
	async getUserImageModel(@CurrentUser() user: JwtPayload) {
		const result = await this.settingsService.getUserImageModel(user.sub);
		if (result.error) {
			return {
				model: 'imagen-4-fast',
				error: result.error.message,
			};
		}
		return {
			model: result.data,
			modelInfo: this.settingsService.getImageModelInfo(result.data!),
		};
	}

	/**
	 * Update user's selected image model
	 */
	@Put('user/image-model')
	async updateUserImageModel(
		@CurrentUser() user: JwtPayload,
		@Body('model') modelId: ImageModelId
	) {
		const result = await this.settingsService.setUserImageModel(user.sub, modelId);
		if (result.error) {
			return {
				success: false,
				error: result.error.message,
			};
		}
		return {
			success: true,
			model: modelId,
			modelInfo: this.settingsService.getImageModelInfo(modelId),
		};
	}

	/**
	 * Update user-specific settings
	 */
	@Put('user')
	@UsePipes(ValidationPipe)
	async updateUserSettings(
		@CurrentUser() user: JwtPayload,
		@UserToken() token: string,
		@Body() settings: UpdateUserSettingsDto
	) {
		await this.settingsClientService.updateServiceSettings(settings as any, token);

		return {
			success: true,
			userId: user.sub,
			settings,
		};
	}

	/**
	 * Get app-wide settings (public)
	 */
	@Get('app')
	async getAppSettings() {
		const settings = this.settingsService.getAllSettings();
		return {
			app: 'storyteller',
			version: '1.0.0',
			settings: {
				features: {
					aiStoryGeneration: true,
					characterCreation: true,
					imageGeneration: true,
					collaborativeStories: false, // Coming soon
					voiceNarration: false, // Coming soon
				},
				limits: {
					maxCharactersPerUser: 50,
					maxStoriesPerUser: 100,
					maxPagesPerStory: 20,
					maxImageGenerationsPerDay: 10,
				},
				costs: {
					characterCreation: 5,
					storyGeneration: 10,
					imageGeneration: 3,
					voiceNarration: 15,
				},
				...settings,
			},
		};
	}

	/**
	 * Get feature flags
	 */
	@Get('features')
	async getFeatureFlags(@CurrentUser() user: JwtPayload) {
		// Check user-specific feature flags
		const userRole = user.role || 'user';

		return {
			userId: user.sub,
			role: userRole,
			features: {
				// Core features
				createCharacter: true,
				createStory: true,
				generateImages: true,

				// Premium features (role-based)
				unlimitedStories: userRole === 'premium' || userRole === 'admin',
				voiceNarration: userRole === 'premium' || userRole === 'admin',
				collaborativeMode: false, // Not implemented yet

				// Beta features
				betaFeatures: userRole === 'admin',
				debugMode: userRole === 'admin',
			},
		};
	}

	/**
	 * Get creators list (for story creation)
	 */
	@Get('creators')
	async getCreators() {
		const creators = this.settingsService.getCreators();
		const authors = creators.filter((c) => c.type === 'author');
		const illustrators = creators.filter((c) => c.type === 'illustrator');

		return {
			authors,
			illustrators,
			total: creators.length,
		};
	}

	/**
	 * Get creators by type
	 */
	@Get('creators/:type')
	async getCreatorsByType(@Param('type') type: 'author' | 'illustrator') {
		if (type !== 'author' && type !== 'illustrator') {
			return {
				error: 'Invalid creator type. Must be "author" or "illustrator"',
			};
		}

		const creators = this.settingsService.getCreatorsByType(type);
		return {
			creators,
			type,
			count: creators.length,
		};
	}

	/**
	 * Get supported languages
	 */
	@Get('languages')
	async getSupportedLanguages() {
		return {
			languages: [
				{ code: 'en', name: 'English', flag: '🇺🇸' },
				{ code: 'de', name: 'Deutsch', flag: '🇩🇪' },
				{ code: 'es', name: 'Español', flag: '🇪🇸' },
				{ code: 'fr', name: 'Français', flag: '🇫🇷' },
				{ code: 'it', name: 'Italiano', flag: '🇮🇹' },
			],
			default: 'en',
		};
	}

	/**
	 * Get theme options
	 */
	@Get('themes')
	async getThemeOptions() {
		return {
			themes: [
				{
					id: 'light',
					name: 'Light Mode',
					description: 'Default light theme',
				},
				{
					id: 'dark',
					name: 'Dark Mode',
					description: 'Easy on the eyes',
				},
				{
					id: 'kids',
					name: 'Kids Mode',
					description: 'Colorful and playful',
				},
			],
			default: 'light',
		};
	}
}
