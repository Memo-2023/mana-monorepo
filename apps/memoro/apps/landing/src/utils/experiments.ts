/**
 * Simplified experiment utilities - PostHog removed
 */

/**
 * Get the current variant for an experiment
 * @param experimentKey - The experiment key
 * @returns Always returns null since PostHog is removed
 */
export async function getExperiment(experimentKey: string): Promise<string | null> {
	return null;
}

/**
 * Track a conversion event for an experiment
 * @param experimentKey - The experiment/feature flag key
 * @param conversionType - Type of conversion (e.g., 'click', 'signup', 'download')
 * @param additionalProperties - Any additional properties to track
 */
export function trackExperimentConversion(
	experimentKey: string,
	conversionType: string,
	additionalProperties?: Record<string, any>
) {
	// No-op since PostHog is removed
	console.log('Experiment conversion:', experimentKey, conversionType, additionalProperties);
}

/**
 * Track a generic event
 * @param eventName - Name of the event
 * @param properties - Event properties
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
	// No-op since PostHog is removed
	console.log('Event:', eventName, properties);
}

/**
 * Apply experiment variant classes to an element
 * @param elementId - ID of the element to apply classes to
 * @param experimentKey - The experiment key
 * @param variantClasses - Object mapping variant names to classes
 */
export async function applyExperimentClasses(
	elementId: string,
	experimentKey: string,
	variantClasses: Record<string, string>
) {
	// No-op since PostHog is removed
}

/**
 * Get all active experiments for debugging
 * @returns Empty object since PostHog is removed
 */
export async function getAllExperiments(): Promise<Record<string, any>> {
	return {};
}
