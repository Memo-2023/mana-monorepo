import { pgTable, uuid, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const levels = pgTable('levels', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	description: text('description'),
	userId: text('user_id').notNull(),
	voxelData: jsonb('voxel_data').notNull(),
	spawnPoint: jsonb('spawn_point').notNull(),
	worldSize: jsonb('world_size').notNull(),
	isPublic: boolean('is_public').default(false),
	playCount: integer('play_count').default(0),
	likesCount: integer('likes_count').default(0),
	difficulty: text('difficulty'),
	tags: text('tags').array(),
	thumbnailUrl: text('thumbnail_url'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
});

export const levelsRelations = relations(levels, ({ many }) => ({
	likes: many(levelLikes),
	plays: many(levelPlays),
}));

// Import after definition to avoid circular dependency
import { levelLikes } from './level-likes.schema';
import { levelPlays } from './level-plays.schema';

export type Level = typeof levels.$inferSelect;
export type NewLevel = typeof levels.$inferInsert;

// Types for JSON fields
export interface VoxelData {
	[key: string]: {
		type: string;
		isSpawnPoint?: boolean;
		isGoal?: boolean;
	};
}

export interface SpawnPoint {
	x: number;
	y: number;
	z: number;
}

export interface WorldSize {
	width: number;
	height: number;
	depth: number;
}
