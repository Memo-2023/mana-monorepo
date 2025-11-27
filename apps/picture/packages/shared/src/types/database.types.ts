export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: '13.0.4';
	};
	public: {
		Tables: {
			batch_generations: {
				Row: {
					completed_at: string | null;
					completed_count: number | null;
					created_at: string | null;
					failed_count: number | null;
					guidance_scale: number | null;
					height: number | null;
					id: string;
					is_multi_generation: boolean | null;
					model_id: string | null;
					model_version: string | null;
					multi_count: number | null;
					name: string | null;
					status: string | null;
					steps: number | null;
					total_count: number;
					user_id: string | null;
					width: number | null;
				};
				Insert: {
					completed_at?: string | null;
					completed_count?: number | null;
					created_at?: string | null;
					failed_count?: number | null;
					guidance_scale?: number | null;
					height?: number | null;
					id?: string;
					is_multi_generation?: boolean | null;
					model_id?: string | null;
					model_version?: string | null;
					multi_count?: number | null;
					name?: string | null;
					status?: string | null;
					steps?: number | null;
					total_count: number;
					user_id?: string | null;
					width?: number | null;
				};
				Update: {
					completed_at?: string | null;
					completed_count?: number | null;
					created_at?: string | null;
					failed_count?: number | null;
					guidance_scale?: number | null;
					height?: number | null;
					id?: string;
					is_multi_generation?: boolean | null;
					model_id?: string | null;
					model_version?: string | null;
					multi_count?: number | null;
					name?: string | null;
					status?: string | null;
					steps?: number | null;
					total_count?: number;
					user_id?: string | null;
					width?: number | null;
				};
				Relationships: [];
			};
			generation_errors: {
				Row: {
					batch_id: string | null;
					created_at: string | null;
					error_details: Json | null;
					error_message: string | null;
					error_type: string | null;
					generation_id: string | null;
					id: string;
					max_retries: number | null;
					recovered_at: string | null;
					recovery_action: string | null;
					retry_after: string | null;
					retry_count: number | null;
					user_id: string | null;
				};
				Insert: {
					batch_id?: string | null;
					created_at?: string | null;
					error_details?: Json | null;
					error_message?: string | null;
					error_type?: string | null;
					generation_id?: string | null;
					id?: string;
					max_retries?: number | null;
					recovered_at?: string | null;
					recovery_action?: string | null;
					retry_after?: string | null;
					retry_count?: number | null;
					user_id?: string | null;
				};
				Update: {
					batch_id?: string | null;
					created_at?: string | null;
					error_details?: Json | null;
					error_message?: string | null;
					error_type?: string | null;
					generation_id?: string | null;
					id?: string;
					max_retries?: number | null;
					recovered_at?: string | null;
					recovery_action?: string | null;
					retry_after?: string | null;
					retry_count?: number | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'generation_errors_batch_id_fkey';
						columns: ['batch_id'];
						isOneToOne: false;
						referencedRelation: 'batch_generations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'generation_errors_batch_id_fkey';
						columns: ['batch_id'];
						isOneToOne: false;
						referencedRelation: 'batch_progress';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'generation_errors_generation_id_fkey';
						columns: ['generation_id'];
						isOneToOne: false;
						referencedRelation: 'image_generations';
						referencedColumns: ['id'];
					},
				];
			};
			generation_performance: {
				Row: {
					batch_id: string | null;
					completed_at: string | null;
					created_at: string | null;
					error_message: string | null;
					generation_id: string | null;
					height: number | null;
					id: string;
					model_id: string | null;
					model_version: string | null;
					processing_time_ms: number | null;
					queue_time_ms: number | null;
					retry_count: number | null;
					started_at: string | null;
					status: string | null;
					steps: number | null;
					total_time_ms: number | null;
					user_id: string | null;
					width: number | null;
				};
				Insert: {
					batch_id?: string | null;
					completed_at?: string | null;
					created_at?: string | null;
					error_message?: string | null;
					generation_id?: string | null;
					height?: number | null;
					id?: string;
					model_id?: string | null;
					model_version?: string | null;
					processing_time_ms?: number | null;
					queue_time_ms?: number | null;
					retry_count?: number | null;
					started_at?: string | null;
					status?: string | null;
					steps?: number | null;
					total_time_ms?: number | null;
					user_id?: string | null;
					width?: number | null;
				};
				Update: {
					batch_id?: string | null;
					completed_at?: string | null;
					created_at?: string | null;
					error_message?: string | null;
					generation_id?: string | null;
					height?: number | null;
					id?: string;
					model_id?: string | null;
					model_version?: string | null;
					processing_time_ms?: number | null;
					queue_time_ms?: number | null;
					retry_count?: number | null;
					started_at?: string | null;
					status?: string | null;
					steps?: number | null;
					total_time_ms?: number | null;
					user_id?: string | null;
					width?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: 'generation_performance_batch_id_fkey';
						columns: ['batch_id'];
						isOneToOne: false;
						referencedRelation: 'batch_generations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'generation_performance_batch_id_fkey';
						columns: ['batch_id'];
						isOneToOne: false;
						referencedRelation: 'batch_progress';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'generation_performance_generation_id_fkey';
						columns: ['generation_id'];
						isOneToOne: false;
						referencedRelation: 'image_generations';
						referencedColumns: ['id'];
					},
				];
			};
			image_generations: {
				Row: {
					batch_id: string | null;
					batch_index: number | null;
					completed_at: string | null;
					created_at: string | null;
					error_message: string | null;
					generation_strength: number | null;
					generation_time_seconds: number | null;
					guidance_scale: number | null;
					height: number | null;
					id: string;
					model: string | null;
					model_id: string | null;
					multi_group_id: string | null;
					multi_index: number | null;
					negative_prompt: string | null;
					priority: number | null;
					prompt: string;
					replicate_prediction_id: string | null;
					retry_count: number | null;
					seed: number | null;
					source_image_url: string | null;
					status: string | null;
					steps: number | null;
					style: string | null;
					user_id: string | null;
					width: number | null;
				};
				Insert: {
					batch_id?: string | null;
					batch_index?: number | null;
					completed_at?: string | null;
					created_at?: string | null;
					error_message?: string | null;
					generation_strength?: number | null;
					generation_time_seconds?: number | null;
					guidance_scale?: number | null;
					height?: number | null;
					id?: string;
					model?: string | null;
					model_id?: string | null;
					multi_group_id?: string | null;
					multi_index?: number | null;
					negative_prompt?: string | null;
					priority?: number | null;
					prompt: string;
					replicate_prediction_id?: string | null;
					retry_count?: number | null;
					seed?: number | null;
					source_image_url?: string | null;
					status?: string | null;
					steps?: number | null;
					style?: string | null;
					user_id?: string | null;
					width?: number | null;
				};
				Update: {
					batch_id?: string | null;
					batch_index?: number | null;
					completed_at?: string | null;
					created_at?: string | null;
					error_message?: string | null;
					generation_strength?: number | null;
					generation_time_seconds?: number | null;
					guidance_scale?: number | null;
					height?: number | null;
					id?: string;
					model?: string | null;
					model_id?: string | null;
					multi_group_id?: string | null;
					multi_index?: number | null;
					negative_prompt?: string | null;
					priority?: number | null;
					prompt?: string;
					replicate_prediction_id?: string | null;
					retry_count?: number | null;
					seed?: number | null;
					source_image_url?: string | null;
					status?: string | null;
					steps?: number | null;
					style?: string | null;
					user_id?: string | null;
					width?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: 'image_generations_batch_id_fkey';
						columns: ['batch_id'];
						isOneToOne: false;
						referencedRelation: 'batch_generations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'image_generations_batch_id_fkey';
						columns: ['batch_id'];
						isOneToOne: false;
						referencedRelation: 'batch_progress';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'image_generations_model_id_fkey';
						columns: ['model_id'];
						isOneToOne: false;
						referencedRelation: 'models';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'image_generations_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
				];
			};
			image_likes: {
				Row: {
					created_at: string | null;
					id: string;
					image_id: string | null;
					user_id: string | null;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					image_id?: string | null;
					user_id?: string | null;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					image_id?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'image_likes_image_id_fkey';
						columns: ['image_id'];
						isOneToOne: false;
						referencedRelation: 'images';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'image_likes_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
				];
			};
			image_tags: {
				Row: {
					added_at: string | null;
					id: string;
					image_id: string | null;
					tag_id: string | null;
				};
				Insert: {
					added_at?: string | null;
					id?: string;
					image_id?: string | null;
					tag_id?: string | null;
				};
				Update: {
					added_at?: string | null;
					id?: string;
					image_id?: string | null;
					tag_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'image_tags_image_id_fkey';
						columns: ['image_id'];
						isOneToOne: false;
						referencedRelation: 'images';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'image_tags_tag_id_fkey';
						columns: ['tag_id'];
						isOneToOne: false;
						referencedRelation: 'tags';
						referencedColumns: ['id'];
					},
				];
			};
			images: {
				Row: {
					archived_at: string | null;
					blurhash: string | null;
					created_at: string | null;
					download_count: number | null;
					file_size: number | null;
					filename: string;
					format: string | null;
					generation_id: string | null;
					generation_strength: number | null;
					height: number | null;
					id: string;
					is_favorite: boolean | null;
					is_public: boolean | null;
					model: string | null;
					negative_prompt: string | null;
					prompt: string;
					public_url: string | null;
					rating: number | null;
					source_image_id: string | null;
					storage_path: string;
					style: string | null;
					user_id: string | null;
					width: number | null;
				};
				Insert: {
					archived_at?: string | null;
					blurhash?: string | null;
					created_at?: string | null;
					download_count?: number | null;
					file_size?: number | null;
					filename: string;
					format?: string | null;
					generation_id?: string | null;
					generation_strength?: number | null;
					height?: number | null;
					id?: string;
					is_favorite?: boolean | null;
					is_public?: boolean | null;
					model?: string | null;
					negative_prompt?: string | null;
					prompt: string;
					public_url?: string | null;
					rating?: number | null;
					source_image_id?: string | null;
					storage_path: string;
					style?: string | null;
					user_id?: string | null;
					width?: number | null;
				};
				Update: {
					archived_at?: string | null;
					blurhash?: string | null;
					created_at?: string | null;
					download_count?: number | null;
					file_size?: number | null;
					filename?: string;
					format?: string | null;
					generation_id?: string | null;
					generation_strength?: number | null;
					height?: number | null;
					id?: string;
					is_favorite?: boolean | null;
					is_public?: boolean | null;
					model?: string | null;
					negative_prompt?: string | null;
					prompt?: string;
					public_url?: string | null;
					rating?: number | null;
					source_image_id?: string | null;
					storage_path?: string;
					style?: string | null;
					user_id?: string | null;
					width?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: 'images_generation_id_fkey';
						columns: ['generation_id'];
						isOneToOne: false;
						referencedRelation: 'image_generations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'images_source_image_id_fkey';
						columns: ['source_image_id'];
						isOneToOne: false;
						referencedRelation: 'images';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'images_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
				];
			};
			models: {
				Row: {
					cost_per_generation: number | null;
					created_at: string | null;
					default_guidance_scale: number | null;
					default_height: number | null;
					default_steps: number | null;
					default_strength: number | null;
					default_width: number | null;
					description: string | null;
					display_name: string;
					estimated_time_seconds: number | null;
					id: string;
					is_active: boolean | null;
					is_default: boolean | null;
					max_height: number | null;
					max_steps: number | null;
					max_width: number | null;
					min_height: number | null;
					min_width: number | null;
					name: string;
					replicate_id: string;
					sort_order: number | null;
					strength_max: number | null;
					strength_min: number | null;
					supported_aspect_ratios: Json | null;
					supports_image_to_image: boolean | null;
					supports_img2img: boolean | null;
					supports_negative_prompt: boolean | null;
					supports_seed: boolean | null;
					updated_at: string | null;
					version: string | null;
				};
				Insert: {
					cost_per_generation?: number | null;
					created_at?: string | null;
					default_guidance_scale?: number | null;
					default_height?: number | null;
					default_steps?: number | null;
					default_strength?: number | null;
					default_width?: number | null;
					description?: string | null;
					display_name: string;
					estimated_time_seconds?: number | null;
					id?: string;
					is_active?: boolean | null;
					is_default?: boolean | null;
					max_height?: number | null;
					max_steps?: number | null;
					max_width?: number | null;
					min_height?: number | null;
					min_width?: number | null;
					name: string;
					replicate_id: string;
					sort_order?: number | null;
					strength_max?: number | null;
					strength_min?: number | null;
					supported_aspect_ratios?: Json | null;
					supports_image_to_image?: boolean | null;
					supports_img2img?: boolean | null;
					supports_negative_prompt?: boolean | null;
					supports_seed?: boolean | null;
					updated_at?: string | null;
					version?: string | null;
				};
				Update: {
					cost_per_generation?: number | null;
					created_at?: string | null;
					default_guidance_scale?: number | null;
					default_height?: number | null;
					default_steps?: number | null;
					default_strength?: number | null;
					default_width?: number | null;
					description?: string | null;
					display_name?: string;
					estimated_time_seconds?: number | null;
					id?: string;
					is_active?: boolean | null;
					is_default?: boolean | null;
					max_height?: number | null;
					max_steps?: number | null;
					max_width?: number | null;
					min_height?: number | null;
					min_width?: number | null;
					name?: string;
					replicate_id?: string;
					sort_order?: number | null;
					strength_max?: number | null;
					strength_min?: number | null;
					supported_aspect_ratios?: Json | null;
					supports_image_to_image?: boolean | null;
					supports_img2img?: boolean | null;
					supports_negative_prompt?: boolean | null;
					supports_seed?: boolean | null;
					updated_at?: string | null;
					version?: string | null;
				};
				Relationships: [];
			};
			profiles: {
				Row: {
					avatar_url: string | null;
					created_at: string | null;
					email: string | null;
					id: string;
					updated_at: string | null;
					username: string | null;
				};
				Insert: {
					avatar_url?: string | null;
					created_at?: string | null;
					email?: string | null;
					id: string;
					updated_at?: string | null;
					username?: string | null;
				};
				Update: {
					avatar_url?: string | null;
					created_at?: string | null;
					email?: string | null;
					id?: string;
					updated_at?: string | null;
					username?: string | null;
				};
				Relationships: [];
			};
			prompt_templates: {
				Row: {
					category: string | null;
					created_at: string | null;
					id: string;
					is_public: boolean | null;
					name: string;
					negative_prompt: string | null;
					prompt: string;
					use_count: number | null;
					user_id: string | null;
				};
				Insert: {
					category?: string | null;
					created_at?: string | null;
					id?: string;
					is_public?: boolean | null;
					name: string;
					negative_prompt?: string | null;
					prompt: string;
					use_count?: number | null;
					user_id?: string | null;
				};
				Update: {
					category?: string | null;
					created_at?: string | null;
					id?: string;
					is_public?: boolean | null;
					name?: string;
					negative_prompt?: string | null;
					prompt?: string;
					use_count?: number | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'prompt_templates_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
				];
			};
			tags: {
				Row: {
					color: string | null;
					created_at: string | null;
					id: string;
					name: string;
				};
				Insert: {
					color?: string | null;
					created_at?: string | null;
					id?: string;
					name: string;
				};
				Update: {
					color?: string | null;
					created_at?: string | null;
					id?: string;
					name?: string;
				};
				Relationships: [];
			};
			user_rate_limits: {
				Row: {
					daily_generations_count: number | null;
					daily_generations_limit: number | null;
					daily_reset_at: string | null;
					hourly_generations_count: number | null;
					hourly_generations_limit: number | null;
					hourly_reset_at: string | null;
					last_generation_at: string | null;
					max_batch_size: number | null;
					max_concurrent_generations: number | null;
					total_generations_all_time: number | null;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					daily_generations_count?: number | null;
					daily_generations_limit?: number | null;
					daily_reset_at?: string | null;
					hourly_generations_count?: number | null;
					hourly_generations_limit?: number | null;
					hourly_reset_at?: string | null;
					last_generation_at?: string | null;
					max_batch_size?: number | null;
					max_concurrent_generations?: number | null;
					total_generations_all_time?: number | null;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					daily_generations_count?: number | null;
					daily_generations_limit?: number | null;
					daily_reset_at?: string | null;
					hourly_generations_count?: number | null;
					hourly_generations_limit?: number | null;
					hourly_reset_at?: string | null;
					last_generation_at?: string | null;
					max_batch_size?: number | null;
					max_concurrent_generations?: number | null;
					total_generations_all_time?: number | null;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			batch_progress: {
				Row: {
					completed_count: number | null;
					created_at: string | null;
					failed_count: number | null;
					id: string | null;
					items: Json | null;
					name: string | null;
					pending_count: number | null;
					processing_count: number | null;
					status: string | null;
					total_count: number | null;
					user_id: string | null;
				};
				Relationships: [];
			};
			multi_generation_groups: {
				Row: {
					completed_at: string | null;
					completed_count: number | null;
					created_at: string | null;
					failed_count: number | null;
					images: Json[] | null;
					model: string | null;
					multi_group_id: string | null;
					processing_count: number | null;
					prompt: string | null;
					total_count: number | null;
					user_id: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'image_generations_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
				];
			};
		};
		Functions: {
			check_rate_limit: {
				Args: { p_count?: number; p_user_id: string };
				Returns: Json;
			};
			create_multi_generation: {
				Args: {
					p_count: number;
					p_model: string;
					p_prompt: string;
					p_settings: Json;
					p_user_id: string;
				};
				Returns: string;
			};
			get_error_statistics: {
				Args: { p_days?: number; p_user_id?: string };
				Returns: Json;
			};
			get_user_limits: {
				Args: { p_user_id: string };
				Returns: Json;
			};
			process_error_recovery: {
				Args: Record<PropertyKey, never>;
				Returns: Json;
			};
			recover_stale_generations: {
				Args: Record<PropertyKey, never>;
				Returns: number;
			};
			schedule_retry: {
				Args: {
					p_error_message: string;
					p_error_type: string;
					p_generation_id: string;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {},
	},
} as const;
