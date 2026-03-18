import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module
vi.mock('./client', () => ({
	apiClient: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
	},
}));

import {
	getProjects,
	getProject,
	createProject,
	updateProject,
	deleteProject,
	archiveProject,
	reorderProjects,
} from './projects';
import { apiClient } from './client';

const mockClient = vi.mocked(apiClient);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getProjects', () => {
	it('should fetch all projects', async () => {
		const projects = [
			{ id: 'p1', name: 'Work' },
			{ id: 'p2', name: 'Personal' },
		];
		mockClient.get.mockResolvedValue({ projects });

		const result = await getProjects();

		expect(mockClient.get).toHaveBeenCalledWith('/api/v1/projects');
		expect(result).toEqual(projects);
	});

	it('should return empty array when no projects', async () => {
		mockClient.get.mockResolvedValue({ projects: [] });

		const result = await getProjects();

		expect(result).toEqual([]);
	});
});

describe('getProject', () => {
	it('should fetch a single project by id', async () => {
		const project = { id: 'p1', name: 'Work' };
		mockClient.get.mockResolvedValue({ project });

		const result = await getProject('p1');

		expect(mockClient.get).toHaveBeenCalledWith('/api/v1/projects/p1');
		expect(result).toEqual(project);
	});
});

describe('createProject', () => {
	it('should POST a new project', async () => {
		const data = { name: 'New Project', color: '#ff0000', icon: 'star' };
		const project = { id: 'p-new', ...data };
		mockClient.post.mockResolvedValue({ project });

		const result = await createProject(data);

		expect(mockClient.post).toHaveBeenCalledWith('/api/v1/projects', data);
		expect(result).toEqual(project);
	});

	it('should create project with only name', async () => {
		const data = { name: 'Minimal Project' };
		const project = { id: 'p-min', name: 'Minimal Project' };
		mockClient.post.mockResolvedValue({ project });

		const result = await createProject(data);

		expect(mockClient.post).toHaveBeenCalledWith('/api/v1/projects', data);
		expect(result).toEqual(project);
	});
});

describe('updateProject', () => {
	it('should PUT updated project', async () => {
		const data = { name: 'Updated Name', color: '#00ff00' };
		const project = { id: 'p1', ...data };
		mockClient.put.mockResolvedValue({ project });

		const result = await updateProject('p1', data);

		expect(mockClient.put).toHaveBeenCalledWith('/api/v1/projects/p1', data);
		expect(result).toEqual(project);
	});
});

describe('deleteProject', () => {
	it('should DELETE project', async () => {
		mockClient.delete.mockResolvedValue(undefined);

		await deleteProject('p1');

		expect(mockClient.delete).toHaveBeenCalledWith('/api/v1/projects/p1');
	});
});

describe('archiveProject', () => {
	it('should POST to archive endpoint', async () => {
		const project = { id: 'p1', name: 'Work', isArchived: true };
		mockClient.post.mockResolvedValue({ project });

		const result = await archiveProject('p1');

		expect(mockClient.post).toHaveBeenCalledWith('/api/v1/projects/p1/archive');
		expect(result).toEqual(project);
	});
});

describe('reorderProjects', () => {
	it('should PUT reorder with project IDs', async () => {
		mockClient.put.mockResolvedValue(undefined);

		await reorderProjects(['p1', 'p2', 'p3']);

		expect(mockClient.put).toHaveBeenCalledWith('/api/v1/projects/reorder', {
			projectIds: ['p1', 'p2', 'p3'],
		});
	});
});
