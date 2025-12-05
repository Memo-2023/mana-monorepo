import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/context/AuthProvider';
import { useComposeStore } from '~/store/composeStore';
import { useEmailsStore } from '~/store/emailsStore';
import { useAppTheme } from '~/theme/ThemeProvider';

export default function ComposeScreen() {
	const { colors } = useTheme();
	const { isDarkMode } = useAppTheme();
	const router = useRouter();
	const { getToken } = useAuth();
	const { selectedAccountId, accounts } = useEmailsStore();
	const {
		subject,
		toAddresses,
		ccAddresses,
		bodyHtml,
		sending,
		loading,
		updateForm,
		saveDraft,
		send,
		closeCompose,
	} = useComposeStore();

	const [showCc, setShowCc] = useState(ccAddresses.length > 0);
	const [toInput, setToInput] = useState(toAddresses.map((a) => a.email).join(', '));
	const [ccInput, setCcInput] = useState(ccAddresses.map((a) => a.email).join(', '));
	const [bodyText, setBodyText] = useState(bodyHtml || '');

	const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

	const parseEmailAddresses = (input: string) => {
		return input
			.split(',')
			.map((email) => email.trim())
			.filter((email) => email.length > 0)
			.map((email) => ({ email }));
	};

	const handleSend = async () => {
		const to = parseEmailAddresses(toInput);
		if (to.length === 0) {
			Alert.alert('Error', 'Please add at least one recipient');
			return;
		}

		updateForm({
			accountId: selectedAccountId || '',
			toAddresses: to,
			ccAddresses: parseEmailAddresses(ccInput),
			subject,
			bodyHtml: bodyText,
		});

		const token = await getToken();
		if (!token) return;

		const success = await send(token);
		if (success) {
			router.back();
		}
	};

	const handleSaveDraft = async () => {
		updateForm({
			accountId: selectedAccountId || '',
			toAddresses: parseEmailAddresses(toInput),
			ccAddresses: parseEmailAddresses(ccInput),
			subject,
			bodyHtml: bodyText,
		});

		const token = await getToken();
		if (!token) return;

		const draft = await saveDraft(token);
		if (draft) {
			Alert.alert('Saved', 'Draft has been saved');
		}
	};

	const handleClose = () => {
		if (toInput || subject || bodyText) {
			Alert.alert('Discard Draft?', 'Do you want to save this email as a draft?', [
				{
					text: 'Discard',
					style: 'destructive',
					onPress: () => {
						closeCompose();
						router.back();
					},
				},
				{
					text: 'Save Draft',
					onPress: async () => {
						await handleSaveDraft();
						router.back();
					},
				},
				{ text: 'Cancel', style: 'cancel' },
			]);
		} else {
			closeCompose();
			router.back();
		}
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<Stack.Screen
					options={{
						headerShown: true,
						headerTitle: 'New Message',
						headerStyle: { backgroundColor: colors.card },
						headerTintColor: colors.text,
						headerLeft: () => (
							<TouchableOpacity onPress={handleClose} style={styles.headerButton}>
								<Ionicons name="close" size={24} color={colors.text} />
							</TouchableOpacity>
						),
						headerRight: () => (
							<View style={styles.headerActions}>
								<TouchableOpacity
									onPress={handleSaveDraft}
									style={styles.headerButton}
									disabled={loading}
								>
									<Ionicons name="save-outline" size={24} color={colors.text} />
								</TouchableOpacity>
								<TouchableOpacity
									onPress={handleSend}
									style={[styles.sendButton, { backgroundColor: colors.primary }]}
									disabled={sending}
								>
									{sending ? (
										<ActivityIndicator size="small" color="#fff" />
									) : (
										<Ionicons name="send" size={20} color="#fff" />
									)}
								</TouchableOpacity>
							</View>
						),
					}}
				/>

				<ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
					{/* From */}
					<View style={[styles.field, { borderBottomColor: colors.border }]}>
						<Text style={[styles.fieldLabel, { color: colors.text + '80' }]}>From</Text>
						<Text style={[styles.fromEmail, { color: colors.text }]}>
							{selectedAccount?.email || 'Select account'}
						</Text>
					</View>

					{/* To */}
					<View style={[styles.field, { borderBottomColor: colors.border }]}>
						<Text style={[styles.fieldLabel, { color: colors.text + '80' }]}>To</Text>
						<TextInput
							style={[styles.fieldInput, { color: colors.text }]}
							placeholder="Recipients"
							placeholderTextColor={colors.text + '60'}
							value={toInput}
							onChangeText={setToInput}
							keyboardType="email-address"
							autoCapitalize="none"
						/>
						{!showCc && (
							<TouchableOpacity onPress={() => setShowCc(true)}>
								<Text style={[styles.ccToggle, { color: colors.primary }]}>Cc</Text>
							</TouchableOpacity>
						)}
					</View>

					{/* Cc */}
					{showCc && (
						<View style={[styles.field, { borderBottomColor: colors.border }]}>
							<Text style={[styles.fieldLabel, { color: colors.text + '80' }]}>Cc</Text>
							<TextInput
								style={[styles.fieldInput, { color: colors.text }]}
								placeholder="Cc recipients"
								placeholderTextColor={colors.text + '60'}
								value={ccInput}
								onChangeText={setCcInput}
								keyboardType="email-address"
								autoCapitalize="none"
							/>
						</View>
					)}

					{/* Subject */}
					<View style={[styles.field, { borderBottomColor: colors.border }]}>
						<Text style={[styles.fieldLabel, { color: colors.text + '80' }]}>Subject</Text>
						<TextInput
							style={[styles.fieldInput, { color: colors.text }]}
							placeholder="Subject"
							placeholderTextColor={colors.text + '60'}
							value={subject}
							onChangeText={(text) => updateForm({ subject: text })}
						/>
					</View>

					{/* Body */}
					<View style={styles.bodyContainer}>
						<TextInput
							style={[styles.bodyInput, { color: colors.text }]}
							placeholder="Compose email"
							placeholderTextColor={colors.text + '60'}
							value={bodyText}
							onChangeText={setBodyText}
							multiline
							textAlignVertical="top"
						/>
					</View>
				</ScrollView>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	headerButton: {
		padding: 8,
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	sendButton: {
		marginLeft: 12,
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	content: {
		flex: 1,
	},
	field: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	fieldLabel: {
		width: 60,
		fontSize: 14,
	},
	fieldInput: {
		flex: 1,
		fontSize: 16,
	},
	fromEmail: {
		flex: 1,
		fontSize: 16,
	},
	ccToggle: {
		fontSize: 14,
		fontWeight: '600',
		paddingHorizontal: 8,
	},
	bodyContainer: {
		flex: 1,
		minHeight: 300,
	},
	bodyInput: {
		flex: 1,
		fontSize: 16,
		padding: 16,
		lineHeight: 24,
	},
});
