import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '~/hooks/useAuth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      setError('Bitte gib deine E-Mail-Adresse ein');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await resetPassword(email);

    if (error) {
      setError(error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 justify-center bg-white px-8">
        <View className="text-center">
          <Text className="mb-4 text-2xl font-bold text-gray-900">E-Mail gesendet!</Text>
          <Text className="mb-8 text-gray-600">
            Wir haben dir einen Link zum Zurücksetzen deines Passworts gesendet. Überprüfe deine
            E-Mails und folge den Anweisungen.
          </Text>

          <Link href="/(auth)/login" asChild>
            <Pressable className="rounded-lg bg-blue-600 px-4 py-3 active:bg-blue-700">
              <Text className="text-center font-semibold text-white">Zurück zum Login</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white">
      <View className="flex-1 justify-center px-8">
        <View className="mb-8">
          <Text className="mb-2 text-4xl font-bold text-gray-900">Passwort zurücksetzen</Text>
          <Text className="text-gray-600">
            Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen
          </Text>
        </View>

        {error && (
          <View className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <Text className="text-red-700">{error}</Text>
          </View>
        )}

        <View className="space-y-4">
          <View>
            <Text className="mb-1 text-sm font-medium text-gray-700">E-Mail</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="deine@email.de"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-lg border border-gray-300 px-4 py-3 text-base"
            />
          </View>

          <Pressable
            onPress={handleResetPassword}
            disabled={loading}
            className={`rounded-lg px-4 py-3 ${
              loading ? 'bg-gray-400' : 'bg-blue-600 active:bg-blue-700'
            }`}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center text-base font-semibold text-white">
                Reset-Link senden
              </Text>
            )}
          </Pressable>

          <View className="mt-4 flex-row justify-center">
            <Text className="text-gray-600">Erinnerst du dich wieder? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="font-medium text-blue-600">Anmelden</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
