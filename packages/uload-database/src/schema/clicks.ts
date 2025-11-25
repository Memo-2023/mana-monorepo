import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { links } from './links.js';

export const clicks = pgTable(
  'clicks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    linkId: uuid('link_id')
      .references(() => links.id, { onDelete: 'cascade' })
      .notNull(),
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),
    referer: text('referer'),
    browser: text('browser'),
    deviceType: text('device_type'),
    os: text('os'),
    country: text('country'),
    city: text('city'),
    clickedAt: timestamp('clicked_at').defaultNow().notNull(),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('clicks_link_id_idx').on(table.linkId),
    index('clicks_clicked_at_idx').on(table.clickedAt),
    index('clicks_country_idx').on(table.country),
  ]
);

export type Click = typeof clicks.$inferSelect;
export type NewClick = typeof clicks.$inferInsert;
