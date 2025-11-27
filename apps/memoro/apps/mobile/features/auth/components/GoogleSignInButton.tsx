import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { AntDesign } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '~/features/theme/ThemeProvider';

// Configure Google Sign-In

// Based on troubleshooting, for Android we only need webClientId
// The androidClientId should NOT be used in the configure method
GoogleSignin.configure({
	webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID, // Web client ID (for Android)
	iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // iOS-specific client ID
	scopes: ['profile', 'email'],
	offlineAccess: false, // Setting to false based on troubleshooting recommendations
});

type GoogleSignInButtonProps = {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
};

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onSuccess, onError }) => {
	const { loading } = useAuth();
	const { isDark } = useTheme();

	const signInWithGoogle = async () => {
		try {
			// Check if Play Services are available (Android only)
			await GoogleSignin.hasPlayServices();

			// Perform the sign-in
			const userInfo = await GoogleSignin.signIn();

			// Get the ID token from the user info
			const { idToken } = await GoogleSignin.getTokens();
			console.log('Google Sign-In successful, received ID token');

			// Extract nonce from the ID token if present
			let nonce = null;
			try {
				// Decode the ID token to extract the nonce
				const payload = JSON.parse(atob(idToken.split('.')[1]));
				nonce = payload.nonce || null;
				console.log('Extracted nonce from ID token:', nonce);
			} catch (e) {
				console.error('Error extracting nonce from ID token:', e);
			}

			// Check if we have an ID token
			if (idToken) {
				// Use our custom auth service to authenticate with the mana-middleware
				const result = await authService.signInWithGoogle(idToken);

				if (!result.success) {
					console.error('Error signing in with Google:', result.error);
					onError?.(new Error(result.error || 'Failed to authenticate with Google'));
					return;
				}

				console.log('Successfully signed in with Google');

				// Get user data from token to update the auth context
				try {
					const userData = await authService.getUserFromToken();
					if (userData) {
						// Navigate to home screen with navigation stack reset
						router.dismissAll();
						router.replace('/');
					}
				} catch (err) {
					console.error('Error getting user data after Google Sign-In:', err);
				}

				onSuccess?.();
			} else {
				throw new Error('No ID token present in Google Sign-In response');
			}
		} catch (error: any) {
			if (error.code === statusCodes.SIGN_IN_CANCELLED) {
				// User cancelled the login flow
				console.log('User cancelled the login flow');
			} else if (error.code === statusCodes.IN_PROGRESS) {
				// Operation is in progress already
				console.log('Google Sign-In operation is in progress');
			} else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
				// Play services not available or outdated
				console.log('Google Play Services not available or outdated');
			} else {
				// Some other error happened
				console.error('Error during Google Sign-In:', error);
				onError?.(error);
			}
		}
	};

	return (
		<View style={styles.container}>
			<TouchableOpacity
				style={[
					styles.googleButton,
					{
						backgroundColor: isDark ? '#2c2c2c' : '#ffffff',
						borderColor: isDark ? '#404040' : '#dadce0',
					},
				]}
				onPress={signInWithGoogle}
				disabled={loading}
			>
				<View style={styles.buttonContent}>
					<View style={styles.googleIconContainer}>
						<AntDesign name="google" size={20} color="#4285f4" />
					</View>
					<Text style={[styles.buttonText, { color: isDark ? '#ffffff' : '#3c4043' }]}>
						Mit Google anmelden
					</Text>
				</View>
			</TouchableOpacity>
			{loading && (
				<View style={styles.loadingOverlay}>
					<ActivityIndicator size="small" color="#fff" />
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		width: '100%',
	},
	googleButton: {
		width: '100%',
		height: 56,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#dadce0',
		backgroundColor: '#ffffff',
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	googleIconContainer: {
		width: 20,
		height: 20,
		marginRight: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonText: {
		fontSize: 16,
		fontWeight: '500',
		color: '#3c4043',
	},
	loadingOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 8,
	},
});

export default GoogleSignInButton;
