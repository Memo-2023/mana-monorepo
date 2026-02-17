/**
 * Morning Summary Service
 *
 * Daily morning summary aggregation with user preferences.
 *
 * @example
 * ```typescript
 * import {
 *   MorningSummaryModule,
 *   MorningSummaryService,
 *   MorningPreferencesService,
 * } from '@manacore/bot-services/morning-summary';
 *
 * // In module
 * @Module({
 *   imports: [MorningSummaryModule.forRoot()]
 * })
 *
 * // In service
 * const summary = await morningSummaryService.generateSummary(matrixUserId, token);
 * const formatted = morningSummaryService.formatSummary(summary, 'detailed');
 *
 * // Manage preferences
 * await preferencesService.setEnabled(matrixUserId, true);
 * await preferencesService.setDeliveryTime(matrixUserId, '07:00');
 * await preferencesService.setLocation(matrixUserId, 'Berlin');
 * ```
 */

export { MorningSummaryModule } from './morning-summary.module.js';
export { MorningSummaryService } from './morning-summary.service.js';
export { MorningPreferencesService } from './preferences.service.js';
export {
	MorningSummaryModuleOptions,
	MorningSummaryData,
	MorningPreferences,
	DEFAULT_MORNING_PREFERENCES,
	MORNING_SUMMARY_MODULE_OPTIONS,
	MORNING_PREFS_KEY_PREFIX,
	DAY_NAMES_DE,
	MONTH_NAMES_DE,
} from './types.js';
