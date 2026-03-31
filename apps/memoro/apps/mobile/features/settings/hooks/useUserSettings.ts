import { useState, useEffect, useCallback } from 'react';
import { userSettingsService, MemoroSettings, UserProfile } from '../services/userSettingsService';

export function useUserSettings() {
	const [settings, setSettings] = useState<MemoroSettings>({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchSettings = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const memoroSettings = await userSettingsService.getMemoroSettings();
			setSettings(memoroSettings);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch settings');
			console.error('Failed to fetch user settings:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	const updateDataUsage = useCallback(async (accepted: boolean) => {
		setLoading(true);
		setError(null);
		try {
			const response = await userSettingsService.updateDataUsageAcceptance(accepted);
			setSettings(response.settings.memoro || {});
			return response;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update data usage');
			console.error('Failed to update data usage:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	const updateEmailNewsletter = useCallback(async (optIn: boolean) => {
		setLoading(true);
		setError(null);
		try {
			const response = await userSettingsService.updateEmailNewsletterOptIn(optIn);
			setSettings(response.settings.memoro || {});
			return response;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update email newsletter');
			console.error('Failed to update email newsletter:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	const updateMemoroSettings = useCallback(async (newSettings: Partial<MemoroSettings>) => {
		setLoading(true);
		setError(null);
		try {
			const response = await userSettingsService.updateMemoroSettings(newSettings);
			setSettings(response.settings.memoro || {});
			return response;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update settings');
			console.error('Failed to update Memoro settings:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	const updateUserProfile = useCallback(async (profile: UserProfile) => {
		setLoading(true);
		setError(null);
		try {
			const response = await userSettingsService.updateUserProfile(profile);
			return response;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update profile');
			console.error('Failed to update user profile:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

	return {
		settings,
		loading,
		error,
		refetch: fetchSettings,
		updateDataUsage,
		updateEmailNewsletter,
		updateMemoroSettings,
		updateUserProfile,
	};
}
