import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SettingsClientService {
	private readonly logger = new Logger(SettingsClientService.name);
	private readonly manaServiceUrl: string;

	constructor(private readonly configService: ConfigService) {
		this.manaServiceUrl = this.configService.get<string>('MANA_SERVICE_URL');
		if (!this.manaServiceUrl) {
			this.logger.warn('MANA_SERVICE_URL not configured');
		}
	}

	async getUserSettings(token: string): Promise<any> {
		try {
			const response = await fetch(`${this.manaServiceUrl}/users/settings`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to get user settings: ${response.status} - ${errorText}`);
			}

			const result = await response.json();
			return result.settings || {};
		} catch (error) {
			this.logger.error(`Error getting user settings: ${error.message}`);
			throw error;
		}
	}

	async updateMemoroSettings(
		settings: {
			dataUsageAcceptance?: boolean;
			emailNewsletterOptIn?: boolean;
			[key: string]: any;
		},
		token: string
	): Promise<any> {
		try {
			const response = await fetch(`${this.manaServiceUrl}/users/settings/memoro`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(settings),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to update Memoro settings: ${response.status} - ${errorText}`);
			}

			const result = await response.json();
			return result.settings || {};
		} catch (error) {
			this.logger.error(`Error updating Memoro settings: ${error.message}`);
			throw error;
		}
	}

	async updateUserProfile(
		profileData: {
			firstName?: string;
			lastName?: string;
			avatarUrl?: string;
		},
		token: string
	): Promise<any> {
		try {
			const response = await fetch(`${this.manaServiceUrl}/users/settings/profile`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(profileData),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to update user profile: ${response.status} - ${errorText}`);
			}

			const result = await response.json();
			return result.user || {};
		} catch (error) {
			this.logger.error(`Error updating user profile: ${error.message}`);
			throw error;
		}
	}

	async getMemoroSettings(token: string): Promise<any> {
		try {
			const allSettings = await this.getUserSettings(token);
			return allSettings.memoro || {};
		} catch (error) {
			this.logger.error(`Error getting Memoro settings: ${error.message}`);
			throw error;
		}
	}

	async updateDataUsageAcceptance(accepted: boolean, token: string): Promise<any> {
		return this.updateMemoroSettings({ dataUsageAcceptance: accepted }, token);
	}

	async updateEmailNewsletterOptIn(optIn: boolean, token: string): Promise<any> {
		return this.updateMemoroSettings({ emailNewsletterOptIn: optIn }, token);
	}
}
