import type { BlockSpec } from '../types';
import Analytics from './Analytics.svelte';
import AnalyticsInspector from './AnalyticsInspector.svelte';
import { AnalyticsSchema, ANALYTICS_DEFAULTS, type AnalyticsProps } from './schema';

export const analyticsBlockSpec: BlockSpec<AnalyticsProps> = {
	type: 'analytics',
	label: 'Analytics',
	icon: 'chart',
	category: 'embed',
	schema: AnalyticsSchema,
	schemaVersion: 1,
	defaults: ANALYTICS_DEFAULTS,
	Component: Analytics,
	Inspector: AnalyticsInspector,
};

export type { AnalyticsProps };
export { AnalyticsSchema, ANALYTICS_DEFAULTS };
