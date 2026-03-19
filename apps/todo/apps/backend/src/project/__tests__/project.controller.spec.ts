import { ProjectController } from '../project.controller';

const TEST_USER_ID = 'test-user-123';
const mockUser = { userId: TEST_USER_ID, email: 'test@example.com' };

function createMockProject(overrides: Record<string, unknown> = {}) {
	return { id: 'proj-1', userId: TEST_USER_ID, name: 'Test', color: '#3B82F6', ...overrides };
}

describe('ProjectController', () => {
	let controller: ProjectController;
	let service: any;

	beforeEach(() => {
		service = {
			findAll: jest.fn(),
			findByIdOrThrow: jest.fn(),
			create: jest.fn(),
			getOrCreateDefaultProject: jest.fn().mockResolvedValue(undefined),
			update: jest.fn(),
			delete: jest.fn(),
			archive: jest.fn(),
			reorder: jest.fn(),
		};
		controller = new ProjectController(service);
	});

	afterEach(() => jest.clearAllMocks());

	describe('findAll', () => {
		it('should return projects', async () => {
			const projects = [createMockProject()];
			service.findAll.mockResolvedValue(projects);
			const result = await controller.findAll(mockUser as any);
			expect(result).toEqual({ projects });
		});
	});

	describe('findOne', () => {
		it('should return project', async () => {
			const project = createMockProject();
			service.findByIdOrThrow.mockResolvedValue(project);
			const result = await controller.findOne(mockUser as any, 'proj-1');
			expect(result).toEqual({ project });
		});
	});

	describe('create', () => {
		it('should create project', async () => {
			const project = createMockProject({ name: 'New' });
			service.create.mockResolvedValue(project);
			const result = await controller.create(mockUser as any, { name: 'New' } as any);
			expect(result).toEqual({ project });
		});
	});

	describe('delete', () => {
		it('should delete', async () => {
			service.delete.mockResolvedValue(undefined);
			const result = await controller.delete(mockUser as any, 'proj-1');
			expect(result).toEqual({ success: true });
		});
	});

	describe('archive', () => {
		it('should archive project', async () => {
			const project = createMockProject({ isArchived: true });
			service.archive.mockResolvedValue(project);
			const result = await controller.archive(mockUser as any, 'proj-1');
			expect(result).toEqual({ project });
		});
	});
});
