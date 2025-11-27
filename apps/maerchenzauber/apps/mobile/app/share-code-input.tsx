import React, { useState } from 'react';
import {
	View,
	StyleSheet,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Text from '../components/atoms/Text';
import Icon from '../components/atoms/Icon';
import Button from '../components/atoms/Button';
import CommonHeader from '../components/molecules/CommonHeader';

export default function ShareCodeInputScreen() {
	const router = useRouter();
	const [shareCode, setShareCode] = useState('');
	const [error, setError] = useState('');

	const handleSubmit = () => {
		const trimmedCode = shareCode.trim().toUpperCase();

		if (!trimmedCode) {
			setError('Bitte gib einen Share-Code ein');
			return;
		}

		if (trimmedCode.length < 4) {
			setError('Der Share-Code muss mindestens 4 Zeichen lang sein');
			return;
		}

		// Navigate to the share code screen with the code
		router.replace(`/share/${trimmedCode}`);
	};

	const handleCodeChange = (text: string) => {
		setShareCode(text);
		if (error) setError('');
	};

	const handlePaste = async () => {
		try {
			const text = await Clipboard.getStringAsync();
			if (text) {
				setShareCode(text);
				setError('');
			}
		} catch (err) {
			console.log('Clipboard not available or paste failed');
		}
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<CommonHeader title="Share-Code eingeben" showBackButton />

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.keyboardView}
			>
				<View style={styles.container}>
					<View style={styles.content}>
						<View style={styles.iconContainer}>
							<Icon set="ionicons" name="share-social-outline" size={64} color="#FFD700" />
						</View>

						<Text style={styles.title}>Charakter-Code eingeben</Text>
						<Text style={styles.description}>
							Gib den Share-Code ein, den du von einem Freund erhalten hast, um seinen Charakter zu
							deiner Sammlung hinzuzufügen.
						</Text>

						<View style={styles.inputContainer}>
							<TextInput
								style={styles.input}
								value={shareCode}
								onChangeText={handleCodeChange}
								placeholder="z.B. ABC123"
								placeholderTextColor="#666666"
								autoCapitalize="characters"
								autoCorrect={false}
								maxLength={10}
								returnKeyType="done"
								onSubmitEditing={handleSubmit}
							/>
							{shareCode.length === 0 && (
								<TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
									<Ionicons name="clipboard-outline" size={20} color="#FFD700" />
									<Text style={styles.pasteText}>Einfügen</Text>
								</TouchableOpacity>
							)}
						</View>

						{error ? <Text style={styles.errorText}>{error}</Text> : null}

						<View style={styles.infoBox}>
							<Ionicons name="information-circle-outline" size={20} color="#FFD700" />
							<Text style={styles.infoText}>
								Share-Codes sind in der Regel 6-stellig und bestehen aus Buchstaben und Zahlen
							</Text>
						</View>
					</View>

					<View style={styles.actions}>
						<Button
							title="Charakter laden"
							onPress={handleSubmit}
							variant="primary"
							size="lg"
							disabled={!shareCode.trim()}
							style={styles.button}
						/>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#181818',
	},
	keyboardView: {
		flex: 1,
	},
	container: {
		flex: 1,
		padding: 16,
		maxWidth: 600,
		width: '100%',
		alignSelf: 'center',
		justifyContent: 'space-between',
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingBottom: 40,
	},
	iconContainer: {
		marginBottom: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#FFFFFF',
		marginBottom: 12,
		textAlign: 'center',
	},
	description: {
		fontSize: 16,
		color: '#A0A0A0',
		textAlign: 'center',
		marginBottom: 32,
		paddingHorizontal: 20,
		lineHeight: 22,
	},
	inputContainer: {
		width: '100%',
		maxWidth: 300,
		marginBottom: 16,
		position: 'relative',
	},
	input: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 12,
		padding: 16,
		fontSize: 20,
		fontWeight: '600',
		color: '#FFFFFF',
		textAlign: 'center',
		letterSpacing: 2,
		borderWidth: 1,
		borderColor: 'rgba(255, 215, 0, 0.3)',
	},
	pasteButton: {
		position: 'absolute',
		right: 12,
		top: '50%',
		transform: [{ translateY: -12 }],
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 215, 0, 0.1)',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		gap: 4,
	},
	pasteText: {
		fontSize: 12,
		color: '#FFD700',
		fontWeight: '600',
	},
	errorText: {
		color: '#FF4444',
		fontSize: 14,
		marginTop: 8,
		textAlign: 'center',
	},
	infoBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 215, 0, 0.05)',
		padding: 12,
		borderRadius: 8,
		marginTop: 24,
		maxWidth: 350,
		gap: 8,
	},
	infoText: {
		flex: 1,
		fontSize: 12,
		color: '#A0A0A0',
		lineHeight: 16,
	},
	actions: {
		paddingBottom: 20,
	},
	button: {
		width: '100%',
	},
});
