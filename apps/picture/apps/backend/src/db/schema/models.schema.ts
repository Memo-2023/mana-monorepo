import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  real,
} from 'drizzle-orm/pg-core';

export const models = pgTable('models', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  replicateId: text('replicate_id').notNull(),
  version: text('version'),

  defaultWidth: integer('default_width').default(1024),
  defaultHeight: integer('default_height').default(1024),
  defaultSteps: integer('default_steps').default(25),
  defaultGuidanceScale: real('default_guidance_scale').default(7.5),

  minWidth: integer('min_width').default(512),
  minHeight: integer('min_height').default(512),
  maxWidth: integer('max_width').default(2048),
  maxHeight: integer('max_height').default(2048),
  maxSteps: integer('max_steps').default(50),

  supportsNegativePrompt: boolean('supports_negative_prompt')
    .default(true)
    .notNull(),
  supportsImg2Img: boolean('supports_img2img').default(false).notNull(),
  supportsSeed: boolean('supports_seed').default(true).notNull(),

  isActive: boolean('is_active').default(true).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  costPerGeneration: real('cost_per_generation'),
  estimatedTimeSeconds: integer('estimated_time_seconds'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;
