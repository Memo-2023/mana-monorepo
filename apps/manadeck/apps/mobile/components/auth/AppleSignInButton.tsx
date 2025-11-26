import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { Text } from '~/components/ui/Text';
import { useThemeColors } from '~/utils/themeUtils';
import { Ionicons } from '@expo/vector-icons';

interface AppleSignInButtonProps {
  onSignInSuccess?: () => void;
  onSignInError?: (error: string) => void;
  onSignIn: (identityToken: string) => Promise<void>;
}

export const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({
  onSignInSuccess,
  onSignInError,
  onSignIn,
}) => {
  const colors = useThemeColors();
  const [isLoading, setIsLoading] = useState(false);

  // Apple Sign-In is iOS only
  if (Platform.OS !== 'ios') {
    return null;
  }

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      // Trigger Apple Sign-In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const identityToken = credential.identityToken;

      if (!identityToken) {
        Alert.alert('Anmeldung fehlgeschlagen', 'Kein Identity Token von Apple erhalten');
        if (onSignInError) {
          onSignInError('Kein Identity Token erhalten');
        }
        return;
      }

      console.log('Got Apple identity token');

      // Send to backend for validation
      await onSignIn(identityToken);

      if (onSignInSuccess) {
        onSignInSuccess();
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('User cancelled Apple sign-in');
      } else {
        console.error('Apple Sign-In Error:', error);
        const errorMessage = error.message || 'Anmeldung mit Apple fehlgeschlagen';
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
      style={[styles.button, { backgroundColor: '#000000' }]}
      onPress={handleAppleSignIn}
      disabled={isLoading}
      activeOpacity={0.7}>
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <Ionicons name="logo-apple" size={20} color="#FFFFFF" style={styles.icon} />
          <Text style={styles.buttonText}>Mit Apple anmelden</Text>
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
    minHeight: 52,
  },
  icon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
