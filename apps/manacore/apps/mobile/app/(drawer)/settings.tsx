import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	TextInput,
	Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Container } from '~/components/Container';
import { useTheme } from '~/utils/themeContext';
import type { ThemeMode } from '~/utils/themeContext';
import { useAuth } from '~/context/AuthProvider';
import { api } from '~/services/api';

export default function SettingsScreen() {
	const { themeMode, setThemeMode, isDarkMode } = useTheme();
	const { user, signOut } = useAuth();
	const [loading, setLoading] = useState(false);
	const [name, setName] = useState('');
	const [creditBalance, setCreditBalance] = useState<number | null>(null);

	// Funktion zum Ändern des Theme-Modus
	const changeTheme = (mode: ThemeMode) => {
		setThemeMode(mode);
	};

	useEffect(() => {
		if (user) loadProfile();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	async function loadProfile() {
		try {
			setLoading(true);

			const { data, error } = await api.getProfile();

			if (error) {
				throw new Error(error);
			}

			if (data) {
				setName(data.name || '');
			}

			// Also load credit balance
			const { data: creditData } = await api.getCreditBalance();
			if (creditData) {
				setCreditBalance(creditData.balance);
			}
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert('Fehler beim Laden des Profils', error.message);
			}
		} finally {
			setLoading(false);
		}
	}

	async function updateProfile() {
		if (!user) return;

		try {
			setLoading(true);

			const { error } = await api.updateProfile({ name });

			if (error) {
				throw new Error(error);
			}

			Alert.alert('Erfolg', 'Profil erfolgreich aktualisiert!');
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert('Fehler beim Aktualisieren des Profils', error.message);
			}
		} finally {
			setLoading(false);
		}
	}

	async function handleSignOut() {
		try {
			setLoading(true);
			await signOut();
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert('Fehler beim Abmelden', error.message);
			}
		} finally {
			setLoading(false);
		}
	}

	// Dynamische Stile basierend auf dem aktuellen Theme
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
		},
		sectionTitle: {
			fontSize: 18,
			fontWeight: 'bold',
			marginBottom: 16,
			color: isDarkMode ? '#F9FAFB' : '#1F2937',
		},
		card: {
			backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
			borderRadius: 12,
			padding: 16,
			marginBottom: 16,
			shadowColor: isDarkMode ? '#000000' : '#000000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: isDarkMode ? 0.5 : 0.1,
			shadowRadius: 4,
			elevation: 4,
		},
		themeButtonsContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginTop: 8,
		},
		themeButton: {
			flex: 1,
			padding: 12,
			borderRadius: 8,
			alignItems: 'center',
			marginHorizontal: 4,
		},
		activeThemeButton: {
			backgroundColor: isDarkMode ? '#3B82F6' : '#0055FF',
		},
		inactiveThemeButton: {
			backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
		},
		themeButtonText: {
			fontWeight: '500',
			marginTop: 4,
			color: isDarkMode ? '#F9FAFB' : '#1F2937',
		},
		activeThemeButtonText: {
			color: '#FFFFFF',
		},
		// Profil-Stile
		formGroup: {
			marginBottom: 15,
		},
		label: {
			fontSize: 16,
			marginBottom: 5,
			fontWeight: '500',
			color: isDarkMode ? '#E5E7EB' : '#374151',
		},
		value: {
			fontSize: 16,
			color: isDarkMode ? '#9CA3AF' : '#6B7280',
			paddingVertical: 10,
		},
		input: {
			height: 50,
			borderWidth: 1,
			borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
			borderRadius: 8,
			paddingHorizontal: 10,
			backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
			color: isDarkMode ? '#F9FAFB' : '#1F2937',
		},
		quotaContainer: {
			marginVertical: 15,
			padding: 15,
			backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF',
			borderRadius: 8,
		},
		quota: {
			fontSize: 18,
			fontWeight: 'bold',
			color: isDarkMode ? '#93C5FD' : '#0055FF',
		},
		button: {
			backgroundColor: isDarkMode ? '#3B82F6' : '#0055FF',
			height: 50,
			borderRadius: 8,
			justifyContent: 'center',
			alignItems: 'center',
			marginTop: 15,
		},
		buttonText: {
			color: 'white',
			fontSize: 16,
			fontWeight: 'bold',
		},
		signOutButton: {
			backgroundColor: isDarkMode ? '#DC2626' : '#EF4444',
			marginTop: 10,
		},
	});

	return (
		<>
			<Stack.Screen
				options={{
					title: 'Einstellungen',
					headerLargeTitle: true,
				}}
			/>
			<Container>
				<ScrollView className="flex-1 px-4 py-4">
					{user ? (
						<View style={styles.card}>
							<Text style={styles.sectionTitle}>Mein Profil</Text>

							<View style={styles.formGroup}>
								<Text style={styles.label}>E-Mail</Text>
								<Text style={styles.value}>{user.email}</Text>
							</View>

							<View style={styles.formGroup}>
								<Text style={styles.label}>Name</Text>
								<TextInput
									style={styles.input}
									value={name}
									onChangeText={setName}
									placeholder="Name eingeben"
									placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
								/>
							</View>

							{creditBalance !== null && (
								<View style={styles.quotaContainer}>
									<Text style={styles.label}>Verfügbare Kredite</Text>
									<Text style={styles.quota}>{creditBalance}</Text>
								</View>
							)}

							<TouchableOpacity style={styles.button} onPress={updateProfile} disabled={loading}>
								<Text style={styles.buttonText}>
									{loading ? 'Wird aktualisiert...' : 'Profil aktualisieren'}
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.button, styles.signOutButton]}
								onPress={handleSignOut}
								disabled={loading}
							>
								<Text style={styles.buttonText}>Abmelden</Text>
							</TouchableOpacity>
						</View>
					) : (
						<View style={styles.card}>
							<Text style={styles.sectionTitle}>Anmeldung erforderlich</Text>
							<Text style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280', marginBottom: 15 }}>
								Bitte melden Sie sich an, um Ihr Profil zu verwalten.
							</Text>
						</View>
					)}

					<View style={styles.card}>
						<Text style={styles.sectionTitle}>Erscheinungsbild</Text>
						<View style={styles.themeButtonsContainer}>
							<TouchableOpacity
								style={[
									styles.themeButton,
									themeMode === 'system' ? styles.activeThemeButton : styles.inactiveThemeButton,
								]}
								onPress={() => changeTheme('system')}
							>
								<FontAwesome5
									name="laptop"
									size={20}
									color={themeMode === 'system' ? '#FFFFFF' : isDarkMode ? '#F9FAFB' : '#1F2937'}
								/>
								<Text
									style={[
										styles.themeButtonText,
										themeMode === 'system' && styles.activeThemeButtonText,
									]}
								>
									System
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.themeButton,
									themeMode === 'light' ? styles.activeThemeButton : styles.inactiveThemeButton,
								]}
								onPress={() => changeTheme('light')}
							>
								<FontAwesome5
									name="sun"
									size={20}
									color={themeMode === 'light' ? '#FFFFFF' : isDarkMode ? '#F9FAFB' : '#1F2937'}
								/>
								<Text
									style={[
										styles.themeButtonText,
										themeMode === 'light' && styles.activeThemeButtonText,
									]}
								>
									Hell
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.themeButton,
									themeMode === 'dark' ? styles.activeThemeButton : styles.inactiveThemeButton,
								]}
								onPress={() => changeTheme('dark')}
							>
								<FontAwesome5
									name="moon"
									size={20}
									color={themeMode === 'dark' ? '#FFFFFF' : isDarkMode ? '#F9FAFB' : '#1F2937'}
								/>
								<Text
									style={[
										styles.themeButtonText,
										themeMode === 'dark' && styles.activeThemeButtonText,
									]}
								>
									Dunkel
								</Text>
							</TouchableOpacity>
						</View>
					</View>

					<View style={styles.card}>
						<Text style={styles.sectionTitle}>Über</Text>
						<Text style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
							Manacore App Version 1.0.0
						</Text>
					</View>
				</ScrollView>
			</Container>
		</>
	);
}
