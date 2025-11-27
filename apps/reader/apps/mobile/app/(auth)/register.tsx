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
import { Link, router } from 'expo-router';
import { useAuth } from '~/hooks/useAuth';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Bitte fülle alle Felder aus');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await signUp(email, password);

    if (error) {
      setError(error);
      setLoading(false);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white">
      <View className="flex-1 justify-center px-8">
        <View className="mb-8">
          <Text className="mb-2 text-4xl font-bold text-gray-900">Konto erstellen</Text>
          <Text className="text-gray-600">Registriere dich für Reader</Text>
        </View>

        {error && (
          <View className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <Text className="text-red-700">{error}</Text>
          </View>
        )}

        <View className="space-y-4">
          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-gray-700">E-Mail</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="deine@email.de"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
              accessibilityLabel="E-Mail eingeben"
              className="rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-gray-700">Passwort</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Mindestens 6 Zeichen"
              secureTextEntry
              textContentType="none"
              autoComplete="off"
              accessibilityLabel="Passwort eingeben"
              className="rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-gray-700">Passwort bestätigen</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Passwort wiederholen"
              secureTextEntry
              textContentType="none"
              autoComplete="off"
              accessibilityLabel="Passwort bestätigen"
              className="rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500"
            />
          </View>

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Registrieren"
            className={`mt-2 rounded-lg px-4 py-3 ${
              loading ? 'bg-gray-400' : 'bg-blue-600 active:bg-blue-700'
            }`}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center text-base font-semibold text-white">Registrieren</Text>
            )}
          </Pressable>

          <View className="mt-4 flex-row justify-center">
            <Text className="text-gray-600">Schon ein Konto? </Text>
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
