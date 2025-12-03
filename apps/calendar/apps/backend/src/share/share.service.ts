import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, or } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import {
	calendarShares,
	type CalendarShare,
	type NewCalendarShare,
} from '../db/schema/calendar-shares.schema';
import { CalendarService } from '../calendar/calendar.service';
import { CreateShareDto, UpdateShareDto } from './dto';

@Injectable()
export class ShareService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private calendarService: CalendarService
	) {}

	async findByCalendar(calendarId: string, userId: string): Promise<CalendarShare[]> {
		// Verify user owns the calendar
		await this.calendarService.findByIdOrThrow(calendarId, userId);

		return this.db.select().from(calendarShares).where(eq(calendarShares.calendarId, calendarId));
	}

	async findById(id: string): Promise<CalendarShare | null> {
		const result = await this.db.select().from(calendarShares).where(eq(calendarShares.id, id));
		return result[0] || null;
	}

	async findPendingInvitations(userId: string, email: string): Promise<CalendarShare[]> {
		return this.db
			.select()
			.from(calendarShares)
			.where(
				and(
					eq(calendarShares.status, 'pending'),
					or(eq(calendarShares.sharedWithUserId, userId), eq(calendarShares.sharedWithEmail, email))
				)
			);
	}

	async create(userId: string, dto: CreateShareDto): Promise<CalendarShare> {
		// Verify user owns the calendar
		await this.calendarService.findByIdOrThrow(dto.calendarId, userId);

		const newShare: NewCalendarShare = {
			calendarId: dto.calendarId,
			permission: dto.permission,
			invitedBy: userId,
			status: 'pending',
		};

		if (dto.createLink) {
			// Create a shareable link
			const token = randomBytes(32).toString('hex');
			newShare.shareToken = token;
			newShare.shareUrl = `/share/${token}`;
		} else if (dto.email) {
			// Share with specific email
			newShare.sharedWithEmail = dto.email;
		}

		if (dto.expiresAt) {
			newShare.expiresAt = new Date(dto.expiresAt);
		}

		const [created] = await this.db.insert(calendarShares).values(newShare).returning();
		return created;
	}

	async update(id: string, userId: string, dto: UpdateShareDto): Promise<CalendarShare> {
		const share = await this.findById(id);
		if (!share) {
			throw new NotFoundException(`Share with id ${id} not found`);
		}

		// Verify user owns the calendar
		await this.calendarService.findByIdOrThrow(share.calendarId, userId);

		const [updated] = await this.db
			.update(calendarShares)
			.set({
				permission: dto.permission,
				expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
				updatedAt: new Date(),
			})
			.where(eq(calendarShares.id, id))
			.returning();

		return updated;
	}

	async delete(id: string, userId: string): Promise<void> {
		const share = await this.findById(id);
		if (!share) {
			throw new NotFoundException(`Share with id ${id} not found`);
		}

		// Verify user owns the calendar
		await this.calendarService.findByIdOrThrow(share.calendarId, userId);

		await this.db.delete(calendarShares).where(eq(calendarShares.id, id));
	}

	async acceptInvitation(shareId: string, userId: string): Promise<CalendarShare> {
		const share = await this.findById(shareId);
		if (!share) {
			throw new NotFoundException(`Invitation not found`);
		}

		if (share.status !== 'pending') {
			throw new ForbiddenException('Invitation has already been processed');
		}

		const [updated] = await this.db
			.update(calendarShares)
			.set({
				status: 'accepted',
				sharedWithUserId: userId,
				acceptedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(calendarShares.id, shareId))
			.returning();

		return updated;
	}

	async declineInvitation(shareId: string, userId: string): Promise<CalendarShare> {
		const share = await this.findById(shareId);
		if (!share) {
			throw new NotFoundException(`Invitation not found`);
		}

		if (share.status !== 'pending') {
			throw new ForbiddenException('Invitation has already been processed');
		}

		const [updated] = await this.db
			.update(calendarShares)
			.set({
				status: 'declined',
				sharedWithUserId: userId,
				updatedAt: new Date(),
			})
			.where(eq(calendarShares.id, shareId))
			.returning();

		return updated;
	}

	async findByShareToken(token: string): Promise<CalendarShare | null> {
		const result = await this.db
			.select()
			.from(calendarShares)
			.where(eq(calendarShares.shareToken, token));
		return result[0] || null;
	}

	async getSharedCalendarsForUser(userId: string): Promise<CalendarShare[]> {
		return this.db
			.select()
			.from(calendarShares)
			.where(
				and(eq(calendarShares.sharedWithUserId, userId), eq(calendarShares.status, 'accepted'))
			);
	}
}
