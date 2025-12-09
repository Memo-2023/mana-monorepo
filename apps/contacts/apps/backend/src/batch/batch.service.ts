import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { contacts, contactToGroups, contactToTags } from '../db/schema';
import type { Contact } from '../db/schema';

export interface BatchResult {
	success: number;
	failed: number;
	errors: string[];
}

@Injectable()
export class BatchService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	/**
	 * Delete multiple contacts
	 */
	async deleteMany(contactIds: string[], userId: string): Promise<BatchResult> {
		if (contactIds.length === 0) {
			throw new BadRequestException('No contacts specified');
		}

		const result: BatchResult = { success: 0, failed: 0, errors: [] };

		try {
			// Delete in a single query
			const deleted = await this.db
				.delete(contacts)
				.where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIds)))
				.returning();

			result.success = deleted.length;
			result.failed = contactIds.length - deleted.length;

			if (result.failed > 0) {
				result.errors.push(
					`${result.failed} contacts could not be deleted (not found or no permission)`
				);
			}
		} catch (e) {
			result.failed = contactIds.length;
			result.errors.push(e instanceof Error ? e.message : 'Delete failed');
		}

		return result;
	}

	/**
	 * Archive multiple contacts
	 */
	async archiveMany(contactIds: string[], userId: string, archive = true): Promise<BatchResult> {
		if (contactIds.length === 0) {
			throw new BadRequestException('No contacts specified');
		}

		const result: BatchResult = { success: 0, failed: 0, errors: [] };

		try {
			const updated = await this.db
				.update(contacts)
				.set({ isArchived: archive, updatedAt: new Date() })
				.where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIds)))
				.returning();

			result.success = updated.length;
			result.failed = contactIds.length - updated.length;

			if (result.failed > 0) {
				result.errors.push(
					`${result.failed} contacts could not be ${archive ? 'archived' : 'unarchived'}`
				);
			}
		} catch (e) {
			result.failed = contactIds.length;
			result.errors.push(e instanceof Error ? e.message : 'Archive operation failed');
		}

		return result;
	}

	/**
	 * Set favorite status for multiple contacts
	 */
	async favoriteMany(contactIds: string[], userId: string, favorite = true): Promise<BatchResult> {
		if (contactIds.length === 0) {
			throw new BadRequestException('No contacts specified');
		}

		const result: BatchResult = { success: 0, failed: 0, errors: [] };

		try {
			const updated = await this.db
				.update(contacts)
				.set({ isFavorite: favorite, updatedAt: new Date() })
				.where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIds)))
				.returning();

			result.success = updated.length;
			result.failed = contactIds.length - updated.length;

			if (result.failed > 0) {
				result.errors.push(`${result.failed} contacts could not be updated`);
			}
		} catch (e) {
			result.failed = contactIds.length;
			result.errors.push(e instanceof Error ? e.message : 'Favorite operation failed');
		}

		return result;
	}

	/**
	 * Add multiple contacts to a group
	 */
	async addToGroup(contactIds: string[], groupId: string, userId: string): Promise<BatchResult> {
		if (contactIds.length === 0) {
			throw new BadRequestException('No contacts specified');
		}

		const result: BatchResult = { success: 0, failed: 0, errors: [] };

		// Verify contacts belong to user
		const validContacts = await this.db
			.select({ id: contacts.id })
			.from(contacts)
			.where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIds)));

		const validIds = new Set(validContacts.map((c) => c.id));

		for (const contactId of contactIds) {
			if (!validIds.has(contactId)) {
				result.failed++;
				continue;
			}

			try {
				// Insert if not exists (ignore duplicates)
				await this.db.insert(contactToGroups).values({ contactId, groupId }).onConflictDoNothing();
				result.success++;
			} catch {
				result.failed++;
			}
		}

		if (result.failed > 0) {
			result.errors.push(`${result.failed} contacts could not be added to group`);
		}

		return result;
	}

	/**
	 * Remove multiple contacts from a group
	 */
	async removeFromGroup(
		contactIds: string[],
		groupId: string,
		userId: string
	): Promise<BatchResult> {
		if (contactIds.length === 0) {
			throw new BadRequestException('No contacts specified');
		}

		const result: BatchResult = { success: 0, failed: 0, errors: [] };

		// Verify contacts belong to user first
		const validContacts = await this.db
			.select({ id: contacts.id })
			.from(contacts)
			.where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIds)));

		const validIds = validContacts.map((c) => c.id);

		if (validIds.length === 0) {
			result.failed = contactIds.length;
			result.errors.push('No valid contacts found');
			return result;
		}

		try {
			await this.db
				.delete(contactToGroups)
				.where(
					and(eq(contactToGroups.groupId, groupId), inArray(contactToGroups.contactId, validIds))
				);
			result.success = validIds.length;
			result.failed = contactIds.length - validIds.length;
		} catch (e) {
			result.failed = contactIds.length;
			result.errors.push(e instanceof Error ? e.message : 'Remove from group failed');
		}

		return result;
	}

	/**
	 * Add tags to multiple contacts
	 */
	async addTags(contactIds: string[], tagIds: string[], userId: string): Promise<BatchResult> {
		if (contactIds.length === 0) {
			throw new BadRequestException('No contacts specified');
		}

		const result: BatchResult = { success: 0, failed: 0, errors: [] };

		// Verify contacts belong to user
		const validContacts = await this.db
			.select({ id: contacts.id })
			.from(contacts)
			.where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIds)));

		const validIds = new Set(validContacts.map((c) => c.id));

		for (const contactId of contactIds) {
			if (!validIds.has(contactId)) {
				result.failed++;
				continue;
			}

			for (const tagId of tagIds) {
				try {
					await this.db.insert(contactToTags).values({ contactId, tagId }).onConflictDoNothing();
				} catch {
					// Ignore individual tag failures
				}
			}
			result.success++;
		}

		if (result.failed > 0) {
			result.errors.push(`${result.failed} contacts could not be tagged`);
		}

		return result;
	}
}
