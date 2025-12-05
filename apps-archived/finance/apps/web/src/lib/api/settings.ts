import { apiClient } from './client';
import type { UserSettings, UpdateUserSettingsInput } from '@finance/shared';

export const settingsApi = {
	get: () => apiClient.get<UserSettings>('/settings'),

	update: (data: UpdateUserSettingsInput) => apiClient.put<UserSettings>('/settings', data),
};
