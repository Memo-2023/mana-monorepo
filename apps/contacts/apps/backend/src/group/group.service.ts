import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, or } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import {
	contactGroups,
	contactToGroups,
	type ContactGroup,
	type NewContactGroup,
} from '../db/schema';

// System user ID for preset groups (visible to all users)
const SYSTEM_USER_ID = 'system';

@Injectable()
export class GroupService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	/**
	 * Get all groups for a user, including preset groups (system groups)
	 */
	async findByUserId(userId: string): Promise<ContactGroup[]> {
		// Get user's own groups + preset groups (system)
		return this.db
			.select()
			.from(contactGroups)
			.where(
				or(
					eq(contactGroups.userId, userId),
					and(eq(contactGroups.userId, SYSTEM_USER_ID), eq(contactGroups.isPreset, true))
				)
			);
	}

	/**
	 * Find a group by ID (user's own or preset)
	 */
	async findById(id: string, userId: string): Promise<ContactGroup | null> {
		const [group] = await this.db
			.select()
			.from(contactGroups)
			.where(
				and(
					eq(contactGroups.id, id),
					or(
						eq(contactGroups.userId, userId),
						and(eq(contactGroups.userId, SYSTEM_USER_ID), eq(contactGroups.isPreset, true))
					)
				)
			);
		return group || null;
	}

	async create(data: NewContactGroup): Promise<ContactGroup> {
		const [group] = await this.db.insert(contactGroups).values(data).returning();
		return group;
	}

	/**
	 * Update a group - preset groups cannot be modified
	 */
	async update(id: string, userId: string, data: Partial<NewContactGroup>): Promise<ContactGroup> {
		// First check if this is a preset group
		const existingGroup = await this.findById(id, userId);
		if (!existingGroup) {
			throw new NotFoundException('Group not found');
		}
		if (existingGroup.isPreset) {
			throw new ForbiddenException('Preset groups cannot be modified');
		}

		const [group] = await this.db
			.update(contactGroups)
			.set(data)
			.where(and(eq(contactGroups.id, id), eq(contactGroups.userId, userId)))
			.returning();

		if (!group) {
			throw new NotFoundException('Group not found');
		}

		return group;
	}

	/**
	 * Delete a group - preset groups cannot be deleted
	 */
	async delete(id: string, userId: string): Promise<void> {
		// First check if this is a preset group
		const existingGroup = await this.findById(id, userId);
		if (!existingGroup) {
			throw new NotFoundException('Group not found');
		}
		if (existingGroup.isPreset) {
			throw new ForbiddenException('Preset groups cannot be deleted');
		}

		await this.db
			.delete(contactGroups)
			.where(and(eq(contactGroups.id, id), eq(contactGroups.userId, userId)));
	}

	async addContactToGroup(contactId: string, groupId: string): Promise<void> {
		await this.db.insert(contactToGroups).values({ contactId, groupId }).onConflictDoNothing();
	}

	async removeContactFromGroup(contactId: string, groupId: string): Promise<void> {
		await this.db
			.delete(contactToGroups)
			.where(and(eq(contactToGroups.contactId, contactId), eq(contactToGroups.groupId, groupId)));
	}

	async getContactsInGroup(groupId: string): Promise<string[]> {
		const results = await this.db
			.select({ contactId: contactToGroups.contactId })
			.from(contactToGroups)
			.where(eq(contactToGroups.groupId, groupId));

		return results.map((r) => r.contactId);
	}
}
