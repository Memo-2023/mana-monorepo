import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemeSelector } from '~/components/theme';
import { useTheme } from '~/utils/theme/theme';
import { useAuth } from '~/context/AuthContext';
import { useDebug } from '~/context/DebugContext';
import { useTranslations } from '~/context/I18nContext';
import { LanguagePicker } from '~/components/settings/LanguagePicker';
import { Ionicons } from '@expo/vector-icons';

/**
 * Einstellungsseite
 * Ermöglicht die Konfiguration der App-Einstellungen, wie z.B. das Theme
 */
export default function SettingsScreen() {
	const { isDark } = useTheme();
	const { signOut, user } = useAuth();
	const { showDebugBorders, toggleDebugBorders } = useDebug();
	const { t, settings, auth, common } = useTranslations();
	const router = useRouter();

	const handleSignOut = async () => {
		Alert.alert(auth('signOut'), 'Are you sure you want to sign out?', [
			{
				text: common('cancel'),
				style: 'cancel',
			},
			{
				text: auth('signOut'),
				onPress: async () => {
					await signOut();
					router.replace('/login');
				},
				style: 'destructive',
			},
		]);
	};

	return (
		<>
			<Stack.Screen
				options={{
					title: settings('settings'),
					headerStyle: {
						backgroundColor: isDark ? '#1f2937' : '#ffffff',
					},
					headerTintColor: isDark ? '#f9fafb' : '#1f2937',
				}}
			/>
			<ScrollView
				style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}
				contentContainerStyle={styles.contentContainer}
			>
				{/* Benutzerinfo */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, { color: isDark ? '#f9fafb' : '#1f2937' }]}>
						{settings('account')}
					</Text>
					<View
						style={[
							styles.card,
							styles.userCard,
							{ backgroundColor: isDark ? '#1f2937' : '#ffffff' },
						]}
					>
						<View style={styles.userInfo}>
							<View
								style={[styles.userAvatar, { backgroundColor: isDark ? '#4b5563' : '#e5e7eb' }]}
							>
								<Ionicons name="person" size={24} color={isDark ? '#d1d5db' : '#6b7280'} />
							</View>
							<View style={styles.userDetails}>
								<Text style={[styles.userName, { color: isDark ? '#f9fafb' : '#1f2937' }]}>
									{user?.email || 'User'}
								</Text>
								<Text style={[styles.userEmail, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
									{user?.email || auth('noEmailAddress')}
								</Text>
							</View>
						</View>
					</View>

					{/* Token-Management */}
					<TouchableOpacity
						style={[
							styles.card,
							styles.tokenButton,
							{ backgroundColor: isDark ? '#1f2937' : '#ffffff', marginTop: 12 },
						]}
						onPress={() => router.push('/tokens')}
					>
						<View style={styles.tokenContent}>
							<Ionicons name="wallet-outline" size={24} color={isDark ? '#818cf8' : '#4f46e5'} />
							<Text style={[styles.tokenText, { color: isDark ? '#f9fafb' : '#1f2937' }]}>
								{settings('tokenManagement')}
							</Text>
							<Ionicons
								name="chevron-forward"
								size={20}
								color={isDark ? '#9ca3af' : '#6b7280'}
								style={styles.arrowIcon}
							/>
						</View>
					</TouchableOpacity>
				</View>

				{/* Erscheinungsbild */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, { color: isDark ? '#f9fafb' : '#1f2937' }]}>
						{settings('appearance')}
					</Text>
					<View style={styles.card}>
						<ThemeSelector />
					</View>
					<View style={[styles.card, { marginTop: 12 }]}>
						<LanguagePicker />
					</View>
				</View>

				{/* Entwickleroptionen */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, { color: isDark ? '#f9fafb' : '#1f2937' }]}>
						{settings('developer')}
					</Text>
					<View
						style={[styles.card, { backgroundColor: isDark ? '#1f2937' : '#ffffff', padding: 16 }]}
					>
						<View style={styles.settingRow}>
							<View style={styles.settingLabelContainer}>
								<Ionicons
									name="grid-outline"
									size={20}
									color={isDark ? '#9ca3af' : '#6b7280'}
									style={styles.settingIcon}
								/>
								<Text style={[styles.settingLabel, { color: isDark ? '#f9fafb' : '#1f2937' }]}>
									Show Debug Borders
								</Text>
							</View>
							<Switch
								value={showDebugBorders}
								onValueChange={toggleDebugBorders}
								trackColor={{ false: '#d1d5db', true: '#818cf8' }}
								thumbColor={showDebugBorders ? '#4f46e5' : '#f9fafb'}
							/>
						</View>
						<Text style={[styles.settingDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
							Shows colored borders around UI elements for development and debugging
						</Text>
					</View>
				</View>

				{/* Abmelden */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, { color: isDark ? '#f9fafb' : '#1f2937' }]}>
						{settings('session')}
					</Text>
					<TouchableOpacity
						style={[
							styles.card,
							styles.logoutButton,
							{ backgroundColor: isDark ? '#1f2937' : '#ffffff' },
						]}
						onPress={handleSignOut}
					>
						<View style={styles.logoutContent}>
							<Ionicons name="log-out-outline" size={24} color="#ef4444" />
							<Text style={styles.logoutText}>{auth('signOut')}</Text>
						</View>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {
		padding: 16,
		paddingBottom: 32,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 12,
	},
	card: {
		borderRadius: 8,
		overflow: 'hidden',
	},
	settingRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	settingLabelContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	settingIcon: {
		marginRight: 12,
	},
	settingLabel: {
		fontSize: 16,
		fontWeight: '500',
	},
	settingDescription: {
		fontSize: 14,
		marginTop: 4,
	},
	userCard: {
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	userInfo: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	// Token-Button Styles
	tokenButton: {
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	tokenContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	tokenText: {
		fontSize: 16,
		fontWeight: '500',
		marginLeft: 12,
		flex: 1,
	},
	arrowIcon: {
		marginLeft: 'auto',
	},
	userAvatar: {
		width: 50,
		height: 50,
		borderRadius: 25,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	userDetails: {
		flex: 1,
	},
	userName: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	userEmail: {
		fontSize: 14,
	},
	logoutButton: {
		padding: 16,
	},
	logoutContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	logoutText: {
		marginLeft: 12,
		fontSize: 16,
		fontWeight: '500',
		color: '#ef4444',
	},
});
