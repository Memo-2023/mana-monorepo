import { Injectable, Logger } from '@nestjs/common';
import { UserDataService } from '../admin/user-data.service';
import type { UserDataSummary, DeleteUserDataResponse } from '../admin/dto/user-data.dto';
import { sendAccountDeletionEmail } from '../email/email.service';

/**
 * Self-service data management for authenticated users.
 * Wraps UserDataService to allow users to access their own data without admin privileges.
 */
@Injectable()
export class MeService {
	private readonly logger = new Logger(MeService.name);

	constructor(private readonly userDataService: UserDataService) {}

	/**
	 * Get the authenticated user's data summary
	 */
	async getMyData(userId: string): Promise<UserDataSummary> {
		this.logger.log(`User ${userId} requesting own data`);
		return this.userDataService.getUserDataSummary(userId);
	}

	/**
	 * Export the authenticated user's data as a complete JSON object
	 * Includes sessions, security events, and credit transactions for GDPR compliance
	 */
	async exportMyData(userId: string): Promise<FullUserDataExport> {
		this.logger.log(`User ${userId} exporting own data`);
		return this.userDataService.getFullExportData(userId);
	}

	/**
	 * Delete all data for the authenticated user (GDPR right to be forgotten)
	 * Sends confirmation email after successful deletion
	 */
	async deleteMyData(userId: string): Promise<DeleteUserDataResponse> {
		this.logger.log(`User ${userId} requesting deletion of own data`);

		// Get user data BEFORE deletion for sending confirmation email
		const user = await this.userDataService.getUserForEmail(userId);

		// Perform deletion
		const result = await this.userDataService.deleteUserData(userId);

		// Send confirmation email if deletion was successful
		if (result.success && user?.email) {
			try {
				await sendAccountDeletionEmail(user.email, user.name || undefined);
				this.logger.log(`Account deletion confirmation email sent to ${user.email}`);
			} catch (error) {
				// Log but don't fail the deletion if email fails
				this.logger.error(`Failed to send deletion confirmation email to ${user.email}`, error);
			}
		}

		return result;
	}
}

export interface UserDataExport {
	exportedAt: string;
	exportVersion: string;
	data: UserDataSummary;
}

export interface SessionExport {
	id: string;
	createdAt: Date;
	expiresAt: Date;
	lastActivityAt: Date | null;
	ipAddress: string | null;
	userAgent: string | null;
	deviceName: string | null;
	revokedAt: Date | null;
}

export interface SecurityEventExport {
	id: string;
	eventType: string;
	ipAddress: string | null;
	userAgent: string | null;
	metadata: unknown;
	createdAt: Date;
}

export interface TransactionExport {
	id: string;
	type: string;
	status: string;
	amount: number;
	balanceBefore: number;
	balanceAfter: number;
	appId: string;
	description: string;
	createdAt: Date;
	completedAt: Date | null;
}

export interface FullUserDataExport extends UserDataSummary {
	exportedAt: string;
	exportVersion: string;
	sessions: {
		active: SessionExport[];
		history: SessionExport[];
	};
	securityEvents: SecurityEventExport[];
	creditTransactions: TransactionExport[];
}
