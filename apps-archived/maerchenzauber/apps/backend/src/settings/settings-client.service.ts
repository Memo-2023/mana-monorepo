import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface MaerchenzauberSettings {
	defaultAuthorId?: string;
	defaultIllustratorId?: string;
	replicateModel?: string;
	language?: string;
	storyLength?: 'short' | 'medium' | 'long';
	ageGroup?: string;
}

export interface UserSettings {
	preferences?: {
		language?: string;
		timezone?: string;
		dateFormat?: string;
	};
	maerchenzauber?: MaerchenzauberSettings;
	[appName: string]: any;
}

@Injectable()
export class SettingsClientService {
	private readonly logger = new Logger(SettingsClientService.name);
	private readonly manaServiceUrl: string;
	private readonly serviceKey: string;

	constructor(private configService: ConfigService) {
		this.manaServiceUrl = this.configService.get<string>('MANA_SERVICE_URL') || '';
		this.serviceKey = this.configService.get<string>('MANA_SUPABASE_SECRET_KEY') || '';

		if (!this.manaServiceUrl) {
			this.logger.warn('MANA_SERVICE_URL not configured - user settings integration disabled');
		}
	}

	async getUserSettings(token: string): Promise<UserSettings> {
		if (!this.manaServiceUrl) {
			return {};
		}

		try {
			const response = await fetch(`${this.manaServiceUrl}/users/settings`, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error(`Failed to get user settings: ${response.status} - ${errorText}`);
				return {};
			}

			const result = await response.json();
			return result.settings || {};
		} catch (error) {
			this.logger.error('Failed to get user settings:', error);
			return {};
		}
	}

	async getUserSettingsAsService(userId: string): Promise<UserSettings> {
		if (!this.manaServiceUrl || !this.serviceKey) {
			return {};
		}

		try {
			const response = await fetch(`${this.manaServiceUrl}/users/settings/service/${userId}`, {
				headers: {
					Authorization: `Bearer ${this.serviceKey}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error(
					`Failed to get user settings as service: ${response.status} - ${errorText}`
				);
				return {};
			}

			const result = await response.json();
			return result.settings || {};
		} catch (error) {
			this.logger.error('Error getting user settings as service:', error);
			return {};
		}
	}

	async getMaerchenzauberSettings(userToken: string): Promise<MaerchenzauberSettings> {
		try {
			const allSettings = await this.getUserSettings(userToken);
			return allSettings.maerchenzauber || {};
		} catch (error) {
			this.logger.error('Error getting Märchenzauber settings:', error);
			return {};
		}
	}

	async updateServiceSettings(settings: Partial<MaerchenzauberSettings>, token: string) {
		if (!this.manaServiceUrl) {
			return settings;
		}

		try {
			const response = await fetch(`${this.manaServiceUrl}/users/settings/maerchenzauber`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(settings),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to update settings: ${response.status} - ${errorText}`);
			}

			const result = await response.json();
			return result.settings?.maerchenzauber || settings;
		} catch (error) {
			this.logger.error('Failed to update settings:', error);
			throw error;
		}
	}

	async getUserPreferredAuthorId(userToken: string): Promise<string | undefined> {
		const settings = await this.getMaerchenzauberSettings(userToken);
		return settings.defaultAuthorId;
	}

	async getUserPreferredIllustratorId(userToken: string): Promise<string | undefined> {
		const settings = await this.getMaerchenzauberSettings(userToken);
		return settings.defaultIllustratorId;
	}

	async getUserReplicateModel(userToken: string): Promise<string | undefined> {
		const settings = await this.getMaerchenzauberSettings(userToken);
		return settings.replicateModel;
	}
}
