/**
 * Planta API Service
 *
 * Plant care and watering management API client.
 *
 * @example
 * ```typescript
 * import { PlantaModule, PlantaApiService } from '@manacore/bot-services/planta';
 *
 * // In module
 * @Module({
 *   imports: [PlantaModule.forRoot()]
 * })
 *
 * // In service
 * const plants = await plantaApiService.getPlantsNeedingWater(token);
 * ```
 */

export { PlantaModule } from './planta.module.js';
export { PlantaApiService } from './planta-api.service.js';
export {
	PlantaModuleOptions,
	Plant,
	PlantWateringStatus,
	PLANTA_MODULE_OPTIONS,
	DEFAULT_PLANTA_API_URL,
} from './types.js';
