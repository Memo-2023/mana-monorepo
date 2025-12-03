import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { labels, emailLabels, type Label, type NewLabel } from '../db/schema';

export interface LabelFilters {
	accountId?: string;
}

@Injectable()
export class LabelService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByUserId(userId: string, filters: LabelFilters = {}): Promise<Label[]> {
		const { accountId } = filters;

		let conditions = [eq(labels.userId, userId)];

		if (accountId) {
			conditions.push(eq(labels.accountId, accountId));
		}

		return this.db
			.select()
			.from(labels)
			.where(and(...conditions));
	}

	async findById(id: string, userId: string): Promise<Label | null> {
		const [label] = await this.db
			.select()
			.from(labels)
			.where(and(eq(labels.id, id), eq(labels.userId, userId)));
		return label || null;
	}

	async create(data: NewLabel): Promise<Label> {
		// Check for duplicate name within same user/account
		const existing = await this.db
			.select()
			.from(labels)
			.where(
				and(
					eq(labels.userId, data.userId),
					eq(labels.name, data.name),
					data.accountId ? eq(labels.accountId, data.accountId) : undefined
				)
			);

		if (existing.length > 0) {
			throw new ConflictException('A label with this name already exists');
		}

		const [label] = await this.db.insert(labels).values(data).returning();
		return label;
	}

	async update(id: string, userId: string, data: Partial<NewLabel>): Promise<Label> {
		// Check name uniqueness if name is being updated
		if (data.name) {
			const label = await this.findById(id, userId);
			if (!label) {
				throw new NotFoundException('Label not found');
			}

			const existing = await this.db
				.select()
				.from(labels)
				.where(
					and(
						eq(labels.userId, userId),
						eq(labels.name, data.name),
						label.accountId ? eq(labels.accountId, label.accountId) : undefined
					)
				);

			if (existing.length > 0 && existing[0].id !== id) {
				throw new ConflictException('A label with this name already exists');
			}
		}

		const [updated] = await this.db
			.update(labels)
			.set(data)
			.where(and(eq(labels.id, id), eq(labels.userId, userId)))
			.returning();

		if (!updated) {
			throw new NotFoundException('Label not found');
		}

		return updated;
	}

	async delete(id: string, userId: string): Promise<void> {
		const label = await this.findById(id, userId);
		if (!label) {
			throw new NotFoundException('Label not found');
		}

		// Email labels will be deleted via cascade
		await this.db.delete(labels).where(and(eq(labels.id, id), eq(labels.userId, userId)));
	}

	// Get labels for a specific email
	async getEmailLabels(emailId: string, userId: string): Promise<Label[]> {
		const result = await this.db
			.select({
				label: labels,
			})
			.from(emailLabels)
			.innerJoin(labels, eq(emailLabels.labelId, labels.id))
			.where(and(eq(emailLabels.emailId, emailId), eq(labels.userId, userId)));

		return result.map((r) => r.label);
	}

	// Add labels to an email
	async addLabelsToEmail(emailId: string, labelIds: string[], userId: string): Promise<void> {
		// Verify all labels belong to user
		const userLabels = await this.db
			.select()
			.from(labels)
			.where(and(eq(labels.userId, userId), inArray(labels.id, labelIds)));

		if (userLabels.length !== labelIds.length) {
			throw new NotFoundException('One or more labels not found');
		}

		// Get existing labels for this email
		const existing = await this.db
			.select()
			.from(emailLabels)
			.where(and(eq(emailLabels.emailId, emailId), inArray(emailLabels.labelId, labelIds)));

		const existingIds = new Set(existing.map((e) => e.labelId));
		const newLabelIds = labelIds.filter((id) => !existingIds.has(id));

		if (newLabelIds.length > 0) {
			await this.db.insert(emailLabels).values(
				newLabelIds.map((labelId) => ({
					emailId,
					labelId,
				}))
			);
		}
	}

	// Remove labels from an email
	async removeLabelsFromEmail(emailId: string, labelIds: string[], userId: string): Promise<void> {
		// Verify all labels belong to user
		const userLabels = await this.db
			.select()
			.from(labels)
			.where(and(eq(labels.userId, userId), inArray(labels.id, labelIds)));

		if (userLabels.length !== labelIds.length) {
			throw new NotFoundException('One or more labels not found');
		}

		await this.db
			.delete(emailLabels)
			.where(and(eq(emailLabels.emailId, emailId), inArray(emailLabels.labelId, labelIds)));
	}

	// Set labels for an email (replace all existing)
	async setEmailLabels(emailId: string, labelIds: string[], userId: string): Promise<void> {
		// Verify all labels belong to user
		if (labelIds.length > 0) {
			const userLabels = await this.db
				.select()
				.from(labels)
				.where(and(eq(labels.userId, userId), inArray(labels.id, labelIds)));

			if (userLabels.length !== labelIds.length) {
				throw new NotFoundException('One or more labels not found');
			}
		}

		// Remove all existing labels
		await this.db.delete(emailLabels).where(eq(emailLabels.emailId, emailId));

		// Add new labels
		if (labelIds.length > 0) {
			await this.db.insert(emailLabels).values(
				labelIds.map((labelId) => ({
					emailId,
					labelId,
				}))
			);
		}
	}
}
