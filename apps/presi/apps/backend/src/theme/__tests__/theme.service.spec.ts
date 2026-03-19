import { Test, TestingModule } from '@nestjs/testing';
import { ThemeService } from '../theme.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

const mockTheme = {
	id: 'theme-1',
	name: 'Dark',
	colors: { primary: '#000', secondary: '#333', background: '#111', text: '#fff', accent: '#f00' },
	fonts: { heading: 'Arial', body: 'Helvetica' },
	isDefault: false,
};

const defaultTheme = {
	...mockTheme,
	id: 'theme-default',
	name: 'Default',
	isDefault: true,
};

describe('ThemeService', () => {
	let service: ThemeService;
	let mockDb: any;

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ThemeService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<ThemeService>(ThemeService);
	});

	describe('findAll', () => {
		it('should return all themes', async () => {
			const themes = [mockTheme, defaultTheme];
			mockDb.from.mockResolvedValue(themes);

			const result = await service.findAll();

			expect(result).toEqual(themes);
			expect(result).toHaveLength(2);
		});

		it('should return empty array when no themes exist', async () => {
			mockDb.from.mockResolvedValue([]);

			const result = await service.findAll();

			expect(result).toEqual([]);
		});
	});

	describe('findOne', () => {
		it('should return theme when found', async () => {
			mockDb.where.mockResolvedValue([mockTheme]);

			const result = await service.findOne('theme-1');

			expect(result).toEqual(mockTheme);
		});

		it('should return null when theme not found', async () => {
			mockDb.where.mockResolvedValue([]);

			const result = await service.findOne('nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('findDefault', () => {
		it('should return default theme', async () => {
			mockDb.where.mockResolvedValue([defaultTheme]);

			const result = await service.findDefault();

			expect(result).toEqual(defaultTheme);
			expect(result.isDefault).toBe(true);
		});

		it('should return null when no default theme exists', async () => {
			mockDb.where.mockResolvedValue([]);

			const result = await service.findDefault();

			expect(result).toBeNull();
		});
	});
});
