import { Injectable, Logger, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { devices, type Device, type NewDevice } from '../db/schema';

export interface RegisterDeviceDto {
	pushToken: string;
	tokenType?: string;
	platform: string;
	deviceName?: string;
	appId?: string;
}

@Injectable()
export class DevicesService {
	private readonly logger = new Logger(DevicesService.name);

	constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

	async register(userId: string, dto: RegisterDeviceDto): Promise<Device> {
		this.logger.debug(`Registering device for user ${userId}`);

		// Check if token already exists
		const [existing] = await this.db
			.select()
			.from(devices)
			.where(eq(devices.pushToken, dto.pushToken))
			.limit(1);

		if (existing) {
			// If same user, just update
			if (existing.userId === userId) {
				const [updated] = await this.db
					.update(devices)
					.set({
						platform: dto.platform,
						deviceName: dto.deviceName,
						appId: dto.appId,
						isActive: true,
						lastSeenAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(devices.id, existing.id))
					.returning();

				this.logger.log(`Updated existing device ${existing.id} for user ${userId}`);
				return updated;
			} else {
				// Token belongs to different user - transfer ownership
				const [updated] = await this.db
					.update(devices)
					.set({
						userId,
						platform: dto.platform,
						deviceName: dto.deviceName,
						appId: dto.appId,
						isActive: true,
						lastSeenAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(devices.id, existing.id))
					.returning();

				this.logger.log(`Transferred device ${existing.id} to user ${userId}`);
				return updated;
			}
		}

		// Create new device
		const [device] = await this.db
			.insert(devices)
			.values({
				userId,
				pushToken: dto.pushToken,
				tokenType: dto.tokenType || 'expo',
				platform: dto.platform,
				deviceName: dto.deviceName,
				appId: dto.appId,
				isActive: true,
				lastSeenAt: new Date(),
			})
			.returning();

		this.logger.log(`Registered new device ${device.id} for user ${userId}`);
		return device;
	}

	async unregister(userId: string, deviceId: string): Promise<void> {
		const [device] = await this.db
			.select()
			.from(devices)
			.where(and(eq(devices.id, deviceId), eq(devices.userId, userId)))
			.limit(1);

		if (!device) {
			throw new NotFoundException(`Device ${deviceId} not found`);
		}

		await this.db.delete(devices).where(eq(devices.id, deviceId));
		this.logger.log(`Unregistered device ${deviceId} for user ${userId}`);
	}

	async getByUserId(userId: string): Promise<Device[]> {
		return this.db.select().from(devices).where(eq(devices.userId, userId));
	}

	async getActiveDevicesByUser(userId: string): Promise<Device[]> {
		return this.db
			.select()
			.from(devices)
			.where(and(eq(devices.userId, userId), eq(devices.isActive, true)));
	}

	async getById(id: string): Promise<Device | null> {
		const [device] = await this.db.select().from(devices).where(eq(devices.id, id)).limit(1);
		return device || null;
	}

	async deactivate(deviceId: string): Promise<void> {
		await this.db
			.update(devices)
			.set({ isActive: false, updatedAt: new Date() })
			.where(eq(devices.id, deviceId));
	}

	async updateLastSeen(deviceId: string): Promise<void> {
		await this.db
			.update(devices)
			.set({ lastSeenAt: new Date(), updatedAt: new Date() })
			.where(eq(devices.id, deviceId));
	}

	async deactivateByToken(pushToken: string): Promise<void> {
		await this.db
			.update(devices)
			.set({ isActive: false, updatedAt: new Date() })
			.where(eq(devices.pushToken, pushToken));

		this.logger.debug(`Deactivated device with token ${pushToken.substring(0, 20)}...`);
	}
}
