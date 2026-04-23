import type { BlockSpec } from '../types';
import RichText from './RichText.svelte';
import RichTextInspector from './RichTextInspector.svelte';
import { RichTextSchema, RICH_TEXT_DEFAULTS, type RichTextProps } from './schema';

export const richTextBlockSpec: BlockSpec<RichTextProps> = {
	type: 'richText',
	label: 'Text',
	icon: 'text',
	category: 'content',
	schema: RichTextSchema,
	schemaVersion: 1,
	defaults: RICH_TEXT_DEFAULTS,
	Component: RichText,
	Inspector: RichTextInspector,
};

export type { RichTextProps };
export { RichTextSchema, RICH_TEXT_DEFAULTS };
