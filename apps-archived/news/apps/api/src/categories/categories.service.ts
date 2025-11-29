import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { Database, categories, Category, asc } from '@manacore/news-database';

@Injectable()
export class CategoriesService {
	constructor(@Inject(DATABASE_CONNECTION) private database: Database) {}

	async getAllCategories(): Promise<Category[]> {
		return this.database.select().from(categories).orderBy(asc(categories.priority));
	}

	async createCategory(data: {
		name: string;
		displayName: string;
		description?: string;
		icon?: string;
		color?: string;
		priority?: number;
	}): Promise<Category> {
		const [category] = await this.database.insert(categories).values(data).returning();

		return category;
	}
}
