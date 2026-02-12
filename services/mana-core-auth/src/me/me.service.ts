import { Injectable, Logger } from '@nestjs/common';
import { UserDataService } from '../admin/user-data.service';
import type { UserDataSummary, DeleteUserDataResponse } from '../admin/dto/user-data.dto';

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
	 */
	async exportMyData(userId: string): Promise<UserDataExport> {
		this.logger.log(`User ${userId} exporting own data`);
		const summary = await this.userDataService.getUserDataSummary(userId);

		return {
			exportedAt: new Date().toISOString(),
			exportVersion: '1.0',
			data: summary,
		};
	}

	/**
	 * Delete all data for the authenticated user (GDPR right to be forgotten)
	 */
	async deleteMyData(userId: string): Promise<DeleteUserDataResponse> {
		this.logger.log(`User ${userId} requesting deletion of own data`);
		return this.userDataService.deleteUserData(userId);
	}
}

export interface UserDataExport {
	exportedAt: string;
	exportVersion: string;
	data: UserDataSummary;
}
