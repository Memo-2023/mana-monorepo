import { Injectable, Inject, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, or } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import {
	calendarShares,
	type CalendarShare,
	type NewCalendarShare,
} from '../db/schema/calendar-shares.schema';
import { CalendarService } from '../calendar/calendar.service';
import { EmailService } from '../email/email.service';
import { CreateShareDto, UpdateShareDto } from './dto';

@Injectable()
export class ShareService {
	private readonly logger = new Logger(ShareService.name);

	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private calendarService: CalendarService,
		private emailService: EmailService,
		private configService: ConfigService
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

	async create(userId: string, inviterEmail: string, dto: CreateShareDto): Promise<CalendarShare> {
		// Verify user owns the calendar
		const calendar = await this.calendarService.findByIdOrThrow(dto.calendarId, userId);

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

		// Send invitation email if sharing with specific email
		if (dto.email && !dto.createLink) {
			const inviterName = inviterEmail.split('@')[0];
			const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5179');
			const acceptUrl = `${baseUrl}/shares/${created.id}/accept`;

			try {
				await this.emailService.sendCalendarInvitationEmail(
					dto.email,
					calendar.name,
					inviterName,
					dto.permission,
					acceptUrl
				);
				this.logger.log(`Invitation email sent to ${dto.email} for calendar ${calendar.name}`);
			} catch (error) {
				this.logger.error(`Failed to send invitation email to ${dto.email}:`, error);
				// Don't fail the share creation if email fails
			}
		}

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

	async acceptInvitation(shareId: string, userId: string, email: string): Promise<CalendarShare> {
		const share = await this.findById(shareId);
		if (!share) {
			throw new NotFoundException(`Invitation not found`);
		}

		if (share.status !== 'pending') {
			throw new ForbiddenException('Invitation has already been processed');
		}

		// Validate that the accepting user matches the invitation target
		const matchesUserId = share.sharedWithUserId && share.sharedWithUserId === userId;
		const matchesEmail = share.sharedWithEmail && share.sharedWithEmail === email;
		if (share.sharedWithUserId || share.sharedWithEmail) {
			if (!matchesUserId && !matchesEmail) {
				throw new ForbiddenException('You are not the intended recipient of this invitation');
			}
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
