import type { BlockSpec } from '../types';
import Spacer from './Spacer.svelte';
import SpacerInspector from './SpacerInspector.svelte';
import { SpacerSchema, SPACER_DEFAULTS, type SpacerProps } from './schema';

export const spacerBlockSpec: BlockSpec<SpacerProps> = {
	type: 'spacer',
	label: 'Abstand',
	icon: 'separator',
	category: 'layout',
	schema: SpacerSchema,
	schemaVersion: 1,
	defaults: SPACER_DEFAULTS,
	Component: Spacer,
	Inspector: SpacerInspector,
};

export type { SpacerProps };
export { SpacerSchema, SPACER_DEFAULTS };
