import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, desc, inArray } from 'drizzle-orm';
import * as schema from '../db/schema';
import {
	UserDataResponse,
	DeleteUserDataResponse,
	EntityCount,
} from './dto/user-data-response.dto';

@Injectable()
export class AdminService {
	private readonly logger = new Logger(AdminService.name);

	constructor(
		@Inject('DATABASE_CONNECTION')
		private readonly db: NodePgDatabase<typeof schema>
	) {}

	async getUserData(userId: string): Promise<UserDataResponse> {
		this.logger.log(`Getting user data for userId: ${userId}`);

		// Count contacts
		const contactsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.contacts)
			.where(eq(schema.contacts.userId, userId));
		const contactsCount = contactsResult[0]?.count ?? 0;

		// Count tags
		const tagsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.contactTags)
			.where(eq(schema.contactTags.userId, userId));
		const tagsCount = tagsResult[0]?.count ?? 0;

		// Count notes
		const notesResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.contactNotes)
			.where(eq(schema.contactNotes.userId, userId));
		const notesCount = notesResult[0]?.count ?? 0;

		// Count activities
		const activitiesResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.contactActivities)
			.where(eq(schema.contactActivities.userId, userId));
		const activitiesCount = activitiesResult[0]?.count ?? 0;

		// Get last activity
		const lastContact = await this.db
			.select({ updatedAt: schema.contacts.updatedAt })
			.from(schema.contacts)
			.where(eq(schema.contacts.userId, userId))
			.orderBy(desc(schema.contacts.updatedAt))
			.limit(1);
		const lastActivityAt = lastContact[0]?.updatedAt?.toISOString();

		const entities: EntityCount[] = [
			{ entity: 'contacts', count: contactsCount, label: 'Contacts' },
			{ entity: 'tags', count: tagsCount, label: 'Tags' },
			{ entity: 'notes', count: notesCount, label: 'Notes' },
			{ entity: 'activities', count: activitiesCount, label: 'Activities' },
		];

		const totalCount = contactsCount + tagsCount + notesCount + activitiesCount;

		return { entities, totalCount, lastActivityAt };
	}

	async deleteUserData(userId: string): Promise<DeleteUserDataResponse> {
		this.logger.log(`Deleting user data for userId: ${userId}`);

		const deletedCounts: EntityCount[] = [];
		let totalDeleted = 0;

		// Delete activities
		const deletedActivities = await this.db
			.delete(schema.contactActivities)
			.where(eq(schema.contactActivities.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'activities',
			count: deletedActivities.length,
			label: 'Activities',
		});
		totalDeleted += deletedActivities.length;

		// Delete notes
		const deletedNotes = await this.db
			.delete(schema.contactNotes)
			.where(eq(schema.contactNotes.userId, userId))
			.returning();
		deletedCounts.push({ entity: 'notes', count: deletedNotes.length, label: 'Notes' });
		totalDeleted += deletedNotes.length;

		// Get contact IDs for tag deletion
		const userContacts = await this.db
			.select({ id: schema.contacts.id })
			.from(schema.contacts)
			.where(eq(schema.contacts.userId, userId));
		const contactIds = userContacts.map((c) => c.id);

		// Delete contact_to_tags
		if (contactIds.length > 0) {
			const deletedContactToTags = await this.db
				.delete(schema.contactToTags)
				.where(inArray(schema.contactToTags.contactId, contactIds))
				.returning();
			deletedCounts.push({
				entity: 'contact_to_tags',
				count: deletedContactToTags.length,
				label: 'Contact Tags',
			});
			totalDeleted += deletedContactToTags.length;
		}

		// Delete tags
		const deletedTags = await this.db
			.delete(schema.contactTags)
			.where(eq(schema.contactTags.userId, userId))
			.returning();
		deletedCounts.push({ entity: 'tags', count: deletedTags.length, label: 'Tags' });
		totalDeleted += deletedTags.length;

		// Delete contacts
		const deletedContacts = await this.db
			.delete(schema.contacts)
			.where(eq(schema.contacts.userId, userId))
			.returning();
		deletedCounts.push({ entity: 'contacts', count: deletedContacts.length, label: 'Contacts' });
		totalDeleted += deletedContacts.length;

		// Delete connected accounts
		const deletedConnectedAccounts = await this.db
			.delete(schema.connectedAccounts)
			.where(eq(schema.connectedAccounts.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'connected_accounts',
			count: deletedConnectedAccounts.length,
			label: 'Connected Accounts',
		});
		totalDeleted += deletedConnectedAccounts.length;

		this.logger.log(`Deleted ${totalDeleted} records for userId: ${userId}`);

		return { success: true, deletedCounts, totalDeleted };
	}
}
