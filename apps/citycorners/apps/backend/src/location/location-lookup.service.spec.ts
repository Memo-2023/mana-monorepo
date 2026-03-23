import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LocationLookupService } from './location-lookup.service';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('LocationLookupService', () => {
	let service: LocationLookupService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LocationLookupService,
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn().mockReturnValue('http://localhost:3021'),
					},
				},
			],
		}).compile();

		service = module.get<LocationLookupService>(LocationLookupService);
	});

	afterEach(() => jest.clearAllMocks());

	describe('lookup', () => {
		it('should return location data from search results', async () => {
			// Mock search response
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					results: [
						{
							url: 'https://example.com/muenster',
							title: 'Konstanzer Münster',
							snippet: 'Das Münster ist eine historische Basilika in Konstanz am Bodensee.',
							engine: 'google',
							score: 1,
						},
						{
							url: 'https://example.com/muenster2',
							title: 'Münster Konstanz - Wikipedia',
							snippet: 'Die Basilika befindet sich in der Münsterplatz 1, 78462 Konstanz.',
							engine: 'bing',
							score: 0.9,
						},
					],
				}),
			});

			// Mock bulk extract response
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					results: [
						{
							success: true,
							content: {
								text: 'Das Konstanzer Münster ist eine imposante Basilika. Die Adresse ist Münsterplatz 1, 78462 Konstanz. Es wurde im Jahr 615 gegründet.',
							},
						},
					],
				}),
			});

			const result = await service.lookup('Konstanzer Münster');

			expect(result).not.toBeNull();
			expect(result!.name).toBe('Konstanzer Münster');
			expect(result!.description.length).toBeGreaterThan(0);
			expect(result!.sources).toHaveLength(2);
			expect(result!.category).toBe('sight');
		});

		it('should detect restaurant category', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					results: [
						{
							url: 'https://example.com',
							title: 'Restaurant Test',
							snippet: 'Ein wunderbares Restaurant mit feiner Küche und exzellentem Essen.',
							engine: 'google',
							score: 1,
						},
					],
				}),
			});

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ results: [] }),
			});

			const result = await service.lookup('Restaurant Ophelia');

			expect(result).not.toBeNull();
			expect(result!.category).toBe('restaurant');
		});

		it('should return null on empty search results', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ results: [] }),
			});

			const result = await service.lookup('xyznonexistent');

			expect(result).toBeNull();
		});

		it('should return null on search API failure', async () => {
			mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

			const result = await service.lookup('Test');

			expect(result).toBeNull();
		});

		it('should handle extract failure gracefully', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					results: [
						{
							url: 'https://example.com',
							title: 'Test Place',
							snippet: 'A nice place in Konstanz with great atmosphere.',
							engine: 'google',
							score: 1,
						},
					],
				}),
			});

			// Extract fails
			mockFetch.mockRejectedValueOnce(new Error('Timeout'));

			const result = await service.lookup('Test Place');

			// Should still return result using search snippets
			expect(result).not.toBeNull();
			expect(result!.description.length).toBeGreaterThan(0);
		});
	});
});
