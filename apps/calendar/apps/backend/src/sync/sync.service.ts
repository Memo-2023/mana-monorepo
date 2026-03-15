import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and, lte, isNull, or } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { externalCalendars, ExternalCalendar, events, calendars } from '../db/schema';
import { ICalService, ParsedEvent } from './ical.service';
import { CalDavService } from './caldav.service';
import { GoogleCalendarService } from './google-calendar.service';
import { ConnectCalendarDto, UpdateExternalCalendarDto, DiscoverCalDavDto } from './dto';
import { EncryptionService } from '../common/encryption.service';

interface SyncResult {
	success: boolean;
	eventsImported: number;
	eventsExported: number;
	errors: string[];
}

@Injectable()
export class SyncService {
	private readonly logger = new Logger(SyncService.name);

	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: Database,
		private readonly icalService: ICalService,
		private readonly caldavService: CalDavService,
		private readonly googleCalendarService: GoogleCalendarService,
		private readonly encryptionService: EncryptionService
	) {}

	/**
	 * Connect an external calendar
	 */
	async connect(userId: string, dto: ConnectCalendarDto): Promise<ExternalCalendar> {
		// Validate connection based on provider
		if (dto.provider === 'caldav' || dto.provider === 'apple') {
			if (!dto.username || !dto.password) {
				throw new BadRequestException('CalDAV requires username and password');
			}
			// Test connection
			await this.caldavService.discoverCalendars(
				dto.provider === 'apple' ? this.caldavService.getAppleCalDavUrl() : dto.calendarUrl,
				dto.username,
				dto.password
			);
		} else if (dto.provider === 'google') {
			if (!dto.accessToken) {
				throw new BadRequestException('Google Calendar requires OAuth tokens');
			}
		} else if (dto.provider === 'ical_url') {
			// Test that we can fetch the URL
			await this.icalService.fetchAndParseICalUrl(dto.calendarUrl);
		}

		const [externalCalendar] = await this.db
			.insert(externalCalendars)
			.values({
				userId,
				name: dto.name,
				provider: dto.provider,
				calendarUrl: dto.calendarUrl,
				username: dto.username,
				encryptedPassword: dto.password ? this.encryptionService.encrypt(dto.password) : null,
				accessToken: dto.accessToken,
				refreshToken: dto.refreshToken,
				tokenExpiresAt: dto.accessToken ? new Date(Date.now() + 3600 * 1000) : null,
				syncDirection: dto.syncDirection || 'both',
				syncInterval: dto.syncInterval || 15,
				color: dto.color || '#6B7280',
			})
			.returning();

		// Trigger initial sync
		this.syncCalendar(externalCalendar.id).catch((err) => {
			this.logger.error(`Initial sync failed for ${externalCalendar.id}: ${err}`);
		});

		return externalCalendar;
	}

	/**
	 * Disconnect an external calendar
	 */
	async disconnect(id: string, userId: string): Promise<void> {
		const [externalCalendar] = await this.db
			.select()
			.from(externalCalendars)
			.where(and(eq(externalCalendars.id, id), eq(externalCalendars.userId, userId)));

		if (!externalCalendar) {
			throw new NotFoundException('External calendar not found');
		}

		// Delete synced events first
		await this.db.delete(events).where(eq(events.externalCalendarId, id));

		// Delete the external calendar
		await this.db.delete(externalCalendars).where(eq(externalCalendars.id, id));
	}

	/**
	 * Update external calendar settings
	 */
	async update(
		id: string,
		userId: string,
		dto: UpdateExternalCalendarDto
	): Promise<ExternalCalendar> {
		const [existing] = await this.db
			.select()
			.from(externalCalendars)
			.where(and(eq(externalCalendars.id, id), eq(externalCalendars.userId, userId)));

		if (!existing) {
			throw new NotFoundException('External calendar not found');
		}

		const [updated] = await this.db
			.update(externalCalendars)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(eq(externalCalendars.id, id))
			.returning();

		return updated;
	}

	/**
	 * Get all external calendars for a user
	 */
	async findByUser(userId: string): Promise<ExternalCalendar[]> {
		return this.db.select().from(externalCalendars).where(eq(externalCalendars.userId, userId));
	}

	/**
	 * Get single external calendar
	 */
	async findOne(id: string, userId: string): Promise<ExternalCalendar> {
		const [externalCalendar] = await this.db
			.select()
			.from(externalCalendars)
			.where(and(eq(externalCalendars.id, id), eq(externalCalendars.userId, userId)));

		if (!externalCalendar) {
			throw new NotFoundException('External calendar not found');
		}

		return externalCalendar;
	}

	/**
	 * Discover CalDAV calendars
	 */
	async discoverCalDav(dto: DiscoverCalDavDto) {
		const discovered = await this.caldavService.discoverCalendars(
			dto.serverUrl,
			dto.username,
			dto.password
		);

		return {
			calendars: discovered.map((cal) => ({
				url: cal.url,
				name: cal.displayName,
				color: cal.color,
				description: cal.description,
			})),
		};
	}

	/**
	 * Get Google OAuth URL
	 */
	getGoogleAuthUrl(state?: string): string {
		if (!this.googleCalendarService.isConfigured()) {
			throw new BadRequestException('Google Calendar is not configured');
		}
		return this.googleCalendarService.getAuthUrl(state);
	}

	/**
	 * Handle Google OAuth callback
	 */
	async handleGoogleCallback(code: string, userId: string) {
		const tokens = await this.googleCalendarService.exchangeCodeForTokens(code);

		// List available calendars
		const calendarList = await this.googleCalendarService.listCalendars(tokens.access_token);

		return {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			expiresIn: tokens.expires_in,
			calendars: calendarList.map((cal) => ({
				id: cal.id,
				name: cal.summary,
				description: cal.description,
				color: cal.backgroundColor,
				primary: cal.primary,
			})),
		};
	}

	/**
	 * Sync a specific external calendar
	 */
	async syncCalendar(externalCalendarId: string): Promise<SyncResult> {
		const [externalCalendar] = await this.db
			.select()
			.from(externalCalendars)
			.where(eq(externalCalendars.id, externalCalendarId));

		if (!externalCalendar) {
			throw new NotFoundException('External calendar not found');
		}

		if (!externalCalendar.syncEnabled) {
			return { success: true, eventsImported: 0, eventsExported: 0, errors: ['Sync is disabled'] };
		}

		const result: SyncResult = {
			success: true,
			eventsImported: 0,
			eventsExported: 0,
			errors: [],
		};

		try {
			// Import events
			if (
				externalCalendar.syncDirection === 'import' ||
				externalCalendar.syncDirection === 'both'
			) {
				const imported = await this.importEvents(externalCalendar);
				result.eventsImported = imported;
			}

			// Export events
			if (
				externalCalendar.syncDirection === 'export' ||
				externalCalendar.syncDirection === 'both'
			) {
				const exported = await this.exportEvents(externalCalendar);
				result.eventsExported = exported;
			}

			// Update last sync time
			await this.db
				.update(externalCalendars)
				.set({
					lastSyncAt: new Date(),
					lastSyncError: null,
					updatedAt: new Date(),
				})
				.where(eq(externalCalendars.id, externalCalendarId));
		} catch (error) {
			result.success = false;
			result.errors.push(error instanceof Error ? error.message : 'Unknown error');

			// Update error status
			await this.db
				.update(externalCalendars)
				.set({
					lastSyncError: error instanceof Error ? error.message : 'Unknown error',
					updatedAt: new Date(),
				})
				.where(eq(externalCalendars.id, externalCalendarId));
		}

		return result;
	}

	/**
	 * Import events from external calendar
	 */
	private async importEvents(externalCalendar: ExternalCalendar): Promise<number> {
		let parsedEvents: ParsedEvent[] = [];

		// Calculate time range (sync last 30 days to next 365 days)
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 30);
		const endDate = new Date();
		endDate.setFullYear(endDate.getFullYear() + 1);

		switch (externalCalendar.provider) {
			case 'ical_url':
				parsedEvents = await this.icalService.fetchAndParseICalUrl(externalCalendar.calendarUrl);
				break;

			case 'caldav':
			case 'apple': {
				const serverUrl =
					externalCalendar.provider === 'apple'
						? this.caldavService.getAppleCalDavUrl()
						: new URL(externalCalendar.calendarUrl).origin;

				const result = await this.caldavService.fetchEvents(
					serverUrl,
					externalCalendar.calendarUrl,
					externalCalendar.username || '',
					externalCalendar.encryptedPassword
						? this.encryptionService.decrypt(externalCalendar.encryptedPassword)
						: '',
					startDate,
					endDate
				);
				parsedEvents = result.events;

				// Store ctag for change detection
				if (result.ctag) {
					await this.db
						.update(externalCalendars)
						.set({
							providerData: {
								...externalCalendar.providerData,
								caldavCtag: result.ctag,
							},
						})
						.where(eq(externalCalendars.id, externalCalendar.id));
				}
				break;
			}

			case 'google': {
				// Refresh token if needed
				let accessToken = externalCalendar.accessToken;
				if (
					externalCalendar.tokenExpiresAt &&
					new Date(externalCalendar.tokenExpiresAt) < new Date()
				) {
					if (!externalCalendar.refreshToken) {
						throw new Error('Token expired and no refresh token available');
					}
					const tokens = await this.googleCalendarService.refreshAccessToken(
						externalCalendar.refreshToken
					);
					accessToken = tokens.access_token;

					await this.db
						.update(externalCalendars)
						.set({
							accessToken: tokens.access_token,
							tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
						})
						.where(eq(externalCalendars.id, externalCalendar.id));
				}

				const googleCalendarId = externalCalendar.providerData?.googleCalendarId || 'primary';
				parsedEvents = await this.googleCalendarService.fetchEvents(
					accessToken!,
					googleCalendarId,
					startDate,
					endDate
				);
				break;
			}
		}

		// Get or create a local calendar for imported events
		let [localCalendar] = await this.db
			.select()
			.from(calendars)
			.where(
				and(
					eq(calendars.userId, externalCalendar.userId),
					eq(calendars.name, `${externalCalendar.name} (Sync)`)
				)
			);

		if (!localCalendar) {
			[localCalendar] = await this.db
				.insert(calendars)
				.values({
					userId: externalCalendar.userId,
					name: `${externalCalendar.name} (Sync)`,
					color: externalCalendar.color || '#6B7280',
					isDefault: false,
				})
				.returning();
		}

		// Upsert events
		let importedCount = 0;
		for (const parsedEvent of parsedEvents) {
			try {
				// Check if event already exists
				const [existingEvent] = await this.db
					.select()
					.from(events)
					.where(
						and(
							eq(events.externalId, parsedEvent.uid),
							eq(events.externalCalendarId, externalCalendar.id)
						)
					);

				if (existingEvent) {
					// Update existing event
					await this.db
						.update(events)
						.set({
							title: parsedEvent.summary,
							description: parsedEvent.description,
							location: parsedEvent.location,
							startTime: parsedEvent.dtstart,
							endTime: parsedEvent.dtend,
							isAllDay: parsedEvent.isAllDay,
							recurrenceRule: parsedEvent.rrule,
							status: parsedEvent.status,
							lastSyncedAt: new Date(),
							updatedAt: new Date(),
						})
						.where(eq(events.id, existingEvent.id));
				} else {
					// Create new event
					await this.db.insert(events).values({
						calendarId: localCalendar.id,
						userId: externalCalendar.userId,
						title: parsedEvent.summary,
						description: parsedEvent.description,
						location: parsedEvent.location,
						startTime: parsedEvent.dtstart,
						endTime: parsedEvent.dtend,
						isAllDay: parsedEvent.isAllDay,
						recurrenceRule: parsedEvent.rrule,
						status: parsedEvent.status,
						externalId: parsedEvent.uid,
						externalCalendarId: externalCalendar.id,
						lastSyncedAt: new Date(),
						metadata: parsedEvent.attendees
							? {
									attendees: parsedEvent.attendees.map((a) => ({
										email: a.email,
										name: a.name,
										status:
											(a.status as 'accepted' | 'declined' | 'tentative' | 'pending') || undefined,
									})),
								}
							: undefined,
					});
					importedCount++;
				}
			} catch (error) {
				this.logger.warn(`Failed to import event ${parsedEvent.uid}: ${error}`);
			}
		}

		return importedCount;
	}

	/**
	 * Export events to external calendar
	 */
	private async exportEvents(externalCalendar: ExternalCalendar): Promise<number> {
		// Only CalDAV and Google support export
		if (externalCalendar.provider === 'ical_url') {
			return 0; // iCal URLs are read-only
		}

		// Get local events that haven't been synced yet
		const [localCalendar] = await this.db
			.select()
			.from(calendars)
			.where(and(eq(calendars.userId, externalCalendar.userId), eq(calendars.isDefault, true)));

		if (!localCalendar) {
			return 0;
		}

		// Get events from default calendar that need to be exported
		const localEvents = await this.db
			.select()
			.from(events)
			.where(
				and(
					eq(events.calendarId, localCalendar.id),
					or(isNull(events.lastSyncedAt), lte(events.lastSyncedAt, events.updatedAt))
				)
			);

		let exportedCount = 0;

		for (const event of localEvents) {
			try {
				switch (externalCalendar.provider) {
					case 'caldav':
					case 'apple': {
						const serverUrl =
							externalCalendar.provider === 'apple'
								? this.caldavService.getAppleCalDavUrl()
								: new URL(externalCalendar.calendarUrl).origin;

						await this.caldavService.upsertEvent(
							serverUrl,
							externalCalendar.calendarUrl,
							externalCalendar.username || '',
							externalCalendar.encryptedPassword
								? this.encryptionService.decrypt(externalCalendar.encryptedPassword)
								: '',
							{
								uid: event.externalId || event.id,
								title: event.title,
								description: event.description ?? undefined,
								location: event.location ?? undefined,
								startTime: event.startTime,
								endTime: event.endTime,
								isAllDay: event.isAllDay ?? false,
								recurrenceRule: event.recurrenceRule ?? undefined,
							}
						);
						break;
					}

					case 'google': {
						let accessToken = externalCalendar.accessToken;
						if (
							externalCalendar.tokenExpiresAt &&
							new Date(externalCalendar.tokenExpiresAt) < new Date()
						) {
							if (!externalCalendar.refreshToken) {
								throw new Error('Token expired');
							}
							const tokens = await this.googleCalendarService.refreshAccessToken(
								externalCalendar.refreshToken
							);
							accessToken = tokens.access_token;
						}

						const googleCalendarId = externalCalendar.providerData?.googleCalendarId || 'primary';

						if (event.externalId) {
							await this.googleCalendarService.updateEvent(
								accessToken!,
								googleCalendarId,
								event.externalId,
								{
									title: event.title,
									description: event.description ?? undefined,
									location: event.location ?? undefined,
									startTime: event.startTime,
									endTime: event.endTime,
									isAllDay: event.isAllDay ?? false,
								}
							);
						} else {
							const result = await this.googleCalendarService.createEvent(
								accessToken!,
								googleCalendarId,
								{
									title: event.title,
									description: event.description ?? undefined,
									location: event.location ?? undefined,
									startTime: event.startTime,
									endTime: event.endTime,
									isAllDay: event.isAllDay ?? false,
									recurrenceRule: event.recurrenceRule ?? undefined,
								}
							);

							// Update the local event with the external ID
							await this.db
								.update(events)
								.set({ externalId: result.id })
								.where(eq(events.id, event.id));
						}
						break;
					}
				}

				// Mark as synced
				await this.db
					.update(events)
					.set({ lastSyncedAt: new Date() })
					.where(eq(events.id, event.id));

				exportedCount++;
			} catch (error) {
				this.logger.warn(`Failed to export event ${event.id}: ${error}`);
			}
		}

		return exportedCount;
	}

	/**
	 * Export a local calendar to iCal format
	 */
	async exportCalendarAsIcal(calendarId: string, userId: string): Promise<string> {
		const [calendar] = await this.db
			.select()
			.from(calendars)
			.where(and(eq(calendars.id, calendarId), eq(calendars.userId, userId)));

		if (!calendar) {
			throw new NotFoundException('Calendar not found');
		}

		const calendarEvents = await this.db
			.select()
			.from(events)
			.where(eq(events.calendarId, calendarId));

		return this.icalService.generateICalData(calendar.name, calendarEvents);
	}

	/**
	 * Scheduled sync job - runs every 5 minutes
	 */
	@Cron(CronExpression.EVERY_5_MINUTES)
	async scheduledSync() {
		this.logger.log('Running scheduled calendar sync...');

		// Get calendars that need syncing
		const now = new Date();
		const calendarsToSync = await this.db
			.select()
			.from(externalCalendars)
			.where(eq(externalCalendars.syncEnabled, true));

		for (const calendar of calendarsToSync) {
			// Check if enough time has passed since last sync
			const lastSync = calendar.lastSyncAt ? new Date(calendar.lastSyncAt) : null;
			const intervalMs = (calendar.syncInterval || 15) * 60 * 1000;

			if (!lastSync || now.getTime() - lastSync.getTime() >= intervalMs) {
				try {
					await this.syncCalendar(calendar.id);
					this.logger.log(`Synced calendar: ${calendar.name} (${calendar.id})`);
				} catch (error) {
					this.logger.error(`Failed to sync calendar ${calendar.id}: ${error}`);
				}
			}
		}
	}
}
