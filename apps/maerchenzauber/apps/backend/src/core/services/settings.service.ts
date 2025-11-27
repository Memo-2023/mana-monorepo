import { Injectable, OnModuleInit } from '@nestjs/common';
import { DEFAULT_PROMPTS, Prompts } from '../util/prompts';
import { Creator, ExtraPrompts } from '../models/shared.models';
import { SupabaseProvider } from '../../supabase/supabase.provider';
import {
	IMAGE_MODELS,
	ImageModel,
	ImageModelId,
	DEFAULT_IMAGE_MODEL,
} from '../models/image-models';
import { Result } from '../models/error';

@Injectable()
export class SettingsService implements OnModuleInit {
	private prompts: Prompts = DEFAULT_PROMPTS;
	private creators: Creator[] = [];
	private replicateModel: string = IMAGE_MODELS[DEFAULT_IMAGE_MODEL].replicateId; // Default to imagen-4-fast
	private userImageModels: Map<string, ImageModelId> = new Map();
	private readonly defaultIllustratorPrompt = `You're a talented artist with a flair for creating captivating illustrations for animal books for children. You have a passion for bringing stories to life through your art and delighting young readers with your creativity.`;
	private readonly defaultAuthorPrompt = `You're a creative animal book writer for children with a passion for storytelling. You have a talent for creating engaging and informative stories that captivate young readers and spark their curiosity.`;

	constructor(private supabaseProvider: SupabaseProvider) {}

	async onModuleInit() {
		await this.initialize();
	}

	private async initialize(): Promise<void> {
		try {
			const supabase = this.supabaseProvider.getClient();

			// Fetch creators from Märchenzauber Supabase database
			const { data: creatorsData, error: creatorsError } = await supabase
				.from('creators')
				.select('*');

			if (creatorsError) {
				console.error('Failed to fetch creators from Märchenzauber Supabase:', creatorsError);
			} else if (creatorsData) {
				// Map Supabase data to Creator model
				this.creators = creatorsData.map((creator) => ({
					creatorId: creator.id,
					systemPrompt:
						creator.system_prompt ||
						(creator.type === 'author' ? this.defaultAuthorPrompt : this.defaultIllustratorPrompt),
					extraPromptBeginning: creator.extra_prompt_beginning || '',
					extraPromptEnd: creator.extra_prompt_end || '',
					type: creator.type,
					name: creator.name,
					description: creator.description || `${creator.type} creator`,
				}));
				console.log(`Loaded ${this.creators.length} creators from Märchenzauber database:`);
				this.creators.forEach((c) => console.log(`  - ${c.name} (${c.type}): ${c.creatorId}`));
			}

			// Load user settings from database
			await this.loadUserSettings();
		} catch (error) {
			console.error('Failed to initialize settings from Märchenzauber Supabase:', error);
			this.replicateModel = IMAGE_MODELS[DEFAULT_IMAGE_MODEL].replicateId;
		}
	}

	private async loadUserSettings(): Promise<void> {
		try {
			const supabase = this.supabaseProvider.getClient();
			const { data: settings, error } = await supabase
				.from('user_settings')
				.select('user_id, image_model');

			if (error) {
				console.error('Failed to load user settings:', error);
				return;
			}

			if (settings) {
				settings.forEach((setting) => {
					if (setting.image_model && IMAGE_MODELS[setting.image_model as ImageModelId]) {
						this.userImageModels.set(setting.user_id, setting.image_model as ImageModelId);
					}
				});
				console.log(`Loaded settings for ${this.userImageModels.size} users`);
			}
		} catch (error) {
			console.error('Error loading user settings:', error);
		}
	}

	public getAuthorPrompt(creatorId?: string | null): string {
		if (!creatorId) {
			console.info('No creator ID provided, using default author prompt');
			return this.defaultAuthorPrompt;
		}
		const creator = this.findCreatorById(creatorId);
		if (!creator) {
			console.info(`Creator with id ${creatorId} not found, using default author prompt`);
			return this.defaultAuthorPrompt;
		}
		return creator.systemPrompt;
	}

	public getIllustratorPrompt(creatorId?: string | null): string {
		if (!creatorId) {
			console.info('No creator ID provided, using default illustrator prompt');
			return this.defaultIllustratorPrompt;
		}
		const creator = this.findCreatorById(creatorId);
		if (!creator) {
			console.info(`Creator with id ${creatorId} not found, using default illustrator prompt`);
			return this.defaultIllustratorPrompt;
		}
		return creator.systemPrompt;
	}

	public getAuthorPromptWithExtra(creatorId?: string | null): ExtraPrompts {
		if (!creatorId) {
			console.info('No creator ID provided, using default author extra prompts');
			return {
				extraPromptBeginning: '',
				extraPromptEnd: '',
			};
		}
		const creator = this.findCreatorById(creatorId);
		if (!creator) {
			console.info(`Creator with id ${creatorId} not found, using default author prompt`);
			return {
				extraPromptBeginning: '',
				extraPromptEnd: '',
			};
		}
		return {
			extraPromptBeginning: creator.extraPromptBeginning ? creator.extraPromptBeginning : '',
			extraPromptEnd: creator.extraPromptEnd ? creator.extraPromptEnd : '',
		};
	}

	public getIllustratorPromptWithExtra(creatorId?: string | null): ExtraPrompts {
		if (!creatorId) {
			console.info('No creator ID provided, using default illustrator extra prompts');
			return {
				extraPromptBeginning: '',
				extraPromptEnd: '',
			};
		}
		const creator = this.findCreatorById(creatorId);
		if (!creator) {
			console.info(`Creator with id ${creatorId} not found, using default illustrator prompt`);
			return {
				extraPromptBeginning: '',
				extraPromptEnd: '',
			};
		}
		return {
			extraPromptBeginning: creator.extraPromptBeginning ? creator.extraPromptBeginning : '',
			extraPromptEnd: creator.extraPromptEnd ? creator.extraPromptEnd : '',
		};
	}

	private findCreatorById(id: string): Creator | undefined {
		return this.creators.find((creator) => creator.creatorId === id);
	}

	public getAllSettings(): Prompts & { replicateModel: string } {
		return {
			...this.prompts,
			replicateModel: this.replicateModel,
		};
	}

	public getReplicateModel(userId?: string): string {
		if (userId) {
			const userModel = this.userImageModels.get(userId);
			if (userModel && IMAGE_MODELS[userModel]) {
				return IMAGE_MODELS[userModel].replicateId;
			}
		}
		return this.replicateModel;
	}

	public async getUserImageModel(userId: string): Promise<Result<ImageModelId>> {
		try {
			const supabase = this.supabaseProvider.getClient();
			const { data, error } = await supabase
				.from('user_settings')
				.select('image_model')
				.eq('user_id', userId)
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					// No settings found, return default
					return { data: DEFAULT_IMAGE_MODEL, error: null };
				}
				throw error;
			}

			const modelId = data?.image_model as ImageModelId;
			if (modelId && IMAGE_MODELS[modelId]) {
				this.userImageModels.set(userId, modelId);
				return { data: modelId, error: null };
			}

			return { data: DEFAULT_IMAGE_MODEL, error: null };
		} catch (error) {
			console.error('Error getting user image model:', error);
			return { data: DEFAULT_IMAGE_MODEL, error: null };
		}
	}

	public async setUserImageModel(userId: string, modelId: ImageModelId): Promise<Result<void>> {
		try {
			if (!IMAGE_MODELS[modelId]) {
				return { data: null, error: new Error('Invalid model ID') };
			}

			const supabase = this.supabaseProvider.getClient();
			const { error } = await supabase.from('user_settings').upsert(
				{
					user_id: userId,
					image_model: modelId,
					updated_at: new Date().toISOString(),
				},
				{
					onConflict: 'user_id',
				}
			);

			if (error) {
				throw error;
			}

			this.userImageModels.set(userId, modelId);
			return { data: null, error: null };
		} catch (error) {
			console.error('Error setting user image model:', error);
			return { data: null, error: error as Error };
		}
	}

	public getAvailableImageModels(): ImageModel[] {
		return Object.values(IMAGE_MODELS);
	}

	public getImageModelInfo(modelId: ImageModelId): ImageModel | null {
		return IMAGE_MODELS[modelId] || null;
	}

	public getCreators(): Creator[] {
		return this.creators;
	}

	public getCreatorsByType(type: 'author' | 'illustrator'): Creator[] {
		return this.creators.filter((creator) => creator.type === type);
	}

	public getPromptTemplate(type: keyof Prompts['templates']): string {
		return this.prompts.templates[type];
	}

	/**
	 * Formats a prompt template by replacing placeholders with values from the variables object.
	 *
	 * @param template The template string containing placeholders in the format {key}.
	 * @param variables An object containing the values to replace the placeholders.
	 * @returns The formatted prompt string.
	 */
	public formatPrompt(template: string, variables: Record<string, any>): string {
		return template.replace(/\{([^}]+)\}/g, (match, path) => {
			const value = path
				.split('.')
				.reduce(
					(obj: any, key: any) => (obj && obj[key] !== undefined ? obj[key] : match),
					variables
				);
			return String(value);
		});
	}
}
