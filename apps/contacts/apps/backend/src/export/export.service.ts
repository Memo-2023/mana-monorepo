import { Injectable, Inject } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { contacts, type Contact } from '../db/schema';
import { contactToGroups, contactToTags } from '../db/schema';
import { ExportRequestDto, ExportFormat } from './dto/export.dto';
import { generateVCardFile } from './generators/vcard.generator';
import { generateCsvFile } from './generators/csv.generator';

export interface ExportResult {
	data: string;
	filename: string;
	mimeType: string;
	contactCount: number;
}

@Injectable()
export class ExportService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	/**
	 * Export contacts based on the request options
	 */
	async exportContacts(userId: string, options: ExportRequestDto): Promise<ExportResult> {
		// Get contacts based on filters
		const contactList = await this.getContactsForExport(userId, options);

		// Generate export data
		const { data, mimeType, extension } = this.generateExportData(contactList, options.format);

		// Generate filename
		const timestamp = new Date().toISOString().slice(0, 10);
		const filename = `contacts-${timestamp}.${extension}`;

		return {
			data,
			filename,
			mimeType,
			contactCount: contactList.length,
		};
	}

	/**
	 * Get contacts based on export options
	 */
	private async getContactsForExport(
		userId: string,
		options: ExportRequestDto
	): Promise<Contact[]> {
		const { contactIds, groupId, tagId, includeFavorites, includeArchived = false } = options;

		// If specific contact IDs are provided, fetch those
		if (contactIds && contactIds.length > 0) {
			return this.db
				.select()
				.from(contacts)
				.where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIds)));
		}

		// If a group is specified, get contacts in that group
		if (groupId) {
			const groupContacts = await this.db
				.select({ contactId: contactToGroups.contactId })
				.from(contactToGroups)
				.where(eq(contactToGroups.groupId, groupId));

			const contactIdsInGroup = groupContacts.map((gc) => gc.contactId);

			if (contactIdsInGroup.length === 0) {
				return [];
			}

			return this.db
				.select()
				.from(contacts)
				.where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIdsInGroup)));
		}

		// If a tag is specified, get contacts with that tag
		if (tagId) {
			const taggedContacts = await this.db
				.select({ contactId: contactToTags.contactId })
				.from(contactToTags)
				.where(eq(contactToTags.tagId, tagId));

			const contactIdsWithTag = taggedContacts.map((tc) => tc.contactId);

			if (contactIdsWithTag.length === 0) {
				return [];
			}

			return this.db
				.select()
				.from(contacts)
				.where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIdsWithTag)));
		}

		// Default: get all contacts with optional filters
		let conditions = [eq(contacts.userId, userId)];

		if (!includeArchived) {
			conditions.push(eq(contacts.isArchived, false));
		}

		if (includeFavorites !== undefined) {
			conditions.push(eq(contacts.isFavorite, includeFavorites));
		}

		return this.db
			.select()
			.from(contacts)
			.where(and(...conditions));
	}

	/**
	 * Generate export data in the specified format
	 */
	private generateExportData(
		contactList: Contact[],
		format: ExportFormat
	): { data: string; mimeType: string; extension: string } {
		switch (format) {
			case 'vcard':
				return {
					data: generateVCardFile(contactList),
					mimeType: 'text/vcard',
					extension: 'vcf',
				};
			case 'csv':
				return {
					data: generateCsvFile(contactList),
					mimeType: 'text/csv',
					extension: 'csv',
				};
			default:
				throw new Error(`Unsupported export format: ${format}`);
		}
	}
}
