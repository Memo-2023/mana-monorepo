import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/context/AuthProvider';
import { useAppTheme } from '~/theme/ThemeProvider';
import { useEmailsStore } from '~/store/emailsStore';

export default function SettingsScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const { signOut } = useAuth();
	const { isDarkMode, themeMode, setThemeMode, toggleTheme } = useAppTheme();
	const { accounts } = useEmailsStore();

	const handleLogout = async () => {
		Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Sign Out',
				style: 'destructive',
				onPress: async () => {
					await signOut();
					router.replace('/auth/login');
				},
			},
		]);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<Stack.Screen
				options={{
					headerShown: true,
					headerTitle: 'Settings',
					headerStyle: { backgroundColor: colors.card },
					headerTintColor: colors.text,
				}}
			/>

			<ScrollView>
				{/* Accounts Section */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, { color: colors.text + '80' }]}>EMAIL ACCOUNTS</Text>
					{accounts.map((account) => (
						<TouchableOpacity
							key={account.id}
							style={[styles.item, { backgroundColor: colors.card }]}
							onPress={() => router.push('/accounts')}
						>
							<View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
								<Ionicons
									name={
										account.provider === 'gmail'
											? 'logo-google'
											: account.provider === 'outlook'
												? 'logo-microsoft'
												: 'mail'
									}
									size={20}
									color={colors.primary}
								/>
							</View>
							<View style={styles.itemContent}>
								<Text style={[styles.itemTitle, { color: colors.text }]}>{account.name}</Text>
								<Text style={[styles.itemSubtitle, { color: colors.text + '80' }]}>
									{account.email}
								</Text>
							</View>
							{account.isDefault && (
								<View style={[styles.defaultBadge, { backgroundColor: colors.primary + '20' }]}>
									<Text style={[styles.defaultBadgeText, { color: colors.primary }]}>Default</Text>
								</View>
							)}
							<Ionicons name="chevron-forward" size={20} color={colors.text + '60'} />
						</TouchableOpacity>
					))}
					<TouchableOpacity
						style={[styles.item, { backgroundColor: colors.card }]}
						onPress={() => router.push('/accounts')}
					>
						<View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
							<Ionicons name="add" size={20} color={colors.primary} />
						</View>
						<Text style={[styles.itemTitle, { color: colors.primary }]}>Add Account</Text>
					</TouchableOpacity>
				</View>

				{/* Appearance Section */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, { color: colors.text + '80' }]}>APPEARANCE</Text>
					<View style={[styles.item, { backgroundColor: colors.card }]}>
						<View style={[styles.iconContainer, { backgroundColor: '#f59e0b20' }]}>
							<Ionicons name="moon" size={20} color="#f59e0b" />
						</View>
						<Text style={[styles.itemTitle, { color: colors.text }]}>Dark Mode</Text>
						<Switch
							value={isDarkMode}
							onValueChange={toggleTheme}
							trackColor={{ false: '#767577', true: colors.primary + '80' }}
							thumbColor={isDarkMode ? colors.primary : '#f4f3f4'}
						/>
					</View>
					<TouchableOpacity
						style={[styles.item, { backgroundColor: colors.card }]}
						onPress={() => {
							Alert.alert('Theme Mode', 'Choose theme mode', [
								{ text: 'Light', onPress: () => setThemeMode('light') },
								{ text: 'Dark', onPress: () => setThemeMode('dark') },
								{ text: 'System', onPress: () => setThemeMode('system') },
								{ text: 'Cancel', style: 'cancel' },
							]);
						}}
					>
						<View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
							<Ionicons name="color-palette" size={20} color={colors.primary} />
						</View>
						<View style={styles.itemContent}>
							<Text style={[styles.itemTitle, { color: colors.text }]}>Theme Mode</Text>
							<Text style={[styles.itemSubtitle, { color: colors.text + '80' }]}>
								{themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
							</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color={colors.text + '60'} />
					</TouchableOpacity>
				</View>

				{/* About Section */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, { color: colors.text + '80' }]}>ABOUT</Text>
					<View style={[styles.item, { backgroundColor: colors.card }]}>
						<View style={[styles.iconContainer, { backgroundColor: '#22c55e20' }]}>
							<Ionicons name="information-circle" size={20} color="#22c55e" />
						</View>
						<View style={styles.itemContent}>
							<Text style={[styles.itemTitle, { color: colors.text }]}>Version</Text>
							<Text style={[styles.itemSubtitle, { color: colors.text + '80' }]}>1.0.0</Text>
						</View>
					</View>
				</View>

				{/* Sign Out */}
				<View style={styles.section}>
					<TouchableOpacity
						style={[styles.item, styles.dangerItem, { backgroundColor: colors.card }]}
						onPress={handleLogout}
					>
						<View style={[styles.iconContainer, { backgroundColor: '#ef444420' }]}>
							<Ionicons name="log-out" size={20} color="#ef4444" />
						</View>
						<Text style={[styles.itemTitle, { color: '#ef4444' }]}>Sign Out</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	section: {
		marginTop: 24,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: '600',
		paddingHorizontal: 16,
		marginBottom: 8,
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(128, 128, 128, 0.2)',
	},
	iconContainer: {
		width: 36,
		height: 36,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	itemContent: {
		flex: 1,
	},
	itemTitle: {
		fontSize: 16,
	},
	itemSubtitle: {
		fontSize: 13,
		marginTop: 2,
	},
	defaultBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
		marginRight: 8,
	},
	defaultBadgeText: {
		fontSize: 12,
		fontWeight: '500',
	},
	dangerItem: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: 'rgba(128, 128, 128, 0.2)',
	},
});
