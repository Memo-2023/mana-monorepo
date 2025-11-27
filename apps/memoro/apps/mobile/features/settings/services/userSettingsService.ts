export interface MemoroSettings {
	dataUsageAcceptance?: boolean;
	emailNewsletterOptIn?: boolean;
	language?: string;
	defaultSpaceId?: string;
	migration?: {
		migrated_at: string;
		subscription_plan_id: string | null;
		is_active_subscription: boolean;
		memos_count?: number;
		memories_count?: number;
		images_count?: number;
		tags_count?: number;
		showMigratedNotification: boolean;
	};
}
export interface UserProfile {
	firstName?: string;
	lastName?: string;
	avatarUrl?: string;
}

export interface UserSettingsResponse {
	settings: {
		memoro?: MemoroSettings;
		[key: string]: any;
	};
	subscription_plan_id?: string;
	is_b2b?: boolean;
}

interface ProfileUpdateResponse {
	success: boolean;
	user: {
		id: string;
		email: string;
		first_name?: string;
		last_name?: string;
		avatar_url?: string;
		app_settings?: any;
	};
	message: string;
}

class UserSettingsService {
	private baseUrl = process.env.EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL || 'http://localhost:3001';

	private async getAuthHeaders() {
		const { tokenManager } = await import('~/features/auth/services/tokenManager');
		const token = await tokenManager.getValidToken();
		if (!token) {
			throw new Error('Not authenticated');
		}
		return {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		};
	}

	async getAllSettings(): Promise<UserSettingsResponse> {
		const headers = await this.getAuthHeaders();

		const response = await fetch(`${this.baseUrl}/settings`, {
			method: 'GET',
			headers,
		});

		if (!response.ok) {
			throw new Error(`Failed to get settings: ${response.statusText}`);
		}

		return response.json();
	}

	async getMemoroSettings(): Promise<MemoroSettings> {
		const headers = await this.getAuthHeaders();

		const response = await fetch(`${this.baseUrl}/settings/memoro`, {
			method: 'GET',
			headers,
		});

		if (!response.ok) {
			throw new Error(`Failed to get Memoro settings: ${response.statusText}`);
		}

		const data = await response.json();
		return data.settings || {};
	}

	async updateMemoroSettings(settings: Partial<MemoroSettings>): Promise<UserSettingsResponse> {
		const headers = await this.getAuthHeaders();

		const response = await fetch(`${this.baseUrl}/settings/memoro`, {
			method: 'PATCH',
			headers,
			body: JSON.stringify(settings),
		});

		if (!response.ok) {
			throw new Error(`Failed to update Memoro settings: ${response.statusText}`);
		}

		return response.json();
	}

	async updateDataUsageAcceptance(accepted: boolean): Promise<UserSettingsResponse> {
		const headers = await this.getAuthHeaders();

		const response = await fetch(`${this.baseUrl}/settings/memoro/data-usage`, {
			method: 'PATCH',
			headers,
			body: JSON.stringify({ accepted }),
		});

		if (!response.ok) {
			throw new Error(`Failed to update data usage acceptance: ${response.statusText}`);
		}

		return response.json();
	}

	async updateEmailNewsletterOptIn(optIn: boolean): Promise<UserSettingsResponse> {
		const headers = await this.getAuthHeaders();

		const response = await fetch(`${this.baseUrl}/settings/memoro/email-newsletter`, {
			method: 'PATCH',
			headers,
			body: JSON.stringify({ optIn }),
		});

		if (!response.ok) {
			throw new Error(`Failed to update email newsletter opt-in: ${response.statusText}`);
		}

		return response.json();
	}

	async updateUserProfile(profile: UserProfile): Promise<ProfileUpdateResponse> {
		const headers = await this.getAuthHeaders();

		const response = await fetch(`${this.baseUrl}/settings/profile`, {
			method: 'PATCH',
			headers,
			body: JSON.stringify(profile),
		});

		if (!response.ok) {
			throw new Error(`Failed to update user profile: ${response.statusText}`);
		}

		return response.json();
	}
}

export const userSettingsService = new UserSettingsService();
