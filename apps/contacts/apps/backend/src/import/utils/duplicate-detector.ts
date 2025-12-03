import { Contact } from '../../db/schema';
import { DuplicateInfo, ParsedContactDto } from '../dto/import.dto';

export class DuplicateDetector {
	/**
	 * Detect duplicates between imported contacts and existing contacts
	 */
	detectDuplicates(
		importedContacts: ParsedContactDto[],
		existingContacts: Contact[]
	): DuplicateInfo[] {
		const duplicates: DuplicateInfo[] = [];

		// Build lookup maps for faster matching
		const emailMap = new Map<string, Contact>();
		const phoneMap = new Map<string, Contact>();

		for (const contact of existingContacts) {
			if (contact.email) {
				emailMap.set(this.normalizeEmail(contact.email), contact);
			}
			if (contact.phone) {
				phoneMap.set(this.normalizePhone(contact.phone), contact);
			}
			if (contact.mobile) {
				phoneMap.set(this.normalizePhone(contact.mobile), contact);
			}
		}

		// Check each imported contact for duplicates
		for (let i = 0; i < importedContacts.length; i++) {
			const imported = importedContacts[i];

			// Check email first (primary match)
			if (imported.email) {
				const normalizedEmail = this.normalizeEmail(imported.email);
				const existingByEmail = emailMap.get(normalizedEmail);

				if (existingByEmail) {
					duplicates.push({
						importIndex: i,
						existingContactId: existingByEmail.id,
						existingContactName: this.getContactName(existingByEmail),
						matchField: 'email',
						matchValue: imported.email,
					});
					continue; // Skip phone check if email matches
				}
			}

			// Check phone (secondary match)
			const phonesToCheck = [imported.phone, imported.mobile].filter(Boolean) as string[];

			for (const phone of phonesToCheck) {
				const normalizedPhone = this.normalizePhone(phone);
				const existingByPhone = phoneMap.get(normalizedPhone);

				if (existingByPhone) {
					duplicates.push({
						importIndex: i,
						existingContactId: existingByPhone.id,
						existingContactName: this.getContactName(existingByPhone),
						matchField: 'phone',
						matchValue: phone,
					});
					break; // Only report first phone match
				}
			}
		}

		return duplicates;
	}

	/**
	 * Normalize email for comparison
	 */
	private normalizeEmail(email: string): string {
		return email.toLowerCase().trim();
	}

	/**
	 * Normalize phone number for comparison
	 * Removes all non-digit characters except leading +
	 */
	private normalizePhone(phone: string): string {
		const hasPlus = phone.startsWith('+');
		const digits = phone.replace(/\D/g, '');
		return hasPlus ? '+' + digits : digits;
	}

	/**
	 * Get display name for a contact
	 */
	private getContactName(contact: Contact): string {
		if (contact.displayName) return contact.displayName;
		if (contact.firstName || contact.lastName) {
			return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
		}
		if (contact.email) return contact.email;
		return 'Unknown';
	}

	/**
	 * Merge imported data with existing contact
	 * Only fills in missing fields from the imported data
	 */
	mergeContacts(existing: Contact, imported: ParsedContactDto): Partial<Contact> {
		const updates: Partial<Contact> = {};

		// Only update fields that are empty in existing contact
		if (!existing.firstName && imported.firstName) updates.firstName = imported.firstName;
		if (!existing.lastName && imported.lastName) updates.lastName = imported.lastName;
		if (!existing.displayName && imported.displayName) updates.displayName = imported.displayName;
		if (!existing.nickname && imported.nickname) updates.nickname = imported.nickname;
		if (!existing.email && imported.email) updates.email = imported.email;
		if (!existing.phone && imported.phone) updates.phone = imported.phone;
		if (!existing.mobile && imported.mobile) updates.mobile = imported.mobile;
		if (!existing.street && imported.street) updates.street = imported.street;
		if (!existing.city && imported.city) updates.city = imported.city;
		if (!existing.postalCode && imported.postalCode) updates.postalCode = imported.postalCode;
		if (!existing.country && imported.country) updates.country = imported.country;
		if (!existing.company && imported.company) updates.company = imported.company;
		if (!existing.jobTitle && imported.jobTitle) updates.jobTitle = imported.jobTitle;
		if (!existing.department && imported.department) updates.department = imported.department;
		if (!existing.website && imported.website) updates.website = imported.website;
		if (!existing.birthday && imported.birthday) updates.birthday = imported.birthday;
		if (!existing.notes && imported.notes) updates.notes = imported.notes;
		if (!existing.photoUrl && imported.photoUrl) updates.photoUrl = imported.photoUrl;

		return updates;
	}
}
