import type { Location } from '../db/schema/locations.schema';
import type { Favorite } from '../db/schema/favorites.schema';

export const TEST_USER_ID = 'test-user-123';
export const TEST_USER_EMAIL = 'test@example.com';

export function createMockLocation(overrides: Partial<Location> = {}): Location {
	return {
		id: 'loc-1',
		name: 'Konstanzer Münster',
		category: 'sight',
		description: 'Historic cathedral in Konstanz.',
		address: 'Münsterplatz 1, 78462 Konstanz',
		latitude: 47.6603,
		longitude: 9.1757,
		imageUrl: '/images/muenster.svg',
		timeline: [{ year: '615', event: 'Founded' }],
		createdAt: new Date('2026-01-01'),
		updatedAt: new Date('2026-01-01'),
		...overrides,
	};
}

export function createMockFavorite(overrides: Partial<Favorite> = {}): Favorite {
	return {
		id: 'fav-1',
		userId: TEST_USER_ID,
		locationId: 'loc-1',
		createdAt: new Date('2026-01-01'),
		...overrides,
	};
}

export function createMockDb() {
	return {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		orderBy: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		returning: jest.fn(),
		update: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		delete: jest.fn().mockReturnThis(),
	};
}
