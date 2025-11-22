import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authService } from '../../src/services/authService';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Text from '../atoms/Text';

export const AppleSignInButton: React.FC = () => {
  const router = useRouter();
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
        Alert.alert('Anmeldefehler', 'Kein Identity-Token von Apple erhalten');
        return;
      }

      console.log('[AppleSignIn] Got Apple identity token');

      // Send to backend for validation
      const result = await authService.signInWithApple(identityToken);

      if (result.success) {
        console.log('[AppleSignIn] Sign-in successful, auth state will trigger navigation');
        // Don't navigate manually - let _layout.tsx handle navigation based on auth state
        // This prevents conflicts with the automatic navigation system
      } else {
        Alert.alert('Anmeldefehler', result.error || 'Unbekannter Fehler');
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('[AppleSignIn] User cancelled Apple sign-in');
      } else {
        console.error('[AppleSignIn] Error:', error);
        Alert.alert('Anmeldefehler', error.message || 'Fehler bei der Apple-Anmeldung');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleAppleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <FontAwesome name="apple" size={20} color="#fff" />
          <Text variant="body" color="#fff" style={styles.buttonText}>
            Mit Apple anmelden
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
    backgroundColor: '#000000',
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
