export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			blueprints: {
				Row: {
					advice: Json | null;
					category: Json | null;
					created_at: string;
					description: Json | null;
					id: string;
					is_public: boolean;
					name: Json;
					style: Json | null;
					topic_id: string | null;
					updated_at: string;
					user_id: string | null;
				};
				Insert: {
					advice?: Json | null;
					category?: Json | null;
					created_at?: string;
					description?: Json | null;
					id?: string;
					is_public?: boolean;
					name?: Json;
					style?: Json | null;
					topic_id?: string | null;
					updated_at?: string;
					user_id?: string | null;
				};
				Update: {
					advice?: Json | null;
					category?: Json | null;
					created_at?: string;
					description?: Json | null;
					id?: string;
					is_public?: boolean;
					name?: Json;
					style?: Json | null;
					topic_id?: string | null;
					updated_at?: string;
					user_id?: string | null;
				};
				Relationships: [];
			};
			debug_logs: {
				Row: {
					created_at: string;
					data: Json;
					id: string;
					type: string;
				};
				Insert: {
					created_at?: string;
					data: Json;
					id?: string;
					type: string;
				};
				Update: {
					created_at?: string;
					data?: Json;
					id?: string;
					type?: string;
				};
				Relationships: [];
			};
			memo_spaces: {
				Row: {
					created_at: string;
					memo_id: string;
					space_id: string;
				};
				Insert: {
					created_at?: string;
					memo_id: string;
					space_id: string;
				};
				Update: {
					created_at?: string;
					memo_id?: string;
					space_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'memo_spaces_memo_id_fkey';
						columns: ['memo_id'];
						isOneToOne: false;
						referencedRelation: 'memos';
						referencedColumns: ['id'];
					},
				];
			};
			memo_tags: {
				Row: {
					created_at: string;
					id: string;
					memo_id: string;
					tag_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					memo_id: string;
					tag_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					memo_id?: string;
					tag_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'memo_tags_memo_id_fkey';
						columns: ['memo_id'];
						isOneToOne: false;
						referencedRelation: 'memos';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'memo_tags_tag_id_fkey';
						columns: ['tag_id'];
						isOneToOne: false;
						referencedRelation: 'tags';
						referencedColumns: ['id'];
					},
				];
			};
			memories: {
				Row: {
					content: string | null;
					created_at: string;
					id: string;
					media: Json | null;
					memo_id: string;
					metadata: Json | null;
					style: Json | null;
					title: string;
					updated_at: string;
				};
				Insert: {
					content?: string | null;
					created_at?: string;
					id?: string;
					media?: Json | null;
					memo_id: string;
					metadata?: Json | null;
					style?: Json | null;
					title?: string;
					updated_at?: string;
				};
				Update: {
					content?: string | null;
					created_at?: string;
					id?: string;
					media?: Json | null;
					memo_id?: string;
					metadata?: Json | null;
					style?: Json | null;
					title?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'memories_memo_id_fkey';
						columns: ['memo_id'];
						isOneToOne: false;
						referencedRelation: 'memos';
						referencedColumns: ['id'];
					},
				];
			};
			memos: {
				Row: {
					created_at: string;
					id: string;
					intro: string | null;
					is_archived: boolean;
					is_pinned: boolean;
					is_public: boolean;
					location: unknown | null;
					metadata: Json | null;
					shared_with_users: string[] | null;
					source: Json;
					style: Json | null;
					title: string | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					intro?: string | null;
					is_archived?: boolean;
					is_pinned?: boolean;
					is_public?: boolean;
					location?: unknown | null;
					metadata?: Json | null;
					shared_with_users?: string[] | null;
					source?: Json;
					style?: Json | null;
					title?: string | null;
					updated_at?: string;
					user_id?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					intro?: string | null;
					is_archived?: boolean;
					is_pinned?: boolean;
					is_public?: boolean;
					location?: unknown | null;
					metadata?: Json | null;
					shared_with_users?: string[] | null;
					source?: Json;
					style?: Json | null;
					title?: string | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			prompt_blueprints: {
				Row: {
					blueprint_id: string;
					created_at: string;
					prompt_id: string;
				};
				Insert: {
					blueprint_id: string;
					created_at?: string;
					prompt_id: string;
				};
				Update: {
					blueprint_id?: string;
					created_at?: string;
					prompt_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'blueprint_prompts_blueprint_id_fkey';
						columns: ['blueprint_id'];
						isOneToOne: false;
						referencedRelation: 'blueprints';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'blueprint_prompts_prompt_id_fkey';
						columns: ['prompt_id'];
						isOneToOne: false;
						referencedRelation: 'prompts';
						referencedColumns: ['id'];
					},
				];
			};
			prompts: {
				Row: {
					created_at: string;
					description: Json | null;
					id: string;
					is_public: boolean;
					memory_title: Json;
					prompt_text: Json;
					updated_at: string;
					user_id: string | null;
				};
				Insert: {
					created_at?: string;
					description?: Json | null;
					id?: string;
					is_public?: boolean;
					memory_title?: Json;
					prompt_text?: Json;
					updated_at?: string;
					user_id?: string | null;
				};
				Update: {
					created_at?: string;
					description?: Json | null;
					id?: string;
					is_public?: boolean;
					memory_title?: Json;
					prompt_text?: Json;
					updated_at?: string;
					user_id?: string | null;
				};
				Relationships: [];
			};
			space_members: {
				Row: {
					added_at: string | null;
					added_by: string | null;
					id: string;
					role: string;
					space_id: string;
					user_id: string;
				};
				Insert: {
					added_at?: string | null;
					added_by?: string | null;
					id?: string;
					role: string;
					space_id: string;
					user_id: string;
				};
				Update: {
					added_at?: string | null;
					added_by?: string | null;
					id?: string;
					role?: string;
					space_id?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			spatial_ref_sys: {
				Row: {
					auth_name: string | null;
					auth_srid: number | null;
					proj4text: string | null;
					srid: number;
					srtext: string | null;
				};
				Insert: {
					auth_name?: string | null;
					auth_srid?: number | null;
					proj4text?: string | null;
					srid: number;
					srtext?: string | null;
				};
				Update: {
					auth_name?: string | null;
					auth_srid?: number | null;
					proj4text?: string | null;
					srid?: number;
					srtext?: string | null;
				};
				Relationships: [];
			};
			tags: {
				Row: {
					created_at: string;
					description: Json | null;
					id: string;
					is_pinned: boolean | null;
					name: string;
					sort_order: number | null;
					style: Json | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					description?: Json | null;
					id?: string;
					is_pinned?: boolean | null;
					name?: string;
					sort_order?: number | null;
					style?: Json | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					description?: Json | null;
					id?: string;
					is_pinned?: boolean | null;
					name?: string;
					sort_order?: number | null;
					style?: Json | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			user_active_blueprints: {
				Row: {
					blueprint_id: string;
					created_at: string;
					id: string;
					is_active: boolean;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					blueprint_id: string;
					created_at?: string;
					id?: string;
					is_active?: boolean;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					blueprint_id?: string;
					created_at?: string;
					id?: string;
					is_active?: boolean;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'user_active_blueprints_blueprint_id_fkey';
						columns: ['blueprint_id'];
						isOneToOne: false;
						referencedRelation: 'blueprints';
						referencedColumns: ['id'];
					},
				];
			};
		};
		Views: {
			geography_columns: {
				Row: {
					coord_dimension: number | null;
					f_geography_column: unknown | null;
					f_table_catalog: unknown | null;
					f_table_name: unknown | null;
					f_table_schema: unknown | null;
					srid: number | null;
					type: string | null;
				};
				Relationships: [];
			};
			geometry_columns: {
				Row: {
					coord_dimension: number | null;
					f_geometry_column: unknown | null;
					f_table_catalog: string | null;
					f_table_name: unknown | null;
					f_table_schema: unknown | null;
					srid: number | null;
					type: string | null;
				};
				Insert: {
					coord_dimension?: number | null;
					f_geometry_column?: unknown | null;
					f_table_catalog?: string | null;
					f_table_name?: unknown | null;
					f_table_schema?: unknown | null;
					srid?: number | null;
					type?: string | null;
				};
				Update: {
					coord_dimension?: number | null;
					f_geometry_column?: unknown | null;
					f_table_catalog?: string | null;
					f_table_name?: unknown | null;
					f_table_schema?: unknown | null;
					srid?: number | null;
					type?: string | null;
				};
				Relationships: [];
			};
		};
		Functions: {
			[key: string]: any;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			geometry_dump: {
				path: number[] | null;
				geom: unknown | null;
			};
			http_header: {
				field: string | null;
				value: string | null;
			};
			http_request: {
				method: unknown | null;
				uri: string | null;
				headers: Database['public']['CompositeTypes']['http_header'][] | null;
				content_type: string | null;
				content: string | null;
			};
			http_response: {
				status: number | null;
				content_type: string | null;
				headers: Database['public']['CompositeTypes']['http_header'][] | null;
				content: string | null;
			};
			valid_detail: {
				valid: boolean | null;
				reason: string | null;
				location: unknown | null;
			};
		};
	};
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
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
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
	DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof Database },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof Database },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {},
	},
} as const;
