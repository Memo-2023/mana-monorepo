import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/context/AuthProvider';
import { useEmailsStore } from '~/store/emailsStore';
import { useAppTheme } from '~/theme/ThemeProvider';
import { accountsApi } from '~/utils/api';

export default function AccountsScreen() {
	const { colors } = useTheme();
	const { isDarkMode } = useAppTheme();
	const router = useRouter();
	const { getToken } = useAuth();
	const { accounts, fetchAccounts, selectAccount } = useEmailsStore();

	const [showAddForm, setShowAddForm] = useState(false);
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		imapHost: '',
		imapPort: '993',
		smtpHost: '',
		smtpPort: '587',
		password: '',
	});

	const handleAddAccount = async () => {
		if (!formData.email || !formData.password || !formData.imapHost) {
			Alert.alert('Error', 'Please fill in all required fields');
			return;
		}

		setLoading(true);
		const token = await getToken();
		if (!token) {
			setLoading(false);
			return;
		}

		const result = await accountsApi.create(
			{
				name: formData.name || formData.email.split('@')[0],
				email: formData.email,
				provider: 'imap',
				imapHost: formData.imapHost,
				imapPort: parseInt(formData.imapPort, 10),
				smtpHost: formData.smtpHost || formData.imapHost.replace('imap', 'smtp'),
				smtpPort: parseInt(formData.smtpPort, 10),
				password: formData.password,
			},
			token
		);

		setLoading(false);

		if (result.error) {
			Alert.alert('Error', result.error.message);
			return;
		}

		await fetchAccounts(token);
		setShowAddForm(false);
		setFormData({
			name: '',
			email: '',
			imapHost: '',
			imapPort: '993',
			smtpHost: '',
			smtpPort: '587',
			password: '',
		});
		Alert.alert('Success', 'Account added successfully');
	};

	const handleDeleteAccount = async (id: string) => {
		Alert.alert('Delete Account', 'Are you sure you want to remove this email account?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					const token = await getToken();
					if (!token) return;

					const result = await accountsApi.delete(id, token);
					if (result.error) {
						Alert.alert('Error', result.error.message);
						return;
					}

					await fetchAccounts(token);
				},
			},
		]);
	};

	const handleSetDefault = async (id: string) => {
		const token = await getToken();
		if (!token) return;

		const result = await accountsApi.setDefault(id, token);
		if (result.error) {
			Alert.alert('Error', result.error.message);
			return;
		}

		selectAccount(id);
		await fetchAccounts(token);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<Stack.Screen
				options={{
					headerShown: true,
					headerTitle: 'Email Accounts',
					headerStyle: { backgroundColor: colors.card },
					headerTintColor: colors.text,
				}}
			/>

			<ScrollView>
				{/* Existing Accounts */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, { color: colors.text + '80' }]}>YOUR ACCOUNTS</Text>
					{accounts.map((account) => (
						<View key={account.id} style={[styles.accountItem, { backgroundColor: colors.card }]}>
							<View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
								<Ionicons
									name={
										account.provider === 'gmail'
											? 'logo-google'
											: account.provider === 'outlook'
												? 'logo-microsoft'
												: 'mail'
									}
									size={24}
									color={colors.primary}
								/>
							</View>
							<View style={styles.accountInfo}>
								<Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
								<Text style={[styles.accountEmail, { color: colors.text + '80' }]}>
									{account.email}
								</Text>
								<Text style={[styles.accountProvider, { color: colors.text + '60' }]}>
									{account.provider.toUpperCase()} • {account.syncEnabled ? 'Syncing' : 'Paused'}
								</Text>
							</View>
							<View style={styles.accountActions}>
								{!account.isDefault && (
									<TouchableOpacity
										style={styles.actionButton}
										onPress={() => handleSetDefault(account.id)}
									>
										<Ionicons name="star-outline" size={22} color={colors.text + '80'} />
									</TouchableOpacity>
								)}
								{account.isDefault && <Ionicons name="star" size={22} color="#f59e0b" />}
								<TouchableOpacity
									style={styles.actionButton}
									onPress={() => handleDeleteAccount(account.id)}
								>
									<Ionicons name="trash-outline" size={22} color="#ef4444" />
								</TouchableOpacity>
							</View>
						</View>
					))}
				</View>

				{/* Add Account Form */}
				{showAddForm ? (
					<View style={styles.section}>
						<Text style={[styles.sectionTitle, { color: colors.text + '80' }]}>
							ADD IMAP ACCOUNT
						</Text>
						<View style={[styles.formContainer, { backgroundColor: colors.card }]}>
							<View style={styles.inputGroup}>
								<Text style={[styles.inputLabel, { color: colors.text }]}>Display Name</Text>
								<TextInput
									style={[
										styles.input,
										{
											color: colors.text,
											backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
											borderColor: isDarkMode ? '#3A3A3C' : '#E5E5EA',
										},
									]}
									placeholder="My Email"
									placeholderTextColor={colors.text + '60'}
									value={formData.name}
									onChangeText={(text) => setFormData({ ...formData, name: text })}
								/>
							</View>

							<View style={styles.inputGroup}>
								<Text style={[styles.inputLabel, { color: colors.text }]}>Email Address *</Text>
								<TextInput
									style={[
										styles.input,
										{
											color: colors.text,
											backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
											borderColor: isDarkMode ? '#3A3A3C' : '#E5E5EA',
										},
									]}
									placeholder="you@example.com"
									placeholderTextColor={colors.text + '60'}
									value={formData.email}
									onChangeText={(text) => setFormData({ ...formData, email: text })}
									keyboardType="email-address"
									autoCapitalize="none"
								/>
							</View>

							<View style={styles.inputGroup}>
								<Text style={[styles.inputLabel, { color: colors.text }]}>IMAP Host *</Text>
								<TextInput
									style={[
										styles.input,
										{
											color: colors.text,
											backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
											borderColor: isDarkMode ? '#3A3A3C' : '#E5E5EA',
										},
									]}
									placeholder="imap.example.com"
									placeholderTextColor={colors.text + '60'}
									value={formData.imapHost}
									onChangeText={(text) => setFormData({ ...formData, imapHost: text })}
									autoCapitalize="none"
								/>
							</View>

							<View style={styles.inputGroup}>
								<Text style={[styles.inputLabel, { color: colors.text }]}>Password *</Text>
								<TextInput
									style={[
										styles.input,
										{
											color: colors.text,
											backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
											borderColor: isDarkMode ? '#3A3A3C' : '#E5E5EA',
										},
									]}
									placeholder="Password or App Password"
									placeholderTextColor={colors.text + '60'}
									value={formData.password}
									onChangeText={(text) => setFormData({ ...formData, password: text })}
									secureTextEntry
								/>
							</View>

							<View style={styles.formActions}>
								<TouchableOpacity
									style={[styles.cancelButton, { borderColor: colors.border }]}
									onPress={() => setShowAddForm(false)}
								>
									<Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.submitButton, { backgroundColor: colors.primary }]}
									onPress={handleAddAccount}
									disabled={loading}
								>
									{loading ? (
										<ActivityIndicator size="small" color="#fff" />
									) : (
										<Text style={styles.submitButtonText}>Add Account</Text>
									)}
								</TouchableOpacity>
							</View>
						</View>
					</View>
				) : (
					<View style={styles.section}>
						<TouchableOpacity
							style={[styles.addButton, { backgroundColor: colors.card }]}
							onPress={() => setShowAddForm(true)}
						>
							<View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
								<Ionicons name="add" size={24} color={colors.primary} />
							</View>
							<Text style={[styles.addButtonText, { color: colors.primary }]}>
								Add IMAP Account
							</Text>
						</TouchableOpacity>
					</View>
				)}
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
	accountItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(128, 128, 128, 0.2)',
	},
	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	accountInfo: {
		flex: 1,
	},
	accountName: {
		fontSize: 16,
		fontWeight: '600',
	},
	accountEmail: {
		fontSize: 14,
		marginTop: 2,
	},
	accountProvider: {
		fontSize: 12,
		marginTop: 4,
	},
	accountActions: {
		flexDirection: 'row',
	},
	actionButton: {
		padding: 8,
	},
	addButton: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		marginHorizontal: 16,
		borderRadius: 12,
	},
	addButtonText: {
		fontSize: 16,
		fontWeight: '500',
	},
	formContainer: {
		margin: 16,
		padding: 16,
		borderRadius: 12,
	},
	inputGroup: {
		marginBottom: 16,
	},
	inputLabel: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 16,
	},
	formActions: {
		flexDirection: 'row',
		marginTop: 8,
	},
	cancelButton: {
		flex: 1,
		paddingVertical: 12,
		borderWidth: 1,
		borderRadius: 8,
		alignItems: 'center',
		marginRight: 8,
	},
	cancelButtonText: {
		fontSize: 16,
		fontWeight: '500',
	},
	submitButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
		marginLeft: 8,
	},
	submitButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '500',
	},
});
