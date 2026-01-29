import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, isNull, count } from 'drizzle-orm';
import { collections, Collection, NewCollection, questions } from '../db/schema';
import { CreateCollectionDto, UpdateCollectionDto } from './dto';

@Injectable()
export class CollectionService {
	constructor(
		@Inject('DATABASE_CONNECTION')
		private readonly db: NodePgDatabase,
	) {}

	async create(userId: string, dto: CreateCollectionDto): Promise<Collection> {
		// If this is set as default, unset other defaults
		if (dto.isDefault) {
			await this.db
				.update(collections)
				.set({ isDefault: false })
				.where(and(eq(collections.userId, userId), eq(collections.isDefault, true)));
		}

		// Get max sort order
		const existing = await this.db
			.select({ sortOrder: collections.sortOrder })
			.from(collections)
			.where(and(eq(collections.userId, userId), isNull(collections.deletedAt)))
			.orderBy(desc(collections.sortOrder))
			.limit(1);

		const maxSortOrder = existing.length > 0 ? existing[0].sortOrder ?? 0 : 0;

		const newCollection: NewCollection = {
			userId,
			name: dto.name,
			description: dto.description,
			color: dto.color || '#6366f1',
			icon: dto.icon || 'folder',
			isDefault: dto.isDefault || false,
			sortOrder: maxSortOrder + 1,
		};

		const [created] = await this.db.insert(collections).values(newCollection).returning();
		return created;
	}

	async findAll(userId: string): Promise<(Collection & { questionCount: number })[]> {
		const userCollections = await this.db
			.select()
			.from(collections)
			.where(and(eq(collections.userId, userId), isNull(collections.deletedAt)))
			.orderBy(collections.sortOrder);

		// Get question counts for each collection
		const result = await Promise.all(
			userCollections.map(async (collection) => {
				const [countResult] = await this.db
					.select({ count: count() })
					.from(questions)
					.where(
						and(
							eq(questions.collectionId, collection.id),
							eq(questions.userId, userId),
							isNull(questions.deletedAt),
						),
					);

				return {
					...collection,
					questionCount: countResult?.count ?? 0,
				};
			}),
		);

		return result;
	}

	async findOne(userId: string, id: string): Promise<Collection> {
		const [collection] = await this.db
			.select()
			.from(collections)
			.where(
				and(eq(collections.id, id), eq(collections.userId, userId), isNull(collections.deletedAt)),
			);

		if (!collection) {
			throw new NotFoundException(`Collection with id ${id} not found`);
		}

		return collection;
	}

	async update(userId: string, id: string, dto: UpdateCollectionDto): Promise<Collection> {
		await this.findOne(userId, id);

		// If setting as default, unset other defaults
		if (dto.isDefault) {
			await this.db
				.update(collections)
				.set({ isDefault: false })
				.where(and(eq(collections.userId, userId), eq(collections.isDefault, true)));
		}

		const updateData: Partial<NewCollection> = {
			...dto,
			updatedAt: new Date(),
		};

		const [updated] = await this.db
			.update(collections)
			.set(updateData)
			.where(and(eq(collections.id, id), eq(collections.userId, userId)))
			.returning();

		return updated;
	}

	async delete(userId: string, id: string): Promise<void> {
		const collection = await this.findOne(userId, id);

		// Check if collection has questions
		const [questionsCount] = await this.db
			.select({ count: count() })
			.from(questions)
			.where(
				and(
					eq(questions.collectionId, id),
					eq(questions.userId, userId),
					isNull(questions.deletedAt),
				),
			);

		if (questionsCount.count > 0) {
			throw new ConflictException(
				'Cannot delete collection with questions. Move or delete questions first.',
			);
		}

		// Soft delete
		await this.db
			.update(collections)
			.set({ deletedAt: new Date() })
			.where(and(eq(collections.id, id), eq(collections.userId, userId)));
	}

	async getDefault(userId: string): Promise<Collection | null> {
		const [collection] = await this.db
			.select()
			.from(collections)
			.where(
				and(
					eq(collections.userId, userId),
					eq(collections.isDefault, true),
					isNull(collections.deletedAt),
				),
			);

		return collection || null;
	}

	async reorder(userId: string, orderedIds: string[]): Promise<void> {
		await Promise.all(
			orderedIds.map((id, index) =>
				this.db
					.update(collections)
					.set({ sortOrder: index, updatedAt: new Date() })
					.where(and(eq(collections.id, id), eq(collections.userId, userId))),
			),
		);
	}
}
