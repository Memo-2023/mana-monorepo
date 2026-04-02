/**
 * Database types for Supabase
 * This is a placeholder file - generate actual types using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/types/database.types.ts
 */

export type Database = {
	public: {
		Tables: {
			[key: string]: {
				Row: Record<string, unknown>;
				Insert: Record<string, unknown>;
				Update: Record<string, unknown>;
			};
		};
		Views: {
			[key: string]: {
				Row: Record<string, unknown>;
			};
		};
		Functions: {
			[key: string]: {
				Args: Record<string, unknown>;
				Returns: unknown;
			};
		};
	};
};
