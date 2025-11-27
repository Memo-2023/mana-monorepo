import React, { useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { authService } from '../../src/services/authService';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { AntDesign } from '@expo/vector-icons';
import Text from '../atoms/Text';

export const GoogleSignInButton: React.FC = () => {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		// Configure Google Sign-In
		// Get iOS client ID from app.json config
		const iosClientId = Constants.expoConfig?.ios?.config?.googleSignIn?.reservedClientId;

		GoogleSignin.configure({
			webClientId:
				process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
				'111768794939-uu9b50hlh1mmsd1v8pdm4s58o04lqh22.apps.googleusercontent.com',
			iosClientId:
				iosClientId || '111768794939-dtmimmtn6op11a39bo1v4o7et4h913dd.apps.googleusercontent.com',
			scopes: ['profile', 'email'],
			offlineAccess: false,
		});

		console.log('[GoogleSignIn] Configured with:', {
			webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ? 'from env' : 'fallback',
			iosClientId: iosClientId ? 'from app.json' : 'fallback',
		});
	}, []);

	const handleGoogleSignIn = async () => {
		setIsLoading(true);
		try {
			// Check Google Play Services (Android only)
			if (Platform.OS === 'android') {
				await GoogleSignin.hasPlayServices();
			}

			// Trigger Google Sign-In
			await GoogleSignin.signIn();

			// Get ID token
			const tokens = await GoogleSignin.getTokens();
			const idToken = tokens.idToken;

			console.log('[GoogleSignIn] Got Google ID token');

			// Send to backend for validation
			const result = await authService.signInWithGoogle(idToken);

			if (result.success) {
				console.log('[GoogleSignIn] Sign-in successful, auth state will trigger navigation');
				// Don't navigate manually - let _layout.tsx handle navigation based on auth state
				// This prevents conflicts with the automatic navigation system
			} else {
				Alert.alert('Anmeldefehler', result.error || 'Unbekannter Fehler');
			}
		} catch (error: any) {
			// Handle specific error codes
			if (error.code === statusCodes.SIGN_IN_CANCELLED) {
				console.log('[GoogleSignIn] User cancelled sign-in');
			} else if (error.code === statusCodes.IN_PROGRESS) {
				console.log('[GoogleSignIn] Sign-in already in progress');
			} else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
				Alert.alert(
					'Google Play Services',
					'Google Play Services ist nicht verfügbar oder veraltet. Bitte aktualisiere es.'
				);
			} else {
				console.error('[GoogleSignIn] Error:', error);
				Alert.alert('Anmeldefehler', error.message || 'Fehler bei der Google-Anmeldung');
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<TouchableOpacity style={styles.button} onPress={handleGoogleSignIn} disabled={isLoading}>
			{isLoading ? (
				<ActivityIndicator color="#fff" />
			) : (
				<>
					<AntDesign name="google" size={20} color="#fff" />
					<Text variant="body" color="#fff" style={styles.buttonText}>
						Mit Google anmelden
					</Text>
				</>
			)}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#4285F4',
		height: 50,
		borderRadius: 10,
		paddingHorizontal: 16,
		gap: 10,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.2)',
	},
	buttonText: {
		fontSize: 16,
		fontWeight: '600',
	},
});
