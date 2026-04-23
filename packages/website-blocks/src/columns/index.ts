import type { BlockSpec } from '../types';
import Columns from './Columns.svelte';
import ColumnsInspector from './ColumnsInspector.svelte';
import { ColumnsSchema, COLUMNS_DEFAULTS, columnSlotKeys, type ColumnsProps } from './schema';

export const columnsBlockSpec: BlockSpec<ColumnsProps> = {
	type: 'columns',
	label: 'Spalten',
	icon: 'columns',
	category: 'layout',
	schema: ColumnsSchema,
	schemaVersion: 1,
	defaults: COLUMNS_DEFAULTS,
	Component: Columns,
	Inspector: ColumnsInspector,
};

export type { ColumnsProps };
export { ColumnsSchema, COLUMNS_DEFAULTS, columnSlotKeys };
