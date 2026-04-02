/**
 * Spiral DB Store for Contacts
 * Manages SpiralDB state for visual contact storage
 */

import {
	SpiralDB,
	createContactSchema,
	type SpiralImage,
	type SpiralRecord,
	exportToPngBytes,
	importFromPngBytes,
	downloadPng,
} from '@manacore/spiral-db';

interface ContactData extends Record<string, unknown> {
	id: number;
	status: number;
	hasEmail: boolean;
	hasPhone: boolean;
	createdAt: Date;
	name: string;
	company: string | null;
	city: string | null;
}

interface SpiralStats {
	imageSize: number;
	totalPixels: number;
	usedPixels: number;
	totalRecords: number;
	activeRecords: number;
	deletedRecords: number;
	currentRing: number;
	compressionRatio: number;
}

class SpiralStore {
	private db: SpiralDB<ContactData>;

	image = $state<SpiralImage | null>(null);
	stats = $state<SpiralStats | null>(null);
	records = $state<SpiralRecord<ContactData>[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);

	constructor() {
		this.db = new SpiralDB<ContactData>({
			schema: createContactSchema(),
			compression: true,
		});
		this.updateState();
	}

	private updateState() {
		this.image = this.db.getImage();
		this.records = this.db.getAll();

		const dbStats = this.db.getStats();
		const jsonSize = JSON.stringify(this.records.map((r) => r.data)).length || 1;
		const pixelBytes = Math.ceil((dbStats.usedPixels * 3) / 8);

		this.stats = {
			...dbStats,
			compressionRatio: Math.round((1 - pixelBytes / jsonSize) * 100),
		};
	}

	/**
	 * Import contacts from the contacts store
	 */
	importContacts(
		contacts: Array<{
			firstName?: string | null;
			lastName?: string | null;
			displayName?: string | null;
			email?: string | null;
			phone?: string | null;
			mobile?: string | null;
			company?: string | null;
			city?: string | null;
			isFavorite?: boolean;
			isArchived?: boolean;
			createdAt?: string | Date;
		}>
	) {
		this.db = new SpiralDB<ContactData>({
			schema: createContactSchema(),
			compression: true,
		});

		for (const contact of contacts) {
			const name =
				contact.displayName ||
				[contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
				'Unnamed';

			const status = contact.isFavorite ? 2 : contact.isArchived ? 4 : 0;

			const result = this.db.insert({
				id: 0,
				status,
				hasEmail: Boolean(contact.email),
				hasPhone: Boolean(contact.phone || contact.mobile),
				createdAt: contact.createdAt ? new Date(contact.createdAt) : new Date(),
				name: name.slice(0, 100),
				company: contact.company?.slice(0, 100) ?? null,
				city: contact.city?.slice(0, 50) ?? null,
			});

			if (result.success && contact.isFavorite) {
				this.db.complete(result.recordId!);
			}
		}

		this.updateState();
	}

	addContact(contact: {
		name: string;
		email?: string;
		phone?: string;
		company?: string;
		city?: string;
		isFavorite?: boolean;
	}) {
		const result = this.db.insert({
			id: 0,
			status: contact.isFavorite ? 2 : 0,
			hasEmail: Boolean(contact.email),
			hasPhone: Boolean(contact.phone),
			createdAt: new Date(),
			name: contact.name.slice(0, 100),
			company: contact.company?.slice(0, 100) ?? null,
			city: contact.city?.slice(0, 50) ?? null,
		});

		if (result.success) {
			this.updateState();
		}
		return result;
	}

	removeContact(id: number) {
		const result = this.db.delete(id);
		if (result.success) {
			this.updateState();
		}
		return result;
	}

	favoriteContact(id: number) {
		const result = this.db.complete(id);
		if (result.success) {
			this.updateState();
		}
		return result;
	}

	downloadPng(filename = 'spiral-contacts.png') {
		if (this.image) {
			downloadPng(this.image, filename);
		}
	}

	getPngBytes(): Uint8Array | null {
		if (!this.image) return null;
		return exportToPngBytes(this.image);
	}

	clear() {
		this.db = new SpiralDB<ContactData>({
			schema: createContactSchema(),
			compression: true,
		});
		this.updateState();
	}

	async importFromPng(file: File): Promise<{ success: boolean; error?: string }> {
		try {
			this.isLoading = true;
			this.error = null;

			const buffer = await file.arrayBuffer();
			const bytes = new Uint8Array(buffer);
			const image = await importFromPngBytes(bytes);

			this.db = SpiralDB.fromImage<ContactData>(image, createContactSchema());
			this.updateState();

			return { success: true };
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			this.error = errorMessage;
			return { success: false, error: errorMessage };
		} finally {
			this.isLoading = false;
		}
	}
}

export const spiralStore = new SpiralStore();
