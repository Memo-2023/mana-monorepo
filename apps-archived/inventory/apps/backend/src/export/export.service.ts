import { Injectable, Inject } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { DbClient } from '../db/connection';
import { items, categories, locations } from '../db/schema';

interface ExportOptions {
	categoryId?: string;
	locationId?: string;
	includeArchived?: boolean;
}

@Injectable()
export class ExportService {
	constructor(@Inject(DATABASE_CONNECTION) private db: DbClient) {}

	async exportCsv(userId: string, options: ExportOptions = {}): Promise<string> {
		const conditions = [eq(items.userId, userId)];

		if (!options.includeArchived) {
			conditions.push(eq(items.isArchived, false));
		}
		if (options.categoryId) {
			conditions.push(eq(items.categoryId, options.categoryId));
		}
		if (options.locationId) {
			conditions.push(eq(items.locationId, options.locationId));
		}

		const data = await this.db
			.select({
				item: items,
				category: categories,
				location: locations,
			})
			.from(items)
			.leftJoin(categories, eq(items.categoryId, categories.id))
			.leftJoin(locations, eq(items.locationId, locations.id))
			.where(and(...conditions));

		const rows = data.map(({ item, category, location }) => ({
			name: item.name,
			description: item.description || '',
			sku: item.sku || '',
			category: category?.name || '',
			location: location?.name || '',
			purchaseDate: item.purchaseDate || '',
			purchasePrice: item.purchasePrice || '',
			currency: item.currency,
			currentValue: item.currentValue || '',
			condition: item.condition,
			warrantyExpires: item.warrantyExpires || '',
			warrantyNotes: item.warrantyNotes || '',
			notes: item.notes || '',
			quantity: item.quantity,
			isFavorite: item.isFavorite ? 'yes' : 'no',
			isArchived: item.isArchived ? 'yes' : 'no',
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
		}));

		return stringify(rows, {
			header: true,
			columns: [
				'name',
				'description',
				'sku',
				'category',
				'location',
				'purchaseDate',
				'purchasePrice',
				'currency',
				'currentValue',
				'condition',
				'warrantyExpires',
				'warrantyNotes',
				'notes',
				'quantity',
				'isFavorite',
				'isArchived',
				'createdAt',
				'updatedAt',
			],
		});
	}
}
