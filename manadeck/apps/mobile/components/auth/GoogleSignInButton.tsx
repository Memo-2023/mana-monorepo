import React, { useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import { Text } from '~/components/ui/Text';
import { useThemeColors } from '~/utils/themeUtils';
import { Ionicons } from '@expo/vector-icons';

interface GoogleSignInButtonProps {
  onSignInSuccess?: () => void;
  onSignInError?: (error: string) => void;
  onSignIn: (idToken: string) => Promise<void>;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSignInSuccess,
  onSignInError,
  onSignIn,
}) => {
  const colors = useThemeColors();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      scopes: ['profile', 'email'],
      offlineAccess: false,
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

      console.log('Got Google ID token');

      // Send to backend for validation
      await onSignIn(idToken);

      if (onSignInSuccess) {
        onSignInSuccess();
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);

      // Handle specific error codes
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled sign-in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign-in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(
          'Google Play Services',
          'Google Play Services ist nicht verfügbar oder veraltet. Bitte aktualisieren Sie es.'
        );
        if (onSignInError) {
          onSignInError('Google Play Services nicht verfügbar');
        }
      } else {
        const errorMessage = error.message || 'Anmeldung mit Google fehlgeschlagen';
        Alert.alert('Anmeldefehler', errorMessage);
        if (onSignInError) {
          onSignInError(errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: '#FFFFFF', borderColor: colors.border }]}
      onPress={handleGoogleSignIn}
      disabled={isLoading}
      activeOpacity={0.7}>
      {isLoading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#4285F4" style={styles.icon} />
          <Text style={[styles.buttonText, { color: colors.foreground }]}>
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
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 52,
  },
  icon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
