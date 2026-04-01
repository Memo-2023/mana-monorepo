/**
 * Planta module — barrel exports.
 */

// Collections & seed data
export {
	plantTable,
	plantPhotoTable,
	wateringScheduleTable,
	wateringLogTable,
	PLANTA_GUEST_SEED,
} from './collections';

// Types
export type {
	LocalPlant,
	LocalPlantPhoto,
	LocalWateringSchedule,
	LocalWateringLog,
	Plant,
	PlantPhoto,
	WateringSchedule,
	WateringLog,
	CreatePlantDto,
	UpdatePlantDto,
	LightLevel,
	HumidityLevel,
	HealthStatus,
	HealthAssessment,
} from './types';

// Queries
export {
	useAllPlants,
	useAllPlantPhotos,
	useAllWateringSchedules,
	useAllWateringLogs,
	toPlant,
	toPlantPhoto,
	toWateringSchedule,
	toWateringLog,
	getPlantById,
	getActivePlants,
	getPhotosForPlant,
	getPrimaryPhoto,
	getScheduleForPlant,
	getLogsForPlant,
	getDaysUntilWatering,
	isWateringOverdue,
} from './queries';

// Mutations
export { plantMutations, wateringMutations } from './mutations';

// Utils
export {
	parsePlantInput,
	resolvePlantData,
	formatParsedPlantPreview,
	type CareAction,
	type ParsedPlant,
	type ParsedPlantWithIds,
} from './utils/plant-parser';
export { PLANTA_SYNTAX } from './utils/syntax-help';
