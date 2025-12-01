import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Switch,
	Alert,
	Platform,
	Linking,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeProvider';

type ThemeVariant = 'default' | 'ocean' | 'forest' | 'sunset' | 'lavender';

interface ThemeOption {
	id: ThemeVariant;
	label: string;
	icon: string;
	color: string;
}

const themeOptions: ThemeOption[] = [
	{ id: 'default', label: 'Standard', icon: 'color-palette', color: '#3b82f6' },
	{ id: 'ocean', label: 'Ozean', icon: 'water', color: '#0ea5e9' },
	{ id: 'forest', label: 'Wald', icon: 'leaf', color: '#22c55e' },
	{ id: 'sunset', label: 'Sonnenuntergang', icon: 'sunny', color: '#f97316' },
	{ id: 'lavender', label: 'Lavendel', icon: 'flower', color: '#a855f7' },
];

export default function SettingsScreen() {
	const { colors } = useTheme();
	const { isDarkMode, toggleTheme } = useAppTheme();
	const router = useRouter();

	// Local state for settings (would be persisted in a real app)
	const [selectedTheme, setSelectedTheme] = useState<ThemeVariant>('default');
	const [pushNotifications, setPushNotifications] = useState(false);
	const [emailNotifications, setEmailNotifications] = useState(false);

	const handleDeleteChatHistory = () => {
		Alert.alert(
			'Chat-Verlauf löschen',
			'Bist du sicher, dass du alle Konversationen permanent löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.',
			[
				{
					text: 'Abbrechen',
					style: 'cancel',
				},
				{
					text: 'Löschen',
					style: 'destructive',
					onPress: () => {
						// TODO: Implement chat history deletion
						Alert.alert('Erfolg', 'Dein Chat-Verlauf wurde gelöscht.');
					},
				},
			]
		);
	};

	const handleChangePassword = () => {
		router.push('/profile');
	};

	const openLink = (url: string) => {
		Linking.openURL(url);
	};

	return (
		<ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.header}>
				<Text style={[styles.title, { color: colors.text }]}>Einstellungen</Text>
				<Text style={[styles.subtitle, { color: colors.text + '80' }]}>
					Passe die App an deine Vorlieben an
				</Text>
			</View>

			{/* Appearance Section */}
			<View style={styles.section}>
				<View style={styles.sectionHeader}>
					<Ionicons name="color-palette" size={20} color={colors.primary} />
					<Text style={[styles.sectionTitle, { color: colors.text }]}>Erscheinungsbild</Text>
				</View>

				<View
					style={[
						styles.card,
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
							shadowColor: isDarkMode ? undefined : '#000',
						},
					]}
				>
					{/* Dark Mode Toggle */}
					<View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
						<View style={styles.settingInfo}>
							<Ionicons
								name={isDarkMode ? 'moon' : 'sunny'}
								size={22}
								color={colors.primary}
								style={styles.settingIcon}
							/>
							<View>
								<Text style={[styles.settingLabel, { color: colors.text }]}>Dunkler Modus</Text>
								<Text style={[styles.settingDescription, { color: colors.text + '70' }]}>
									{isDarkMode ? 'Aktiviert' : 'Deaktiviert'}
								</Text>
							</View>
						</View>
						<Switch
							value={isDarkMode}
							onValueChange={toggleTheme}
							trackColor={{ false: colors.border, true: colors.primary + '60' }}
							thumbColor={isDarkMode ? colors.primary : '#f4f3f4'}
							ios_backgroundColor={colors.border}
						/>
					</View>

					{/* Theme Selection */}
					<View style={styles.themeSection}>
						<Text style={[styles.settingLabel, { color: colors.text, marginBottom: 12 }]}>
							Farbschema
						</Text>
						<View style={styles.themeGrid}>
							{themeOptions.map((theme) => (
								<TouchableOpacity
									key={theme.id}
									style={[
										styles.themeOption,
										{
											borderColor: selectedTheme === theme.id ? colors.primary : colors.border,
											backgroundColor:
												selectedTheme === theme.id ? colors.primary + '10' : 'transparent',
										},
									]}
									onPress={() => setSelectedTheme(theme.id)}
								>
									<Ionicons
										name={theme.icon as any}
										size={24}
										color={selectedTheme === theme.id ? colors.primary : theme.color}
									/>
									<Text
										style={[
											styles.themeLabel,
											{
												color: selectedTheme === theme.id ? colors.primary : colors.text,
											},
										]}
									>
										{theme.label}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>
				</View>
			</View>

			{/* Notifications Section */}
			<View style={styles.section}>
				<View style={styles.sectionHeader}>
					<Ionicons name="notifications" size={20} color={colors.primary} />
					<Text style={[styles.sectionTitle, { color: colors.text }]}>Benachrichtigungen</Text>
				</View>

				<View
					style={[
						styles.card,
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
							shadowColor: isDarkMode ? undefined : '#000',
						},
					]}
				>
					<View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
						<View style={styles.settingInfo}>
							<Ionicons
								name="phone-portrait-outline"
								size={22}
								color={colors.text + '60'}
								style={styles.settingIcon}
							/>
							<View>
								<Text style={[styles.settingLabel, { color: colors.text }]}>
									Push-Benachrichtigungen
								</Text>
								<Text style={[styles.settingDescription, { color: colors.text + '70' }]}>
									Erhalte Benachrichtigungen über neue Nachrichten
								</Text>
							</View>
						</View>
						<Switch
							value={pushNotifications}
							onValueChange={setPushNotifications}
							trackColor={{ false: colors.border, true: colors.primary + '60' }}
							thumbColor={pushNotifications ? colors.primary : '#f4f3f4'}
							ios_backgroundColor={colors.border}
							disabled
						/>
					</View>

					<View style={styles.settingRowLast}>
						<View style={styles.settingInfo}>
							<Ionicons
								name="mail-outline"
								size={22}
								color={colors.text + '60'}
								style={styles.settingIcon}
							/>
							<View>
								<Text style={[styles.settingLabel, { color: colors.text }]}>
									E-Mail-Benachrichtigungen
								</Text>
								<Text style={[styles.settingDescription, { color: colors.text + '70' }]}>
									Erhalte wöchentliche Zusammenfassungen
								</Text>
							</View>
						</View>
						<Switch
							value={emailNotifications}
							onValueChange={setEmailNotifications}
							trackColor={{ false: colors.border, true: colors.primary + '60' }}
							thumbColor={emailNotifications ? colors.primary : '#f4f3f4'}
							ios_backgroundColor={colors.border}
							disabled
						/>
					</View>

					<Text style={[styles.disabledNote, { color: colors.text + '50' }]}>
						Benachrichtigungen werden in einer zukünftigen Version verfügbar sein.
					</Text>
				</View>
			</View>

			{/* Privacy & Security Section */}
			<View style={styles.section}>
				<View style={styles.sectionHeader}>
					<Ionicons name="shield-checkmark" size={20} color={colors.primary} />
					<Text style={[styles.sectionTitle, { color: colors.text }]}>
						Datenschutz & Sicherheit
					</Text>
				</View>

				<View
					style={[
						styles.card,
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
							shadowColor: isDarkMode ? undefined : '#000',
						},
					]}
				>
					<TouchableOpacity
						style={[styles.actionRow, { borderBottomColor: colors.border }]}
						onPress={handleChangePassword}
					>
						<View style={styles.settingInfo}>
							<Ionicons
								name="key-outline"
								size={22}
								color={colors.primary}
								style={styles.settingIcon}
							/>
							<View>
								<Text style={[styles.settingLabel, { color: colors.text }]}>Passwort ändern</Text>
								<Text style={[styles.settingDescription, { color: colors.text + '70' }]}>
									Aktualisiere dein Passwort regelmäßig
								</Text>
							</View>
						</View>
						<Ionicons name="chevron-forward" size={20} color={colors.text + '60'} />
					</TouchableOpacity>

					<TouchableOpacity style={styles.actionRowLast} onPress={handleDeleteChatHistory}>
						<View style={styles.settingInfo}>
							<Ionicons name="trash-outline" size={22} color="#FF3B30" style={styles.settingIcon} />
							<View>
								<Text style={[styles.settingLabel, { color: '#FF3B30' }]}>
									Chat-Verlauf löschen
								</Text>
								<Text style={[styles.settingDescription, { color: colors.text + '70' }]}>
									Lösche alle Konversationen permanent
								</Text>
							</View>
						</View>
					</TouchableOpacity>
				</View>
			</View>

			{/* About Section */}
			<View style={styles.section}>
				<View style={styles.sectionHeader}>
					<Ionicons name="information-circle" size={20} color={colors.primary} />
					<Text style={[styles.sectionTitle, { color: colors.text }]}>Über die App</Text>
				</View>

				<View
					style={[
						styles.card,
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
							shadowColor: isDarkMode ? undefined : '#000',
						},
					]}
				>
					<View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
						<Text style={[styles.infoLabel, { color: colors.text + '80' }]}>Version</Text>
						<Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
					</View>

					<View style={styles.infoRowLast}>
						<Text style={[styles.infoLabel, { color: colors.text + '80' }]}>Build</Text>
						<Text style={[styles.infoValue, { color: colors.text }]}>2024.11.29</Text>
					</View>
				</View>

				<View style={styles.linksContainer}>
					<TouchableOpacity
						style={styles.linkButton}
						onPress={() => openLink('https://example.com/privacy')}
					>
						<Text style={[styles.linkText, { color: colors.primary }]}>Datenschutz</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.linkButton}
						onPress={() => openLink('https://example.com/terms')}
					>
						<Text style={[styles.linkText, { color: colors.primary }]}>Nutzungsbedingungen</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.linkButton}
						onPress={() => openLink('https://example.com/support')}
					>
						<Text style={[styles.linkText, { color: colors.primary }]}>Hilfe & Support</Text>
					</TouchableOpacity>
				</View>
			</View>

			<View style={styles.bottomSpacer} />
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 24,
	},
	header: {
		marginTop: 20,
		marginBottom: 24,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
	},
	subtitle: {
		fontSize: 14,
		marginTop: 4,
	},
	section: {
		marginBottom: 24,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
		gap: 8,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
	},
	card: {
		borderRadius: 12,
		borderWidth: 1,
		overflow: 'hidden',
		...Platform.select({
			ios: {
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.08,
				shadowRadius: 4,
			},
			android: {
				elevation: 2,
			},
		}),
	},
	settingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		borderBottomWidth: 1,
	},
	settingRowLast: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
	},
	actionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		borderBottomWidth: 1,
	},
	actionRowLast: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
	},
	settingInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	settingIcon: {
		marginRight: 12,
	},
	settingLabel: {
		fontSize: 15,
		fontWeight: '500',
	},
	settingDescription: {
		fontSize: 13,
		marginTop: 2,
	},
	themeSection: {
		padding: 16,
	},
	themeGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
	},
	themeOption: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 10,
		borderWidth: 2,
		gap: 8,
	},
	themeLabel: {
		fontSize: 13,
		fontWeight: '500',
	},
	disabledNote: {
		fontSize: 12,
		fontStyle: 'italic',
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		borderBottomWidth: 1,
	},
	infoRowLast: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
	},
	infoLabel: {
		fontSize: 14,
	},
	infoValue: {
		fontSize: 14,
		fontWeight: '500',
	},
	linksContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 16,
		gap: 16,
	},
	linkButton: {
		paddingVertical: 4,
	},
	linkText: {
		fontSize: 14,
		fontWeight: '500',
	},
	bottomSpacer: {
		height: 40,
	},
});
