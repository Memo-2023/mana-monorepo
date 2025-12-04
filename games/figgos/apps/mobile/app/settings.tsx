import { Stack, useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useTheme } from '~/utils/ThemeContext';
import { ThemeName, ThemeMode } from '~/utils/themes';
import { useAuth } from '~/utils/AuthContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedView, ThemedText } from '~/components/ThemedView';

export default function Settings() {
	const {
		themeName,
		themeMode,
		setThemeName,
		setThemeMode,
		theme,
		isDark,
		debugBorders,
		setDebugBorders,
	} = useTheme();
	const { signOut, user } = useAuth();
	const router = useRouter();

	// Theme options
	const themeOptions: ThemeName[] = ['default', 'pastel', 'vibrant'];
	const themeModeOptions: ThemeMode[] = ['system', 'light', 'dark'];

	// Theme option labels
	const themeLabels: Record<ThemeName, string> = {
		default: 'Default',
		pastel: 'Pastel',
		vibrant: 'Vibrant',
	};

	const themeModeLabels: Record<ThemeMode, string> = {
		system: 'System',
		light: 'Light',
		dark: 'Dark',
	};

	const handleSignOut = async () => {
		Alert.alert('Abmelden', 'Möchtest du dich wirklich abmelden?', [
			{
				text: 'Abbrechen',
				style: 'cancel',
			},
			{
				text: 'Abmelden',
				onPress: async () => {
					try {
						console.log('Logging out...');
						const { error } = await signOut();

						if (error) {
							console.error('Logout error:', error);
							Alert.alert('Fehler', 'Es gab ein Problem beim Abmelden: ' + error.message);
						} else {
							console.log('Logout successful, navigating to login screen');
							// Navigate to login screen after successful logout
							router.replace('/login');
						}
					} catch (e) {
						console.error('Unexpected error during logout:', e);
						Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten.');
					}
				},
			},
		]);
	};

	return (
		<>
			<Stack.Screen
				options={{
					title: 'Settings',
					headerStyle: {
						backgroundColor: theme.colors.card,
					},
					headerTintColor: theme.colors.text,
					headerShadowVisible: false,
				}}
			/>
			<ScrollView
				style={[styles.container, { backgroundColor: theme.colors.background }]}
				contentContainerStyle={styles.contentContainer}
			>
				<ThemedText style={styles.sectionTitle}>Appearance</ThemedText>

				{/* Theme Selection */}
				<ThemedView style={styles.section} debugBorderType="primary">
					<ThemedText style={styles.sectionHeader}>Theme</ThemedText>
					<ThemedView style={styles.optionsContainer} debugBorderType="secondary">
						{themeOptions.map((option) => (
							<TouchableOpacity
								key={option}
								style={[
									styles.optionButton,
									{
										backgroundColor:
											themeName === option ? theme.colors.primary : theme.colors.card,
										borderColor: theme.colors.border,
									},
								]}
								onPress={() => setThemeName(option)}
							>
								<Text
									style={[
										styles.optionText,
										{ color: themeName === option ? 'white' : theme.colors.text },
									]}
								>
									{themeLabels[option]}
								</Text>
							</TouchableOpacity>
						))}
					</ThemedView>
				</ThemedView>

				{/* Mode Selection */}
				<ThemedView style={styles.section} debugBorderType="primary">
					<ThemedText style={styles.sectionHeader}>Mode</ThemedText>
					<ThemedView style={styles.optionsContainer} debugBorderType="secondary">
						{themeModeOptions.map((option) => (
							<TouchableOpacity
								key={option}
								style={[
									styles.optionButton,
									{
										backgroundColor:
											themeMode === option ? theme.colors.primary : theme.colors.card,
										borderColor: theme.colors.border,
									},
								]}
								onPress={() => setThemeMode(option)}
							>
								<Text
									style={[
										styles.optionText,
										{ color: themeMode === option ? 'white' : theme.colors.text },
									]}
								>
									{themeModeLabels[option]}
								</Text>
							</TouchableOpacity>
						))}
					</ThemedView>
				</ThemedView>

				{/* Theme Preview */}
				<ThemedView style={styles.section} debugBorderType="primary">
					<ThemedText style={styles.sectionHeader}>Preview</ThemedText>
					<ThemedView
						style={[
							styles.previewCard,
							{ backgroundColor: theme.colors.card, borderColor: theme.colors.border },
						]}
						debugBorderType="tertiary"
					>
						<ThemedText style={styles.previewTitle}>
							Current Theme: {themeLabels[themeName]}
						</ThemedText>
						<ThemedText style={styles.previewSubtitle}>
							Mode: {themeModeLabels[themeMode]}
						</ThemedText>
						<ThemedView style={styles.colorSamples} debugBorderType="quaternary">
							<View style={[styles.colorSample, { backgroundColor: theme.colors.primary }]} />
							<View style={[styles.colorSample, { backgroundColor: theme.colors.secondary }]} />
							<View style={[styles.colorSample, { backgroundColor: theme.colors.accent }]} />
						</ThemedView>
						<TouchableOpacity
							style={[styles.previewButton, { backgroundColor: theme.colors.primary }]}
						>
							<Text style={styles.previewButtonText}>Button</Text>
						</TouchableOpacity>
					</ThemedView>
				</ThemedView>

				{/* Developer Options Section */}
				<ThemedText style={[styles.sectionTitle, { marginTop: 20 }]}>Entwickleroptionen</ThemedText>
				<ThemedView style={styles.section} debugBorderType="primary">
					<ThemedView
						style={[
							styles.settingRow,
							{ backgroundColor: theme.colors.card, borderColor: theme.colors.border },
						]}
						debugBorderType="secondary"
					>
						<ThemedView style={styles.settingLabelContainer} debugBorderType="tertiary">
							<FontAwesome
								name="bug"
								size={16}
								color={theme.colors.text}
								style={styles.settingIcon}
							/>
							<ThemedText style={styles.settingLabel}>Debug Borders anzeigen</ThemedText>
						</ThemedView>
						<Switch
							value={debugBorders}
							onValueChange={setDebugBorders}
							trackColor={{ false: '#767577', true: theme.colors.primary }}
							thumbColor="#f4f3f4"
						/>
					</ThemedView>
					<ThemedText style={styles.settingDescription}>
						Zeigt Rahmen um UI-Elemente an, um das Layout zu debuggen
					</ThemedText>
				</ThemedView>

				{/* Account Section */}
				{user && (
					<>
						<ThemedText style={[styles.sectionTitle, { marginTop: 20 }]}>Account</ThemedText>
						<ThemedView style={styles.section} debugBorderType="primary">
							<ThemedView
								style={[
									styles.accountInfo,
									{ backgroundColor: theme.colors.card, borderColor: theme.colors.border },
								]}
								debugBorderType="secondary"
							>
								<ThemedView style={styles.accountInfoRow} debugBorderType="tertiary">
									<FontAwesome name="envelope" size={16} color={theme.colors.text} />
									<ThemedText style={styles.accountInfoText}>{user.email}</ThemedText>
								</ThemedView>
							</ThemedView>

							<TouchableOpacity
								style={[styles.logoutButton, { backgroundColor: '#ff3b30' }]}
								onPress={handleSignOut}
							>
								<FontAwesome name="sign-out" size={18} color="#fff" style={styles.buttonIcon} />
								<Text style={styles.logoutButtonText}>Abmelden</Text>
							</TouchableOpacity>
						</ThemedView>
					</>
				)}
			</ScrollView>
		</>
	);
}

const styles = StyleSheet.create({
	settingRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		marginBottom: 8,
	},
	settingLabelContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	settingLabel: {
		fontSize: 16,
		fontWeight: '500',
	},
	settingDescription: {
		fontSize: 14,
		marginLeft: 4,
		marginBottom: 16,
		opacity: 0.7,
	},
	settingIcon: {
		marginRight: 12,
	},
	accountInfo: {
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		marginBottom: 16,
	},
	accountInfoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 4,
	},
	accountInfoText: {
		fontSize: 16,
		marginLeft: 12,
	},
	logoutButton: {
		flexDirection: 'row',
		height: 50,
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	logoutButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	buttonIcon: {
		marginRight: 10,
	},
	container: {
		flex: 1,
	},
	contentContainer: {
		padding: 24,
		paddingBottom: 40,
	},
	sectionTitle: {
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 16,
	},
	section: {
		marginBottom: 24,
	},
	sectionHeader: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 12,
	},
	optionsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginHorizontal: -6,
	},
	optionButton: {
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 8,
		borderWidth: 1,
		marginHorizontal: 6,
		marginBottom: 12,
		minWidth: 100,
		alignItems: 'center',
	},
	optionText: {
		fontSize: 16,
		fontWeight: '500',
	},
	previewCard: {
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
	},
	previewTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	previewSubtitle: {
		fontSize: 14,
		marginBottom: 16,
	},
	colorSamples: {
		flexDirection: 'row',
		marginBottom: 16,
	},
	colorSample: {
		width: 30,
		height: 30,
		borderRadius: 15,
		marginRight: 8,
	},
	previewButton: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	previewButtonText: {
		color: 'white',
		fontWeight: '600',
	},
});
