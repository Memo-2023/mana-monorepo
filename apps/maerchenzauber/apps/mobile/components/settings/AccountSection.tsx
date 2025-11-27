import React, { useState } from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../atoms/Button';
import Text from '../atoms/Text';
import { ParentalGate } from '../../src/components/ParentalGate';
import { useParentalGate } from '../../src/hooks/useParentalGate';

interface AccountSectionProps {
	email?: string;
	onLogout: () => void;
	isWideScreen?: boolean;
}

export default function AccountSection({
	email,
	onLogout,
	isWideScreen = false,
}: AccountSectionProps) {
	const router = useRouter();
	const { isVisible, config, setIsVisible, openEmailWithGate, openExternalLinkWithGate } =
		useParentalGate();

	const dynamicStyles = {
		userInfo: {
			padding: isWideScreen ? 20 : 16,
			marginBottom: isWideScreen ? 20 : 16,
		},
		button: {
			marginBottom: isWideScreen ? 12 : 8,
		},
	};

	const handleContactPress = () => {
		openEmailWithGate('kontakt@memoro.ai');
	};

	const handleFeedbackPress = () => {
		router.push('/feedback');
	};

	const handlePrivacyPress = () => {
		openExternalLinkWithGate('https://märchen-zauber.de/privacy', {
			title: 'Datenschutzerklärung öffnen',
			message: 'Um die Datenschutzerklärung zu öffnen, löse bitte diese Rechenaufgabe:',
		});
	};

	const handleTermsPress = () => {
		openExternalLinkWithGate('https://märchen-zauber.de/terms', {
			title: 'AGB öffnen',
			message: 'Um die AGB zu öffnen, löse bitte diese Rechenaufgabe:',
		});
	};

	const handleDeleteAccount = () => {
		Alert.alert(
			'Account löschen',
			'Möchtest du deinen Account wirklich löschen? Alle deine Geschichten und Charaktere werden dauerhaft gelöscht.\n\nBitte kontaktiere unseren Support, um dein Konto zu löschen.',
			[
				{
					text: 'Abbrechen',
					style: 'cancel',
				},
				{
					text: 'Support kontaktieren',
					style: 'destructive',
					onPress: () => {
						openEmailWithGate(
							'kontakt@memoro.ai',
							'Account Deletion Request',
							`Hallo,\n\nIch möchte meinen Account löschen.\n\nE-Mail: ${email}\n\nBitte löscht alle meine Daten gemäß DSGVO.\n\nVielen Dank`
						);
					},
				},
			]
		);
	};

	return (
		<View style={styles.container}>
			<ParentalGate
				visible={isVisible}
				onSuccess={() => {
					setIsVisible(false);
					config.onSuccess?.();
				}}
				onCancel={() => setIsVisible(false)}
				title={config.title}
				message={config.message}
			/>

			<View style={[styles.userInfo, dynamicStyles.userInfo]}>
				<Text style={styles.label}>E-Mail</Text>
				<Text style={styles.email}>{email}</Text>
			</View>

			<Button
				title="Feedback & Wünsche"
				onPress={handleFeedbackPress}
				color="#4A9EFF"
				iconName="bubble.left"
				iconSet="sf-symbols"
				iconPosition="left"
				style={[styles.feedbackButton, dynamicStyles.button]}
			/>

			<Button
				title="Support kontaktieren"
				onPress={handleContactPress}
				color="#333333"
				iconName="envelope"
				iconSet="sf-symbols"
				iconPosition="left"
				style={[styles.contactButton, dynamicStyles.button]}
			/>

			<View style={styles.legalLinksContainer}>
				<Button
					title="Datenschutzerklärung"
					onPress={handlePrivacyPress}
					color="#444444"
					iconName="shield"
					iconSet="sf-symbols"
					iconPosition="left"
					style={[styles.legalButton, dynamicStyles.button]}
				/>

				<Button
					title="AGB"
					onPress={handleTermsPress}
					color="#444444"
					iconName="doc.text"
					iconSet="sf-symbols"
					iconPosition="left"
					style={[styles.legalButton, dynamicStyles.button]}
				/>
			</View>

			<Button
				title="Account löschen"
				onPress={handleDeleteAccount}
				color="#FF3B30"
				iconName="trash"
				iconSet="sf-symbols"
				iconPosition="left"
				style={[styles.deleteButton, dynamicStyles.button]}
			/>

			<Button
				title="Abmelden"
				onPress={onLogout}
				color="#333333"
				iconName="rectangle.portrait.and.arrow.right"
				iconSet="sf-symbols"
				iconPosition="left"
				style={[styles.logoutButton, dynamicStyles.button]}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
	},
	userInfo: {
		backgroundColor: '#222',
		borderRadius: 12,
	},
	label: {
		color: '#999999',
		fontSize: 14,
		marginBottom: 4,
	},
	email: {
		color: '#fff',
		fontSize: 16,
	},
	feedbackButton: {
		marginTop: 8,
	},
	contactButton: {
		marginTop: 8,
	},
	legalLinksContainer: {
		marginTop: 16,
		marginBottom: 8,
	},
	legalButton: {
		marginTop: 8,
	},
	deleteButton: {
		marginTop: 16,
	},
	logoutButton: {
		marginTop: 8,
	},
});
