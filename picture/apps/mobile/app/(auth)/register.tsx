import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '~/utils/supabase';
import { useTheme } from '~/contexts/ThemeContext';
import { Button } from '~/components/Button';
import { Text } from '~/components/Text';
import { Container } from '~/components/Container';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    if (!email || !password || !username) {
      Alert.alert('Fehler', 'Bitte alle Felder ausfüllen');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Fehler', 'Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          username: username.trim(),
        },
      },
    });

    if (error) {
      Alert.alert('Registrierung fehlgeschlagen', error.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      // Profile will be created automatically by database trigger
      Alert.alert(
        'Registrierung erfolgreich!',
        'Bitte überprüfe deine E-Mail, um dein Konto zu bestätigen.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
    
    setLoading(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Container>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
        <View className="flex-1 justify-center">
          <View className="mb-8">
            <Text variant="h1" color="primary" align="center" className="mb-2">Erstelle dein Konto</Text>
            <Text variant="body" color="secondary" align="center">Beginne noch heute mit der Bildgenerierung</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text variant="label" color="secondary" className="mb-1">Benutzername</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.input, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: theme.colors.text.primary }}
                onChangeText={setUsername}
                value={username}
                placeholder="deinname"
                placeholderTextColor={theme.colors.text.tertiary}
                autoCapitalize="none"
                autoComplete="username"
              />
            </View>

            <View>
              <Text variant="label" color="secondary" className="mb-1">E-Mail</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.input, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: theme.colors.text.primary }}
                onChangeText={setEmail}
                value={email}
                placeholder="deine@email.de"
                placeholderTextColor={theme.colors.text.tertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View>
              <Text variant="label" color="secondary" className="mb-1">Passwort</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.input, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: theme.colors.text.primary }}
                onChangeText={setPassword}
                value={password}
                secureTextEntry
                placeholder="Mindestens 6 Zeichen"
                placeholderTextColor={theme.colors.text.tertiary}
                autoCapitalize="none"
                autoComplete="password-new"
              />
            </View>

            <Button 
              title={loading ? "Registrieren..." : "Registrieren"}
              onPress={signUpWithEmail}
              disabled={loading}
              className="mt-4"
            />

            <View className="flex-row justify-center mt-6">
              <Text variant="body" color="secondary">Bereits ein Konto? </Text>
              <Link href="/(auth)/login" asChild>
                <Text variant="body" weight="semibold" style={{ color: theme.colors.primary.default }}>Anmelden</Text>
              </Link>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Container>
    </SafeAreaView>
  );
}