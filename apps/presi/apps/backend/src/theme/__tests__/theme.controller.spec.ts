import { ThemeController } from '../theme.controller';

const mockTheme = {
	id: 'theme-1',
	name: 'Dark',
	colors: { primary: '#000', secondary: '#333', background: '#111', text: '#fff', accent: '#f00' },
	fonts: { heading: 'Arial', body: 'Helvetica' },
	isDefault: false,
};

describe('ThemeController', () => {
	let controller: ThemeController;
	let service: any;

	beforeEach(() => {
		service = {
			findAll: jest.fn(),
			findDefault: jest.fn(),
			findOne: jest.fn(),
		};
		controller = new ThemeController(service);
	});

	afterEach(() => jest.clearAllMocks());

	describe('findAll', () => {
		it('should return all themes', async () => {
			const themes = [mockTheme];
			service.findAll.mockResolvedValue(themes);

			const result = await controller.findAll();

			expect(result).toEqual(themes);
		});
	});

	describe('findDefault', () => {
		it('should return default theme', async () => {
			const defaultTheme = { ...mockTheme, isDefault: true };
			service.findDefault.mockResolvedValue(defaultTheme);

			const result = await controller.findDefault();

			expect(result).toEqual(defaultTheme);
			expect(result.isDefault).toBe(true);
		});

		it('should return null when no default theme', async () => {
			service.findDefault.mockResolvedValue(null);

			const result = await controller.findDefault();

			expect(result).toBeNull();
		});
	});

	describe('findOne', () => {
		it('should return theme by id', async () => {
			service.findOne.mockResolvedValue(mockTheme);

			const result = await controller.findOne('theme-1');

			expect(result).toEqual(mockTheme);
			expect(service.findOne).toHaveBeenCalledWith('theme-1');
		});

		it('should return null when not found', async () => {
			service.findOne.mockResolvedValue(null);

			const result = await controller.findOne('nonexistent');

			expect(result).toBeNull();
		});
	});
});
