import {
	pgTable,
	uuid,
	text,
	doublePrecision,
	timestamp,
	integer,
	pgEnum,
	index,
	uniqueIndex,
} from 'drizzle-orm/pg-core';

// ============================================
// Enums
// ============================================

export const locationSourceEnum = pgEnum('location_source', [
	'foreground',
	'background',
	'manual',
	'photo-import',
]);

export const deviceMotionEnum = pgEnum('device_motion', [
	'stationary',
	'walking',
	'driving',
	'unknown',
]);

export const poiCategoryEnum = pgEnum('poi_category', [
	'building',
	'monument',
	'church',
	'museum',
	'palace',
	'bridge',
	'park',
	'square',
	'sculpture',
	'fountain',
	'historic_site',
	'other',
]);

export const guideStatusEnum = pgEnum('guide_status', ['generating', 'ready', 'error']);

// ============================================
// Tables
// ============================================

export const locations = pgTable(
	'locations',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id').notNull(),
		latitude: doublePrecision('latitude').notNull(),
		longitude: doublePrecision('longitude').notNull(),
		recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
		accuracy: doublePrecision('accuracy'),
		altitude: doublePrecision('altitude'),
		speed: doublePrecision('speed'),
		source: locationSourceEnum('source').default('foreground'),
		deviceMotion: deviceMotionEnum('device_motion'),
		addressFormatted: text('address_formatted'),
		street: text('street'),
		houseNumber: text('house_number'),
		city: text('city'),
		postalCode: text('postal_code'),
		country: text('country'),
		countryCode: text('country_code'),
		cityId: uuid('city_id').references(() => cities.id),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('locations_user_id_idx').on(table.userId),
		index('locations_recorded_at_idx').on(table.recordedAt),
		index('locations_city_id_idx').on(table.cityId),
		index('locations_user_recorded_idx').on(table.userId, table.recordedAt),
	]
);

export const cities = pgTable(
	'cities',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: text('name').notNull(),
		country: text('country').notNull(),
		countryCode: text('country_code').notNull(),
		latitude: doublePrecision('latitude').notNull(),
		longitude: doublePrecision('longitude').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [uniqueIndex('cities_name_country_code_idx').on(table.name, table.countryCode)]
);

export const cityVisits = pgTable(
	'city_visits',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id').notNull(),
		cityId: uuid('city_id')
			.notNull()
			.references(() => cities.id, { onDelete: 'cascade' }),
		firstVisitAt: timestamp('first_visit_at', { withTimezone: true }).notNull(),
		lastVisitAt: timestamp('last_visit_at', { withTimezone: true }).notNull(),
		totalDurationMs: integer('total_duration_ms').default(0).notNull(),
		visitCount: integer('visit_count').default(1).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex('city_visits_user_city_idx').on(table.userId, table.cityId),
		index('city_visits_user_id_idx').on(table.userId),
	]
);

export const places = pgTable(
	'places',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id').notNull(),
		name: text('name').notNull(),
		latitude: doublePrecision('latitude').notNull(),
		longitude: doublePrecision('longitude').notNull(),
		radiusMeters: integer('radius_meters').default(100).notNull(),
		addressFormatted: text('address_formatted'),
		cityId: uuid('city_id').references(() => cities.id),
		visitCount: integer('visit_count').default(0).notNull(),
		totalDurationMs: integer('total_duration_ms').default(0).notNull(),
		firstVisitAt: timestamp('first_visit_at', { withTimezone: true }),
		lastVisitAt: timestamp('last_visit_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('places_user_id_idx').on(table.userId),
		index('places_city_id_idx').on(table.cityId),
	]
);

export const pois = pgTable(
	'pois',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		latitude: doublePrecision('latitude').notNull(),
		longitude: doublePrecision('longitude').notNull(),
		category: poiCategoryEnum('category').default('other').notNull(),
		cityId: uuid('city_id')
			.notNull()
			.references(() => cities.id),
		imageUrl: text('image_url'),
		sourceUrls: text('source_urls').array(),
		aiSummary: text('ai_summary'),
		aiSummaryLanguage: text('ai_summary_language'),
		aiSummaryGeneratedAt: timestamp('ai_summary_generated_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('pois_city_id_idx').on(table.cityId),
		index('pois_lat_lng_idx').on(table.latitude, table.longitude),
	]
);

export const guides = pgTable(
	'guides',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id').notNull(),
		cityId: uuid('city_id')
			.notNull()
			.references(() => cities.id),
		title: text('title').notNull(),
		description: text('description'),
		status: guideStatusEnum('status').default('generating').notNull(),
		routePolyline: text('route_polyline'),
		estimatedDurationMin: integer('estimated_duration_min'),
		distanceMeters: integer('distance_meters'),
		language: text('language').default('de').notNull(),
		creditsCost: integer('credits_cost'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('guides_user_id_idx').on(table.userId),
		index('guides_city_id_idx').on(table.cityId),
	]
);

export const guidePois = pgTable(
	'guide_pois',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		guideId: uuid('guide_id')
			.notNull()
			.references(() => guides.id, { onDelete: 'cascade' }),
		poiId: uuid('poi_id')
			.notNull()
			.references(() => pois.id),
		sortOrder: integer('sort_order').notNull(),
		aiNarrative: text('ai_narrative'),
		narrativeLanguage: text('narrative_language').default('de'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('guide_pois_guide_id_idx').on(table.guideId),
		index('guide_pois_poi_id_idx').on(table.poiId),
	]
);

// ============================================
// Type Exports
// ============================================

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;
export type CityVisit = typeof cityVisits.$inferSelect;
export type NewCityVisit = typeof cityVisits.$inferInsert;
export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;
export type Poi = typeof pois.$inferSelect;
export type NewPoi = typeof pois.$inferInsert;
export type Guide = typeof guides.$inferSelect;
export type NewGuide = typeof guides.$inferInsert;
export type GuidePoi = typeof guidePois.$inferSelect;
export type NewGuidePoi = typeof guidePois.$inferInsert;
