import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { contactNotes, type ContactNote, type NewContactNote } from '../db/schema';

@Injectable()
export class NoteService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByContactId(contactId: string, userId: string): Promise<ContactNote[]> {
		return this.db
			.select()
			.from(contactNotes)
			.where(and(eq(contactNotes.contactId, contactId), eq(contactNotes.userId, userId)))
			.orderBy(desc(contactNotes.isPinned), desc(contactNotes.createdAt));
	}

	async findById(id: string, userId: string): Promise<ContactNote | null> {
		const [note] = await this.db
			.select()
			.from(contactNotes)
			.where(and(eq(contactNotes.id, id), eq(contactNotes.userId, userId)));
		return note || null;
	}

	async create(data: NewContactNote): Promise<ContactNote> {
		const [note] = await this.db.insert(contactNotes).values(data).returning();
		return note;
	}

	async update(id: string, userId: string, data: Partial<NewContactNote>): Promise<ContactNote> {
		const [note] = await this.db
			.update(contactNotes)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(contactNotes.id, id), eq(contactNotes.userId, userId)))
			.returning();

		if (!note) {
			throw new NotFoundException('Note not found');
		}

		return note;
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.db
			.delete(contactNotes)
			.where(and(eq(contactNotes.id, id), eq(contactNotes.userId, userId)));
	}

	async togglePin(id: string, userId: string): Promise<ContactNote> {
		const note = await this.findById(id, userId);
		if (!note) {
			throw new NotFoundException('Note not found');
		}

		return this.update(id, userId, { isPinned: !note.isPinned });
	}
}
