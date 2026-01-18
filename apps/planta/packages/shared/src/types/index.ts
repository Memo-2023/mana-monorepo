// Light level requirements
export type LightLevel = 'low' | 'medium' | 'bright' | 'direct';

// Humidity requirements
export type HumidityLevel = 'low' | 'medium' | 'high';

// Health status
export type HealthStatus = 'healthy' | 'needs_attention' | 'sick';

// Health assessment from AI
export type HealthAssessment = 'healthy' | 'minor_issues' | 'needs_care' | 'critical';

// Plant entity
export interface Plant {
	id: string;
	userId: string;
	name: string;
	scientificName?: string;
	commonName?: string;
	species?: string;
	lightRequirements?: LightLevel;
	wateringFrequencyDays?: number;
	humidity?: HumidityLevel;
	temperature?: string;
	soilType?: string;
	careNotes?: string;
	isActive: boolean;
	healthStatus?: HealthStatus;
	acquiredAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

// Plant with all related data
export interface PlantWithDetails extends Plant {
	photos: PlantPhoto[];
	wateringSchedule?: WateringSchedule;
	latestAnalysis?: PlantAnalysis;
}

// Plant photo
export interface PlantPhoto {
	id: string;
	plantId: string;
	userId: string;
	storagePath: string;
	publicUrl?: string;
	filename: string;
	mimeType?: string;
	fileSize?: number;
	width?: number;
	height?: number;
	isPrimary: boolean;
	isAnalyzed: boolean;
	takenAt?: Date;
	createdAt: Date;
}

// AI analysis result
export interface PlantAnalysis {
	id: string;
	photoId: string;
	plantId?: string;
	userId: string;
	identifiedSpecies?: string;
	scientificName?: string;
	commonNames?: string[];
	confidence?: number;
	healthAssessment?: HealthAssessment;
	healthDetails?: string;
	issues?: string[];
	wateringAdvice?: string;
	lightAdvice?: string;
	fertilizingAdvice?: string;
	generalTips?: string[];
	model?: string;
	tokensUsed?: number;
	createdAt: Date;
}

// Watering schedule
export interface WateringSchedule {
	id: string;
	plantId: string;
	userId: string;
	frequencyDays: number;
	lastWateredAt?: Date;
	nextWateringAt?: Date;
	reminderEnabled: boolean;
	reminderHoursBefore: number;
	createdAt: Date;
	updatedAt: Date;
}

// Watering log entry
export interface WateringLog {
	id: string;
	plantId: string;
	userId: string;
	wateredAt: Date;
	notes?: string;
	createdAt: Date;
}

// Watering status for dashboard
export interface WateringStatus {
	plantId: string;
	plantName: string;
	daysUntilWatering: number;
	isOverdue: boolean;
	lastWateredAt?: Date;
	nextWateringAt?: Date;
}

// DTOs for API
export interface CreatePlantDto {
	name: string;
	scientificName?: string;
	commonName?: string;
	acquiredAt?: string;
}

export interface UpdatePlantDto {
	name?: string;
	scientificName?: string;
	commonName?: string;
	careNotes?: string;
	isActive?: boolean;
	lightRequirements?: LightLevel;
	wateringFrequencyDays?: number;
	humidity?: HumidityLevel;
}

export interface AnalysisRequest {
	photoId: string;
	plantId?: string;
}

// AI analysis response structure
export interface AnalysisResult {
	identification: {
		scientificName: string;
		commonNames: string[];
		confidence: number;
	};
	health: {
		status: HealthAssessment;
		issues: string[];
		details: string;
	};
	care: {
		light: LightLevel;
		wateringFrequencyDays: number;
		humidity: HumidityLevel;
		temperature: string;
		soilType: string;
		tips: string[];
	};
}
