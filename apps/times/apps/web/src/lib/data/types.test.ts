import { describe, it, expect } from 'vitest';
import type {
	Client,
	Project,
	TimeEntry,
	Tag,
	EntryTemplate,
	TimesSettings,
	BillingRate,
	FilterCriteria,
	SortOption,
} from '@times/shared';

describe('Shared Types', () => {
	it('BillingRate has correct shape', () => {
		const rate: BillingRate = { amount: 95, currency: 'EUR', per: 'hour' };
		expect(rate.amount).toBe(95);
		expect(rate.per).toBe('hour');
	});

	it('Client has required fields', () => {
		const client: Client = {
			id: '1',
			name: 'Test',
			color: '#000',
			isArchived: false,
			order: 0,
			createdAt: '',
			updatedAt: '',
		};
		expect(client.name).toBe('Test');
	});

	it('TimeEntry has required fields', () => {
		const entry: TimeEntry = {
			id: '1',
			description: 'Work',
			date: '2024-01-15',
			duration: 3600,
			isBillable: true,
			isRunning: false,
			tags: ['dev'],
			visibility: 'private',
			createdAt: '',
			updatedAt: '',
		};
		expect(entry.duration).toBe(3600);
		expect(entry.tags).toContain('dev');
	});

	it('FilterCriteria supports all filter types', () => {
		const filter: FilterCriteria = {
			search: 'test',
			projectId: 'p1',
			clientId: 'c1',
			tagIds: ['t1'],
			isBillable: true,
			dateFrom: '2024-01-01',
			dateTo: '2024-12-31',
		};
		expect(filter.search).toBe('test');
	});

	it('SortOption has valid fields', () => {
		const sort: SortOption = { field: 'date', direction: 'desc' };
		expect(sort.field).toBe('date');
	});
});
