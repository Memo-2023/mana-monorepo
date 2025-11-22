import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useTheme } from '../../utils/themeContext';

export default function ResetPasswordScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Only allow on web platform
    if (Platform.OS !== 'web') {
      Alert.alert('Nicht verfügbar', 'Diese Funktion ist nur in der Web-Version verfügbar');
      setTimeout(() => router.replace('/login'), 100);
      return;
    }
    verifyToken();
  }, []);

  const verifyToken = async () => {
    try {
      setVerifying(true);
      
      console.log('URL params:', params);
      
      // Check if access token is in the URL hash (Supabase puts it there)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        console.log('Hash params:', { access_token, type });
        
        if (access_token && type === 'recovery') {
          setAccessToken(access_token);
          setIsValidToken(true);
          setVerifying(false);
          return;
        }
      }
      
      // Check if access token is in regular params (sometimes it's there)
      const paramAccessToken = params.access_token as string;
      const paramType = params.type as string;
      
      if (paramAccessToken && paramType === 'recovery') {
        setAccessToken(paramAccessToken);
        setIsValidToken(true);
        setVerifying(false);
        return;
      }
      
      // If no access token found, check for error parameters
      const error = params.error as string;
      const error_description = params.error_description as string;
      
      if (error) {
        console.error('Auth error:', error, error_description);
        Alert.alert('Fehler', error_description || 'Ungültiger oder abgelaufener Link');
        setTimeout(() => router.replace('/login'), 100);
        return;
      }
      
      // If we get here, no valid token was found
      Alert.alert('Fehler', 'Ungültiger Wiederherstellungslink');
      setTimeout(() => router.replace('/login'), 100);
    } catch (error) {
      console.error('Token verification error:', error);
      Alert.alert('Fehler', 'Ungültiger oder abgelaufener Link');
      setTimeout(() => router.replace('/login'), 100);
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Fehler', 'Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Fehler', 'Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (!accessToken) {
      Alert.alert('Fehler', 'Kein gültiger Token gefunden');
      return;
    }

    setLoading(true);
    
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://mana-core-middleware-111768794939.europe-west3.run.app';
      const endpoint = `${apiUrl}/auth/update-password`;
      
      console.log('Calling update password endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: accessToken,
          newPassword: password
        }),
      });

      const data = await response.json();
      console.log('Update password response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Passwort konnte nicht zurückgesetzt werden');
      }

      Alert.alert(
        'Erfolg',
        'Ihr Passwort wurde erfolgreich zurückgesetzt. Sie können sich jetzt mit Ihrem neuen Passwort anmelden.',
        [
          {
            text: 'Zur Anmeldung',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Update password error:', error);
      Alert.alert('Fehler', error.message || 'Passwort konnte nicht zurückgesetzt werden');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
        <Stack.Screen options={{ title: 'Passwort zurücksetzen' }} />
        <ActivityIndicator size="large" color={isDarkMode ? '#BB86FC' : '#6366F1'} />
        <Text style={[styles.loadingText, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>
          Link wird überprüft...
        </Text>
      </View>
    );
  }

  if (!isValidToken) {
    return null;
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Passwort zurücksetzen',
          headerStyle: {
            backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
          },
          headerTintColor: isDarkMode ? '#F9FAFB' : '#1F2937',
        }} 
      />
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
        <View style={[styles.formContainer, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>
            Neues Passwort festlegen
          </Text>
          
          <Text style={[styles.subtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            Bitte geben Sie Ihr neues Passwort ein
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? '#2D2D2D' : '#F9FAFB',
                color: isDarkMode ? '#F9FAFB' : '#1F2937',
                borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
              },
            ]}
            placeholder="Neues Passwort"
            placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? '#2D2D2D' : '#F9FAFB',
                color: isDarkMode ? '#F9FAFB' : '#1F2937',
                borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
              },
            ]}
            placeholder="Passwort bestätigen"
            placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: isDarkMode ? '#BB86FC' : '#6366F1' },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Passwort zurücksetzen</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  formContainer: {
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});