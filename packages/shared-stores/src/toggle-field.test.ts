import { describe, it, expect, vi } from 'vitest';
import { toggleField } from './toggle-field';

function createMockTable(records: Record<string, Record<string, unknown>>) {
	return {
		get: vi.fn(async (id: string) => records[id] ?? null),
		update: vi.fn(async (id: string, changes: Record<string, unknown>) => {
			if (records[id]) Object.assign(records[id], changes);
			return 1;
		}),
	};
}

describe('toggleField', () => {
	it('toggles false to true', async () => {
		const table = createMockTable({ '1': { id: '1', isFavorite: false } });
		const result = await toggleField(table as never, '1', 'isFavorite');
		expect(result).toBe(true);
		expect(table.update).toHaveBeenCalledWith('1', expect.objectContaining({ isFavorite: true }));
	});

	it('toggles true to false', async () => {
		const table = createMockTable({ '1': { id: '1', isFavorite: true } });
		const result = await toggleField(table as never, '1', 'isFavorite');
		expect(result).toBe(false);
		expect(table.update).toHaveBeenCalledWith('1', expect.objectContaining({ isFavorite: false }));
	});

	it('sets updatedAt timestamp', async () => {
		const table = createMockTable({ '1': { id: '1', isPinned: false } });
		await toggleField(table as never, '1', 'isPinned');
		const call = table.update.mock.calls[0][1] as Record<string, unknown>;
		expect(call.updatedAt).toBeTruthy();
		expect(typeof call.updatedAt).toBe('string');
	});

	it('throws if record not found', async () => {
		const table = createMockTable({});
		await expect(toggleField(table as never, 'missing', 'isFavorite')).rejects.toThrow(
			'Record missing not found'
		);
	});

	it('treats undefined as false', async () => {
		const table = createMockTable({ '1': { id: '1' } });
		const result = await toggleField(table as never, '1', 'isFavorite');
		expect(result).toBe(true);
	});
});
