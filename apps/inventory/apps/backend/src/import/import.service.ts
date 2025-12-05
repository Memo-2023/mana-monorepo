import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { DATABASE_CONNECTION } from '../db/database.module';
import { DbClient } from '../db/connection';
import { items } from '../db/schema';

interface CsvRow {
	name?: string;
	description?: string;
	sku?: string;
	category?: string;
	location?: string;
	purchaseDate?: string;
	purchasePrice?: string;
	currency?: string;
	currentValue?: string;
	condition?: string;
	warrantyExpires?: string;
	notes?: string;
	quantity?: string;
}

@Injectable()
export class ImportService {
	constructor(@Inject(DATABASE_CONNECTION) private db: DbClient) {}

	async importCsv(userId: string, file: Express.Multer.File) {
		if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
			throw new BadRequestException('File must be CSV format');
		}

		const content = file.buffer.toString('utf-8');

		let records: CsvRow[];
		try {
			records = parse(content, {
				columns: true,
				skip_empty_lines: true,
				trim: true,
			});
		} catch (error) {
			throw new BadRequestException('Invalid CSV format');
		}

		if (!records.length) {
			throw new BadRequestException('CSV file is empty');
		}

		const imported: string[] = [];
		const errors: { row: number; error: string }[] = [];

		for (let i = 0; i < records.length; i++) {
			const row = records[i];

			if (!row.name?.trim()) {
				errors.push({ row: i + 2, error: 'Name is required' });
				continue;
			}

			try {
				const [item] = await this.db
					.insert(items)
					.values({
						userId,
						name: row.name.trim(),
						description: row.description?.trim() || null,
						sku: row.sku?.trim() || null,
						purchaseDate: row.purchaseDate || null,
						purchasePrice: row.purchasePrice || null,
						currency: row.currency?.trim() || 'EUR',
						currentValue: row.currentValue || null,
						condition: this.normalizeCondition(row.condition),
						warrantyExpires: row.warrantyExpires || null,
						notes: row.notes?.trim() || null,
						quantity: row.quantity || '1',
					})
					.returning();

				imported.push(item.id);
			} catch (error) {
				errors.push({ row: i + 2, error: error.message });
			}
		}

		return {
			imported: imported.length,
			errors: errors.length,
			errorDetails: errors,
			itemIds: imported,
		};
	}

	getTemplate(): string {
		const headers = [
			'name',
			'description',
			'sku',
			'purchaseDate',
			'purchasePrice',
			'currency',
			'currentValue',
			'condition',
			'warrantyExpires',
			'notes',
			'quantity',
		];

		const exampleRow = [
			'MacBook Pro 16"',
			'Work laptop',
			'MBP-2023-001',
			'2023-06-15',
			'2499.00',
			'EUR',
			'2000.00',
			'good',
			'2025-06-15',
			'Company device',
			'1',
		];

		return [headers.join(','), exampleRow.join(',')].join('\n');
	}

	private normalizeCondition(condition?: string): string {
		const normalized = condition?.toLowerCase().trim();
		const validConditions = ['new', 'like_new', 'good', 'fair', 'poor'];

		if (normalized && validConditions.includes(normalized)) {
			return normalized;
		}

		const mapping: Record<string, string> = {
			neu: 'new',
			new: 'new',
			'sehr gut': 'like_new',
			'like new': 'like_new',
			likenew: 'like_new',
			gut: 'good',
			good: 'good',
			akzeptabel: 'fair',
			fair: 'fair',
			schlecht: 'poor',
			poor: 'poor',
		};

		return mapping[normalized || ''] || 'good';
	}
}
