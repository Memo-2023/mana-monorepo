import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SkillService } from './skill.service';
import { DATABASE_TOKEN } from '../db/database.module';

// Mock database operations
// Uses a query builder pattern where each query chain is thenable
const createMockDb = () => {
	// Queue for resolved values - each await will pop from this queue
	const resolveQueue: any[] = [];

	// Create a thenable query result (only used for final await)
	const createQueryResult = (): any => {
		return {
			then: (resolve: (value: any) => void, reject?: (reason: any) => void) => {
				const value = resolveQueue.shift() ?? [];
				return Promise.resolve(value).then(resolve, reject);
			},
		};
	};

	// The mock database object - NOT thenable itself
	const mockDb: any = {
		// Helper methods
		_queueResult: (value: any) => {
			resolveQueue.push(value);
		},
		_queueResults: (...values: any[]) => {
			values.forEach((v) => resolveQueue.push(v));
		},
		_clearQueue: () => {
			resolveQueue.length = 0;
		},
	};

	// Create a query builder that returns thenable results
	const createChainableMethod = () => {
		const chainable: any = createQueryResult();
		chainable.select = jest.fn(() => chainable);
		chainable.from = jest.fn(() => chainable);
		chainable.where = jest.fn(() => chainable);
		chainable.orderBy = jest.fn(() => chainable);
		chainable.limit = jest.fn(() => chainable);
		chainable.returning = jest.fn(() => chainable);
		chainable.insert = jest.fn(() => chainable);
		chainable.values = jest.fn(() => chainable);
		chainable.update = jest.fn(() => chainable);
		chainable.set = jest.fn(() => chainable);
		chainable.delete = jest.fn(() => chainable);
		chainable.onConflictDoUpdate = jest.fn(() => chainable);
		return chainable;
	};

	// Database entry points return new chainable builders
	mockDb.select = jest.fn(() => createChainableMethod());
	mockDb.insert = jest.fn(() => createChainableMethod());
	mockDb.update = jest.fn(() => createChainableMethod());
	mockDb.delete = jest.fn(() => createChainableMethod());

	return mockDb;
};

describe('SkillService', () => {
	let service: SkillService;
	let mockDb: ReturnType<typeof createMockDb>;

	const testUserId = 'test-user-123';
	const testSkillId = 'skill-uuid-123';

	const mockSkill = {
		id: testSkillId,
		userId: testUserId,
		name: 'TypeScript',
		description: 'Learn TypeScript programming',
		branch: 'intellect',
		parentId: null,
		icon: 'code',
		color: '#3178C6',
		currentXp: 150,
		totalXp: 150,
		level: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(async () => {
		mockDb = createMockDb();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SkillService,
				{
					provide: DATABASE_TOKEN,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<SkillService>(SkillService);
	});

	afterEach(() => {
		jest.clearAllMocks();
		mockDb._clearQueue();
	});

	describe('findAll', () => {
		it('should return all skills for a user', async () => {
			const skills = [mockSkill, { ...mockSkill, id: 'skill-2', name: 'JavaScript' }];
			mockDb._queueResult(skills);

			const result = await service.findAll(testUserId);

			expect(result).toEqual(skills);
			expect(mockDb.select).toHaveBeenCalled();
		});

		it('should return empty array when user has no skills', async () => {
			mockDb._queueResult([]);

			const result = await service.findAll(testUserId);

			expect(result).toEqual([]);
		});
	});

	describe('findByBranch', () => {
		it('should return skills filtered by branch', async () => {
			const intellectSkills = [mockSkill];
			mockDb._queueResult(intellectSkills);

			const result = await service.findByBranch(testUserId, 'intellect');

			expect(result).toEqual(intellectSkills);
		});

		it('should return empty array for branch with no skills', async () => {
			mockDb._queueResult([]);

			const result = await service.findByBranch(testUserId, 'body');

			expect(result).toEqual([]);
		});
	});

	describe('findById', () => {
		it('should return skill when found', async () => {
			mockDb._queueResult([mockSkill]);

			const result = await service.findById(testSkillId, testUserId);

			expect(result).toEqual(mockSkill);
		});

		it('should return null when skill not found', async () => {
			mockDb._queueResult([]);

			const result = await service.findById('non-existent', testUserId);

			expect(result).toBeNull();
		});
	});

	describe('findByIdOrThrow', () => {
		it('should return skill when found', async () => {
			mockDb._queueResult([mockSkill]);

			const result = await service.findByIdOrThrow(testSkillId, testUserId);

			expect(result).toEqual(mockSkill);
		});

		it('should throw NotFoundException when skill not found', async () => {
			mockDb._queueResult([]);

			await expect(service.findByIdOrThrow('non-existent', testUserId)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('create', () => {
		const createDto = {
			name: 'React',
			description: 'Learn React framework',
			branch: 'intellect' as const,
			parentId: undefined,
			icon: 'component',
			color: '#61DAFB',
		};

		it('should create a new skill with default XP and level', async () => {
			const createdSkill = {
				...createDto,
				id: 'new-skill-id',
				userId: testUserId,
				currentXp: 0,
				totalXp: 0,
				level: 0,
			};

			// Queue results in order of awaits:
			// 1. insert().values().returning() -> [createdSkill]
			// 2. updateUserStats: select().from(skills).where() -> [createdSkill]
			// 3. updateUserStats: select().from(activities).where().orderBy().limit() -> []
			// 4. calculateStreak: select().from(activities).where().orderBy() -> []
			// 5. insert().values().onConflictDoUpdate() -> undefined
			mockDb._queueResults(
				[createdSkill], // 1. insert skill returning
				[createdSkill], // 2. select skills
				[], // 3. select activities (limit)
				[], // 4. calculateStreak activities
				undefined // 5. upsert stats
			);

			const result = await service.create(testUserId, createDto);

			expect(result.name).toBe('React');
			expect(result.currentXp).toBe(0);
			expect(result.level).toBe(0);
		});

		it('should use default icon when not provided', async () => {
			const dtoWithoutIcon = {
				name: 'New Skill',
				description: 'A skill',
				branch: 'body' as const,
				parentId: undefined,
				color: undefined,
			};

			const createdSkill = {
				...dtoWithoutIcon,
				id: 'new-id',
				userId: testUserId,
				icon: 'star',
				currentXp: 0,
				totalXp: 0,
				level: 0,
			};

			mockDb._queueResults([createdSkill], [createdSkill], [], [], undefined);

			const result = await service.create(testUserId, dtoWithoutIcon);

			expect(result.icon).toBe('star');
		});
	});

	describe('update', () => {
		const updateDto = {
			name: 'Updated TypeScript',
			description: 'Master TypeScript',
		};

		it('should update skill and return updated version', async () => {
			const updatedSkill = { ...mockSkill, ...updateDto };

			// Queue results:
			// 1. findByIdOrThrow: select().from(skills).where() -> [mockSkill]
			// 2. update().set().where().returning() -> [updatedSkill]
			mockDb._queueResults([mockSkill], [updatedSkill]);

			const result = await service.update(testSkillId, testUserId, updateDto);

			expect(result.name).toBe('Updated TypeScript');
			expect(result.description).toBe('Master TypeScript');
		});

		it('should throw NotFoundException when updating non-existent skill', async () => {
			mockDb._queueResult([]);

			await expect(service.update('non-existent', testUserId, updateDto)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('delete', () => {
		it('should delete skill successfully', async () => {
			// Queue results:
			// 1. findByIdOrThrow: select().from(skills).where() -> [mockSkill]
			// 2. delete(skills).where() -> undefined
			// 3. updateUserStats: select().from(skills).where() -> [] (empty after delete)
			// 4. updateUserStats: select().from(activities).where().orderBy().limit() -> []
			// 5. calculateStreak: select().from(activities).where().orderBy() -> []
			// 6. insert().values().onConflictDoUpdate() -> undefined
			mockDb._queueResults(
				[mockSkill], // 1. findByIdOrThrow
				undefined, // 2. delete
				[], // 3. select skills
				[], // 4. select activities (limit)
				[], // 5. calculateStreak
				undefined // 6. upsert stats
			);

			await expect(service.delete(testSkillId, testUserId)).resolves.not.toThrow();
		});

		it('should throw NotFoundException when deleting non-existent skill', async () => {
			mockDb._queueResult([]);

			await expect(service.delete('non-existent', testUserId)).rejects.toThrow(NotFoundException);
		});
	});

	describe('addXp', () => {
		const addXpDto = {
			xp: 50,
			description: 'Completed tutorial',
			duration: 30,
		};

		it('should add XP and update skill level when threshold crossed', async () => {
			// Skill at level 0 with 80 XP, adding 50 should reach level 1
			const skillAt80Xp = { ...mockSkill, currentXp: 80, totalXp: 80, level: 0 };
			const updatedSkill = {
				...skillAt80Xp,
				currentXp: 130,
				totalXp: 130,
				level: 1,
			};
			const recentActivity = { timestamp: new Date() };

			// Queue results:
			// 1. findByIdOrThrow: select().from(skills).where() -> [skillAt80Xp]
			// 2. update(skills).set().where().returning() -> [updatedSkill]
			// 3. insert(activities).values() -> undefined
			// 4. updateUserStats: select().from(skills).where() -> [updatedSkill]
			// 5. updateUserStats: select().from(activities).where().orderBy().limit() -> [activity]
			// 6. calculateStreak: select().from(activities).where().orderBy() -> [activity]
			// 7. insert().values().onConflictDoUpdate() -> undefined
			mockDb._queueResults(
				[skillAt80Xp], // 1
				[updatedSkill], // 2
				undefined, // 3
				[updatedSkill], // 4
				[recentActivity], // 5
				[recentActivity], // 6
				undefined // 7
			);

			const result = await service.addXp(testSkillId, testUserId, addXpDto);

			expect(result.skill.totalXp).toBe(130);
			expect(result.skill.level).toBe(1);
			expect(result.leveledUp).toBe(true);
			expect(result.newLevel).toBe(1);
		});

		it('should not level up when threshold not crossed', async () => {
			// Skill at level 1 with 150 XP, adding 50 stays at level 1
			const updatedSkill = {
				...mockSkill,
				currentXp: 200,
				totalXp: 200,
				level: 1,
			};
			const recentActivity = { timestamp: new Date() };

			mockDb._queueResults(
				[mockSkill], // findByIdOrThrow
				[updatedSkill], // update skill
				undefined, // insert activity
				[updatedSkill], // select skills
				[recentActivity], // select activities (limit)
				[recentActivity], // calculateStreak
				undefined // upsert stats
			);

			const result = await service.addXp(testSkillId, testUserId, addXpDto);

			expect(result.leveledUp).toBe(false);
			expect(result.newLevel).toBe(1);
		});

		it('should throw NotFoundException when adding XP to non-existent skill', async () => {
			mockDb._queueResult([]);

			await expect(service.addXp('non-existent', testUserId, addXpDto)).rejects.toThrow(
				NotFoundException
			);
		});

		it('should create activity record when adding XP', async () => {
			const updatedSkill = { ...mockSkill, currentXp: 200, totalXp: 200 };

			mockDb._queueResults(
				[mockSkill], // findByIdOrThrow
				[updatedSkill], // update skill
				undefined, // insert activity
				[updatedSkill], // select skills
				[], // select activities (limit)
				[], // calculateStreak
				undefined // upsert stats
			);

			await service.addXp(testSkillId, testUserId, addXpDto);

			expect(mockDb.insert).toHaveBeenCalled();
		});
	});

	describe('getUserStats', () => {
		it('should return user stats when they exist', async () => {
			const stats = {
				userId: testUserId,
				totalXp: 500,
				totalSkills: 5,
				highestLevel: 2,
				streakDays: 7,
				lastActivityDate: '2026-01-28',
			};
			mockDb._queueResult([stats]);

			const result = await service.getUserStats(testUserId);

			expect(result).toEqual(stats);
		});

		it('should return default stats when none exist', async () => {
			mockDb._queueResult([]);

			const result = await service.getUserStats(testUserId);

			expect(result).toEqual({
				totalXp: 0,
				totalSkills: 0,
				highestLevel: 0,
				streakDays: 0,
				lastActivityDate: null,
			});
		});
	});
});

describe('Level Calculation (Unit Tests)', () => {
	// Test the calculateLevel function directly
	const LEVEL_THRESHOLDS = [0, 100, 500, 1500, 4000, 10000];

	function calculateLevel(xp: number): number {
		for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
			if (xp >= LEVEL_THRESHOLDS[i]) {
				return i;
			}
		}
		return 0;
	}

	describe('calculateLevel', () => {
		it.each([
			[0, 0],
			[50, 0],
			[99, 0],
			[100, 1],
			[250, 1],
			[499, 1],
			[500, 2],
			[1000, 2],
			[1499, 2],
			[1500, 3],
			[3999, 3],
			[4000, 4],
			[9999, 4],
			[10000, 5],
			[50000, 5],
		])('calculateLevel(%i) should return %i', (xp, expectedLevel) => {
			expect(calculateLevel(xp)).toBe(expectedLevel);
		});
	});

	describe('Level up detection', () => {
		it('should detect level up from 0 to 1', () => {
			const oldLevel = calculateLevel(90);
			const newLevel = calculateLevel(110);
			expect(oldLevel).toBe(0);
			expect(newLevel).toBe(1);
			expect(newLevel > oldLevel).toBe(true);
		});

		it('should not detect level up within same level', () => {
			const oldLevel = calculateLevel(100);
			const newLevel = calculateLevel(200);
			expect(oldLevel).toBe(1);
			expect(newLevel).toBe(1);
			expect(newLevel > oldLevel).toBe(false);
		});

		it('should detect multiple level ups', () => {
			const oldLevel = calculateLevel(0);
			const newLevel = calculateLevel(600);
			expect(oldLevel).toBe(0);
			expect(newLevel).toBe(2);
			expect(newLevel - oldLevel).toBe(2);
		});
	});
});
