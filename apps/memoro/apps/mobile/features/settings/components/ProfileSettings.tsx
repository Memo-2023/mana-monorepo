import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import Text from '~/components/atoms/Text';
import Input from '~/components/atoms/Input';
import Button from '~/components/atoms/Button';
import { useUserSettings } from '../hooks/useUserSettings';
import { useAuth } from '~/features/auth';
import { useTheme } from '~/features/theme/ThemeProvider';

export function ProfileSettings() {
	const { t } = useTranslation();
	const { isDark } = useTheme();
	const { user } = useAuth();
	const { updateUserProfile, loading, error } = useUserSettings();

	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [isUpdating, setIsUpdating] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);

	// Initialize with current user data
	useEffect(() => {
		if (user) {
			setFirstName(user.user_metadata?.first_name || user.first_name || '');
			setLastName(user.user_metadata?.last_name || user.last_name || '');
		}
	}, [user]);

	// Check if there are changes to enable/disable save button
	useEffect(() => {
		const originalFirstName = user?.user_metadata?.first_name || user?.first_name || '';
		const originalLastName = user?.user_metadata?.last_name || user?.last_name || '';

		setHasChanges(firstName.trim() !== originalFirstName || lastName.trim() !== originalLastName);
	}, [firstName, lastName, user]);

	const handleSaveProfile = async () => {
		if (!firstName.trim() && !lastName.trim()) {
			Alert.alert(
				t('settings.error', 'Error'),
				t('settings.profile_empty_error', 'Please enter at least a first or last name.')
			);
			return;
		}

		setIsUpdating(true);
		try {
			await updateUserProfile({
				firstName: firstName.trim() || undefined,
				lastName: lastName.trim() || undefined,
			});

			Alert.alert(
				t('settings.profile_updated', 'Profile Updated'),
				t('settings.profile_updated_message', 'Your profile has been updated successfully.')
			);

			setHasChanges(false);
		} catch (err) {
			Alert.alert(
				t('settings.error', 'Error'),
				t('settings.profile_error', 'Failed to update profile. Please try again.')
			);
		} finally {
			setIsUpdating(false);
		}
	};

	const styles = StyleSheet.create({
		container: {
			marginBottom: 24,
		},
		title: {
			fontSize: 18,
			fontWeight: '600',
			marginBottom: 16,
			color: isDark ? '#FFFFFF' : '#000000',
		},
		inputContainer: {
			marginBottom: 16,
		},
		inputLabel: {
			fontSize: 14,
			fontWeight: '500',
			marginBottom: 8,
			color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
		},
		saveButton: {
			marginTop: 8,
		},
		errorText: {
			fontSize: 12,
			color: isDark ? '#FF6B6B' : '#DC3545',
			marginTop: 4,
		},
		currentEmail: {
			fontSize: 14,
			color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
			marginBottom: 16,
		},
	});

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{t('settings.profile_information', 'Profile Information')}</Text>

			{user?.email && (
				<Text style={styles.currentEmail}>
					{t('settings.email', 'Email')}: {user.email}
				</Text>
			)}

			<View style={styles.inputContainer}>
				<Text style={styles.inputLabel}>{t('settings.first_name', 'First Name')}</Text>
				<Input
					value={firstName}
					onChangeText={setFirstName}
					placeholder={t('settings.first_name_placeholder', 'Enter your first name')}
					autoCapitalize="words"
					autoCorrect={false}
					editable={!isUpdating}
				/>
			</View>

			<View style={styles.inputContainer}>
				<Text style={styles.inputLabel}>{t('settings.last_name', 'Last Name')}</Text>
				<Input
					value={lastName}
					onChangeText={setLastName}
					placeholder={t('settings.last_name_placeholder', 'Enter your last name')}
					autoCapitalize="words"
					autoCorrect={false}
					editable={!isUpdating}
				/>
			</View>

			<Button
				title={t('settings.save_profile', 'Save Profile')}
				onPress={handleSaveProfile}
				disabled={!hasChanges || isUpdating || loading}
				loading={isUpdating}
				variant="primary"
				style={styles.saveButton}
			/>

			{error && (
				<Text style={styles.errorText}>
					{t('settings.profile_error', 'Failed to update profile')}
				</Text>
			)}
		</View>
	);
}
