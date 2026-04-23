import { z } from 'zod';

export const ColumnsSchema = z.object({
	count: z.union([z.literal(2), z.literal(3)]).default(2),
	gap: z.enum(['sm', 'md', 'lg']).default('md'),
	align: z.enum(['start', 'center', 'stretch']).default('stretch'),
	stackOnMobile: z.boolean().default(true),
});

export type ColumnsProps = z.infer<typeof ColumnsSchema>;

export const COLUMNS_DEFAULTS: ColumnsProps = {
	count: 2,
	gap: 'md',
	align: 'stretch',
	stackOnMobile: true,
};

/**
 * Slot keys that a `columns` container accepts. Children of this block
 * set `slotKey = 'col-0' | 'col-1' | 'col-2'` to be placed in that
 * column.
 */
export function columnSlotKeys(count: 2 | 3): readonly string[] {
	return count === 2 ? ['col-0', 'col-1'] : ['col-0', 'col-1', 'col-2'];
}
