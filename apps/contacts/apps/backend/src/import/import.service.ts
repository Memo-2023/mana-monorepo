import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { contacts, type Contact, type NewContact } from '../db/schema';
import { VCardParser } from './parsers/vcard.parser';
import { CsvParser, CsvFieldMapping } from './parsers/csv.parser';
import { DuplicateDetector } from './utils/duplicate-detector';
import {
	ParsedContactDto,
	ImportPreviewResponseDto,
	ExecuteImportDto,
	ImportResultDto,
	ImportErrorDto,
	DuplicateInfo,
} from './dto/import.dto';

@Injectable()
export class ImportService {
	private vcardParser = new VCardParser();
	private csvParser = new CsvParser();
	private duplicateDetector = new DuplicateDetector();

	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	/**
	 * Preview import from uploaded file
	 */
	async preview(
		userId: string,
		file: Express.Multer.File
	): Promise<ImportPreviewResponseDto & { fieldMapping?: CsvFieldMapping[] }> {
		const content = file.buffer.toString('utf-8');
		const extension = this.getFileExtension(file.originalname);

		let parsedContacts: ParsedContactDto[] = [];
		let parseErrors: string[] = [];
		let fieldMapping: CsvFieldMapping[] | undefined;

		// Parse based on file type
		if (extension === 'vcf' || extension === 'vcard') {
			const result = this.vcardParser.parse(content);
			parsedContacts = result.contacts;
			parseErrors = result.errors;
		} else if (extension === 'csv') {
			const result = this.csvParser.parse(content);
			parsedContacts = result.contacts;
			parseErrors = result.errors;
			fieldMapping = result.fieldMapping;
		} else {
			throw new BadRequestException(
				`Unsupported file type: .${extension}. Use .vcf or .csv files.`
			);
		}

		// Validate contacts
		const { valid, invalid } = this.validateContacts(parsedContacts);

		// Fetch existing contacts for duplicate detection
		const existingContacts = await this.db
			.select()
			.from(contacts)
			.where(eq(contacts.userId, userId));

		// Detect duplicates
		const duplicates = this.duplicateDetector.detectDuplicates(valid, existingContacts);

		return {
			contacts: valid,
			duplicates,
			totalParsed: parsedContacts.length,
			validCount: valid.length,
			invalidCount: invalid.length,
			errors: parseErrors,
			fieldMapping,
		};
	}

	/**
	 * Execute the import with the selected options
	 */
	async execute(userId: string, dto: ExecuteImportDto): Promise<ImportResultDto> {
		const result: ImportResultDto = {
			imported: 0,
			skipped: 0,
			merged: 0,
			errors: [],
		};

		// Build skip set for fast lookup
		const skipSet = new Set(dto.skipIndices || []);

		// Fetch existing contacts for merge operations
		let existingContactsMap = new Map<string, Contact>();
		if (dto.duplicateAction === 'merge') {
			const existingContacts = await this.db
				.select()
				.from(contacts)
				.where(eq(contacts.userId, userId));

			const duplicates = this.duplicateDetector.detectDuplicates(dto.contacts, existingContacts);

			for (const dup of duplicates) {
				const existing = existingContacts.find((c) => c.id === dup.existingContactId);
				if (existing) {
					existingContactsMap.set(dup.importIndex.toString(), existing);
				}
			}
		}

		// Process each contact
		for (let i = 0; i < dto.contacts.length; i++) {
			if (skipSet.has(i)) {
				result.skipped++;
				continue;
			}

			const contact = dto.contacts[i];

			try {
				// Check if this is a duplicate that needs handling
				const existingContact = existingContactsMap.get(i.toString());

				if (existingContact && dto.duplicateAction === 'merge') {
					// Merge: Update existing contact with new data
					const updates = this.duplicateDetector.mergeContacts(existingContact, contact);

					if (Object.keys(updates).length > 0) {
						await this.db
							.update(contacts)
							.set({ ...updates, updatedAt: new Date() })
							.where(eq(contacts.id, existingContact.id));
					}

					result.merged++;
				} else if (existingContact && dto.duplicateAction === 'skip') {
					// Skip: Don't import
					result.skipped++;
				} else {
					// Create new contact
					const newContact: NewContact = {
						userId,
						createdBy: userId,
						firstName: contact.firstName,
						lastName: contact.lastName,
						displayName: contact.displayName,
						nickname: contact.nickname,
						email: contact.email,
						phone: contact.phone,
						mobile: contact.mobile,
						street: contact.street,
						city: contact.city,
						postalCode: contact.postalCode,
						country: contact.country,
						company: contact.company,
						jobTitle: contact.jobTitle,
						department: contact.department,
						website: contact.website,
						birthday: contact.birthday,
						notes: contact.notes,
						photoUrl: contact.photoUrl,
					};

					await this.db.insert(contacts).values(newContact);
					result.imported++;
				}
			} catch (error) {
				result.errors.push({
					index: i,
					contactName: this.getContactName(contact),
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}

		return result;
	}

	/**
	 * Generate CSV template
	 */
	getCsvTemplate(): string {
		return CsvParser.generateTemplate();
	}

	/**
	 * Get file extension from filename
	 */
	private getFileExtension(filename: string): string {
		const parts = filename.toLowerCase().split('.');
		return parts[parts.length - 1];
	}

	/**
	 * Validate contacts - separate valid from invalid
	 */
	private validateContacts(parsedContacts: ParsedContactDto[]): {
		valid: ParsedContactDto[];
		invalid: ParsedContactDto[];
	} {
		const valid: ParsedContactDto[] = [];
		const invalid: ParsedContactDto[] = [];

		for (const contact of parsedContacts) {
			// A contact is valid if it has at least a name or email
			if (contact.firstName || contact.lastName || contact.email || contact.displayName) {
				valid.push(contact);
			} else {
				invalid.push(contact);
			}
		}

		return { valid, invalid };
	}

	/**
	 * Get display name for a contact
	 */
	private getContactName(contact: ParsedContactDto): string {
		if (contact.displayName) return contact.displayName;
		if (contact.firstName || contact.lastName) {
			return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
		}
		if (contact.email) return contact.email;
		return 'Unknown';
	}
}
