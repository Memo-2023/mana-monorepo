import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import {
	contactGroups,
	contactToGroups,
	type ContactGroup,
	type NewContactGroup,
} from '../db/schema';

@Injectable()
export class GroupService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByUserId(userId: string): Promise<ContactGroup[]> {
		return this.db.select().from(contactGroups).where(eq(contactGroups.userId, userId));
	}

	async findById(id: string, userId: string): Promise<ContactGroup | null> {
		const [group] = await this.db
			.select()
			.from(contactGroups)
			.where(and(eq(contactGroups.id, id), eq(contactGroups.userId, userId)));
		return group || null;
	}

	async create(data: NewContactGroup): Promise<ContactGroup> {
		const [group] = await this.db.insert(contactGroups).values(data).returning();
		return group;
	}

	async update(id: string, userId: string, data: Partial<NewContactGroup>): Promise<ContactGroup> {
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

	async delete(id: string, userId: string): Promise<void> {
		await this.db
			.delete(contactGroups)
			.where(and(eq(contactGroups.id, id), eq(contactGroups.userId, userId)));
	}

	async addContactToGroup(contactId: string, groupId: string): Promise<void> {
		await this.db
			.insert(contactToGroups)
			.values({ contactId, groupId })
			.onConflictDoNothing();
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
