import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { mockTagFactory } from '../__tests__/utils/mock-factories';

describe('TagController', () => {
	let controller: TagController;
	let tagService: jest.Mocked<TagService>;

	const mockUser = { userId: 'test-user-id', email: 'test@example.com', role: 'user' };

	beforeEach(async () => {
		const mockTagService = {
			findAll: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [TagController],
			providers: [{ provide: TagService, useValue: mockTagService }],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<TagController>(TagController);
		tagService = module.get(TagService);
	});

	describe('findAll', () => {
		it('should return all tags for user', async () => {
			const tags = [
				mockTagFactory.create({ name: 'Work' }),
				mockTagFactory.create({ name: 'Personal' }),
				mockTagFactory.create({ name: 'Important' }),
			];
			tagService.findAll.mockResolvedValue(tags as any);

			const result = await controller.findAll(mockUser);

			expect(tagService.findAll).toHaveBeenCalledWith('test-user-id');
			expect(result).toEqual(tags);
			expect(result).toHaveLength(3);
		});
	});

	describe('create', () => {
		it('should create a tag with name and color', async () => {
			const dto = { name: 'Urgent', color: '#ff0000' };
			const created = mockTagFactory.create({ name: 'Urgent', color: '#ff0000' });
			tagService.create.mockResolvedValue(created as any);

			const result = await controller.create(mockUser, dto);

			expect(tagService.create).toHaveBeenCalledWith('test-user-id', 'Urgent', '#ff0000');
			expect(result).toEqual(created);
		});

		it('should create a tag with name only (no color)', async () => {
			const dto = { name: 'Archive' };
			const created = mockTagFactory.create({ name: 'Archive' });
			tagService.create.mockResolvedValue(created as any);

			const result = await controller.create(mockUser, dto);

			expect(tagService.create).toHaveBeenCalledWith('test-user-id', 'Archive', undefined);
			expect(result).toEqual(created);
		});
	});

	describe('update', () => {
		it('should update a tag with new name and color', async () => {
			const dto = { name: 'Updated Tag', color: '#00ff00' };
			const updated = mockTagFactory.create({ name: 'Updated Tag', color: '#00ff00' });
			tagService.update.mockResolvedValue(updated as any);

			const result = await controller.update(mockUser, 'tag-123', dto);

			expect(tagService.update).toHaveBeenCalledWith('test-user-id', 'tag-123', dto);
			expect(result).toEqual(updated);
		});

		it('should update a tag with partial data (name only)', async () => {
			const dto = { name: 'Renamed' };
			const updated = mockTagFactory.create({ name: 'Renamed' });
			tagService.update.mockResolvedValue(updated as any);

			const result = await controller.update(mockUser, 'tag-123', dto);

			expect(tagService.update).toHaveBeenCalledWith('test-user-id', 'tag-123', {
				name: 'Renamed',
			});
			expect(result).toEqual(updated);
		});

		it('should update a tag with partial data (color only)', async () => {
			const dto = { color: '#0000ff' };
			const updated = mockTagFactory.create({ color: '#0000ff' });
			tagService.update.mockResolvedValue(updated as any);

			const result = await controller.update(mockUser, 'tag-123', dto);

			expect(tagService.update).toHaveBeenCalledWith('test-user-id', 'tag-123', {
				color: '#0000ff',
			});
			expect(result).toEqual(updated);
		});
	});

	describe('delete', () => {
		it('should delete a tag and return success', async () => {
			tagService.delete.mockResolvedValue(undefined);

			const result = await controller.delete(mockUser, 'tag-123');

			expect(tagService.delete).toHaveBeenCalledWith('test-user-id', 'tag-123');
			expect(result).toEqual({ success: true });
		});
	});
});
