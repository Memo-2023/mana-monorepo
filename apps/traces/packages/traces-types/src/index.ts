// ============================================
// Shared types for the Traces project
// ============================================

// Location source enum
export type LocationSource = 'foreground' | 'background' | 'manual' | 'photo-import';

// Device motion enum
export type DeviceMotion = 'stationary' | 'walking' | 'driving' | 'unknown';

// Accuracy levels
export enum AccuracyLevel {
	Lowest = 'lowest',
	Low = 'low',
	Balanced = 'balanced',
	High = 'high',
	Highest = 'highest',
}

// POI categories
export type PoiCategory =
	| 'building'
	| 'monument'
	| 'church'
	| 'museum'
	| 'palace'
	| 'bridge'
	| 'park'
	| 'square'
	| 'sculpture'
	| 'fountain'
	| 'historic_site'
	| 'other';

// Guide status
export type GuideStatus = 'generating' | 'ready' | 'error';

// ============================================
// Sync DTOs (Mobile -> Backend)
// ============================================

export interface LocationSyncItem {
	id: string;
	latitude: number;
	longitude: number;
	recordedAt: string; // ISO 8601
	accuracy?: number;
	altitude?: number;
	speed?: number;
	source: LocationSource;
	deviceMotion?: DeviceMotion;
	addressFormatted?: string;
	street?: string;
	houseNumber?: string;
	city?: string;
	postalCode?: string;
	country?: string;
	countryCode?: string;
}

export interface LocationSyncRequest {
	locations: LocationSyncItem[];
}

export interface LocationSyncResponse {
	synced: number;
	duplicates: number;
}

// ============================================
// API Response Types
// ============================================

export interface CityResponse {
	id: string;
	name: string;
	country: string;
	countryCode: string;
	latitude: number;
	longitude: number;
}

export interface CityVisitResponse {
	id: string;
	city: CityResponse;
	firstVisitAt: string;
	lastVisitAt: string;
	totalDurationMs: number;
	visitCount: number;
}

export interface PlaceResponse {
	id: string;
	name: string;
	latitude: number;
	longitude: number;
	radiusMeters: number;
	addressFormatted?: string;
	cityId?: string;
	visitCount: number;
	totalDurationMs: number;
	firstVisitAt?: string;
	lastVisitAt?: string;
}

export interface CreatePlaceRequest {
	name: string;
	latitude: number;
	longitude: number;
	radiusMeters?: number;
	addressFormatted?: string;
}

export interface UpdatePlaceRequest {
	name?: string;
	radiusMeters?: number;
	addressFormatted?: string;
}

export interface PoiResponse {
	id: string;
	name: string;
	description?: string;
	latitude: number;
	longitude: number;
	category: PoiCategory;
	cityId: string;
	imageUrl?: string;
	aiSummary?: string;
	aiSummaryLanguage?: string;
}

export interface GuideResponse {
	id: string;
	title: string;
	description?: string;
	cityId: string;
	city?: CityResponse;
	status: GuideStatus;
	estimatedDurationMin?: number;
	distanceMeters?: number;
	language: string;
	creditsCost?: number;
	poisCount?: number;
	createdAt: string;
}

export interface GuideDetailResponse extends GuideResponse {
	routePolyline?: string;
	pois: GuidePoiResponse[];
}

export interface GuidePoiResponse {
	id: string;
	poi: PoiResponse;
	sortOrder: number;
	aiNarrative?: string;
	narrativeLanguage?: string;
}

export interface GenerateGuideRequest {
	cityId: string;
	radiusMeters?: number;
	categories?: PoiCategory[];
	language?: string;
	maxPois?: number;
}

// ============================================
// Query Parameters
// ============================================

export interface LocationQueryParams {
	cityId?: string;
	from?: string; // ISO date
	to?: string; // ISO date
	limit?: number;
	offset?: number;
}

export interface NearbyPoiQueryParams {
	lat: number;
	lng: number;
	radiusMeters?: number;
	cityId?: string;
	category?: PoiCategory;
	limit?: number;
}
