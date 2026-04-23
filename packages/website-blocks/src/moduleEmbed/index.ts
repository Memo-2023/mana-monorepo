import type { BlockSpec } from '../types';
import ModuleEmbed from './ModuleEmbed.svelte';
import ModuleEmbedInspectorFallback from './ModuleEmbedInspectorFallback.svelte';
import {
	ModuleEmbedSchema,
	MODULE_EMBED_DEFAULTS,
	type ModuleEmbedProps,
	type EmbedItem,
	type EmbedSource,
} from './schema';

export const moduleEmbedBlockSpec: BlockSpec<ModuleEmbedProps> = {
	type: 'moduleEmbed',
	label: 'Modul einbetten',
	icon: 'link',
	category: 'embed',
	schema: ModuleEmbedSchema,
	schemaVersion: 1,
	defaults: MODULE_EMBED_DEFAULTS,
	Component: ModuleEmbed,
	Inspector: ModuleEmbedInspectorFallback,
};

export type { ModuleEmbedProps, EmbedItem, EmbedSource };
export { ModuleEmbedSchema, MODULE_EMBED_DEFAULTS };
